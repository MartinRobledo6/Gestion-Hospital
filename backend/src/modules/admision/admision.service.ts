import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, Not, In, MoreThanOrEqual } from 'typeorm';
import { TurnoEntity } from './entities/turno.entity.js';
import { HorarioMedicoEntity } from './entities/Horarios-medico-entity.js';
import { PacienteEntity } from './entities/paciente.entity.js';
import { MedicoEntity, TipoProfesional } from './entities/medico.entity.js';
import { ReservarTurnoDto } from './dto/reservar-turnos.dto.js';
import { CrearHorarioDto } from './dto/crear-horarios.dto.js';
import { SolicitarTurnoDto } from './dto/solicitar-turnos.dto.js';
import { CrearMedicoDto } from './dto/crear-medico.dto.js';
import { CrearEntreturnoDto } from './dto/crear-entreturno.dto.js';
import { EspecialidadEntity } from './entities/especialidad.entity.js';
import { ESTADOS, EstadoTurno } from './estados/estados-turnos.js';
import { puedeCambiarA } from './estados/permisos-estados.js';
import { CambiarEstadoTurnoDto } from './dto/cambiar-estado-turno.dto.js';
import { Rol } from '../iam/rol.enum.js';
import { UsuariosService } from '../iam/usuarios.service.js';
import { UsuarioToken } from '../iam/usuario-actual.decorador.js';

@Injectable()
export class AdmisionService {
  constructor(
    @InjectRepository(PacienteEntity)
    private readonly pacientesRepo: Repository<PacienteEntity>,
    @InjectRepository(TurnoEntity)
    private readonly turnosRepo: Repository<TurnoEntity>,
    @InjectRepository(HorarioMedicoEntity)
    private readonly horariosRepo: Repository<HorarioMedicoEntity>,
    @InjectRepository(MedicoEntity)
    private readonly medicosRepo: Repository<MedicoEntity>,
    private readonly dataSource: DataSource,
    @InjectRepository(EspecialidadEntity)
    private readonly especialidadesRepo: Repository<EspecialidadEntity>,
    private readonly usuariosService: UsuariosService,
  ) {}
  

  // ---------- Pacientes ----------

  // Buscar al paciente por email; si no existe, se crea
  private async obtenerOCrearPaciente(nombreRaw: string, emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const nombre = nombreRaw.trim();

    let paciente = await this.pacientesRepo.findOneBy({ email });
    if (paciente) {
      paciente.nombre = nombre;
    } else {
      paciente = this.pacientesRepo.create({ nombre, email });
    }
    return this.pacientesRepo.save(paciente);
  }

  // ---------- Turnos ----------

  // 0. Listar los turnos guardados, con el nombre del paciente.
  //    Si viene medicoId, solo los de ese profesional (agenda del médico).
  async listarTurnos(medicoId?: number) {
    const turnos = await this.turnosRepo.find({
      where: medicoId ? { medicoId } : {},
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

    const medico = await queryRunner.manager
      .createQueryBuilder(MedicoEntity, 'm')
      .setLock('pessimistic_write')
      .where('m.id = :id', { id: dto.medicoId })
      .getOne();

    if (!medico) {
      throw new NotFoundException(`Médico ${dto.medicoId} no encontrado`);
    }
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

  async cambiarEstado(id: number, dto: CambiarEstadoTurnoDto, usuario: UsuarioToken) {
    // 1) Permiso por rol: ¿este rol puede llevar un turno a ese estado?
    if (!puedeCambiarA(usuario.rol, dto.nuevoEstado)) {
      throw new ForbiddenException(
        `Tu rol no puede pasar un turno a "${dto.nuevoEstado}".`,
      );
    }

    const turno = await this.turnosRepo.findOneBy({ id });
    if (!turno) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }

    // 2) Permiso por dueño: el médico solo modifica sus propios turnos
    if (usuario.rol === Rol.MEDICO) {
      const profesional = await this.profesionalDelUsuario(usuario.id);
      if (turno.medicoId !== profesional.id) {
        throw new ForbiddenException('Solo podés modificar tus propios turnos.');
      }
    }

    const estadoActual = ESTADOS[turno.estado];
    if (!estadoActual) {
      throw new InternalServerErrorException(
        `El turno ${id} tiene un estado desconocido: "${turno.estado}".`,
      );
    }

    // 3) Regla de negocio: ¿la transición es válida? (patrón State)
    const nuevoEstado = estadoActual.transicionar(dto.nuevoEstado);

    turno.estado = nuevoEstado.nombre;
    return this.turnosRepo.save(turno);
  }

  // ---------- Agenda del profesional logueado ----------

  // Busca el profesional (tabla Medicos) vinculado a la cuenta logueada
  async profesionalDelUsuario(usuarioId: number) {
    const profesional = await this.medicosRepo.findOneBy({ usuarioId });
    if (!profesional) {
      throw new ForbiddenException(
        'Tu usuario no está vinculado a ningún profesional. Pedile al administrador que lo vincule.',
      );
    }
    return profesional;
  }

  async miAgenda(usuarioId: number) {
    const profesional = await this.profesionalDelUsuario(usuarioId);
    const [horarios, turnos] = await Promise.all([
      this.listarHorarios(profesional.id),
      this.listarTurnos(profesional.id),
    ]);
    return {
      profesional: {
        id: profesional.id,
        nombre: profesional.nombre,
        tipo: profesional.tipo,
        especialidad: profesional.especialidad?.nombre ?? '',
      },
      horarios,
      turnos,
    };
  }

  // 4. Pedido de turno hecho por el propio paciente
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

    const paciente = await this.obtenerOCrearPaciente(dto.nombre, dto.email);

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

  // 5. Entreturno: recorta el turno en curso y usa el tiempo liberado (HU 1.2)
  async insertarEntreturno(dto: CrearEntreturnoDto) {
    const MIN_MINUTOS = 5;
    const momento = new Date(dto.fechaHoraInicio);

    const medico = await this.medicosRepo.findOneBy({ id: dto.medicoId });
    if (!medico) {
      throw new NotFoundException(`Médico ${dto.medicoId} no encontrado`);
    }

    const paciente = await this.obtenerOCrearPaciente(dto.nombre, dto.email);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Turno que está en curso en ese momento (queda bloqueado)
      const afectado = await queryRunner.manager
        .createQueryBuilder(TurnoEntity, 't')
        .setLock('pessimistic_write')
        .where('t.medicoId = :medicoId', { medicoId: dto.medicoId })
        .andWhere('t.estado != :cancelado', { cancelado: 'Cancelado' })
        .andWhere(
          't.fechaHoraInicio < :momento AND t.fechaHoraFin > :momento',
          { momento },
        )
        .getOne();

      if (!afectado) {
        throw new ConflictException(
          'En ese horario no hay un turno para acortar. Si está libre, reservalo como turno normal.',
        );
      }

      if (
        afectado.estado === 'Atendido' ||
        afectado.estado === 'En Sala de Espera'
      ) {
        throw new ConflictException(
          `No se puede acortar un turno en estado "${afectado.estado}".`,
        );
      }

      const inicioOriginal = new Date(afectado.fechaHoraInicio);
      const finOriginal = new Date(afectado.fechaHoraFin);

      const minutosQueQuedan =
        (momento.getTime() - inicioOriginal.getTime()) / 60000;
      if (minutosQueQuedan < MIN_MINUTOS) {
        throw new ConflictException(
          `El turno afectado quedaría con menos de ${MIN_MINUTOS} minutos.`,
        );
      }

      const finEntreturno = dto.duracionMinutos
        ? new Date(momento.getTime() + dto.duracionMinutos * 60000)
        : finOriginal;

      if (finEntreturno.getTime() > finOriginal.getTime()) {
        throw new ConflictException(
          'El entreturno no entra en el tiempo del turno que se recorta.',
        );
      }
      if ((finEntreturno.getTime() - momento.getTime()) / 60000 < MIN_MINUTOS) {
        throw new ConflictException(
          `El entreturno tiene que durar al menos ${MIN_MINUTOS} minutos.`,
        );
      }

      // 1) Recortar el turno afectado
      afectado.fechaHoraFin = momento;
      afectado.duracionReducida = true;
      await queryRunner.manager.save(afectado);

      // 2) Crear el entreturno en el tramo liberado
      const entreturno = queryRunner.manager.create(TurnoEntity, {
        medicoId: dto.medicoId,
        pacienteId: paciente.id,
        fechaHoraInicio: momento,
        fechaHoraFin: finEntreturno,
        estado: 'Programado',
        esEntreturno: true,
      });
      const guardado = await queryRunner.manager.save(entreturno);

      await queryRunner.commitTransaction();
      return guardado;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ---------- Horarios de atención ----------

  listarHorarios(medicoId: number) {
    return this.horariosRepo.find({
      where: { medicoId },
      order: { diaSemana: 'ASC' },
    });
  }

  async crearHorario(medicoId: number, dto: CrearHorarioDto) {
    if (dto.horaFin <= dto.horaInicio) {
      throw new ConflictException(
        'La hora de fin debe ser posterior a la de inicio.',
      );
    }

    // obtenerHorariosDisponibles usa un solo horario por médico y día
    const existente = await this.horariosRepo.findOneBy({
      medicoId,
      diaSemana: dto.diaSemana,
    });
    if (existente) {
      throw new ConflictException(
        'El médico ya tiene un horario cargado para ese día.',
      );
    }

    const horario = this.horariosRepo.create({ medicoId, ...dto });
    return this.horariosRepo.save(horario);
  }

  async eliminarHorario(id: number) {
    const horario = await this.horariosRepo.findOneBy({ id });
    if (!horario) {
      throw new NotFoundException(`Horario ${id} no encontrado`);
    }

    // No se puede borrar un horario que tiene turnos pendientes ese día de la semana:
    // esos turnos quedarían fuera de cualquier horario de atención.
    const futuros = await this.turnosRepo.find({
      where: {
        medicoId: horario.medicoId,
        fechaHoraInicio: MoreThanOrEqual(new Date()),
        estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.ATENDIDO])),
      },
    });
    const afectados = futuros.filter(
      (t) => new Date(t.fechaHoraInicio).getDay() === horario.diaSemana,
    );
    if (afectados.length) {
      throw new ConflictException(
        `No se puede eliminar: hay ${afectados.length} turno(s) pendiente(s) en ese horario. Cancelalos o reprogramalos primero.`,
      );
    }

    await this.horariosRepo.remove(horario);
    return { eliminado: true };
  }

  // ---------- Médicos ----------

  // Todos los médicos cargados (para los selectores)
 // tipo opcional: para filtrar solo médicos en los selectores de turnos
async listarMedicos(tipo?: string) {
  const profesionales = await this.medicosRepo.find({
    where: tipo ? { tipo: tipo as TipoProfesional } : {},
    order: { nombre: 'ASC' },
  });
  // aplanamos para que el frontend siga recibiendo `especialidad` como texto
  return profesionales.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    especialidadId: p.especialidadId,
    especialidad: p.especialidad?.nombre ?? '',
  }));
}

// Igual que listarMedicos pero con la cuenta vinculada (solo para el personal)
async listarProfesionales() {
  const profesionales = await this.medicosRepo.find({ order: { nombre: 'ASC' } });
  return profesionales.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    especialidadId: p.especialidadId,
    especialidad: p.especialidad?.nombre ?? '',
    usuarioId: p.usuarioId,
  }));
}

// Valida que una cuenta pueda vincularse a un profesional:
// que exista, que su rol coincida con el tipo y que no esté usada por otro.
private async validarCuenta(
  usuarioId: number,
  tipo: TipoProfesional,
  profesionalId?: number,
) {
  const usuario = await this.usuariosService.buscarPorId(usuarioId);
  if (!usuario) {
    throw new NotFoundException(`Usuario ${usuarioId} no encontrado`);
  }

  const rolEsperado = tipo === 'medico' ? Rol.MEDICO : Rol.ENFERMERO;
  if (usuario.rol !== rolEsperado) {
    throw new BadRequestException(
      `La cuenta de ${usuario.nombre} tiene rol ${usuario.rol}; un ${tipo} necesita una cuenta con rol ${rolEsperado}.`,
    );
  }

  const ocupado = await this.medicosRepo.findOneBy({ usuarioId });
  if (ocupado && ocupado.id !== profesionalId) {
    throw new ConflictException(
      `Esa cuenta ya está vinculada a ${ocupado.nombre}.`,
    );
  }
}

async vincularUsuario(profesionalId: number, usuarioId: number | null) {
  const profesional = await this.medicosRepo.findOneBy({ id: profesionalId });
  if (!profesional) {
    throw new NotFoundException(`Profesional ${profesionalId} no encontrado`);
  }

  if (usuarioId != null) {
    await this.validarCuenta(usuarioId, profesional.tipo, profesional.id);
  }

  profesional.usuarioId = usuarioId ?? null;
  await this.medicosRepo.save(profesional);
  return { id: profesional.id, usuarioId: profesional.usuarioId };
}

async crearMedico(dto: CrearMedicoDto) {
  const nombre = dto.nombre.trim();
  const especialidad = await this.especialidadesRepo.findOneBy({ id: dto.especialidadId });
  if (!especialidad) {
    throw new NotFoundException(`Especialidad ${dto.especialidadId} no encontrada`);
  }

  if (especialidad.tipo !== dto.tipo) {
    throw new BadRequestException(
      `La especialidad "${especialidad.nombre}" no corresponde a un ${dto.tipo}.`,
    );
  }

  const existente = await this.medicosRepo.findOneBy({
    nombre,
    tipo: dto.tipo,
    especialidadId: especialidad.id,
  });
  if (existente) {
    throw new ConflictException('Ya existe un profesional con ese nombre, tipo y especialidad.');
  }

  if (dto.usuarioId != null) {
    await this.validarCuenta(dto.usuarioId, dto.tipo);
  }

  const guardado = await this.medicosRepo.save(
    this.medicosRepo.create({
      nombre,
      tipo: dto.tipo,
      especialidadId: especialidad.id,
      usuarioId: dto.usuarioId ?? null,
    }),
  );
  return {
    id: guardado.id,
    nombre: guardado.nombre,
    tipo: guardado.tipo,
    especialidadId: especialidad.id,
    especialidad: especialidad.nombre,
    usuarioId: guardado.usuarioId,
  };
}
  listarEspecialidades() {
  return this.especialidadesRepo.find({ order: { nombre: 'ASC' } });
}
}