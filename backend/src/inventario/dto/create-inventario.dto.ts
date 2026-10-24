import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateInventarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  Nombre: string;

  @IsInt()
  @Min(0)
  StockActual: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  PrecioUnitario: number;
}