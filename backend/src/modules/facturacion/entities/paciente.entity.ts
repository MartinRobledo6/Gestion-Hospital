import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Pacientes')
export class PacienteEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  @Column({ length: 160, unique: true })
  email!: string;

  // Cobertura con la que está registrado (tabla Coberturas, módulo Facturación).
  // null = sin cobertura → se factura como particular.
  @Column({ type: 'int', nullable: true })
  coberturaId!: number | null;
}