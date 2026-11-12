import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FacturacionController } from "./facturacion.controller.js";
import { FacturacionService } from "./facturacion.service.js";
import { CuentaEstadia } from "./entities/cuenta-estadia.entity.js";
import { CargoAutomatico } from "./entities/cargo-automatico.entity.js";

@Module({
  imports: [TypeOrmModule.forFeature([CuentaEstadia, CargoAutomatico])],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}
