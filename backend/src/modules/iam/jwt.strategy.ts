
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsuariosService } from './usuarios.service.js';
import { UsuarioToken } from './usuario-actual.decorador.js';
import { obtenerJwtSecret } from './jwt-secret.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usuarios: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: obtenerJwtSecret(),
    });
  }

  async validate(payload: { sub: number }): Promise<UsuarioToken> {
    const usuario = await this.usuarios.buscarPorId(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Usuario inexistente');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}
