import { IsIn, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { TIPOS_PROFESIONAL } from '../entities/medico.entity.js';

export class CrearMedicoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsIn(TIPOS_PROFESIONAL)
  tipo!: 'medico' | 'enfermero';

  @IsInt()
  especialidadId!: number;
}