import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Cama, EstadoCama } from './entities/cama.entity.js';
import { AsignacionCama } from './entities/asignacion-cama.entity.js';
import { OperacionCama, siguienteEstado } from './estados/cama-state.js';
import { esViolacionUnique } from '../common/db-errors.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CamasService {
  constructor(
    @InjectRepository(Cama)
    private readonly camasRepository: Repository<Cama>,
    private readonly events: EventEmitter2,
  ) {}

  asignarCama(numero: string, pacienteId: number) {
    return this.transicionar(numero, 'asignar', async (m, cama) => {
      await m.insert(AsignacionCama, { CamaId: cama.Id, PacienteId: pacienteId });
    }, 'Cama asignada exitosamente');
  }

  liberarCama(numero: string) {
    return this.transicionar(numero, 'liberar', async (m, cama) => {
      const r = await m.update(
        AsignacionCama,
        { CamaId: cama.Id, FechaEgreso: IsNull() },
        { FechaEgreso: new Date() },
      );
      if (!r.affected) {
        throw new ConflictException('La cama figura ocupada pero no tiene una asignación activa.');
      }
    }, 'Paciente dado de alta. Cama enviada a limpieza');
  }

  limpiarCama(numero: string) {
    return this.transicionar(numero, 'limpiar', undefined, 'Cama libre y lista para usar');
  }

  bloquearCama(numero: string) {
    return this.transicionar(numero, 'bloquear', undefined, 'Cama bloqueada exitosamente');
  }

  desbloquearCama(numero: string) {
    return this.transicionar(numero, 'desbloquear', undefined, 'Cama desbloqueada, está libre');
  }

  obtenerCamas() {
    return this.camasRepository.find({ order: { Numero: 'ASC' } });
  }

  /**
   * Único punto de entrada para cambiar el estado de una cama:
   *  1. valida la transición con la máquina de estados,
   *  2. hace un UPDATE condicional (estado + versión leídos) => bloqueo optimista real,
   *  3. ejecuta el efecto lateral (asignación) en la MISMA transacción.
   */
  private async transicionar(
    numero: string,
    op: OperacionCama,
    efecto: ((m: EntityManager, cama: Cama) => Promise<void>) | undefined,
    mensaje: string,
  ) {
    let resultado: { cama: Cama; desde: EstadoCama };
    try {
      resultado = await this.camasRepository.manager.transaction(async (m) => {
        const cama = await m.findOne(Cama, { where: { Numero: numero } });
        if (!cama) throw new NotFoundException(`La cama ${numero} no existe`);

        const anterior = cama.Estado;
        const nuevo = siguienteEstado(anterior, op); // lanza 409 si la transición es inválida

        const r = await m.update(
          Cama,
          { Id: cama.Id, Estado: anterior, Version: cama.Version },
          { Estado: nuevo, Version: () => 'RowVersion + 1' },
        );
        if (!r.affected) {
          throw new ConflictException(op === 'asignar'
              ? 'La cama acaba de ser ocupada por otro usuario.'
              : 'La cama acaba de ser modificada por otro usuario. Actualizá y reintentá.',);
        }

        if (efecto) await efecto(m, cama);

        cama.Estado = nuevo;
        cama.Version += 1;
        return { cama, desde: anterior };
      });
    } catch (e) {
      // Red de seguridad: los índices únicos filtrados de la BD también frenan la doble asignación
      if (esViolacionUnique(e)) {
        throw new ConflictException('La cama o el paciente ya tienen una asignación activa.');
      }
      throw e;
    }
    this.events.emit('cama.estado-cambiado', {
      camaId: resultado.cama.Id,
      numero: resultado.cama.Numero,
      desde: resultado.desde,
      hasta: resultado.cama.Estado,
      timestamp: new Date(),
    });
    return { mensaje, cama: resultado.cama };
  }
}