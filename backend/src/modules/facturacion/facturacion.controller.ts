import { Controller, Post, Body, Param } from "@nestjs/common";
import { FacturacionService } from "./facturacion.service";

@Controller("facturacion")
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  @Post("cuentas/:id/cargos")
  crearCargoManual(
    @Param("id") id: string,
    @Body()
    body: { costoBase: number; concepto: string; tipoCobertura: string },
  ) {
    // Agregamos el 0 al final como eventoId por defecto
    return this.facturacionService.generarCargo(
      +id,
      body.costoBase,
      body.concepto,
      body.tipoCobertura,
      0,
    );
  }
}
