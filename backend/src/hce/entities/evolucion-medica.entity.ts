import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { HistoriaClinica } from './historia-clinica.entity.js';

@Entity('EvolucionesMedicas')
export class EvolucionMedica {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  HistoriaClinicaId: number; 

  @Column({ type: 'int' })
  MedicoId: number; 

  @CreateDateColumn({ name: 'FechaHora', type: 'datetime', default: () => 'GETDATE()' })
  FechaHora: Date; 

  @Column({ type: 'nvarchar', length: 'MAX' })
  Observaciones: string;

  @ManyToOne(() => HistoriaClinica, (hc) => hc.Evoluciones)
  @JoinColumn({ name: 'HistoriaClinicaId' })
  HistoriaClinica: Relation<HistoriaClinica>;
}