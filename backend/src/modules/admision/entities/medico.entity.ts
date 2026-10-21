import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Medicos')
export class MedicoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  @Column({ length: 100 })
  especialidad!: string;
}