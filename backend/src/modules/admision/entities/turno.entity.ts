import { Entity, PrimaryGeneratedColumn, Column, VersionColumn } from 'typeorm';

@Entity('Turnos')
export class TurnoEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'PacienteId', type: 'int' })
  pacienteId: number;

  @Column({ name: 'MedicoId', type: 'int' })
  medicoId: number;

  @Column({ name: 'FechaHoraInicio', type: 'datetime' })
  fechaHoraInicio: Date;

  @Column({ name: 'FechaHoraFin', type: 'datetime' })
  fechaHoraFin: Date;

  @Column({ name: 'Estado', type: 'varchar', length: 50, default: 'Programado' })
  estado: string;

  @Column({ name: 'EsEntreturno', type: 'bit', default: false })
  esEntreturno: boolean;

  @Column({ name: 'DuracionReducida', type: 'bit', default: false })
  duracionReducida: boolean;

  @VersionColumn({ name: 'RowVersion' })
  version: number;
}