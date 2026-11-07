import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './notificacion.entity';

// Avisos de alta prioridad para el médico de guardia (HU 1.1, escenario 2).
// Se crean al registrar un control crítico (ver EnfermeriaService); acá se consultan y se marcan leídos.
@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notifications: Repository<Notificacion>,
  ) {}

  list(onlyUnread: boolean): Promise<Notificacion[]> {
    return this.notifications.find({
      where: onlyUnread ? { read: false } : {},
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async markAsRead(id: number): Promise<Notificacion> {
    const notification = await this.notifications.findOneBy({ id });
    if (!notification) throw new NotFoundException(`No existe la notificación #${id}.`);
    notification.read = true;
    return this.notifications.save(notification);
  }
}
