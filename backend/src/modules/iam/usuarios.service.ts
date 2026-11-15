
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsuarioEntity } from './Entity/usuario.entity.js';
import { CrearUsuarioDto } from './dto/crear-usuario.dto.js';
import { Rol } from './rol.enum.js';
import { Rol as RolEntity } from '../hce/entities/rol.entity.js';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(UsuarioEntity)
    private readonly repo: Repository<UsuarioEntity>,

    @InjectRepository(RolEntity)
    private readonly rolesRepo: Repository<RolEntity>,
  ) {}

  private normalizarRol(nombre: string): Rol {
    const normalizado = nombre
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

    if (!Object.values(Rol).includes(normalizado as Rol)) {
      throw new ForbiddenException(`Rol no reconocido: ${nombre}`);
    }

    return normalizado as Rol;
  }

  private mapearUsuario(usuario: UsuarioEntity) {
    return {
      id: usuario.id,
      nombre: usuario.nombreUsuario,
      email: usuario.email,
      passwordHash: usuario.passwordHash,
      rol: this.normalizarRol(usuario.rolEntity.nombre),
    };
  }

  async crear(dto: CrearUsuarioDto) {
    const email = dto.email.trim().toLowerCase();

    const existe = await this.repo.findOne({
      where: { email },
    });

    if (existe) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const roles = await this.rolesRepo.find();

    const rolEntity = roles.find(
      (rol) => this.normalizarRol(rol.nombre) === dto.rol,
    );

    if (!rolEntity) {
      throw new BadRequestException(
        `El rol ${dto.rol} no existe en la tabla Roles`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuario = this.repo.create({
      nombreUsuario: dto.nombre.trim(),
      email,
      passwordHash,
      rolEntity,
    });

    const guardado = await this.repo.save(usuario);

    return {
      id: guardado.id,
      nombre: guardado.nombreUsuario,
      email: guardado.email,
      rol: dto.rol,
    };
  }

  async listar() {
    const usuarios = await this.repo.find({
      relations: {
        rolEntity: true,
      },
    });

    return usuarios.map((usuario) => {
      const datos = this.mapearUsuario(usuario);

      return {
        id: datos.id,
        nombre: datos.nombre,
        email: datos.email,
        rol: datos.rol,
      };
    });
  }

  async buscarPorId(id: number) {
    const usuario = await this.repo.findOne({
      where: { id },
      relations: {
        rolEntity: true,
      },
    });

    return usuario ? this.mapearUsuario(usuario) : null;
  }

  async buscarPorEmail(email: string) {
    const usuario = await this.repo.findOne({
      where: { email: email.trim().toLowerCase() },
      relations: {
        rolEntity: true,
      },
    });

    return usuario ? this.mapearUsuario(usuario) : null;
  }
}
