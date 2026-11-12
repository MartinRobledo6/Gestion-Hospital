import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturacionController } from './facturacion.controller.js';
import { FacturacionService } from './facturacion.service.js';
import { CuentaEstadia } from './entities/cuenta-estadia.entity.js';
import { CargoAutomatico } from './entities/cargo-automatico.entity.js';
import { Cobertura } from './entities/cobertura.entity.js';
import { PrecioInsumo } from './entities/precio.insumo.entity.js';
import { PacienteEntity } from '../admision/entities/paciente.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CuentaEstadia,
      CargoAutomatico,
      Cobertura,
      PrecioInsumo,
      PacienteEntity, // para leer la cobertura del paciente
    ]),
  ],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}