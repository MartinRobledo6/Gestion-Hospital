import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { AdmisionService } from './admision.service.js';
import { CambiarEstadoTurnoDto } from './dto/cambiar-estado-turno.dto.js';
import { CrearHorarioDto } from './dto/crear-horarios.dto.js';
import { SolicitarTurnoDto } from './dto/solicitar-turnos.dto.js';
import { CrearMedicoDto } from './dto/crear-medico.dto.js';
import { CrearEntreturnoDto } from './dto/crear-entreturno.dto.js';
import { VincularUsuarioDto } from './dto/vincular-usuario.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';
import * as usuarioActualDecorador from '../iam/usuario-actual.decorador.js';

// Recordá: el ADMINISTRADOR pasa siempre por el RolesGuard,
// así que @Auth(Rol.RECEPCIONISTA) significa "recepcionista o admin".
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

  // ---------- Agenda propia (médico logueado) ----------
  @Auth(Rol.MEDICO)
  @Get('mi-agenda')
  miAgenda(@usuarioActualDecorador.UsuarioActual() usuario: usuarioActualDecorador.UsuarioToken) {
    return this.admisionService.miAgenda(usuario.id);
  }

  // ---------- Turnos (recepción) ----------
  @Auth(Rol.RECEPCIONISTA)
  @Get('turnos')
  listarTurnos() {
    return this.admisionService.listarTurnos();
  }

  // Misma validación que el pedido del paciente (bloque libre y dentro del horario),
  // pero protegido: lo usa la recepción desde AdmisionView.
  @Auth(Rol.RECEPCIONISTA)
  @Post('turnos/reservar')
  reservarTurno(@Body() dto: SolicitarTurnoDto) {
    return this.admisionService.solicitarTurno(dto);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('turnos/entreturno')
  insertarEntreturno(@Body() dto: CrearEntreturnoDto) {
    return this.admisionService.insertarEntreturno(dto);
  }

  // Recepción: En Sala de Espera / Confirmado / Cancelado.
  // Médico: Atendido, y solo en sus turnos (lo valida el service).
  @Auth(Rol.RECEPCIONISTA, Rol.MEDICO)
  @Patch('turnos/:id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoTurnoDto,
    @usuarioActualDecorador.UsuarioActual() usuario: usuarioActualDecorador.UsuarioToken,
  ) {
    return this.admisionService.cambiarEstado(id, dto, usuario);
  }

  // ---------- Horarios de atención (recepción) ----------
  @Auth(Rol.RECEPCIONISTA)
  @Get('profesionales')
  listarProfesionales() {
    return this.admisionService.listarProfesionales();
  }

  @Auth(Rol.RECEPCIONISTA)
  @Get('medicos/:id/horarios')
  listarHorarios(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.listarHorarios(id);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('medicos/:id/horarios')
  crearHorario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearHorarioDto,
  ) {
    return this.admisionService.crearHorario(id, dto);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Delete('medicos/horarios/:id')
  eliminarHorario(@Param('id', ParseIntPipe) id: number) {
    return this.admisionService.eliminarHorario(id);
  }

  // ---------- Profesionales (solo admin) ----------
  @Auth(Rol.ADMINISTRADOR)
  @Post('medicos')
  crearMedico(@Body() dto: CrearMedicoDto) {
    return this.admisionService.crearMedico(dto);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Patch('medicos/:id/usuario')
  vincularUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VincularUsuarioDto,
  ) {
    return this.admisionService.vincularUsuario(id, dto.usuarioId);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Get('especialidades')
  listarEspecialidades() {
    return this.admisionService.listarEspecialidades();
  }
}
