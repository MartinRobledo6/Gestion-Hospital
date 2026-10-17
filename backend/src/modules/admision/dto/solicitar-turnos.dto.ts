import { IsDateString, IsEmail, IsInt, IsString, MaxLength, MinLength, Min } from 'class-validator';

export class SolicitarTurnoDto {
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

  @IsDateString()
  fechaHoraInicio!: string;

  @IsDateString()
  fechaHoraFin!: string;
}