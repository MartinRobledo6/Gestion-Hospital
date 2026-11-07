import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

// Los límites son los mismos que usa el frontend: detectan errores de tipeo (no diagnostican).
export class CreateVitalSignsDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  nurseName: string;

  // Para un paciente en el consultorio el frontend envía "Consultorio".
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsNumber()
  @Min(50)
  @Max(260)
  bloodPressureSystolic: number;

  @IsNumber()
  @Min(30)
  @Max(160)
  bloodPressureDiastolic: number;

  @IsNumber()
  @Min(20)
  @Max(250)
  heartRate: number;

  @IsNumber()
  @Min(30)
  @Max(45)
  temperature: number;
}
