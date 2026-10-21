import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmisionController } from './admision.controller.js';
import { AdmisionService } from './admision.service.js';
import { TurnoEntity } from './entities/turno.entity.js';
import { HorarioMedicoEntity } from './entities/Horarios-medico-entity.js';
import { PacienteEntity } from './entities/paciente.entity.js';
import { MedicoEntity } from './entities/medico.entity.js';



@Module({
  imports: [TypeOrmModule.forFeature([TurnoEntity, HorarioMedicoEntity, PacienteEntity, MedicoEntity])],
  controllers: [AdmisionController],
  providers: [AdmisionService],
  exports: [AdmisionService],
})
export class AdmisionModule {}