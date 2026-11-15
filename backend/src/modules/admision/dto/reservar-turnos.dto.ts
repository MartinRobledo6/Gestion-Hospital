import { IsNumber, IsDateString } from 'class-validator';

export class ReservarTurnoDto {
  @IsNumber()
  medicoId: number;

  @IsNumber()
  pacienteId: number;

  @IsDateString()
  fechaHoraInicio: string;

  @IsDateString()
  fechaHoraFin: string;
}