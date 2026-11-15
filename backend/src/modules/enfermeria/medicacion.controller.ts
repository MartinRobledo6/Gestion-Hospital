
import { Body, Controller, Get, Post } from '@nestjs/common';

import { MedicacionService } from './medicacion.service.js';
import { CreateIndicationDto } from './dto/create-indication.dto.js';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';
import { UsuarioActual } from '../iam/usuario-actual.decorador.js';
import type { UsuarioToken } from '../iam/usuario-actual.decorador.js';

// El médico indica la medicación; el enfermero la administra.
// En los dos casos la identidad sale del token, no del formulario (trazabilidad, HU 1.2).

@Controller('enfermeria')
export class MedicacionController {
  constructor(
    private readonly medicacionService: MedicacionService,
  ) {}

  // Inventario central del hospital
  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('inventory')
  listSupplies() {
    return this.medicacionService.listSupplies();
  }

  // Indicaciones médicas
  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('indications')
  listIndications() {
    return this.medicacionService.listIndications();
  }

  @Auth(Rol.MEDICO)
  @Post('indications')
  createIndication(@Body() dto: CreateIndicationDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.medicacionService.createIndication(dto, usuario.id);
  }

  // Dosis y administraciones
  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('medication-schedule')
  getSchedule() {
    return this.medicacionService.getSchedule();
  }

  @Auth(Rol.ENFERMERO)
  @Post('medication-administration')
  registerAdministration(
    @Body() dto: CreateMedicationAdministrationDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.medicacionService.registerMedicationAdministration(dto, usuario.id);
  }

  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('medication-administration')
  listAdministrations() {
    return this.medicacionService.getAllMedicationAdministrations();
  }
}
