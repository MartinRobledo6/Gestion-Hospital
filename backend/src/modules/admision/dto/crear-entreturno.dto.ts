import {
  IsDateString, IsEmail, IsInt, IsOptional, IsString,
  Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class CrearEntreturnoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

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