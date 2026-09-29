import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Turnos')
export class TurnoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  pacienteId: number;

  @Column({ type: 'int' })
  medicoId: number;

  @Column({ type: 'datetime' })
  fechaHoraInicio: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaHoraFin: Date;

  // Estado que gestiona la Máquina de Estados (Patrón State)
  @Column({ type: 'varchar', length: 50, default: 'Programado' })
  estado: string;

  @Column({ type: 'bit', default: false })
  esEntreturno: boolean;

  // Concurrencia optimista gestionada automáticamente por TypeORM / SQL Server
  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}