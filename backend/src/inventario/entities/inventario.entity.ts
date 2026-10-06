import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Inventario')
export class Inventario {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 100 })
  Nombre: string;

  @Column({ type: 'varchar', length: 50 })
  Categoria: string;

  @Column({ type: 'int', default: 0 })
  CantidadTotal: number;

  @Column({ type: 'int', default: 0 })
  CantidadDisponible: number;
}