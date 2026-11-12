
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ProtocoloAtencion,
  TareaProtocolo,
} from './protocolo.entities.js';

import { AdmitPatientDto } from './dto/admit-patient.dto.js';
import { Paciente } from '../hce/entities/paciente.entity.js';

import {
  ADMISSION_REASONS,
  buildProtocolFor,
} from './rules/protocol-builders.js';

@Injectable()
export class ProtocolosService {
  constructor(
    @InjectRepository(ProtocoloAtencion)
    private readonly protocols: Repository<ProtocoloAtencion>,

    @InjectRepository(TareaProtocolo)
    private readonly tasks: Repository<TareaProtocolo>,

    @InjectRepository(Paciente)
    private readonly patients: Repository<Paciente>,
  ) {}

  listReasons() {
    return ADMISSION_REASONS.map((reason) => {
      const plan = buildProtocolFor(reason.value);

      return {
        value: reason.value,
        label: reason.label,
        type: plan.type,
        tasks: plan.tasks,
      };
    });
  }

  async admit(dto: AdmitPatientDto): Promise<ProtocoloAtencion> {
    const patient = await this.patients.findOneBy({
      Id: dto.patientId,
    });

    if (!patient) {
      throw new NotFoundException(
        `No existe el paciente #${dto.patientId}.`,
      );
    }

    const plan = buildProtocolFor(dto.reason);

    const protocol = this.protocols.create({
      patientId: patient.Id,
      roomNumber: dto.roomNumber.trim(),
      type: plan.type,
      tasks: plan.tasks.map((description) =>
        this.tasks.create({
          description,
          completed: false,
        }),
      ),
    });

    return this.protocols.save(protocol);
  }

  list(): Promise<ProtocoloAtencion[]> {
    return this.protocols.find({
      relations: { tasks: true },
      order: {
        startedAt: 'DESC',
        tasks: { id: 'ASC' },
      },
    });
  }

  async setTaskCompleted(
    id: number,
    completed: boolean,
  ): Promise<TareaProtocolo> {
    const task = await this.tasks.findOneBy({ id });

    if (!task) {
      throw new NotFoundException(
        `No existe la tarea #${id}.`,
      );
    }

    task.completed = completed;

    return this.tasks.save(task);
  }
}
