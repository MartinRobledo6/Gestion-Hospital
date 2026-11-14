import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CrearEstudioDto {
  @IsInt()
  HistoriaClinicaId: number;

  @IsString() @IsNotEmpty() @MaxLength(100)
  TipoEstudio: string;
  
  @IsString() @IsNotEmpty() @MinLength(5)
  Descripcion: string;

  //Solo http/https: el enlace se muestra como link en el frontend
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  Enlace?: string;
}