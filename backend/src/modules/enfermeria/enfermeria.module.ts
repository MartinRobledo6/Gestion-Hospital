import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades propias de Enfermería
import { VitalSigns } from './vital-signs.entity.js';
import { MedicationAdministration } from './medication-administration.entity.js';
import { IndicacionMedica } from './indicacion-medica.entity.js';
import { Notificacion } from './notificacion.entity.js';
import {
  ProtocoloAtencion,
  TareaProtocolo,
} from './protocolo.entities.js';

// Entidades compartidas del hospital
import { Inventario } from '../inventario/entities/inventario.entity.js';
import { Paciente } from '../hce/entities/paciente.entity.js';
import { Usuario } from '../hce/entities/usuario.entity.js';
import { Rol } from '../hce/entities/rol.entity.js';

// Controllers
import { EnfermeriaController } from './enfermeria.controller.js';
import { MedicacionController } from './medicacion.controller.js';
import { ProtocolosController } from './protocolos.controller.js';
import { NotificacionesController } from './notificaciones.controller.js';

// Services
import { EnfermeriaService } from './enfermeria.service.js';
import { MedicacionService } from './medicacion.service.js';
import { ProtocolosService } from './protocolos.service.js';
import { NotificacionesService } from './notificaciones.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Enfermería
      VitalSigns,
      MedicationAdministration,
      IndicacionMedica,
      Notificacion,
      ProtocoloAtencion,
      TareaProtocolo,

      // Entidades compartidas
      Inventario,
      Paciente,
      Usuario,
      Rol,
    ]),
  ],
  controllers: [
    EnfermeriaController,
    MedicacionController,
    ProtocolosController,
    NotificacionesController,
  ],
  providers: [
    EnfermeriaService,
    MedicacionService,
    ProtocolosService,
    NotificacionesService,
  ],
  exports: [
    EnfermeriaService,
    MedicacionService,
    ProtocolosService,
  ],
})
export class EnfermeriaModule {}
