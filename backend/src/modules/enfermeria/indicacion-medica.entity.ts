import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
/**
 * Indicación médica activa, p. ej. "Ibuprofeno 400mg cada 8 horas".
 * La carga el médico (otro módulo); acá la usa enfermería para saber qué dosis toca dar.
 */
@Entity('IndicacionesMedicas')
export class IndicacionMedica {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'int', name: 'PacienteId' })
  patientId: number;

  @Column({ type: 'int', name: 'MedicoId' })
  medicoId: number;

  @Column({ type: 'int', name: 'InsumoId' })
  supplyId: number;

  @Column({ type: 'varchar', length: 100, name: 'Dosis' })
  dose: string;

  @Column({ type: 'varchar', length: 100, name: 'Frecuencia' })
  frequency: string;

  @Column({ type: 'datetime', name: 'PrimeraDosis' })
  firstDoseAt: Date;

  @Column({ type: 'bit', name: 'Activa', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'FechaIndicacion' })
  createdAt: Date;
}