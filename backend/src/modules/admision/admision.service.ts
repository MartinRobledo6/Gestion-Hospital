import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Not, In } from 'typeorm';
import { TurnoEntity } from './entities/turno.entity.js';
import { HorarioMedicoEntity } from './entities/Horarios-medico-entity.js';
import { ReservarTurnoDto } from './dto/reservar-turnos.dto.js';
import { CambiarEstadoTurnoDto } from './dto/cambiar-estado-turno.dto.js';
import { CrearHorarioDto } from './dto/crear-horarios.dto.js';
import { PacienteEntity } from './entities/paciente.entity.js';
import { SolicitarTurnoDto } from './dto/solicitar-turnos.dto.js';

@Injectable()
export class AdmisionService {
  constructor(
        @InjectRepository(PacienteEntity)
    private readonly pacientesRepo: Repository<PacienteEntity>,
    @InjectRepository(TurnoEntity)
    private readonly turnosRepo: Repository<TurnoEntity>,
    @InjectRepository(HorarioMedicoEntity)
    private readonly horariosRepo: Repository<HorarioMedicoEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // 0. Listar los turnos guardados, con el nombre del paciente
  async listarTurnos() {
    const turnos = await this.turnosRepo.find({
      order: { fechaHoraInicio: 'ASC' },
    });

    const ids = [
      ...new Set(
        turnos
          .map((t) => t.pacienteId)
          .filter((id): id is number => id != null),
      ),
    ];

    const pacientes = ids.length
      ? await this.pacientesRepo.find({ where: { id: In(ids) } })
      : [];
    const nombres = new Map(pacientes.map((p) => [p.id, p.nombre]));

    return turnos.map((t) => ({
      ...t,
      pacienteNombre:
        t.pacienteId != null ? (nombres.get(t.pacienteId) ?? null) : null,
    }));
  }

  // 1. Obtener solo los horarios disponibles descontando los turnos ocupados
  async obtenerHorariosDisponibles(medicoId: number, fechaStr: string) {
    const fecha = new Date(`${fechaStr}T00:00:00`); // hora local, evita el corrimiento UTC
    const diaSemana = fecha.getDay(); // 0: Dom, 1: Lun, etc.

    // Configuración de atención del médico para ese día
    const configuracion = await this.horariosRepo.findOneBy({
      medicoId,
      diaSemana,
    });

    if (!configuracion) {
      return []; // El médico no atiende este día
    }

    // Traer turnos ya ocupados de ese médico en esa fecha
    const inicioDia = new Date(`${fechaStr}T00:00:00`);
    const finDia = new Date(`${fechaStr}T23:59:59`);

    const turnosOcupados = await this.turnosRepo.find({
      where: {
        medicoId,
        fechaHoraInicio: Between(inicioDia, finDia),
        estado: Not('Cancelado'), // todo lo que no esté cancelado ocupa el horario
      },
    });

    // Generar la lista de bloques posibles
    const bloquesDisponibles: { inicio: string; fin: string }[] = [];
    const [hInicio, mInicio] = configuracion.horaInicio.split(':').map(Number);
    const [hFin, mFin] = configuracion.horaFin.split(':').map(Number);

    let cursor = new Date(fecha);
    cursor.setHours(hInicio, mInicio, 0, 0);

    const limiteFin = new Date(fecha);
    limiteFin.setHours(hFin, mFin, 0, 0);

    while (cursor < limiteFin) {
      const inicioBloque = new Date(cursor);
      const finBloque = new Date(
        cursor.getTime() + configuracion.duracionIntervaloMinutos * 60000,
      );

      if (finBloque > limiteFin) break;

      // Verificar si se solapa con algún turno ya guardado en la BBDD
      const estaOcupado = turnosOcupados.some((turno) => {
        const tInicio = new Date(turno.fechaHoraInicio).getTime();
        const tFin = new Date(turno.fechaHoraFin).getTime();
        return inicioBloque.getTime() < tFin && finBloque.getTime() > tInicio;
      });

      if (!estaOcupado) {
        bloquesDisponibles.push({
          inicio: inicioBloque.toISOString(),
          fin: finBloque.toISOString(),
        });
      }

      cursor = finBloque; // Avanzar al siguiente intervalo
    }

    return bloquesDisponibles;
  }

  // 2. Guardar únicamente el turno elegido en la tabla Turnos con control de concurrencia
  async reservarTurno(dto: ReservarTurnoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inicio = new Date(dto.fechaHoraInicio);
      const fin = new Date(dto.fechaHoraFin);

      // Bloqueo y verificación de solapamiento en BD para evitar doble reserva simultánea
      const solapado = await queryRunner.manager
        .createQueryBuilder(TurnoEntity, 't')
        .setLock('pessimistic_write')
        .where('t.medicoId = :medicoId', { medicoId: dto.medicoId })
        .andWhere('t.estado != :estado', { estado: 'Cancelado' })
        .andWhere('t.fechaHoraInicio < :fin AND t.fechaHoraFin > :inicio', {
          inicio,
          fin,
        })
        .getOne();

      if (solapado) {
        throw new ConflictException(
          'El horario seleccionado acaba de ser ocupado por otro paciente.',
        );
      }

      const nuevoTurno = queryRunner.manager.create(TurnoEntity, {
        medicoId: dto.medicoId,
        pacienteId: dto.pacienteId,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        estado: 'Programado',
      });

      const guardado = await queryRunner.manager.save(nuevoTurno);
      await queryRunner.commitTransaction();
      return guardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 3. Cambiar el estado de un turno
  async cambiarEstado(id: number, dto: CambiarEstadoTurnoDto) {
    const turno = await this.turnosRepo.findOneBy({ id });
    if (!turno) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    turno.estado = dto.nuevoEstado;
    return this.turnosRepo.save(turno);
  }

    // 4. Horarios de atención de un médico
  listarHorarios(medicoId: number) {
    return this.horariosRepo.find({
      where: { medicoId },
      order: { diaSemana: 'ASC' },
    });
  }

  async crearHorario(medicoId: number, dto: CrearHorarioDto) {
    if (dto.horaFin <= dto.horaInicio) {
      throw new ConflictException('La hora de fin debe ser posterior a la de inicio.');
    }

    // obtenerHorariosDisponibles usa un solo horario por médico y día
    const existente = await this.horariosRepo.findOneBy({
      medicoId,
      diaSemana: dto.diaSemana,
    });
    if (existente) {
      throw new ConflictException('El médico ya tiene un horario cargado para ese día.');
    }

    const horario = this.horariosRepo.create({ medicoId, ...dto });
    return this.horariosRepo.save(horario);
  }

  async eliminarHorario(id: number) {
    const horario = await this.horariosRepo.findOneBy({ id });
    if (!horario) {
      throw new NotFoundException(`Horario ${id} no encontrado`);
    }
    await this.horariosRepo.remove(horario);
    return { eliminado: true };
  }
    // Médicos que tienen horarios cargados (para el selector del paciente)
  async listarMedicos() {
    const horarios = await this.horariosRepo.find();
    return [...new Set(horarios.map((h) => h.medicoId))].sort((a, b) => a - b);
  }

  // Pedido de turno hecho por el propio paciente
  async solicitarTurno(dto: SolicitarTurnoDto) {
    const inicio = new Date(dto.fechaHoraInicio);
    const fin = new Date(dto.fechaHoraFin);

    if (inicio.getTime() <= Date.now()) {
      throw new ConflictException('Ese horario ya pasó.');
    }

    // Solo se acepta un bloque que realmente esté libre y dentro del horario del médico
    const fecha = inicio.toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
    const bloques = await this.obtenerHorariosDisponibles(dto.medicoId, fecha);
    const valido = bloques.some(
      (b) =>
        new Date(b.inicio).getTime() === inicio.getTime() &&
        new Date(b.fin).getTime() === fin.getTime(),
    );
    if (!valido) {
      throw new ConflictException('Ese horario no está disponible.');
    }

    // Buscar al paciente por email; si no existe, se crea
    const email = dto.email.trim().toLowerCase();
    const nombre = dto.nombre.trim();
    let paciente = await this.pacientesRepo.findOneBy({ email });
    if (paciente) {
      paciente.nombre = nombre;
    } else {
      paciente = this.pacientesRepo.create({ nombre, email });
    }
    paciente = await this.pacientesRepo.save(paciente);

    const turno = await this.reservarTurno({
      medicoId: dto.medicoId,
      pacienteId: paciente.id,
      fechaHoraInicio: dto.fechaHoraInicio,
      fechaHoraFin: dto.fechaHoraFin,
    });

    return {
      turnoId: turno.id,
      medicoId: turno.medicoId,
      fechaHoraInicio: turno.fechaHoraInicio,
      fechaHoraFin: turno.fechaHoraFin,
    };
  }
}