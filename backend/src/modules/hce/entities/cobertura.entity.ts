import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('Coberturas')
export class Cobertura {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 100 })
  Nombre: string;

  @Column({ type: 'varchar', length: 100 })
  TipoCobertura: string;
}