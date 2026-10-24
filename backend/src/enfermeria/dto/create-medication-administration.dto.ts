export class CreateMedicationAdministrationDto {
  indicationId: number; // ID de la IndicacionMedica
  nurseId: number;      // ID del enfermero/a
  status: string;       // 'Administrada' u 'Omitida'
}