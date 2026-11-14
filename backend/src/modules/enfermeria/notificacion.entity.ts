import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Aviso para otro rol (hoy: médico de guardia). Se guarda en la base para que el módulo
 * del médico lo consulte; todavía no se modelan sectores de internación ni médicos a cargo.
 */
@Entity('Notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'varchar', length: 20, name: 'Prioridad' })
  priority: string; // 'ALTA'

  @Column({ type: 'varchar', length: 50, name: 'Destinatario' })
  recipientRole: string; // 'MEDICO_GUARDIA'

  @Column({ type: 'nvarchar', length: 500, name: 'Mensaje' })
  message: string;

  /** Id del registro que originó el aviso (p. ej. el control de signos vitales). */
  @Column({ type: 'varchar', length: 50, name: 'ReferenciaId', nullable: true })
  referenceId: string | null;

  @Column({ type: 'bit', name: 'Leida', default: false })
  read: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'FechaHora' })
  createdAt: Date;
}
