import { IsDateString, IsIn, IsInt, Min } from 'class-validator';

export class CreateMedicationAdministrationDto {
  @IsInt()
  @Min(1)
  indicationId: number; // ID de la IndicacionMedica


  @IsIn(['Administrada', 'Omitida'])
  status: 'Administrada' | 'Omitida';

  // Horario de la dosis que se confirma (uno de los de /medication-schedule), en formato ISO.
  @IsDateString()
  scheduledAt: string;
}
