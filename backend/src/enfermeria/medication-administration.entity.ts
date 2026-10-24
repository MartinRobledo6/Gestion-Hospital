import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('AdministracionMedicion')
export class MedicationAdministration {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'int', name: 'IndicacionId' })
  indicationId: number;

  @Column({ type: 'int', name: 'EnfermeroId' })
  nurseId: number;

  @CreateDateColumn({ type: 'datetime', name: 'FechaHoraAplicacion' })
  administeredAt: Date;

  @Column({ type: 'varchar', length: 50, name: 'Estado' })
  status: string;
}