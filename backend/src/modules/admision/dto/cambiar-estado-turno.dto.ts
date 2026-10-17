import { IsString } from 'class-validator';

export class CambiarEstadoTurnoDto {
  @IsString()
  nuevoEstado: string;
}