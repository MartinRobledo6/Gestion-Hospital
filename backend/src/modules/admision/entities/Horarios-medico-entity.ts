import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HorariosMedico')
export class HorarioMedicoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'MedicoId', type: 'int' })
  medicoId: number;

  @Column({ name: 'DiaSemana', type: 'int' }) // 1 = Lunes, 2 = Martes...
  diaSemana: number;

  @Column({ name: 'HoraInicio', type: 'time' }) // Ej: '08:00:00'
  horaInicio: string;

  @Column({ name: 'HoraFin', type: 'time' }) // Ej: '12:00:00'
  horaFin: string;

  @Column({ name: 'DuracionIntervaloMinutos', type: 'int', default: 30 }) // Ej: 30 minutos por consulta
  duracionIntervaloMinutos: number;
}