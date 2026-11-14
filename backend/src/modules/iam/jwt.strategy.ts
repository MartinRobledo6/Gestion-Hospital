
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsuariosService } from './usuarios.service.js';
import { UsuarioToken } from './usuario-actual.decorador.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usuarios: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-cambiar',
    });
  }

  async validate(payload: { sub: number }): Promise<UsuarioToken> {
    const usuario = await this.usuarios.buscarPorId(payload.sub);

    if (!usuario) {
      throw new UnauthorizedException('Usuario inexistente');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };
  }
}
