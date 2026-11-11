import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Cama, EstadoCama } from './entities/cama.entity.js';
import { AsignacionCama } from './entities/asignacion-cama.entity.js';
import { OperacionCama, siguienteEstado } from './estados/cama-state.js';
import { esViolacionUnique } from '../common/db-errors.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

type CambioCama = { cama: Cama; desde: EstadoCama };

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
        { FechaEgreso: () => 'GETDATE()' },
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
   * Traslado: la cama de origen pasa a limpieza y el mismo paciente queda asignado a la cama de destino.
   * Todo en UNA transacción: si el destino no está libre (o alguien se lo gana), se revierte también el origen.
   */
  async trasladarCama(numeroOrigen: string, numeroDestino: string) {
    if (numeroOrigen === numeroDestino) {
      throw new BadRequestException('La cama de origen y la de destino deben ser distintas.');
    }

    const { origen, destino } = await this.ejecutarTransaccion(async (m) => {
      let pacienteId = 0;

      // 1) Origen: ocupadas -> en limpieza, y se cierra la asignación activa del paciente.
      //    Se cierra ANTES de abrir la nueva por el índice único de "un paciente, una cama activa".
      const origen = await this.aplicarTransicion(m, numeroOrigen, 'liberar', async (tx, cama) => {
        const activa = await tx.findOne(AsignacionCama, {
          where: { CamaId: cama.Id, FechaEgreso: IsNull() },
        });
        if (!activa) {
          throw new ConflictException('La cama de origen no tiene una asignación activa.');
        }
        pacienteId = activa.PacienteId;
        await tx.update(AsignacionCama, { Id: activa.Id }, { FechaEgreso: () => 'GETDATE()' });
      });

      // 2) Destino: libres -> ocupadas, con el mismo paciente.
      const destino = await this.aplicarTransicion(m, numeroDestino, 'asignar', async (tx, cama) => {
        await tx.insert(AsignacionCama, { CamaId: cama.Id, PacienteId: pacienteId });
      });

      return { origen, destino };
    });

    this.publicar([origen, destino]);
    return {
      mensaje: `Paciente trasladado de la cama ${origen.cama.Numero} a la cama ${destino.cama.Numero}`,
      origen: origen.cama,
      destino: destino.cama,
    };
  }

  private async transicionar(
    numero: string,
    op: OperacionCama,
    efecto: ((m: EntityManager, cama: Cama) => Promise<void>) | undefined,
    mensaje: string,
  ) {
    const cambio = await this.ejecutarTransaccion((m) => this.aplicarTransicion(m, numero, op, efecto));
    this.publicar([cambio]);
    return { mensaje, cama: cambio.cama };
  }

  /**
   * Cambia el estado de UNA cama dentro de una transacción ya abierta:
   *  1. valida la transición con la máquina de estados,
   *  2. hace un UPDATE condicional (estado + versión leídos) => bloqueo optimista real,
   *  3. ejecuta el efecto lateral (asignación) en la MISMA transacción.
   */
  private async aplicarTransicion(
    m: EntityManager,
    numero: string,
    op: OperacionCama,
    efecto?: (m: EntityManager, cama: Cama) => Promise<void>,
  ): Promise<CambioCama> {
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
      throw new ConflictException(
        op === 'asignar'
          ? 'La cama acaba de ser ocupada por otro usuario.'
          : 'La cama acaba de ser modificada por otro usuario. Actualizá y reintentá.',
      );
    }

    if (efecto) await efecto(m, cama);

    cama.Estado = nuevo;
    cama.Version += 1;
    return { cama, desde: anterior };
  }

  private async ejecutarTransaccion<T>(trabajo: (m: EntityManager) => Promise<T>): Promise<T> {
    try {
      return await this.camasRepository.manager.transaction(trabajo);
    } catch (e) {
      // Red de seguridad: los índices únicos filtrados de la BD también frenan la doble asignación
      if (esViolacionUnique(e)) {
        throw new ConflictException('La cama o el paciente ya tienen una asignación activa.');
      }
      throw e;
    }
  }

  // Se publica recién después del COMMIT, para que los monitores nunca vean un cambio revertido
  private publicar(cambios: CambioCama[]) {
    for (const { cama, desde } of cambios) {
      this.events.emit('cama.estado-cambiado', {
        camaId: cama.Id,
        numero: cama.Numero,
        desde,
        hasta: cama.Estado,
        timestamp: new Date(),
      });
    }
  }
}