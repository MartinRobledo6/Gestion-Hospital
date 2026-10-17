import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class GenerarAgendaDto {
  @IsInt()
  @IsPositive()
  medicoId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(60)
  dias?: number;
}