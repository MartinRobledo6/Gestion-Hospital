import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("CargosAutomaticos")
export class CargoAutomatico {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column()
  CuentaEstadiaId: number;

  @Column()
  Concepto: string;

  @Column("decimal", { precision: 18, scale: 2 })
  Monto: number;

  @Column()
  ReferenciaEventoId: number;

  @CreateDateColumn()
  FechaCargo: Date;
}
