import { Body, Controller, Get, Post } from '@nestjs/common';
import { EnfermeriaService } from './enfermeria.service';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto';

// Signos vitales (HU 1.1). Las rutas de medicación, protocolos y notificaciones están en
// sus propios controladores, todas bajo el mismo prefijo /enfermeria.
@Controller('enfermeria')
export class EnfermeriaController {
  constructor(private readonly enfermeriaService: EnfermeriaService) {}

  @Post('vital-signs')
  async registerVitalSigns(@Body() dto: CreateVitalSignsDto) {
    return this.enfermeriaService.registerVitalSigns(dto);
  }

  @Get('vital-signs')
  async getAllVitalSigns() {
    return this.enfermeriaService.getAllVitalSigns();
  }
}
