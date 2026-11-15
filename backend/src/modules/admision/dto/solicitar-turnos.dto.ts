import { IsDateString, IsInt, Min } from 'class-validator';
import { DatosPacienteDto } from './datos-paciente.dto.js';

// Hereda documento, nombre, apellido, fechaNacimiento y coberturaId
export class SolicitarTurnoDto extends DatosPacienteDto {
  @IsInt()
  @Min(1)
  medicoId!: number;

  @IsDateString()
  fechaHoraInicio!: string;

  @IsDateString()
  fechaHoraFin!: string;
}
