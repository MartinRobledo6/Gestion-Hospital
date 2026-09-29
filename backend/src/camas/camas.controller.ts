import { Controller, Post, Body } from '@nestjs/common';
import { CamasService } from './camas.service.js';
import { AsignarCamaDto } from './dto/asignar-cama.dto.js';

@Controller('camas')
export class CamasController {
  constructor(private readonly camasService: CamasService) {}

  // POST http://localhost:3000/camas/asignar
  @Post('asignar')
  asignar(@Body() body: AsignarCamaDto) {
    return this.camasService.asignarCama(body.numero, body.pacienteId);
  }
}