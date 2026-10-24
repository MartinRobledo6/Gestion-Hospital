import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Especialidades')
export class EspecialidadEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  nombre!: string;  

  @Column({ type: 'varchar', length: 20, default: 'medico' })
  tipo!: 'medico' | 'enfermero';
}