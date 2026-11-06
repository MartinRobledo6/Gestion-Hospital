import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EstadoGuardia,
  IngresoGuardiaEntity,
} from './entities/ingreso-guardia.entity.js';
import { RegistrarIngresoGuardiaDto } from './dto/registrar-ingreso-guardia.dto.js';
import { UsuariosService } from '../iam/usuarios.service.js';
import { Rol } from '../iam/rol.enum.js';
import type { UsuarioToken } from '../iam/usuario-actual.decorador.js';

// Prioridad: primero el nivel más urgente; a igual nivel, el que llegó antes.
// La posición NO se guarda: sale de este orden, así un Código Rojo
// "pasa adelante" sin tener que renumerar a nadie.
const ORDEN_COLA = { nivel: 'ASC', fechaIngreso: 'ASC', id: 'ASC' } as const;

@Injectable()
export class GuardiaService {
  constructor(
    @InjectRepository(IngresoGuardiaEntity)
    private readonly repo: Repository<IngresoGuardiaEntity>,
    private readonly usuariosService: UsuariosService,
  ) {}

  async registrarIngreso(dto: RegistrarIngresoGuardiaDto, enfermeroUsuarioId: number) {
    const guardado = await this.repo.save(
      this.repo.create({
        pacienteNombre: dto.pacienteNombre.trim(),
        documento: dto.documento ?? null,
        motivoConsulta: dto.motivoConsulta.trim(),
        nivel: dto.nivel,
        enfermeroUsuarioId,
      }),
    );

    const { enEspera } = await this.obtenerCola();
    const posicion = enEspera.findIndex((i) => i.id === guardado.id) + 1;
    return { ...guardado, posicion };
  }

  async obtenerCola() {
    const [enEspera, enAtencion] = await Promise.all([
      this.repo.find({
        where: { estado: EstadoGuardia.EN_ESPERA },
        order: ORDEN_COLA,
      }),
      this.repo.find({
        where: { estado: EstadoGuardia.EN_ATENCION },
        order: { fechaAtencion: 'ASC' },
      }),
    ]);

    // Nombre del médico que atiende a cada uno (para mostrarlo en pantalla)
    const usuarios = enAtencion.length ? await this.usuariosService.listar() : [];
    const nombres = new Map(usuarios.map((u) => [u.id, u.nombre]));

    return {
      enEspera: enEspera.map((i, idx) => ({ ...i, posicion: idx + 1 })),
      enAtencion: enAtencion.map((i) => ({
        ...i,
        medicoNombre:
          i.medicoUsuarioId != null ? (nombres.get(i.medicoUsuarioId) ?? null) : null,
      })),
    };
  }

  // El médico no elige a quién atender: toma al primero de la cola.
  // Control de concurrencia: el UPDATE solo cambia la fila si sigue "En espera".
  // Si dos médicos llaman a la vez, uno actualiza 1 fila y el otro 0;
  // el que perdió reintenta con el siguiente paciente.
  async atenderSiguiente(medicoUsuarioId: number) {
    for (let intento = 0; intento < 3; intento++) {
      const siguiente = await this.repo.findOne({
        where: { estado: EstadoGuardia.EN_ESPERA },
        order: ORDEN_COLA,
      });
      if (!siguiente) {
        throw new NotFoundException('No hay pacientes esperando en la guardia.');
      }

      const resultado = await this.repo
        .createQueryBuilder()
        .update(IngresoGuardiaEntity)
        .set({
          estado: EstadoGuardia.EN_ATENCION,
          medicoUsuarioId,
          fechaAtencion: new Date(),
        })
        .where({ id: siguiente.id, estado: EstadoGuardia.EN_ESPERA })
        .execute();

      if (resultado.affected) {
        return this.repo.findOneBy({ id: siguiente.id });
      }
    }
    throw new ConflictException(
      'Otro médico llamó al mismo paciente al mismo tiempo. Probá de nuevo.',
    );
  }

  async finalizar(id: number, usuario: UsuarioToken) {
    const ingreso = await this.repo.findOneBy({ id });
    if (!ingreso) {
      throw new NotFoundException(`Ingreso de guardia ${id} no encontrado`);
    }
    if (ingreso.estado !== EstadoGuardia.EN_ATENCION) {
      throw new ConflictException(
        `El paciente está "${ingreso.estado}": solo se puede finalizar una atención en curso.`,
      );
    }
    if (usuario.rol !== Rol.ADMINISTRADOR && ingreso.medicoUsuarioId !== usuario.id) {
      throw new ForbiddenException(
        'Solo el médico que lo está atendiendo puede finalizar la atención.',
      );
    }

    ingreso.estado = EstadoGuardia.FINALIZADO;
    return this.repo.save(ingreso);
  }
}