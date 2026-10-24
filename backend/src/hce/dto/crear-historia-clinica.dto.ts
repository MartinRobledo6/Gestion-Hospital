import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearHistoriaClinicaDto {
  @IsInt({ message: 'El ID del paciente debe ser un número entero válido' })
  @IsNotEmpty({ message: 'El ID del paciente es obligatorio para abrir la historia clínica' })
  PacienteId: number;

  @IsString()
  @IsOptional()
  Alergias?: string;

  @IsString()
  @IsOptional()
  AntecedentesFamiliares?: string;
}