
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Pacientes')
export class PacienteEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id!: number;

  @Column({ type: 'int', name: 'UsuarioId', nullable: true })
  usuarioId!: number | null;

  @Column({ type: 'int', name: 'CoberturaId' })
  coberturaId!: number;

  @Column({ type: 'varchar', length: 100, name: 'Nombre' })
  nombre!: string;

  @Column({ type: 'varchar', length: 100, name: 'Apellido' })
  apellido!: string;

  @Column({ type: 'varchar', length: 20, name: 'Documento' })
  documento!: string;

  @Column({ type: 'date', name: 'FechaNacimiento' })
  fechaNacimiento!: Date;
}
