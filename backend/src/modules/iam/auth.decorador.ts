import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorador.js';
import { Rol } from './rol.enum.js';


export const Auth = (...roles: Rol[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));