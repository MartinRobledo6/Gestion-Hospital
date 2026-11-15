import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ProtocolosService } from './protocolos.service.js';
import { AdmitPatientDto } from './dto/admit-patient.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

// Protocolos de ingreso (HU 2.1).
@Controller('enfermeria/protocols')
export class ProtocolosController {
  constructor(private readonly protocolosService: ProtocolosService) {}

  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('reasons')
  listReasons() {
    return this.protocolosService.listReasons();
  }

  // Equivale a recibir el evento de ingreso de Admisión: genera el protocolo con su Builder.
  @Auth(Rol.ENFERMERO)
  @Post()
  admit(@Body() dto: AdmitPatientDto) {
    return this.protocolosService.admit(dto);
  }

  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get()
  list() {
    return this.protocolosService.list();
  }

  @Auth(Rol.ENFERMERO)
  @Patch('tasks/:id')
  setTaskCompleted(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.protocolosService.setTaskCompleted(id, dto.completed);
  }
}
