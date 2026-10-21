import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearMedicoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  especialidad!: string;
}