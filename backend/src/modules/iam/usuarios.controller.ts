import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { UsuariosService } from './usuarios.service.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { JwtAuthGuard } from './jwt-auth-guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorador.js';
import { Rol } from './rol.enum.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.ADMINISTRADOR)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  crear(@Body() dto: CrearUsuarioDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar() {
    return this.service.listar();
  }
}