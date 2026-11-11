import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TrasladarCamaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numeroOrigen: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  numeroDestino: string;
}