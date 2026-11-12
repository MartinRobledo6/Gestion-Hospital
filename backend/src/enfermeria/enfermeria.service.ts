
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { VitalSigns } from './vital-signs.entity.js';
import { Notificacion } from './notificacion.entity.js';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto.js';
import { Paciente } from '../hce/entities/paciente.entity.js';

import {
  buildCriticalMessage,
  buildNursingNote,
  isCriticalTemperature,
} from './rules/vital-signs.rules.js';

@Injectable()
export class EnfermeriaService {
  constructor(
    @InjectRepository(VitalSigns)
    private readonly vitalSignsRepository: Repository<VitalSigns>,

    @InjectRepository(Paciente)
    private readonly patients: Repository<Paciente>,

    private readonly dataSource: DataSource,
  ) {}

  async registerVitalSigns(dto: CreateVitalSignsDto): Promise<VitalSigns> {
    const patient = await this.patients.findOneBy({ Id: dto.patientId });

    if (!patient) {
      throw new NotFoundException(
        `No existe el paciente #${dto.patientId}.`,
      );
    }

    const isCriticalAlert = isCriticalTemperature(dto.temperature);
    const automaticNote = buildNursingNote(
  dto.temperature,
  isCriticalAlert,
);

const nursingNote = dto.nursingNote?.trim()
  ? `${automaticNote} Observación: ${dto.nursingNote.trim()}`
  : automaticNote;

    return this.dataSource.transaction(async (manager) => {
      const record = await manager.save(
        manager.create(VitalSigns, {
          patientId: patient.Id,
          nurseName: dto.nurseName.trim(),
          roomNumber: dto.roomNumber.trim(),
          bloodPressureSystolic: dto.bloodPressureSystolic,
          bloodPressureDiastolic: dto.bloodPressureDiastolic,
          heartRate: dto.heartRate,
          temperature: dto.temperature,
          isCriticalAlert,
          nursingNote,
        }),
      );

      if (isCriticalAlert) {
        await manager.save(
          manager.create(Notificacion, {
            priority: 'ALTA',
            recipientRole: 'MEDICO_GUARDIA',
            message: buildCriticalMessage(
              dto.temperature,
              String(patient.Id),
              dto.roomNumber,
            ),
            referenceId: record.id,
            read: false,
          }),
        );
      }

      return record;
    });
  }

  async getAllVitalSigns(): Promise<VitalSigns[]> {
    return this.vitalSignsRepository.find({
      order: { recordedAt: 'DESC' },
    });
  }
}
