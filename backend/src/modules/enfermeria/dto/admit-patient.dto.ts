import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

/** Evento de ingreso que, en el sistema final, publicaría el módulo de Admisión. */
export class AdmitPatientDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  reason: string; // 'PRE_QUIRURGICO' | 'INFECCION_RESPIRATORIA'
}
