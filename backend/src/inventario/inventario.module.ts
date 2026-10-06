import { Module } from '@nestjs/common';
import { InventarioService } from './inventario.service.js';
import { InventarioController } from './inventario.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventario } from './entities/inventario.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Inventario])],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
