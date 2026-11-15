import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AbrirCuentaDto {
  @IsInt()
  @Min(1)
  pacienteId!: number;
}

// HU 1.1: la cobertura NO viene del cliente, se lee del paciente
export class FacturarPrestacionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  concepto!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoBase!: number;
}

export class AsignarCoberturaDto {
  // null = sin cobertura (particular)
  @IsOptional()
  @IsInt()
  coberturaId!: number | null;
}
