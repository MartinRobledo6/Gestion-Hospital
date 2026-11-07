import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Indicación médica activa, p. ej. "Ibuprofeno 400mg cada 8 horas".
 * La carga el médico (otro módulo); acá la usa enfermería para saber qué dosis toca dar.
 */
@Entity('IndicacionesMedicas')
export class IndicacionMedica {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'varchar', length: 50, name: 'PacienteId' })
  patientId: string;

  @Column({ type: 'nvarchar', length: 150, name: 'NombrePaciente' })
  patientName: string;

  @Column({ type: 'nvarchar', length: 150, name: 'Medicamento' })
  medication: string;

  @Column({ type: 'nvarchar', length: 100, name: 'Dosis' })
  dose: string;

  /** Cada cuántas horas se repite la dosis. */
  @Column({ type: 'int', name: 'FrecuenciaHoras' })
  everyHours: number;

  /** Horario de la primera dosis; el resto se calcula sumando `everyHours`. */
  @Column({ type: 'datetime', name: 'PrimeraDosis' })
  firstDoseAt: Date;

  /** Insumo del inventario del piso que se descuenta en cada dosis administrada. */
  @Column({ type: 'int', name: 'InsumoId' })
  supplyId: number;

  @Column({ type: 'bit', name: 'Activa', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'FechaIndicacion' })
  createdAt: Date;
}
