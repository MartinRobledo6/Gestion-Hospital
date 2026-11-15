import { IsInt, IsPositive } from 'class-validator';
import { NumeroCamaDto } from './numero-cama.dto.js';

export class AsignarCamaDto extends NumeroCamaDto {
  @IsInt()
  @IsPositive()
  pacienteId: number;
}