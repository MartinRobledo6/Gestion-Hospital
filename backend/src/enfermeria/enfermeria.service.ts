import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VitalSigns } from './vital-signs.entity';
import { Notificacion } from './notificacion.entity';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import {
  buildCriticalMessage,
  buildNursingNote,
  isCriticalTemperature,
} from './rules/vital-signs.rules';

// Signos vitales (HU 1.1). La medicación (HU 1.2) está en MedicacionService
// y los protocolos de ingreso (HU 2.1) en ProtocolosService.
@Injectable()
export class EnfermeriaService {
  constructor(
    @InjectRepository(VitalSigns)
    private readonly vitalSignsRepository: Repository<VitalSigns>,
    private readonly dataSource: DataSource,
  ) {}

  async registerVitalSigns(dto: CreateVitalSignsDto): Promise<VitalSigns> {
    const isCriticalAlert = isCriticalTemperature(dto.temperature);
    const nursingNote = buildNursingNote(dto.temperature, isCriticalAlert);

    // El control y el aviso al médico se guardan juntos: si falla uno, no queda el otro.
    return this.dataSource.transaction(async (manager) => {
      // Se copian los campos uno por uno (en vez de ...dto) para que el cliente no pueda
      // mandar por su cuenta cosas como id, isCriticalAlert o recordedAt.
      const record = await manager.save(
        manager.create(VitalSigns, {
          patientId: dto.patientId,
          nurseName: dto.nurseName,
          roomNumber: dto.roomNumber,
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
            message: buildCriticalMessage(dto.temperature, dto.patientId, dto.roomNumber),
            referenceId: record.id,
            read: false,
          }),
        );
      }

      return record;
    });
  }

  async getAllVitalSigns(): Promise<VitalSigns[]> {
    return await this.vitalSignsRepository.find({
      order: { recordedAt: 'DESC' },
    });
  }
}
