import { IsDateString, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

// Hoy la usa el frontend como reemplazo de la orden del médico (módulo de HCE, todavía sin hacer).
export class CreateIndicationDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @IsNotEmpty()
  medication: string; // ej: "Ibuprofeno 400mg"

  @IsString()
  @IsNotEmpty()
  dose: string; // ej: "1 comprimido"

  @IsInt()
  @Min(1)
  @Max(48)
  everyHours: number;

  @IsDateString()
  firstDoseAt: string;

  @IsInt()
  @Min(1)
  supplyId: number; // insumo del inventario que se descuenta en cada dosis
}
