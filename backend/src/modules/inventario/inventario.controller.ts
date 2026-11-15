import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { InventarioService } from './inventario.service.js';
import { CreateInventarioDto } from './dto/create-inventario.dto.js';
import { UpdateInventarioDto } from './dto/update-inventario.dto.js';
import { ReponerInventarioDto } from './dto/reponer-inventario.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

// Lo consultan médicos y enfermería; lo gestiona solo administración ("gestor de inventario").

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Auth(Rol.ADMINISTRADOR)
  @Post()
  create(@Body() createInventarioDto: CreateInventarioDto) {
    return this.inventarioService.create(createInventarioDto);
  }

  @Auth(Rol.MEDICO, Rol.ENFERMERO)
  @Get()
  findAll() {
    return this.inventarioService.findAll();
  }

  @Auth(Rol.MEDICO, Rol.ENFERMERO)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.findOne(+id);
  }
  
  @Auth(Rol.ADMINISTRADOR)
  @Patch(':id/reponer')
  reponer(@Param('id', ParseIntPipe) id: number, @Body() dto: ReponerInventarioDto) {
    return this.inventarioService.reponer(id, dto.cantidad);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInventarioDto: UpdateInventarioDto) {
    return this.inventarioService.update(id, updateInventarioDto);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.remove(id);
  }
}
