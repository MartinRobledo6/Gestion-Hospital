import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CamasService } from './camas.service.js';
import { CamasController } from './camas.controller.js';
import { Cama } from './entities/cama.entity.js';
import { AsignacionCama } from './entities/asignacion-cama.entity.js';

@Module({
  // Registramos ambas entidades
  imports: [TypeOrmModule.forFeature([Cama, AsignacionCama])],
  controllers: [CamasController],
  providers: [CamasService],
})
export class CamasModule {}