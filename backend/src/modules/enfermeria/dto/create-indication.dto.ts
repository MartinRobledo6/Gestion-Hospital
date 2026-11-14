import { IsDateString, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

// Hoy la usa el frontend como reemplazo de la orden del médico (módulo de HCE, todavía sin hacer).
export class CreateIndicationDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  medicoId: number;

  @IsInt()
  @Min(1)
  supplyId: number;

  @IsString()
  @IsNotEmpty()
  dose: string;

  @IsInt()
  @Min(1)
  @Max(48)
  everyHours: number;

  @IsDateString()
  firstDoseAt: string;
}
