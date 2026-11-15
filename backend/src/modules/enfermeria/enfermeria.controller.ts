import { Body, Controller, Get, Post } from '@nestjs/common';
import { EnfermeriaService } from './enfermeria.service.js';
import { CreateVitalSignsDto } from './dto/create-vital-signs.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';
import { UsuarioActual } from '../iam/usuario-actual.decorador.js';
import type { UsuarioToken } from '../iam/usuario-actual.decorador.js';

// Signos vitales (HU 1.1). Las rutas de medicación, protocolos y notificaciones están en
// sus propios controladores, todas bajo el mismo prefijo /enfermeria.
@Controller('enfermeria')
export class EnfermeriaController {
  constructor(private readonly enfermeriaService: EnfermeriaService) {}

  // El enfermero que registra es el usuario logueado (antes se escribía a mano)
  @Auth(Rol.ENFERMERO)
  @Post('vital-signs')
  async registerVitalSigns(@Body() dto: CreateVitalSignsDto, @UsuarioActual() usuario: UsuarioToken) {
    return this.enfermeriaService.registerVitalSigns(dto, usuario.nombre);
  }

  @Auth(Rol.ENFERMERO, Rol.MEDICO)
  @Get('vital-signs')
  async getAllVitalSigns() {
    return this.enfermeriaService.getAllVitalSigns();
  }
}
