import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EspecialidadEntity } from './especialidad.entity.js';

export const TIPOS_PROFESIONAL = ['medico', 'enfermero'] as const;
export type TipoProfesional = (typeof TIPOS_PROFESIONAL)[number];

@Entity('Medicos')
export class MedicoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 20, default: 'medico' })
  tipo!: TipoProfesional;

  @Column({ type: 'int', nullable: true })
  especialidadId!: number | null;

  @ManyToOne(() => EspecialidadEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'especialidadId' })
  especialidad!: EspecialidadEntity | null;
}