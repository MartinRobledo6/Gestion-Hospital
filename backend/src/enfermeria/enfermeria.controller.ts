import { Controller, Post, Get, Body } from '@nestjs/common';
import { EnfermeriaService } from './enfermeria.service';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto'; // 1. Importar el nuevo DTO

@Controller('enfermeria')
export class EnfermeriaController {
  constructor(private readonly enfermeriaService: EnfermeriaService) {}

  // --- Endpoints de Signos Vitales ---
  @Post('vital-signs')
  async create(@Body() createDto: CreateVitalSignsDto) {
    return await this.enfermeriaService.registerVitalSigns(createDto);
  }

  @Get('vital-signs')
  async findAll() {
    return await this.enfermeriaService.getAllVitalSigns();
  }

  // --- Endpoints Nuevos de Administración de Medicamentos ---
  @Post('medication-administration')
  async createMedicationAdmin(@Body() createDto: CreateMedicationAdministrationDto) {
    return await this.enfermeriaService.registerMedicationAdministration(createDto);
  }

  @Get('medication-administration')
  async findAllMedicationAdmins() {
    return await this.enfermeriaService.getAllMedicationAdministrations();
  }
}