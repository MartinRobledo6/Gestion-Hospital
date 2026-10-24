import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HceService } from './hce.service.js';
import { HceController } from './hce.controller.js';
import { HistoriaClinica } from './entities/historia-clinica.entity.js';
import { EvolucionMedica } from './entities/evolucion-medica.entity.js';
import { Paciente } from './entities/paciente.entity.js';
import { Cobertura } from './entities/cobertura.entity.js';
import { EstudioMedico } from './entities/estudio-medico.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([HistoriaClinica, EvolucionMedica, Paciente, Cobertura, EstudioMedico])],
  controllers: [HceController],
  providers: [HceService],
})
export class HceModule {}
