import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { GuardiaService } from './guardia.service.js';
import { RegistrarIngresoGuardiaDto } from './dto/registrar-ingreso-guardia.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';
import { UsuarioActual } from '../iam/usuario-actual.decorador.js';
import type { UsuarioToken } from '../iam/usuario-actual.decorador.js';

// El admin pasa siempre por el RolesGuard
@Controller('admision/guardia')
export class GuardiaController {
  constructor(private readonly guardiaService: GuardiaService) {}

  // Enfermero de guardia: registra y clasifica al paciente
  @Auth(Rol.ENFERMERO)
  @Post('ingresos')
  registrar(
    @Body() dto: RegistrarIngresoGuardiaDto,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.guardiaService.registrarIngreso(dto, usuario.id);
  }

  // Enfermería y médicos ven la cola (es el "monitor" de la guardia)
  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('cola')
  cola() {
    return this.guardiaService.obtenerCola();
  }

  @Auth(Rol.MEDICO)
  @Post('atender-siguiente')
  atenderSiguiente(@UsuarioActual() usuario: UsuarioToken) {
    return this.guardiaService.atenderSiguiente(usuario.id);
  }

  @Auth(Rol.MEDICO)
  @Patch('ingresos/:id/finalizar')
  finalizar(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: UsuarioToken,
  ) {
    return this.guardiaService.finalizar(id, usuario);
  }
}