import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class NumeroCamaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numero: string;
}