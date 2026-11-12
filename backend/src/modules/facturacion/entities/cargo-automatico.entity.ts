import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// A nombre de quién queda cada cargo
export enum Destinatario {
  PACIENTE = 'PACIENTE',
  ESTADO = 'ESTADO', // cobertura pública: cargo subsidiado
  PREPAGA = 'PREPAGA', // reclamo de facturación a terceros
}

@Entity('CargosAutomaticos')
export class CargoAutomatico {
  @PrimaryGeneratedColumn()
  Id!: number;

  @Column()
  CuentaEstadiaId!: number;

  @Column({ length: 200 })
  Concepto!: string;

  // Info extra, ej: "Ibuprofeno 400mg x 1"
  @Column({ type: 'varchar', length: 200, nullable: true })
  Detalle!: string | null;

  @Column({ type: 'varchar', length: 20 })
  Destinatario!: Destinatario;

  @Column('decimal', { precision: 18, scale: 2 })
  Monto!: number;

  // ID del evento que originó el cargo (trazabilidad de auditoría, HU 2.1).
  // null = cargo cargado a mano desde la vista de facturación.
  @Column({ type: 'varchar', length: 64, nullable: true })
  ReferenciaEventoId!: string | null;

  @CreateDateColumn()
  FechaCargo!: Date;
}