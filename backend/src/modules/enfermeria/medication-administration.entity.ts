import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../hce/entities/usuario.entity.js';

@Entity('AdministracionMedicion')
export class MedicationAdministration {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'int', name: 'IndicacionId' })
  indicationId: number;

  @Column({ type: 'int', name: 'EnfermeroId' })
  nurseId: number;

  // Misma columna que nurseId, pero como relación: permite traer los datos del usuario.
  @ManyToOne(() => Usuario, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'EnfermeroId' })
  nurse?: Usuario;

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