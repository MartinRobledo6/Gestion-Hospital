import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { Auth } from '../iam/auth.decorador.js';
import { Rol } from '../iam/rol.enum.js';

// Alertas de signos vitales: las genera enfermería y van dirigidas al médico de guardia
@Auth(Rol.MEDICO, Rol.ENFERMERO)

@Controller('enfermeria/notifications')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  // GET /enfermeria/notifications?unread=true  -> solo las no leídas
  @Get()
  list(@Query('unread') unread?: string) {
    return this.notificacionesService.list(unread === 'true');
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificacionesService.markAsRead(id);
  }
}
