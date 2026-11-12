import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// Las dos entidades están en el mismo archivo porque se referencian entre sí
// (así evitamos imports circulares).

@Entity('ProtocolosAtencion')
export class ProtocoloAtencion {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'int', name: 'PacienteId' })
  patientId: number;

  @Column({ type: 'varchar', length: 50, name: 'Habitacion', nullable: true })
  roomNumber: string;

  @Column({ type: 'varchar', length: 100, name: 'TipoProtocolo' })
  type: string;

  @CreateDateColumn({ type: 'datetime', name: 'FechaInicio' })
  startedAt: Date;

  // cascade: al guardar el protocolo se guardan también sus tareas.
  @OneToMany(() => TareaProtocolo, (task) => task.protocol, { cascade: true })
  tasks: TareaProtocolo[];
}

@Entity('TareasProtocolo')
export class TareaProtocolo {
  @PrimaryGeneratedColumn({ type: 'int', name: 'Id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'Descripcion' })
  description: string;

  @Column({ type: 'bit', name: 'Completada', default: false })
  completed: boolean;

  @ManyToOne(() => ProtocoloAtencion, (protocol) => protocol.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ProtocoloId' })
  protocol: ProtocoloAtencion;
}
