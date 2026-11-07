import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('vital_signs')
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  nurseName: string;

  @Column()
  roomNumber: string;

  @Column('float')
  bloodPressureSystolic: number;

  @Column('float')
  bloodPressureDiastolic: number;

  @Column('float')
  heartRate: number;

  @Column('float')
  temperature: number;

  @Column({ default: false })
  isCriticalAlert: boolean; // Se marca true si la temperatura > 39°C

  // Nota de enfermería automática (HU 1.1). Nullable para no romper registros ya guardados.
  @Column({ type: 'nvarchar', length: 500, nullable: true })
  nursingNote: string | null;

  @CreateDateColumn()
  recordedAt: Date;
}