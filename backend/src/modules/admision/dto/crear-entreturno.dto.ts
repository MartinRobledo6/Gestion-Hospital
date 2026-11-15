import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { DatosPacienteDto } from './datos-paciente.dto.js';

// Hereda documento, nombre, apellido, fechaNacimiento y coberturaId
export class CrearEntreturnoDto extends DatosPacienteDto {
  @IsInt()
  @Min(1)
  medicoId!: number;

  // Momento exacto en que arranca el entreturno (ej: 10:15)
  @IsDateString()
  fechaHoraInicio!: string;

  // Opcional: si no viene, ocupa el resto del turno recortado
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  duracionMinutos?: number;
}
