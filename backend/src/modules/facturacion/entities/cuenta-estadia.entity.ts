import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("CuentasEstadia")
export class CuentaEstadia {
  @PrimaryGeneratedColumn()
  Id!: number;

  @Column()
  PacienteId!: number;

  @CreateDateColumn()
  FechaApertura!: Date;

  @Column({ default: "Abierta" })
  Estado!: string;

  @Column("decimal", { precision: 18, scale: 2, default: 0.0 })
  TotalCargoPaciente!: number;

  @Column("decimal", { precision: 18, scale: 2, default: 0.0 })
  TotalCargoTerceros!: number;
}
