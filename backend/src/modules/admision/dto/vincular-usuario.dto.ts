import { IsInt, IsOptional } from 'class-validator';

export class VincularUsuarioDto {
  @IsOptional()
  @IsInt()
  usuarioId!: number | null;
}
