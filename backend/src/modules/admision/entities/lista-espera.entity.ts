import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';

// Columna DATE manejada como texto 'YYYY-MM-DD'.
// El driver de SQL Server (tedious) interpreta un texto '2026-11-14' como medianoche UTC:
// en Argentina (UTC-3) eso es el 13/11 a las 21:00 y los WHERE buscaban el día anterior.
// Pasarle un Date armado en hora local evita el corrimiento al guardar Y al buscar.
const fechaLocalTransformer: ValueTransformer = {
  to: (valor?: string | null) =>
    valor ? new Date(`${String(valor).slice(0, 10)}T00:00:00`) : valor,
  from: (valor?: string | Date | null) =>
    valor instanceof Date ? valor.toLocaleDateString('en-CA') : valor,
};

// HU 1.3: estados de un paciente en la lista de espera (standby) de un profesional
export enum EstadoListaEspera {
  EN_ESPERA = 'En espera', // esperando que se libere un turno ese día
  ASIGNADO = 'Asignado', // se le dio un turno por una cancelación: falta avisarle
  NOTIFICADO = 'Notificado', // la recepción ya le avisó
  RETIRADO = 'Retirado', // la recepción lo sacó de la lista
}

@Entity('ListaEspera')
export class ListaEsperaEntity {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id!: number;

  @Column({ name: 'PacienteId', type: 'int' })
  pacienteId!: number;

  @Column({ name: 'MedicoId', type: 'int' })
  medicoId!: number;

  // Día para el que espera turno (YYYY-MM-DD)
  @Column({ name: 'Fecha', type: 'date', transformer: fechaLocalTransformer })
  fecha!: string;

  @Column({ name: 'Estado', type: 'varchar', length: 50, default: EstadoListaEspera.EN_ESPERA })
  estado!: EstadoListaEspera;

  // La posición NO se guarda: sale del orden de llegada (como en Guardia),
  // así sacar a alguien de la lista no obliga a renumerar al resto.
  @CreateDateColumn({ name: 'FechaAlta', type: 'datetime' })
  fechaAlta!: Date;

  // Turno que se le asignó al promoverlo
  @Column({ name: 'TurnoId', type: 'int', nullable: true })
  turnoId!: number | null;

  @Column({ name: 'FechaAsignacion', type: 'datetime', nullable: true })
  fechaAsignacion!: Date | null;
}