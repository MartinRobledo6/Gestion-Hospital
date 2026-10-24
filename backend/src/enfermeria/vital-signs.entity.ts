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

  @CreateDateColumn()
  recordedAt: Date;
}