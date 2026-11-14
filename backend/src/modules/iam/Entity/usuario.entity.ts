
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rol as RolEntity } from '../../hce/entities/rol.entity.js';

@Entity('Usuarios')
export class UsuarioEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'varchar', length: 100, name: 'NombreUsuario' })
  nombreUsuario: string;

  @Column({ type: 'varchar', length: 100, name: 'Email' })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'PasswordHash' })
  passwordHash: string;

  @ManyToOne(() => RolEntity)
  @JoinColumn({ name: 'RolId', referencedColumnName: 'id' })
  rolEntity: RolEntity;
}
