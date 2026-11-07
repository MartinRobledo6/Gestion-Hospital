import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/** Insumo médico del inventario del piso (mismo nombre de tabla que el diseño de la base). */
@Entity('InventarioInsumos')
export class InventarioInsumo {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'nvarchar', length: 150, name: 'Nombre' })
  name: string;

  @Column({ type: 'int', name: 'StockActual' })
  stock: number;
}
