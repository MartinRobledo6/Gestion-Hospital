
import { Body, Controller, Get, Post } from '@nestjs/common';

import { MedicacionService } from './medicacion.service.js';
import { CreateIndicationDto } from './dto/create-indication.dto.js';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto.js';

@Controller('enfermeria')
export class MedicacionController {
  constructor(
    private readonly medicacionService: MedicacionService,
  ) {}

  // Inventario central del hospital
  @Get('inventory')
  listSupplies() {
    return this.medicacionService.listSupplies();
  }

  // Indicaciones médicas
  @Get('indications')
  listIndications() {
    return this.medicacionService.listIndications();
  }

  @Post('indications')
  createIndication(@Body() dto: CreateIndicationDto) {
    return this.medicacionService.createIndication(dto);
  }

  // Dosis y administraciones
  @Get('medication-schedule')
  getSchedule() {
    return this.medicacionService.getSchedule();
  }

  @Post('medication-administration')
  registerAdministration(
    @Body() dto: CreateMedicationAdministrationDto,
  ) {
    return this.medicacionService.registerMedicationAdministration(dto);
  }

  @Get('medication-administration')
  listAdministrations() {
    return this.medicacionService.getAllMedicationAdministrations();
  }
}
