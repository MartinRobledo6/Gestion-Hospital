import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { EvolucionMedica } from './evolucion-medica.entity.js';
import { Paciente } from './paciente.entity.js';

@Entity('HistoriaClinica')
export class HistoriaClinica {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int', unique: true })
  PacienteId: number; 

  @OneToOne(() => Paciente)
  @JoinColumn({ name: 'PacienteId' })
  Paciente: Paciente;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  Alergias: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  AntecedentesFamiliares: string;

  @OneToMany(() => EvolucionMedica, (evolucion) => evolucion.HistoriaClinica)
  Evoluciones: Relation<EvolucionMedica>[];
}