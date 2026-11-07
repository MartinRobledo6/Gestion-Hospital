import { Body, Controller, Get, Post } from '@nestjs/common';
import { MedicacionService } from './medicacion.service';
import { CreateIndicationDto } from './dto/create-indication.dto';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto';
import { CreateSupplyDto } from './dto/create-supply.dto';

// Medicación prescrita (HU 1.2) e inventario del piso.
@Controller('enfermeria')
export class MedicacionController {
  constructor(private readonly medicacionService: MedicacionService) {}

  // --- Inventario del piso ---
  @Get('inventory')
  listSupplies() {
    return this.medicacionService.listSupplies();
  }

  @Post('inventory')
  createSupply(@Body() dto: CreateSupplyDto) {
    return this.medicacionService.createSupply(dto);
  }

  // --- Indicaciones médicas ---
  @Get('indications')
  listIndications() {
    return this.medicacionService.listIndications();
  }

  @Post('indications')
  createIndication(@Body() dto: CreateIndicationDto) {
    return this.medicacionService.createIndication(dto);
  }

  // --- Dosis de hoy y confirmación ---
  @Get('medication-schedule')
  getSchedule() {
    return this.medicacionService.getSchedule();
  }

  @Post('medication-administration')
  registerAdministration(@Body() dto: CreateMedicationAdministrationDto) {
    return this.medicacionService.registerMedicationAdministration(dto);
  }

  @Get('medication-administration')
  listAdministrations() {
    return this.medicacionService.getAllMedicationAdministrations();
  }
}
