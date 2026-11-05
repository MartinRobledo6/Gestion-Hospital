import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth-guard.js';
import { RolesGuard } from './roles.guard.js';
import { Roles } from './roles.decorador.js';
import { Rol } from './rol.enum.js';

// @Auth()                    -> cualquier usuario logueado
// @Auth(Rol.RECEPCIONISTA)   -> recepcionista (y admin, por el bypass)
export const Auth = (...roles: Rol[]) =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard), Roles(...roles));