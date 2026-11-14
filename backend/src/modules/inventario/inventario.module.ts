import { Module } from '@nestjs/common';
import { InventarioService } from './inventario.service.js';
import { InventarioController } from './inventario.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity.js';
import { EventoProcesado} from './entities/evento-procesado.entity.js';


@Module({
  imports: [TypeOrmModule.forFeature([Inventario, EventoProcesado])],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
