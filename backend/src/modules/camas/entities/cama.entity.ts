import { Entity, Column, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export enum EstadoCama {
  LIBRES = 'libres',
  OCUPADAS = 'ocupadas',
  EN_LIMPIEZA = 'en limpieza',
  BLOQUEADAS = 'bloqueadas',
}

@Entity('Camas')
export class Cama {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  Numero: string;

  @Column({ type: 'varchar', length: 30, default: EstadoCama.LIBRES })
  Estado: EstadoCama;

  @VersionColumn({ name: 'RowVersion' })
  Version: number;
}