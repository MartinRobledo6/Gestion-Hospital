import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;
}