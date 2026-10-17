import { IsInt, IsString, Matches, Max, Min } from 'class-validator';

export class CrearHorarioDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number; // 0 = domingo ... 6 = sábado

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaInicio debe ser HH:mm' })
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaFin debe ser HH:mm' })
  horaFin: string;

  @IsInt()
  @Min(5)
  @Max(240)
  duracionIntervaloMinutos: number;
}