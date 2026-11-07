import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ADMISSION_REASON_VALUES } from '../rules/protocol-builders';

/** Evento de ingreso que, en el sistema final, publicaría el módulo de Admisión. */
export class AdmitPatientDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsIn(ADMISSION_REASON_VALUES)
  reason: string; // 'PRE_QUIRURGICO' | 'INFECCION_RESPIRATORIA'
}
