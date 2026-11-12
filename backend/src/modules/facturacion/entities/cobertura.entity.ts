import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Cada tipo define la "estrategia" de cobro (ver facturacion-strategy.ts)
export enum TipoCobertura {
  PUBLICA = 'PUBLICA',
  PREPAGA = 'PREPAGA',
  PARTICULAR = 'PARTICULAR',
}

// Una obra social o prepaga concreta. Ej: "Medicina Prepaga Premium" (PREPAGA, copago 3000).
// Un paciente sin cobertura asignada se factura como PARTICULAR.
@Entity('Coberturas')
export class Cobertura {
  @PrimaryGeneratedColumn()
  Id!: number;

  @Column({ length: 120, unique: true })
  Nombre!: string;

  @Column({ type: 'varchar', length: 20 })
  Tipo!: TipoCobertura;

  // Lo que paga el paciente por prestación (solo aplica a PREPAGA)
  @Column('decimal', { precision: 18, scale: 2, default: 0 })
  CopagoFijo!: number;
}