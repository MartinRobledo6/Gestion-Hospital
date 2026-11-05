import { IsIn } from 'class-validator';
import { EstadosTurnos } from '../estados/estados-turnos.js';

export class CambiarEstadoTurnoDto {
  @IsIn(EstadosTurnos, { message: 'El estado indicado no existe' })
  nuevoEstado: string;
}
