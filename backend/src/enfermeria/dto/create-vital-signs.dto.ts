import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Los límites son los mismos que usa el frontend: detectan errores de tipeo (no diagnostican).
export class CreateVitalSignsDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsString()
  @IsNotEmpty()
  nurseName: string;

  // Para un paciente en el consultorio el frontend envía "Consultorio".
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsNumber()
  @Min(0)
  bloodPressureSystolic: number;

  @IsNumber()
  @Min(0)
  bloodPressureDiastolic: number;

  @IsNumber()
  @Min(0)
  heartRate: number;

  @IsNumber()
  @Min(0)
  temperature: number;

  @IsOptional()
  @IsString()
  nursingNote?: string;
}
