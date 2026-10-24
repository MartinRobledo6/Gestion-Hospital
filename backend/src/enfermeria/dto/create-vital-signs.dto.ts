export class CreateVitalSignsDto {
  patientId: string;
  nurseName: string;
  roomNumber: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  temperature: number;
}