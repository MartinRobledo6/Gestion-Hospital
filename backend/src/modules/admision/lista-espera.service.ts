import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, In, Not, Repository } from 'typeorm';
import { EstadoListaEspera, ListaEsperaEntity } from './entities/lista-espera.entity.js';
import { TurnoEntity } from './entities/turno.entity.js';
import { PacienteEntity } from './entities/paciente.entity.js';
import { MedicoEntity } from './entities/medico.entity.js';
import { EstadoTurno } from './estados/estados-turnos.js';

// Resultado de una promoción: a quién se le dio el turno liberado
export interface PromocionListaEspera {
  listaEsperaId: number;
  pacienteId: number;
  turnoId: number;
}

// Fecha local en formato YYYY-MM-DD (no usar toISOString: corre el día por UTC)
const fechaLocal = (d: Date) => d.toLocaleDateString('en-CA');

const rangoDelDia = (fecha: string) =>
  Between(new Date(`${fecha}T00:00:00`), new Date(`${fecha}T23:59:59.999`));

// HU 1.3 - Lista de espera (standby) por profesional y día
@Injectable()
export class ListaEsperaService {
  constructor(
    @InjectRepository(ListaEsperaEntity)
    private readonly repo: Repository<ListaEsperaEntity>,
    @InjectRepository(TurnoEntity)
    private readonly turnosRepo: Repository<TurnoEntity>,
    @InjectRepository(PacienteEntity)
    private readonly pacientesRepo: Repository<PacienteEntity>,
    @InjectRepository(MedicoEntity)
    private readonly medicosRepo: Repository<MedicoEntity>,
  ) {}

  // ---------- Recepción ----------

  async agregar(pacienteId: number, medicoId: number, fecha: string) {
    const medico = await this.medicosRepo.findOneBy({ id: medicoId });
    if (!medico) throw new NotFoundException(`Profesional ${medicoId} no encontrado`);

    if (fecha < fechaLocal(new Date())) {
      throw new BadRequestException('No se puede anotar a la lista de espera de un día que ya pasó.');
    }

    const yaAnotado = await this.repo.existsBy({
      pacienteId,
      medicoId,
      fecha,
      estado: EstadoListaEspera.EN_ESPERA,
    });
    if (yaAnotado) {
      throw new ConflictException('El paciente ya está en la lista de espera de ese profesional para ese día.');
    }

    if (await this.tieneTurnoEseDia(this.turnosRepo.manager, pacienteId, medicoId, fecha)) {
      throw new ConflictException('El paciente ya tiene un turno ese día con ese profesional.');
    }

        const guardado = await this.repo.save(
      this.repo.create({ pacienteId, medicoId, fecha, estado: EstadoListaEspera.EN_ESPERA }),
    );
    const lista = await this.listar(medicoId, fecha);
    return lista.find((e) => e.id === guardado.id) ?? guardado;
  }

  // Los que esperan, en orden de llegada. La posición sale de ese orden.
  async listar(medicoId: number, fecha: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('La fecha debe tener el formato AAAA-MM-DD.');
    }

    const enEspera = await this.repo.find({
      where: { medicoId, fecha, estado: EstadoListaEspera.EN_ESPERA },
      order: { fechaAlta: 'ASC', id: 'ASC' },
    });
    const pacientes = await this.pacientesPorId(enEspera.map((e) => e.pacienteId));

    return enEspera.map((e, idx) => ({
      id: e.id,
      posicion: idx + 1,
      pacienteId: e.pacienteId,
      pacienteNombre: pacientes.get(e.pacienteId)?.nombre ?? `Paciente #${e.pacienteId}`,
      documento: pacientes.get(e.pacienteId)?.documento ?? '',
      fechaAlta: e.fechaAlta,
    }));
  }

  async retirar(id: number) {
    const entrada = await this.buscar(id);
    if (entrada.estado !== EstadoListaEspera.EN_ESPERA) {
      throw new ConflictException(`No se puede retirar: el paciente está "${entrada.estado}".`);
    }
    entrada.estado = EstadoListaEspera.RETIRADO;
    await this.repo.save(entrada);
    return { id, estado: entrada.estado };
  }

  // Pacientes promovidos a los que la recepción todavía no avisó
  async avisosPendientes() {
    const asignados = await this.repo.find({
      where: { estado: EstadoListaEspera.ASIGNADO },
      order: { fechaAsignacion: 'ASC' },
    });
    if (!asignados.length) return [];

    const turnoIds = asignados.map((a) => a.turnoId).filter((t): t is number => t != null);
    const [pacientes, medicos, turnos] = await Promise.all([
      this.pacientesPorId(asignados.map((a) => a.pacienteId)),
      this.medicosRepo.findBy({ id: In([...new Set(asignados.map((a) => a.medicoId))]) }),
      turnoIds.length ? this.turnosRepo.findBy({ id: In(turnoIds) }) : Promise.resolve([]),
    ]);

    return asignados.map((a) => {
      const turno = turnos.find((t) => t.id === a.turnoId);
      return {
        id: a.id,
        pacienteNombre: pacientes.get(a.pacienteId)?.nombre ?? `Paciente #${a.pacienteId}`,
        documento: pacientes.get(a.pacienteId)?.documento ?? '',
        medicoNombre: medicos.find((m) => m.id === a.medicoId)?.nombre ?? `Profesional #${a.medicoId}`,
        turnoId: a.turnoId,
        fechaHoraInicio: turno?.fechaHoraInicio ?? null,
        fechaHoraFin: turno?.fechaHoraFin ?? null,
        fechaAsignacion: a.fechaAsignacion,
      };
    });
  }

  async marcarNotificado(id: number) {
    const entrada = await this.buscar(id);
    if (entrada.estado !== EstadoListaEspera.ASIGNADO) {
      throw new ConflictException(`No hay aviso pendiente: el paciente está "${entrada.estado}".`);
    }
    entrada.estado = EstadoListaEspera.NOTIFICADO;
    await this.repo.save(entrada);
    return { id, estado: entrada.estado };
  }

  // ---------- Promoción automática (se llama DENTRO de la transacción de cancelación) ----------

  // Toma al primero de la lista que pueda usar el horario liberado y le crea el turno.
  // Se saltea a quien ya tenga otro turno ese día con el mismo profesional (sigue en la lista).
  async promoverPorCancelacion(
    manager: EntityManager,
    cancelado: TurnoEntity,
  ): Promise<PromocionListaEspera | null> {
    const inicio = new Date(cancelado.fechaHoraInicio);
    if (inicio.getTime() <= Date.now()) return null; // el horario ya pasó: no hay nada que reasignar

    const fecha = fechaLocal(inicio);

    // Bloqueo de las filas: dos cancelaciones simultáneas no pueden promover al mismo paciente
    const candidatos = await manager.find(ListaEsperaEntity, {
      where: { medicoId: cancelado.medicoId, fecha, estado: EstadoListaEspera.EN_ESPERA },
      order: { fechaAlta: 'ASC', id: 'ASC' },
      lock: { mode: 'pessimistic_write' },
    });

    for (const candidato of candidatos) {
      if (await this.tieneTurnoEseDia(manager, candidato.pacienteId, cancelado.medicoId, fecha)) {
        continue;
      }

      const turno = await manager.save(
        manager.create(TurnoEntity, {
          medicoId: cancelado.medicoId,
          pacienteId: candidato.pacienteId,
          fechaHoraInicio: cancelado.fechaHoraInicio,
          fechaHoraFin: cancelado.fechaHoraFin,
          estado: EstadoTurno.PROGRAMADO,
          esEntreturno: cancelado.esEntreturno, // el bloque liberado conserva su forma
        }),
      );

      candidato.estado = EstadoListaEspera.ASIGNADO;
      candidato.turnoId = turno.id;
      candidato.fechaAsignacion = new Date();
      await manager.save(candidato);

      return { listaEsperaId: candidato.id, pacienteId: candidato.pacienteId, turnoId: turno.id };
    }

    return null; // nadie en la lista (o todos ya tenían turno ese día)
  }

  // ---------- Auxiliares ----------

  private async tieneTurnoEseDia(
    manager: EntityManager,
    pacienteId: number,
    medicoId: number,
    fecha: string,
  ) {
    const cantidad = await manager.count(TurnoEntity, {
      where: {
        pacienteId,
        medicoId,
        fechaHoraInicio: rangoDelDia(fecha),
        estado: Not(EstadoTurno.CANCELADO),
      },
    });
    return cantidad > 0;
  }

  private async buscar(id: number) {
    const entrada = await this.repo.findOneBy({ id });
    if (!entrada) throw new NotFoundException(`Registro de lista de espera ${id} no encontrado`);
    return entrada;
  }

  private async pacientesPorId(ids: number[]) {
    const unicos = [...new Set(ids)];
    const pacientes = unicos.length ? await this.pacientesRepo.findBy({ id: In(unicos) }) : [];
    return new Map(
      pacientes.map((p) => [p.id, { nombre: `${p.nombre} ${p.apellido}`, documento: p.documento }]),
    );
  }
}