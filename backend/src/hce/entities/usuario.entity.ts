import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Rol } from './rol.entity.js';

@Entity('Usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombreUsuario: string;

  @Column({ type: 'int'})
  rolId: number;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rolId' })
  rol: Rol;
}