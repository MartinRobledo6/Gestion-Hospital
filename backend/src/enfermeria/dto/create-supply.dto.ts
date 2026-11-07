import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateSupplyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
