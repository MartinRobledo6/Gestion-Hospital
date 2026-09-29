import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FacturacionController } from "./facturacion.controller";
import { FacturacionService } from "./facturacion.service";
import { CuentaEstadia } from "./cuenta-estadia.entity";
import { CargoAutomatico } from "./cargo-automatico.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CuentaEstadia, CargoAutomatico])],
  controllers: [FacturacionController],
  providers: [FacturacionService],
})
export class FacturacionModule {}
