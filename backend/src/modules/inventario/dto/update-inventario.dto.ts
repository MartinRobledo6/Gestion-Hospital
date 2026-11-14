import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateInventarioDto } from './create-inventario.dto.js';

// StockActual queda afuera a propósito: el stock solo cambia por descuentos
// atómicos (eventos) o por una reposición explícita, nunca pisándolo con un PATCH.
export class UpdateInventarioDto extends PartialType(
  OmitType(CreateInventarioDto, ['StockActual'] as const),
) {}