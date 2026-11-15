import { Controller, Post, Body, Get, Sse, MessageEvent } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, fromEvent, map } from 'rxjs';
import { CamasService } from './camas.service.js';
import { AsignarCamaDto } from './dto/asignar-cama.dto.js';
import { NumeroCamaDto } from './dto/numero-cama.dto.js';
import { TrasladarCamaDto } from './dto/trasladar-cama.dto.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

// Permisos (el ADMINISTRADOR pasa siempre por el RolesGuard):
// - Asignar / liberar / trasladar: recepción ("administrativo de piso", HU 1.1)
// - Limpiar: maestranza (HU 2.1)
// - Bloquear / desbloquear: solo administración
// - Ver el mapa: todo el personal que trabaja con camas

@Controller('camas')
export class CamasController {
  constructor(
    private readonly camasService: CamasService,
    private readonly events: EventEmitter2,
  ) {}

  @Auth(Rol.RECEPCIONISTA)
  @Post('asignar')
  asignar(@Body() body: AsignarCamaDto) {
    return this.camasService.asignarCama(body.numero, body.pacienteId);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('liberar')
  liberar(@Body() body: NumeroCamaDto) {
    return this.camasService.liberarCama(body.numero);
  }

  @Auth(Rol.RECEPCIONISTA)
  @Post('trasladar')
  trasladar(@Body() body: TrasladarCamaDto) {
    return this.camasService.trasladarCama(body.numeroOrigen, body.numeroDestino);
  }

  @Auth(Rol.MAESTRANZA)
  @Post('limpiar')
  limpiar(@Body() body: NumeroCamaDto) {
    return this.camasService.limpiarCama(body.numero);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Post('bloquear')
  bloquear(@Body() body: NumeroCamaDto) {
    return this.camasService.bloquearCama(body.numero);
  }

  @Auth(Rol.ADMINISTRADOR)
  @Post('desbloquear')
  desbloquear(@Body() body: NumeroCamaDto) {
    return this.camasService.desbloquearCama(body.numero);
  }

  @Auth(Rol.RECEPCIONISTA, Rol.MEDICO, Rol.ENFERMERO, Rol.MAESTRANZA)
  @Get('listado')
  listado() {
    return this.camasService.obtenerCamas();
  }

  // Monitor en tiempo real (Server-Sent Events): GET /camas/eventos
  // Sin @Auth a propósito: el EventSource del navegador no puede mandar el header
  // Authorization. Solo publica número de cama y estado, sin datos del paciente.
  @Sse('eventos')
  eventos(): Observable<MessageEvent> {
    return fromEvent(this.events, 'cama.estado-cambiado').pipe(
      map((data) => ({ data }) as MessageEvent),
    );
  }
}