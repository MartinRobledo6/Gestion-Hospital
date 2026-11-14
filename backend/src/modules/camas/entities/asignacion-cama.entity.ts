import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('AsignacionCamas')
export class AsignacionCama {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column()
  CamaId: number;

  @Column()
  PacienteId: number;

  // TypeORM no necesita manejar el default acá si SQL Server ya tiene GETDATE()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  FechaIngreso: Date;

  @Column({ nullable: true })
  FechaEgreso: Date;
}