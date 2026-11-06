import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Escala de triaje Manchester: 1 es lo más urgente
export enum NivelTriaje {
  ROJO = 1, // Riesgo vital: atención inmediata
  NARANJA = 2, // Muy urgente
  AMARILLO = 3, // Urgente
  VERDE = 4, // Poco urgente
  AZUL = 5, // No urgente
}

export enum EstadoGuardia {
  EN_ESPERA = 'En espera',
  EN_ATENCION = 'En atención',
  FINALIZADO = 'Finalizado',
}

@Entity('IngresosGuardia')
export class IngresoGuardiaEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // El paciente de guardia llega sin turno y muchas veces sin email,
  // por eso no se usa la tabla Pacientes (que exige email único).
  @Column({ length: 120 })
  pacienteNombre!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  documento!: string | null;

  @Column({ length: 300 })
  motivoConsulta!: string;

  @Column({ type: 'int' })
  nivel!: NivelTriaje;

  @Column({ type: 'varchar', length: 20, default: EstadoGuardia.EN_ESPERA })
  estado!: EstadoGuardia;

  // Cuenta del enfermero que hizo el triaje
  @Column({ type: 'int' })
  enfermeroUsuarioId!: number;

  // Cuenta del médico que lo tomó (null mientras espera)
  @Column({ type: 'int', nullable: true })
  medicoUsuarioId!: number | null;

  @CreateDateColumn({ type: 'datetime' })
  fechaIngreso!: Date;

  @Column({ type: 'datetime', nullable: true })
  fechaAtencion!: Date | null;
}