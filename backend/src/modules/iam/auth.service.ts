import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from './usuarios.service.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private usuarios: UsuariosService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const u = await this.usuarios.buscarPorEmail(dto.email);
    // mismo mensaje si el email no existe o la clave es incorrecta
    if (
      !u ||
      !u.activo ||
      !(await bcrypt.compare(dto.password, u.passwordHash))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const payload = { sub: u.id, email: u.email, rol: u.rol };
    return {
      access_token: await this.jwt.signAsync(payload),
      usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol },
    };
  }
}