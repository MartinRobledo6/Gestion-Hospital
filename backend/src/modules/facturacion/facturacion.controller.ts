import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { FacturacionService } from './facturacion.service.js';
import {
  AbrirCuentaDto,
  AsignarCoberturaDto,
  FacturarPrestacionDto,
  SimularMedicacionDto,
} from './dto/facturacion.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

// Todo el controller: recepcionista o admin (el admin pasa siempre por el RolesGuard)
@Auth(Rol.RECEPCIONISTA)
@Controller('facturacion')
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  // ---------- Catálogos ----------
  @Get('coberturas')
  listarCoberturas() {
    return this.facturacionService.listarCoberturas();
  }

  @Get('precios-insumos')
  listarPreciosInsumos() {
    return this.facturacionService.listarPreciosInsumos();
  }

  // ---------- Pacientes ----------
  @Get('pacientes')
  listarPacientes() {
    return this.facturacionService.listarPacientes();
  }

  @Patch('pacientes/:id/cobertura')
  asignarCobertura(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarCoberturaDto,
  ) {
    return this.facturacionService.asignarCobertura(id, dto.coberturaId ?? null);
  }

  // ---------- Cuentas ----------
  @Get('cuentas')
  listarCuentas() {
    return this.facturacionService.listarCuentas();
  }

  @Post('cuentas')
  abrirCuenta(@Body() dto: AbrirCuentaDto) {
    return this.facturacionService.abrirCuenta(dto.pacienteId);
  }

  @Get('cuentas/:id')
  obtenerCuenta(@Param('id', ParseIntPipe) id: number) {
    return this.facturacionService.obtenerCuenta(id);
  }

  @Patch('cuentas/:id/cerrar')
    cerrarCuenta(@Param('id', ParseIntPipe) id: number) {
    return this.facturacionService.cerrarCuenta(id);
  }

  @Post('cuentas/:id/cargos')
  facturarPrestacion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FacturarPrestacionDto,
  ) {
    return this.facturacionService.facturarPrestacion(id, dto.costoBase, dto.concepto);
  }

  @Get('reportes/resumen')
  resumenFacturado() {
    return this.facturacionService.resumenFacturado();
  }

  // HU 2.1: simula el evento de Enfermería hasta que ese módulo esté integrado
  @Auth(Rol.ADMINISTRADOR)
  @Post('eventos/medicacion-administrada')
  simularMedicacion(@Body() dto: SimularMedicacionDto) {
    return this.facturacionService.simularMedicacionAdministrada(
      dto.pacienteId,
      dto.insumo,
      dto.cantidad,
    );
  }
}