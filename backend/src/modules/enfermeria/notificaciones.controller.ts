import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';

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
