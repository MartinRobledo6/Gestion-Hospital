
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, Repository,} from 'typeorm';
import { IndicacionMedica } from './indicacion-medica.entity.js';
import { MedicationAdministration } from './medication-administration.entity.js';
import { CreateIndicationDto } from './dto/create-indication.dto.js';
import { CreateMedicationAdministrationDto } from './dto/create-medication-administration.dto.js';

import { Inventario } from '../inventario/entities/inventario.entity.js';
import { Paciente } from '../hce/entities/paciente.entity.js';
import { Usuario } from '../hce/entities/usuario.entity.js';

import {
  checkRegistration,
  doseTiming,
  dosesBetween,
  snapToSlot,
  truncateToMinute,
  windowOf,
} from './rules/dose-schedule.js';

export interface DoseView {
  scheduledAt: string;
  windowStart: string;
  windowEnd: string;
  status: 'Pendiente' | 'Administrada' | 'Omitida';
  administeredAt: string | null;
  nurseId: number | null;
}

export interface ScheduleView {
  indication: IndicacionMedica & {
    patientName: string;
    medication: string;
  };
  supply: {
    id: number;
    name: string;
    stock: number;
  } | null;
  doses: DoseView[];
}

@Injectable()
export class MedicacionService {
  constructor(
    @InjectRepository(Inventario)
    private readonly supplies: Repository<Inventario>,

    @InjectRepository(Paciente)
    private readonly patients: Repository<Paciente>,

    @InjectRepository(Usuario)
    private readonly users: Repository<Usuario>,

    @InjectRepository(IndicacionMedica)
    private readonly indications: Repository<IndicacionMedica>,

    @InjectRepository(MedicationAdministration)
    private readonly administrations: Repository<MedicationAdministration>,

    private readonly dataSource: DataSource,
  ) {}

  // ---------- Inventario central ----------

  async listSupplies() {
    const supplies = await this.supplies.find({
      order: { Nombre: 'ASC' },
    });

    return supplies.map((supply) => ({
      id: supply.Id,
      name: supply.Nombre,
      stock: supply.StockActual,
    }));
  }

  // ---------- Indicaciones médicas ----------

  async listIndications() {
    const indications = await this.indications.find({
      where: { active: true },
      order: { id: 'DESC' },
    });

    if (!indications.length) return [];

    const patientIds = [...new Set(indications.map((i) => i.patientId))];
    const supplyIds = [...new Set(indications.map((i) => i.supplyId))];

    const [patients, supplies] = await Promise.all([
      this.patients.find({
        where: { Id: In(patientIds) },
      }),
      this.supplies.find({
        where: { Id: In(supplyIds) },
      }),
    ]);

    return indications.map((indication) => {
      const patient = patients.find(
        (p) => p.Id === indication.patientId,
      );

      const supply = supplies.find(
        (s) => s.Id === indication.supplyId,
      );

      return {
        ...indication,
        patientName: patient
          ? `${patient.Nombre} ${patient.Apellido}`
          : 'Paciente no encontrado',
        medication: supply?.Nombre ?? 'Insumo no encontrado',
      };
    });
  }

  async createIndication(
    dto: CreateIndicationDto,
  ){
    const [patient, doctor, supply] = await Promise.all([
      this.patients.findOneBy({ Id: dto.patientId }),

      this.users.findOne({
        where: { id: dto.medicoId },
        relations: { rol: true },
      }),

      this.supplies.findOneBy({ Id: dto.supplyId }),
    ]);

    if (!patient) {
      throw new BadRequestException(
        `No existe el paciente #${dto.patientId}.`,
      );
    }

    if (!doctor) {
      throw new BadRequestException(
        `No existe el médico #${dto.medicoId}.`,
      );
    }

    if (doctor.rol?.nombre !== 'Médico') {
      throw new BadRequestException(
        'El usuario seleccionado no tiene el rol de Médico.',
      );
    }

    if (!supply) {
      throw new BadRequestException(
        `No existe el insumo #${dto.supplyId} en el inventario.`,
      );
    }

    if (supply.StockActual < 1) {
      throw new BadRequestException(
        `No hay stock disponible de ${supply.Nombre}.`,
      );
    }

    const firstDoseAt = new Date(dto.firstDoseAt);

    if (Number.isNaN(firstDoseAt.getTime())) {
      throw new BadRequestException(
        'El horario de la primera dosis no es válido.',
      );
    }

        const saved = await this.indications.save(
      this.indications.create({
        patientId: patient.Id,
        medicoId: doctor.id,
        supplyId: supply.Id,
        dose: dto.dose.trim(),
        frequency: `Cada ${dto.everyHours} horas`,
        firstDoseAt: truncateToMinute(firstDoseAt),
        active: true,
      }),
    );

    // Misma forma que devuelve listIndications: el front usa patientName y medication.
    return {
      ...saved,
      patientName: `${patient.Nombre} ${patient.Apellido}`,
      medication: supply.Nombre,
      medicoName: doctor.nombreUsuario,
    };
  }

  // ---------- Dosis del día ----------

  async getSchedule(now: Date = new Date()): Promise<ScheduleView[]> {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const active = await this.indications.find({
      where: { active: true },
      order: { id: 'ASC' },
    });

    if (!active.length) return [];

    const patientIds = [...new Set(active.map((i) => i.patientId))];
    const supplyIds = [...new Set(active.map((i) => i.supplyId))];

    const [done, supplies, patients] = await Promise.all([
      this.administrations.find({
        where: {
          indicationId: In(active.map((i) => i.id)),
          scheduledAt: Between(dayStart, dayEnd),
        },
      }),

      this.supplies.find({
        where: { Id: In(supplyIds) },
      }),

      this.patients.find({
        where: { Id: In(patientIds) },
      }),
    ]);

    return active.map((indication) => {
      const supply = supplies.find(
        (s) => s.Id === indication.supplyId,
      );

      const patient = patients.find(
        (p) => p.Id === indication.patientId,
      );

      const frequencyMatch = indication.frequency.match(/\d+/);
      const everyHours = frequencyMatch
        ? Number(frequencyMatch[0])
        : 0;

      const doses =
        everyHours > 0
          ? dosesBetween(
              {
                firstDoseAt: indication.firstDoseAt,
                everyHours,
              },
              dayStart,
              dayEnd,
            ).map((slot): DoseView => {
              const record = done.find(
                (a) =>
                  a.indicationId === indication.id &&
                  a.scheduledAt?.getTime() === slot.getTime(),
              );

              const window = windowOf(slot);

              return {
                scheduledAt: slot.toISOString(),
                windowStart: window.start.toISOString(),
                windowEnd: window.end.toISOString(),
                status: record
                  ? (record.status as 'Administrada' | 'Omitida')
                  : 'Pendiente',
                administeredAt: record
                  ? record.administeredAt.toISOString()
                  : null,
                nurseId: record ? record.nurseId : null,
              };
            })
          : [];

      return {
        indication: {
          ...indication,
          patientName: patient
            ? `${patient.Nombre} ${patient.Apellido}`
            : 'Paciente no encontrado',
          medication: supply?.Nombre ?? 'Insumo no encontrado',
        },
        supply: supply
          ? {
              id: supply.Id,
              name: supply.Nombre,
              stock: supply.StockActual,
            }
          : null,
        doses,
      };
    });
  }

  // ---------- Confirmar una dosis ----------

  async registerMedicationAdministration(
    dto: CreateMedicationAdministrationDto,
  ): Promise<MedicationAdministration> {
    return this.dataSource.transaction(async (manager) => {
      const indication = await manager
        .createQueryBuilder(IndicacionMedica, 'i')
        .setLock('pessimistic_write')
        .where('i.id = :id', { id: dto.indicationId })
        .getOne();

      if (!indication) {
        throw new NotFoundException(
          `No existe la indicación #${dto.indicationId}.`,
        );
      }

      if (!indication.active) {
        throw new BadRequestException(
          'La indicación ya no está activa.',
        );
      }

      const frequencyMatch = indication.frequency.match(/\d+/);
      const everyHours = frequencyMatch
        ? Number(frequencyMatch[0])
        : 0;

      if (everyHours < 1) {
        throw new BadRequestException(
          'La frecuencia de la indicación no es válida.',
        );
      }

      const slot = snapToSlot(
        {
          firstDoseAt: indication.firstDoseAt,
          everyHours,
        },
        new Date(dto.scheduledAt),
      );

      if (!slot) {
        throw new BadRequestException(
          'Ese horario no corresponde a una dosis de esta indicación.',
        );
      }

      const motivo = checkRegistration(
        dto.status,
        doseTiming(slot, new Date()),
      );

      if (motivo) {
        throw new BadRequestException(motivo);
      }

      const yaRegistrada = await manager.count(
        MedicationAdministration,
        {
          where: {
            indicationId: indication.id,
            scheduledAt: slot,
          },
        },
      );

      if (yaRegistrada > 0) {
        throw new ConflictException(
          'Esa dosis ya fue registrada.',
        );
      }

      const saved = await manager.save(
        manager.create(MedicationAdministration, {
          indicationId: indication.id,
          nurseId: dto.nurseId,
          status: dto.status,
          scheduledAt: slot,
        }),
      );

      if (dto.status === 'Administrada') {
        const supply = await manager
          .createQueryBuilder(Inventario, 's')
          .setLock('pessimistic_write')
          .where('s.Id = :id', { id: indication.supplyId })
          .getOne();

        if (!supply) {
          throw new ConflictException(
            `El insumo #${indication.supplyId} ya no existe en el inventario.`,
          );
        }

        if (supply.StockActual < 1) {
          throw new ConflictException(
            `No hay stock de ${supply.Nombre} en el inventario.`,
          );
        }

        supply.StockActual -= 1;

        await manager.save(supply);
      }

      return saved;
    });
  }

    async getAllMedicationAdministrations() {
    const administraciones = await this.administrations.find({
      relations: { nurse: true },
      order: { administeredAt: 'DESC' },
    });

    // Devolvemos solo lo que necesita el front: nunca el usuario entero (tiene Email y PasswordHash).
    return administraciones.map(({ nurse, ...a }) => ({
      ...a,
      nurseName: nurse?.nombreUsuario ?? null,
    }));
  }
}
