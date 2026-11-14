import {
  IsDateString, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength,
} from 'class-validator';

// Datos del paciente que viajan con cada pedido de turno.
// El DNI identifica al paciente: si ya existe se usa ese registro,
// si no, se crea con el resto de los datos (todos obligatorios en la tabla Pacientes).
export class DatosPacienteDto {
  @Matches(/^\d{6,10}$/, { message: 'El DNI debe tener entre 6 y 10 números, sin puntos.' })
  documento!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  apellido!: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no es válida.' })
  fechaNacimiento!: string; // YYYY-MM-DD

  // Sin cobertura -> se registra como Particular
  @IsOptional()
  @IsInt()
  @Min(1)
  coberturaId?: number;
}
