import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { AdmisionService } from './admision.service.js';
import { ReservarTurnoDto } from './dto/reservar-turnos.dto.js';
import { CambiarEstadoTurnoDto } from './dto/cambiar-estado-turno.dto.js';
import { CrearHorarioDto } from './dto/crear-horarios.dto.js';
import { SolicitarTurnoDto } from './dto/solicitar-turnos.dto.js';
import { CrearMedicoDto } from './dto/crear-medico.dto.js';
import { CrearEntreturnoDto } from './dto/crear-entreturno.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

@Controller('admision')
export class AdmisionController {
  constructor(private readonly admisionService: AdmisionService) {}

  // ---------- Públicos (los usa la vista del paciente) ----------
  @Get('medicos')
  listarMedicos(@Query('tipo') tipo?: string) {
    return this.admisionService.listarMedicos(tipo);
  }

  @Get('turnos/disponibles')
  obtenerDisponibles(
    @Query('medicoId', ParseIntPipe) medicoId: number,
    @Query('fecha') fecha: string, // YYYY-MM-DD
  ) {
    return this.admisionService.obtenerHorariosDisponibles(medicoId, fecha);
  }

  @Post('turnos/solicitar')
  solicitarTurno(@Body() dto: SolicitarTurnoDto) {
    return this.admisionService.solicitarTurno(dto);
  }

  // ---------- Turnos (personal) ----------
  @Auth(Rol.RECEPCIONISTA, Rol.MEDICO)
  @Get('turnos')
  listarTurnos() {
    return this.admisionService.listarTurnos();
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('turnos/reservar')
  reservarTurno(@Body() dto: ReservarTurnoDto) {
    return this.admisionService.reservarTurno(dto);
  }

  @Auth(Rol.RECEPCIONISTA, Rol.MEDICO)
  @Patch('turnos/:id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoTurnoDto,
  ) {
    return this.admisionService.cambiarEstado(id, dto);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('turnos/entreturno')
  insertarEntreturno(@Body() dto: CrearEntreturnoDto) {
    return this.admisionService.insertarEntreturno(dto);
  }

  // ---------- Profesionales (solo admin: Rol.ADMINISTRADOR) ----------
  @Auth(Rol.ADMINISTRADOR)
  @Post('medicos')
  crearMedico(@Body() dto: CrearMedicoDto) {
    return this.admisionService.crearMedico(dto);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Get('medicos/:id/horarios')
  listarHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.listarHorarios(id);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Post('medicos/:id/horarios')
  crearHorario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearHorarioDto,
  ) {
    return this.admisionService.crearHorario(id, dto);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Delete('medicos/horarios/:id')
  eliminarHorario(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.eliminarHorario(id);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Get('especialidades')
  listarEspecialidades() {
    return this.admisionService.listarEspecialidades();
  }
}