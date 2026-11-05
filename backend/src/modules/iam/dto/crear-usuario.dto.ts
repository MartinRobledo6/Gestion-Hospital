import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { Rol } from '../rol.enum.js';

// El administrador no se crea por la API: se carga a mano en la base
export const ROLES_CREABLES = [Rol.MEDICO, Rol.ENFERMERO, Rol.RECEPCIONISTA];

export class CrearUsuarioDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(ROLES_CREABLES, {
    message: 'El rol debe ser MEDICO, ENFERMERO o RECEPCIONISTA',
  })
  rol: Rol;
}