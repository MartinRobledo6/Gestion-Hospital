import { Controller, Post, Body, Get } from '@nestjs/common';
import { CamasService } from './camas.service.js';
import { AsignarCamaDto } from './dto/asignar-cama.dto.js';
import { liberarCamaDto } from './dto/liberar-cama.dto.js';
import {limpiarCamaDto} from './dto/limpiar-cama.dto.js'
import { bloqueoCamaDto } from './dto/bloquear-cama.dto.js';
import { desbloquearCamaDto } from './dto/desbloquear-cama.dto.js';

@Controller('camas')
export class CamasController {
  constructor(private readonly camasService: CamasService) {}

  @Post('asignar')
  asignar(@Body() body: AsignarCamaDto) {
    return this.camasService.asignarCama(body.numero, body.pacienteId);
  }

  @Post('liberar')
  liberar(@Body() body: liberarCamaDto){
    return this.camasService.liberarCama(body.numero)
  }

  @Post('limpiar')
  limpiar(@Body() body: limpiarCamaDto){
    return this.camasService.limpiarCama(body.numero)
  }

  @Post('bloquear')
  bloquear(@Body() body: bloqueoCamaDto){
    return this.camasService.bloquearCama(body.numero)
  }

  @Post('desbloquear')
  desbloquear(@Body() body: desbloquearCamaDto){
    return this.camasService.desbloquearCama(body.numero)
  }

  @Get('listado')
  listado(){
  return this.camasService.obtenerCamas()
  }

}