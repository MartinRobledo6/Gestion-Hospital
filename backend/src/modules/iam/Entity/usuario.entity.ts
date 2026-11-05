import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Rol } from '../rol.enum.js';

@Entity('Usuarios')
export class UsuarioEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  rol: Rol;

  @Column({ default: true })
  activo: boolean;
}