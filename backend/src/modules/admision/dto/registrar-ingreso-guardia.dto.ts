import {
  IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength,
} from 'class-validator';

export class RegistrarIngresoGuardiaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  pacienteNombre!: string;

  @IsOptional()
  @Matches(/^\d{7,8}$/, { message: 'El documento debe tener 7 u 8 dígitos' })
  documento?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(300)
  motivoConsulta!: string;

  @IsInt()
  @Min(1, { message: 'El nivel de triaje va de 1 (Rojo) a 5 (Azul)' })
  @Max(5, { message: 'El nivel de triaje va de 1 (Rojo) a 5 (Azul)' })
  nivel!: number;
}