import { Entity, Column, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export enum EstadoCama {
  LIBRES = 'libre',
  OCUPADAS = 'ocupada',
  EN_LIMPIEZA = 'en limpieza',
  BLOQUEADAS = 'bloqueada',
}

@Entity('Camas')
export class Cama {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  Numero: string;

  @Column({ type: 'varchar', length: 30, default: EstadoCama.LIBRES })
  Estado: EstadoCama;

  // Cambiamos Date por number para que TypeORM pueda sumarle +1
  @VersionColumn({ name: 'RowVersion' })
  Version: number;
}