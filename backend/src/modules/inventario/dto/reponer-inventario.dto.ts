import { IsInt, IsPositive, Max } from 'class-validator';

export class ReponerInventarioDto {
  @IsInt()
  @IsPositive()
  @Max(100000)
  cantidad: number;
}