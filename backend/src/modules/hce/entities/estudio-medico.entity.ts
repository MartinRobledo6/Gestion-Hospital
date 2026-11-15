import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('EstudiosMedicos')
export class EstudioMedico{
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'int' })
  HistoriaClinicaId: number;

  @Column({ type: 'nvarchar', length: '100' })
  TipoEstudio: string;

  @Column({ type: 'nvarchar', length: 'MAX' })
  Descripcion: string;

  @Column({ type: 'nvarchar', length: '500', nullable: true })
  Enlace: string | null;

  @CreateDateColumn({ name: 'FechaHora', type: 'datetime', default: () => 'GETDATE()' })
  FechaHora: Date;
}