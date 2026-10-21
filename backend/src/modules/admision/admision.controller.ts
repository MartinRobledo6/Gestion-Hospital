import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdmisionService } from './admision.service.js';
import { ReservarTurnoDto } from './dto/reservar-turnos.dto.js';
import { CambiarEstadoTurnoDto } from './dto/cambiar-estado-turno.dto.js';
import { CrearHorarioDto } from './dto/crear-horarios.dto.js';
import { SolicitarTurnoDto } from './dto/solicitar-turnos.dto.js';
import { CrearMedicoDto } from './dto/crear-medico.dto.js';
import { CrearEntreturnoDto } from './dto/crear-entreturno.dto.js';

@Controller('admision')
export class AdmisionController {
  constructor(private readonly admisionService: AdmisionService) {}

  @Get('turnos')
  listarTurnos() {
    return this.admisionService.listarTurnos();
  }

  @Get('turnos/disponibles')
  obtenerDisponibles(
    @Query('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string, // YYYY-MM-DD
  ) {
    return this.admisionService.obtenerHorariosDisponibles(medicoId, fecha);
  }

  @Post('turnos/reservar')
  reservarTurno(@Body() dto: ReservarTurnoDto) {
    return this.admisionService.reservarTurno(dto);
  }

  @Patch('turnos/:id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoTurnoDto,
  ) {
    return this.admisionService.cambiarEstado(id, dto);
  }

    @Get('medicos/:id/horarios')
  listarHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.listarHorarios(id);
  }

  @Post('medicos/:id/horarios')
  crearHorario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearHorarioDto,
  ) {
    return this.admisionService.crearHorario(id, dto);
  }

  @Delete('medicos/horarios/:id')
  eliminarHorario(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.eliminarHorario(id);
  }
    @Get('medicos')
  listarMedicos() {
    return this.admisionService.listarMedicos();
  }

  @Post('turnos/solicitar')
  solicitarTurno(@Body() dto: SolicitarTurnoDto) {
    return this.admisionService.solicitarTurno(dto);
  }

  @Post('medicos')
crearMedico(@Body() dto: CrearMedicoDto) {
  return this.admisionService.crearMedico(dto);
}

@Post('turnos/entreturno')
insertarEntreturno(@Body() dto: CrearEntreturnoDto) {
  return this.admisionService.insertarEntreturno(dto);
}
}