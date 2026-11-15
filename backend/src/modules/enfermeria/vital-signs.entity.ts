import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('vital_signs')
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  patientId: number;

  @Column({ type: 'nvarchar', length: 100 })
  nurseName: string;

  @Column({ type: 'nvarchar', length: 50 })
  roomNumber: string;

  @Column({ type: 'float' })
  bloodPressureSystolic: number;

  @Column({ type: 'float' })
  bloodPressureDiastolic: number;

  @Column({ type: 'float' })
  heartRate: number;

  @Column({ type: 'float' })
  temperature: number;

  @Column({ type: 'bit', default: false })
  isCriticalAlert: boolean; // Se marca true si la temperatura > 39°C

  // Nota de enfermería automática (HU 1.1). Nullable para no romper registros ya guardados.
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  nursingNote: string | null;

  @CreateDateColumn({ type: 'datetime' })
  recordedAt: Date;
}