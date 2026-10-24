import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Rol } from '../rol.enum.js';

export class CrearUsuarioDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Rol)
  rol: Rol;
}