import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsuarioEntity } from '../Entity/usuario.entity.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { Rol } from './rol.enum.js';

@Injectable()
export class UsuariosService implements OnModuleInit {
  constructor(
    @InjectRepository(UsuarioEntity)
    private repo: Repository<UsuarioEntity>,
  ) {}

  // Seed: crea un administrador la primera vez que arranca
  async onModuleInit() {
    const hayAdmin = await this.repo.findOne({
      where: { rol: Rol.ADMINISTRADOR },
    });
    if (!hayAdmin) {
      await this.crear({
        nombre: 'Admin',
        email: 'admin@hospital.com',
        password: 'admin123',
        rol: Rol.ADMINISTRADOR,
      });
      console.log('Admin inicial creado: admin@hospital.com / admin123');
    }
  }

  async crear(dto: CrearUsuarioDto) {
    const existe = await this.repo.findOne({ where: { email: dto.email } });
    if (existe) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const guardado = await this.repo.save(
      this.repo.create({
        nombre: dto.nombre,
        email: dto.email,
        rol: dto.rol,
        passwordHash,
      }),
    );
    return {
      id: guardado.id,
      nombre: guardado.nombre,
      email: guardado.email,
      rol: guardado.rol,
      activo: guardado.activo,
    };
  }

  listar() {
    return this.repo.find({
      select: { id: true, nombre: true, email: true, rol: true, activo: true },
    });
  }

  buscarPorEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  async cambiarActivo(id: number, activo: boolean) {
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.activo = activo;
    await this.repo.save(usuario);
    return { id, activo };
  }
}