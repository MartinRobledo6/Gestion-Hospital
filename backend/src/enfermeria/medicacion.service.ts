import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository } from 'typeorm';
import { IndicacionMedica } from './indicacion-medica.entity';
import { InventarioInsumo } from './inventario-insumo.entity';
import { MedicationAdministration } from './medication-administration.entity';
import { CreateIndicationDto } from './dto/create-indication.dto';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto';
import { CreateSupplyDto } from './dto/create-supply.dto';
import {
  checkRegistration,
  doseTiming,
  dosesBetween,
  snapToSlot,
  truncateToMinute,
  windowOf,
} from './rules/dose-schedule';

export interface DoseView {
  scheduledAt: string;
  windowStart: string;
  windowEnd: string;
  status: 'Pendiente' | 'Administrada' | 'Omitida';
  administeredAt: string | null;
  nurseId: number | null;
}

export interface ScheduleView {
  indication: IndicacionMedica;
  supply: { id: number; name: string; stock: number } | null;
  doses: DoseView[];
}

// Medicación prescrita (HU 1.2): qué dosis tocan hoy, confirmarlas dentro del margen de
// +/- 30 minutos y descontar el insumo del inventario del piso.
@Injectable()
export class MedicacionService {
  constructor(
    @InjectRepository(InventarioInsumo)
    private readonly supplies: Repository<InventarioInsumo>,
    @InjectRepository(IndicacionMedica)
    private readonly indications: Repository<IndicacionMedica>,
    @InjectRepository(MedicationAdministration)
    private readonly administrations: Repository<MedicationAdministration>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- Inventario del piso ----------

  listSupplies(): Promise<InventarioInsumo[]> {
    return this.supplies.find({ order: { name: 'ASC' } });
  }

  createSupply(dto: CreateSupplyDto): Promise<InventarioInsumo> {
    return this.supplies.save(
      this.supplies.create({ name: dto.name.trim(), stock: dto.stock }),
    );
  }

  // ---------- Indicaciones médicas ----------

  listIndications(): Promise<IndicacionMedica[]> {
    return this.indications.find({ where: { active: true }, order: { id: 'DESC' } });
  }

  async createIndication(dto: CreateIndicationDto): Promise<IndicacionMedica> {
    const supply = await this.supplies.findOneBy({ id: dto.supplyId });
    if (!supply) throw new BadRequestException(`No existe el insumo #${dto.supplyId} en el inventario.`);

    const firstDoseAt = new Date(dto.firstDoseAt);
    if (Number.isNaN(firstDoseAt.getTime())) throw new BadRequestException('El horario de la primera dosis no es válido.');

    return this.indications.save(
      this.indications.create({
        patientId: dto.patientId.trim(),
        patientName: dto.patientName.trim(),
        medication: dto.medication.trim(),
        dose: dto.dose.trim(),
        everyHours: dto.everyHours,
        // Sin segundos: los horarios se comparan por igualdad exacta.
        firstDoseAt: truncateToMinute(firstDoseAt),
        supplyId: dto.supplyId,
        active: true,
      }),
    );
  }

  // ---------- Dosis del día ----------

  /** Para cada indicación activa, las dosis de hoy con su estado (Pendiente / Administrada / Omitida). */
  async getSchedule(now: Date = new Date()): Promise<ScheduleView[]> {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const active = await this.indications.find({ where: { active: true }, order: { patientName: 'ASC', id: 'ASC' } });
    if (!active.length) return [];

    const [done, supplies] = await Promise.all([
      this.administrations.find({
        where: { indicationId: In(active.map((i) => i.id)), scheduledAt: Between(dayStart, dayEnd) },
      }),
      this.supplies.find({ where: { id: In(active.map((i) => i.supplyId)) } }),
    ]);

    return active.map((indication) => {
      const supply = supplies.find((s) => s.id === indication.supplyId);
      const doses = dosesBetween(
        { firstDoseAt: indication.firstDoseAt, everyHours: indication.everyHours },
        dayStart,
        dayEnd,
      ).map((slot): DoseView => {
        const record = done.find(
          (a) => a.indicationId === indication.id && a.scheduledAt && a.scheduledAt.getTime() === slot.getTime(),
        );
        const window = windowOf(slot);
        return {
          scheduledAt: slot.toISOString(),
          windowStart: window.start.toISOString(),
          windowEnd: window.end.toISOString(),
          status: record ? (record.status as 'Administrada' | 'Omitida') : 'Pendiente',
          administeredAt: record ? record.administeredAt.toISOString() : null,
          nurseId: record ? record.nurseId : null,
        };
      });
      return {
        indication,
        supply: supply ? { id: supply.id, name: supply.name, stock: supply.stock } : null,
        doses,
      };
    });
  }

  // ---------- Confirmar una dosis ----------

  async registerMedicationAdministration(dto: CreateMedicationAdministrationDto): Promise<MedicationAdministration> {
    // Todo en una transacción: o se registra la dosis Y se descuenta el insumo, o no se hace nada.
    return this.dataSource.transaction(async (manager) => {
      // Bloqueamos la fila de la indicación hasta el final: dos enfermeros que confirmen la misma
      // dosis al mismo tiempo quedan en fila y el segundo ve que ya está registrada.
      const indication = await manager
        .createQueryBuilder(IndicacionMedica, 'i')
        .setLock('pessimistic_write')
        .where('i.id = :id', { id: dto.indicationId })
        .getOne();
      if (!indication) throw new NotFoundException(`No existe la indicación #${dto.indicationId}.`);
      if (!indication.active) throw new BadRequestException('La indicación ya no está activa.');

      // El horario tiene que ser una dosis real de esta indicación (el cliente no lo inventa).
      const slot = snapToSlot(
        { firstDoseAt: indication.firstDoseAt, everyHours: indication.everyHours },
        new Date(dto.scheduledAt),
      );
      if (!slot) throw new BadRequestException('Ese horario no corresponde a una dosis de esta indicación.');

      // Margen de +/- 30 minutos (la hora la decide el servidor, no el cliente).
      const motivo = checkRegistration(dto.status, doseTiming(slot, new Date()));
      if (motivo) throw new BadRequestException(motivo);

      const yaRegistrada = await manager.count(MedicationAdministration, {
        where: { indicationId: indication.id, scheduledAt: slot },
      });
      if (yaRegistrada > 0) throw new ConflictException('Esa dosis ya fue registrada.');

      const saved = await manager.save(
        manager.create(MedicationAdministration, {
          indicationId: indication.id,
          nurseId: dto.nurseId,
          status: dto.status,
          scheduledAt: slot,
        }),
      );

      // Solo una dosis realmente administrada consume insumo.
      if (dto.status === 'Administrada') {
        const supply = await manager
          .createQueryBuilder(InventarioInsumo, 's')
          .setLock('pessimistic_write')
          .where('s.id = :id', { id: indication.supplyId })
          .getOne();
        if (!supply) throw new ConflictException(`El insumo #${indication.supplyId} ya no existe en el inventario.`);
        if (supply.stock < 1) throw new ConflictException(`No hay stock de ${supply.name} en el piso.`);

        // La fila está bloqueada hasta el final de la transacción, así que leer, restar y
        // guardar es seguro frente a otros enfermeros que descuenten a la vez.
        supply.stock -= 1;
        await manager.save(supply);
      }

      return saved;
    });
  }

  getAllMedicationAdministrations(): Promise<MedicationAdministration[]> {
    return this.administrations.find({ order: { administeredAt: 'DESC' } });
  }
}
