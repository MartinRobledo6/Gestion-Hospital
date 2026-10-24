import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from 'typeorm';
import { Cobertura} from './cobertura.entity.js';

@Entity('Pacientes')
export class Paciente {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 100 })
  Nombre: string;

  @Column({ type: 'varchar', length: 100 })
  Apellido: string;

  @Column({ type: 'varchar', length: 20 })
  Documento: string;

  @Column({ type: 'date' })
  FechaNacimiento: Date;

  @Column({ type: 'int' })
  CoberturaId: number;

  @ManyToOne(() => Cobertura)
  @JoinColumn({ name: 'CoberturaId' })
  Cobertura: Cobertura;
}