import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('InventarioInsumos')
export class Inventario {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 150 })
  Nombre: string;

  @Column({ type: 'int' })
  StockActual: number;
  
  @Column({ type: 'int', default: 0 })
  StockMinimo: number;
  
  @Column('decimal', { precision: 18, scale: 2 })
  PrecioUnitario: number;
  
}
