import { IsOptional, IsString } from 'class-validator';

export class ActualizarHistoriaClinicaDto {
  @IsString()
  @IsOptional()
  Alergias?: string;

  @IsString()
  @IsOptional()
  AntecedentesFamiliares?: string;
}