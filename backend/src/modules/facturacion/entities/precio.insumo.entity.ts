import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Lista de precios vigente de insumos (HU 2.1: "consultar el precio unitario del insumo").
// Cuando se integre el módulo de Inventario, esta tabla puede pasar a vivir allá.
@Entity('PreciosInsumos')
export class PrecioInsumo {
  @PrimaryGeneratedColumn()
  Id!: number;

  @Column({ length: 120, unique: true })
  Insumo!: string;

  @Column('decimal', { precision: 18, scale: 2 })
  PrecioUnitario!: number;
}