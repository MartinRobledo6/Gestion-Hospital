import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmisionController } from './admision.controller.js';
import { AdmisionService } from './admision.service.js';
import { GuardiaController } from './guardia.controller.js';
import { GuardiaService } from './guardia.service.js';
import { TurnoEntity } from './entities/turno.entity.js';
import { HorarioMedicoEntity } from './entities/Horarios-medico-entity.js';
import { PacienteEntity } from './entities/paciente.entity.js';
import { MedicoEntity } from './entities/medico.entity.js';
import { EspecialidadEntity } from './entities/especialidad.entity.js';
import { IngresoGuardiaEntity } from './entities/ingreso-guardia.entity.js';
import { IamModule } from '../iam/iam.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurnoEntity,
      HorarioMedicoEntity,
      PacienteEntity,
      MedicoEntity,
      EspecialidadEntity,
      IngresoGuardiaEntity,
    ]),
    IamModule, // UsuariosService: vincular profesionales y nombres en la guardia
  ],
  controllers: [AdmisionController, GuardiaController],
  providers: [AdmisionService, GuardiaService],
  exports: [AdmisionService],
})
export class AdmisionModule {}