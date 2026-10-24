import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { HceService } from './hce.service.js';
import { CrearHistoriaClinicaDto } from './dto/crear-historia-clinica.dto.js';
import { CrearEvolucionDto } from './dto/crear-evolucion.dto.js';
import { ActualizarHistoriaClinicaDto } from './dto/actualizar-historia-clinica.dto.js';
import { CrearEstudioDto } from './dto/crear-estudio.dto.js';

@Controller('hce')
export class HceController {
  constructor(private readonly hceService: HceService) {}

  // POST: http://localhost:3000/hce
  @Post()
  abrirHistoria(@Body() dto: CrearHistoriaClinicaDto) {
    return this.hceService.crearHistoriaClinica(dto);
  }

  // POST: http://localhost:3000/hce/evolucion
  @Post('evolucion')
  agregarEvolucion(@Body() dto: CrearEvolucionDto) {
    return this.hceService.agregarEvolucion(dto);
  }

  // GET: http://localhost:3000/hce/paciente/1
  @Get('paciente/:id')
  obtenerHistoriaCompleta(@Param('id', ParseIntPipe) pacienteId: number) {
    return this.hceService.obtenerPorPaciente(pacienteId);
  }

  @Patch('paciente/:id')
  actualizarHistoria(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarHistoriaClinicaDto) {
    return this.hceService.actualizarHistoriaClinica(id, dto);
  }

  // POST: http://localhost:3000/hce/estudio
  @Post('estudio')
  agregarEstudio(@Body() dto: CrearEstudioDto) {
    return this.hceService.agregarEstudio(dto);
  }

  // GET: http://localhost:3000/hce/historia/1/estudios
  @Get('historia/:id/estudios')
  listarEstudios(@Param('id', ParseIntPipe) id: number) {
    return this.hceService.listarEstudios(id);
  }
}