import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProtocoloAtencion, TareaProtocolo } from './protocolo.entities';
import { AdmitPatientDto } from './dto/admit-patient.dto';
import { ADMISSION_REASONS, buildProtocolFor } from './rules/protocol-builders';

// Protocolos de ingreso (HU 2.1): al admitir un paciente en una habitación se arma
// automáticamente el plan de cuidados con el Builder que corresponde al motivo de ingreso.
@Injectable()
export class ProtocolosService {
  constructor(
    @InjectRepository(ProtocoloAtencion)
    private readonly protocols: Repository<ProtocoloAtencion>,
    @InjectRepository(TareaProtocolo)
    private readonly tasks: Repository<TareaProtocolo>,
  ) {}

  /** Motivos de ingreso disponibles, con las tareas que generaría cada uno (para mostrar una vista previa). */
  listReasons() {
    return ADMISSION_REASONS.map((r) => {
      const plan = buildProtocolFor(r.value);
      return { value: r.value, label: r.label, type: plan.type, tasks: plan.tasks };
    });
  }

  /**
   * Recibe el "evento de ingreso" (en el sistema final lo publicaría el módulo de Admisión)
   * y genera el protocolo con sus tareas.
   */
  admit(dto: AdmitPatientDto): Promise<ProtocoloAtencion> {
    const plan = buildProtocolFor(dto.reason);
    return this.protocols.save(
      this.protocols.create({
        patientId: dto.patientId.trim(),
        roomNumber: dto.roomNumber.trim(),
        type: plan.type,
        tasks: plan.tasks.map((description) => this.tasks.create({ description, completed: false })),
      }),
    );
  }

  list(): Promise<ProtocoloAtencion[]> {
    return this.protocols.find({
      relations: { tasks: true },
      order: { startedAt: 'DESC', tasks: { id: 'ASC' } },
    });
  }

  async setTaskCompleted(id: number, completed: boolean): Promise<TareaProtocolo> {
    const task = await this.tasks.findOneBy({ id });
    if (!task) throw new NotFoundException(`No existe la tarea #${id}.`);
    task.completed = completed;
    return this.tasks.save(task);
  }
}
