import { Controller, Post, Get, Body, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { HceService } from './hce.service.js';
import { CrearHistoriaClinicaDto } from './dto/crear-historia-clinica.dto.js';
import { CrearEvolucionDto } from './dto/crear-evolucion.dto.js';
import { ActualizarHistoriaClinicaDto } from './dto/actualizar-historia-clinica.dto.js';
import { CrearEstudioDto } from './dto/crear-estudio.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';
import { UsuarioActual } from '../iam/usuario-actual.decorador.js';
import type { UsuarioToken } from '../iam/usuario-actual.decorador.js';

// Dato clínico: lo escribe el médico y lo consulta enfermería.
// La recepción solo lista pacientes (lo usa el mapa de camas para asignar).

@Controller('hce')
export class HceController {
  constructor(private readonly hceService: HceService) {}

  // POST: http://localhost:3000/hce
  @Auth(Rol.MEDICO)
  @Post()
  abrirHistoria(@Body() dto: CrearHistoriaClinicaDto) {
    return this.hceService.crearHistoriaClinica(dto);
  }

  // POST: http://localhost:3000/hce/evolucion
  // El médico que firma la evolución es el usuario logueado, no un dato del formulario
  @Auth(Rol.MEDICO)
  @Post('evolucion')
  agregarEvolucion(@Body() dto: CrearEvolucionDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.hceService.agregarEvolucion(dto, usuario.id);
  }

    // GET: http://localhost:3000/hce/pacientes
  @Auth(Rol.MEDICO, Rol.ENFERMERO, Rol.RECEPCIONISTA)
  @Get('pacientes')
  listarPacientes() {
    return this.hceService.listarPacientes();
  }

  // GET: http://localhost:3000/hce/paciente/1
  @Auth(Rol.MEDICO, Rol.ENFERMERO)
  @Get('paciente/:id')
  obtenerHistoriaCompleta(@Param('id', ParseIntPipe) pacienteId: number) {
    return this.hceService.obtenerPorPaciente(pacienteId);
  }

  @Auth(Rol.MEDICO)
  @Patch('paciente/:id')
  actualizarHistoria(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarHistoriaClinicaDto) {
    return this.hceService.actualizarHistoriaClinica(id, dto);
  }

  // POST: http://localhost:3000/hce/estudio
  @Auth(Rol.MEDICO)
  @Post('estudio')
  agregarEstudio(@Body() dto: CrearEstudioDto) {
    return this.hceService.agregarEstudio(dto);
  }

  // GET: http://localhost:3000/hce/historia/1/estudios
  @Auth(Rol.MEDICO, Rol.ENFERMERO)
  @Get('historia/:id/estudios')
  listarEstudios(@Param('id', ParseIntPipe) id: number) {
    return this.hceService.listarEstudios(id);
  }
}