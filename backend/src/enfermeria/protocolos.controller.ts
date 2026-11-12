import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ProtocolosService } from './protocolos.service.js';
import { AdmitPatientDto } from './dto/admit-patient.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

// Protocolos de ingreso (HU 2.1).
@Controller('enfermeria/protocols')
export class ProtocolosController {
  constructor(private readonly protocolosService: ProtocolosService) {}

  @Get('reasons')
  listReasons() {
    return this.protocolosService.listReasons();
  }

  // Equivale a recibir el evento de ingreso de Admisión: genera el protocolo con su Builder.
  @Post()
  admit(@Body() dto: AdmitPatientDto) {
    return this.protocolosService.admit(dto);
  }

  @Get()
  list() {
    return this.protocolosService.list();
  }

  @Patch('tasks/:id')
  setTaskCompleted(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.protocolosService.setTaskCompleted(id, dto.completed);
  }
}
