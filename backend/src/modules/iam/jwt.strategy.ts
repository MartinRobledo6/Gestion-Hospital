import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from './usuarios.service.js';
import { UsuarioToken } from './usuario-actual.decorador.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuarios: UsuariosService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-cambiar',
    });
  }

  // Se ejecuta en cada request con token válido.
  // Se consulta la base para que un usuario desactivado (o al que le
  // cambiaron el rol) no siga entrando con un token viejo de 8 horas.
  async validate(payload: { sub: number }): Promise<UsuarioToken> {
    const u = await this.usuarios.buscarPorId(payload.sub);
    if (!u || !u.activo) {
      throw new UnauthorizedException('Usuario inexistente o desactivado');
    }
    return { id: u.id, email: u.email, rol: u.rol };
  }
}
