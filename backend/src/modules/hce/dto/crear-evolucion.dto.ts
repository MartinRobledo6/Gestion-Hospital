import { IsInt, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CrearEvolucionDto {
  @IsInt({ message: 'El ID de la historia clínica es obligatorio' })
  @IsNotEmpty()
  HistoriaClinicaId: number;


  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsNotEmpty({ message: 'No se puede guardar una evolución en blanco' })
  @MinLength(5, { message: 'La evolución médica debe ser detallada (mínimo 5 caracteres)' })
  Observaciones: string;
}