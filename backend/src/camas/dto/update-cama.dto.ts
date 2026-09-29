import { PartialType } from '@nestjs/mapped-types';
import { AsignarCamaDto } from './asignar-cama.dto.js';

export class UpdateCamaDto extends PartialType(AsignarCamaDto) {}
