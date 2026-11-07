import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalSigns } from './vital-signs.entity';
import { MedicationAdministration } from './medication-administration.entity';
import { IndicacionMedica } from './indicacion-medica.entity';
import { InventarioInsumo } from './inventario-insumo.entity';
import { Notificacion } from './notificacion.entity';
import { ProtocoloAtencion, TareaProtocolo } from './protocolo.entities';
import { EnfermeriaController } from './enfermeria.controller';
import { MedicacionController } from './medicacion.controller';
import { ProtocolosController } from './protocolos.controller';
import { NotificacionesController } from './notificaciones.controller';
import { EnfermeriaService } from './enfermeria.service';
import { MedicacionService } from './medicacion.service';
import { ProtocolosService } from './protocolos.service';
import { NotificacionesService } from './notificaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VitalSigns,
      MedicationAdministration,
      IndicacionMedica,
      InventarioInsumo,
      Notificacion,
      ProtocoloAtencion,
      TareaProtocolo,
    ]),
  ],
  controllers: [
    EnfermeriaController,
    MedicacionController,
    ProtocolosController,
    NotificacionesController,
  ],
  providers: [EnfermeriaService, MedicacionService, ProtocolosService, NotificacionesService],
  exports: [EnfermeriaService, MedicacionService, ProtocolosService],
})
export class EnfermeriaModule {}
