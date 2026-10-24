import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VitalSigns } from './vital-signs.entity';
import { MedicationAdministration } from './medication-administration.entity'; // 1. Importar la entidad
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto'; // (Asegúrate de crear este DTO)
import { Repository, DeepPartial } from 'typeorm';

@Injectable()
export class EnfermeriaService {
  constructor(
    @InjectRepository(VitalSigns)
    private readonly vitalSignsRepository: Repository<VitalSigns>,

    // 2. Inyectar el repositorio de administración de medicamentos
    @InjectRepository(MedicationAdministration)
    private readonly medicationAdminRepository: Repository<MedicationAdministration>,
  ) {}

  // --- MÉTODOS DE SIGNOS VITALES (Ya los tienes) ---
  async registerVitalSigns(dto: CreateVitalSignsDto): Promise<VitalSigns> {
    const isCriticalAlert = dto.temperature > 39;

    const vitalRecord = this.vitalSignsRepository.create({
      ...dto,
      isCriticalAlert,
    });

    return this.vitalSignsRepository.save(vitalRecord);
  }

  async getAllVitalSigns(): Promise<VitalSigns[]> {
    return await this.vitalSignsRepository.find({
      order: { recordedAt: 'DESC' },
    });
  }

  // --- 3. MÉTODOS NUEVOS DE ADMINISTRACIÓN DE MEDICAMENTOS ---
  async registerMedicationAdministration(dto: CreateMedicationAdministrationDto): Promise<MedicationAdministration> {
    const medicationAdmin = this.medicationAdminRepository.create({
      ...dto,
    });

    return await this.medicationAdminRepository.save(medicationAdmin);
  }

  async getAllMedicationAdministrations(): Promise<MedicationAdministration[]> {
    return await this.medicationAdminRepository.find({
      order: { administeredAt: 'DESC' },
    });
  }
}