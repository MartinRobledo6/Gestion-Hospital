import { IsDateString, IsInt, Min } from 'class-validator';
import { DatosPacienteDto } from './datos-paciente.dto.js';

// Hereda documento, nombre, apellido, fechaNacimiento y coberturaId
export class AgregarListaEsperaDto extends DatosPacienteDto {
  @IsInt()
  @Min(1)
  medicoId!: number;

  @IsDateString({}, { message: 'La fecha no es válida.' })
  fecha!: string; // YYYY-MM-DD
}