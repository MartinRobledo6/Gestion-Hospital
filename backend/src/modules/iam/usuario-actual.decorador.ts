import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Rol } from './rol.enum.js';

// Lo que JwtStrategy.validate() deja en req.user
export interface UsuarioToken {
  id: number;
  email: string;
  rol: Rol;
}

// Uso en un controller:  metodo(@UsuarioActual() usuario: UsuarioToken)
// Evita repetir @Req() req y tipar req.user en cada endpoint.
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioToken =>
    ctx.switchToHttp().getRequest().user,
);
