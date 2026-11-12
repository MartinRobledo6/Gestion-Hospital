
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('AdministracionMedicion')
export class MedicationAdministration {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'int', name: 'IndicacionId' })
  indicationId: number;

  @Column({ type: 'int', name: 'EnfermeroId' })
  nurseId: number;

  @CreateDateColumn({
    type: 'datetime',
    name: 'FechaHoraAplicacion',
  })
  administeredAt: Date;

  /** Horario de la dosis programada que se está confirmando (p. ej. las 14:00). */
  @Column({
    type: 'datetime',
    name: 'FechaHoraProgramada',
    nullable: true,
  })
  scheduledAt: Date | null;

  @Column({ type: 'varchar', length: 50, name: 'Estado' })
  status: string;
}


