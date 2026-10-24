import {Entity, Column, PrimaryColumn} from 'typeorm';

@Entity('EventoProcesados')
export class EventoProcesado {
  @PrimaryColumn({ type: 'uniqueidentifier' })
  EventoId: string;
  
  @PrimaryColumn({ type: 'varchar', length: 50})
  Consumidor: string;

  @Column({ type: 'datetime', default: () => 'GETDATE()' })
  FechaProcesado: Date;
}