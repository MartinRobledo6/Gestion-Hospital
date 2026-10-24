import { Controller, Post, Body, Get, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';
import { CamasService } from './camas.service.js';
import { AsignarCamaDto } from './dto/asignar-cama.dto.js';
import { NumeroCamaDto } from './dto/numero-cama.dto.js';

@Controller('camas')
export class CamasController {
  constructor(
    private readonly camasService: CamasService,
    private readonly events: EventEmitter2,
  ) {}

  @Post('asignar')
  asignar(@Body() body: AsignarCamaDto) {
    return this.camasService.asignarCama(body.numero, body.pacienteId);
  }

  @Post('liberar')
  liberar(@Body() body: NumeroCamaDto) {
    return this.camasService.liberarCama(body.numero);
  }

  @Post('limpiar')
  limpiar(@Body() body: NumeroCamaDto) {
    return this.camasService.limpiarCama(body.numero);
  }

  @Post('bloquear')
  bloquear(@Body() body: NumeroCamaDto) {
    return this.camasService.bloquearCama(body.numero);
  }

  @Post('desbloquear')
  desbloquear(@Body() body: NumeroCamaDto) {
    return this.camasService.desbloquearCama(body.numero);
  }

  @Get('listado')
  listado() {
    return this.camasService.obtenerCamas();
  }

  // Monitor en tiempo real (Server-Sent Events): GET /camas/eventos
  @Sse('eventos')
  eventos(): Observable<MessageEvent> {
    return fromEvent(this.events, 'cama.estado-cambiado').pipe(
      map((data) => ({ data }) as MessageEvent),
    );
  }
}