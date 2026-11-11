import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity.js';
import { EvolucionMedica } from './entities/evolucion-medica.entity.js';
import { Paciente } from './entities/paciente.entity.js';
import { EstudioMedico } from './entities/estudio-medico.entity.js';
import { Usuario } from './entities/usuario.entity.js';
import { CrearHistoriaClinicaDto } from './dto/crear-historia-clinica.dto.js';
import { CrearEvolucionDto } from './dto/crear-evolucion.dto.js';
import { ActualizarHistoriaClinicaDto } from './dto/actualizar-historia-clinica.dto.js';
import { CrearEstudioDto } from './dto/crear-estudio.dto.js';
import { esViolacionUnique } from '../common/db-errors.js';

@Injectable()
export class HceService {
  constructor(
    @InjectRepository(HistoriaClinica)
    private historiaClinicaRepository: Repository<HistoriaClinica>,
    
    @InjectRepository(EvolucionMedica)
    private evolucionRepository: Repository<EvolucionMedica>,
    
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,

    @InjectRepository(EstudioMedico)
    private estudioRepository: Repository<EstudioMedico>,

    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  // 1. Abrir la Ficha Demográfica (Se ejecuta una sola vez por paciente)
  async crearHistoriaClinica(dto: CrearHistoriaClinicaDto) {
    const paciente = await this.pacienteRepository.findOne({ 
      where: { Id: dto.PacienteId } 
    });
    
    if (!paciente) {
      throw new NotFoundException(`El paciente ${dto.PacienteId} no existe.`);
    }
    const existe = await this.historiaClinicaRepository.findOne({
      where: { PacienteId: dto.PacienteId } 
    });
    if (existe) {
      throw new ConflictException(`El paciente ${dto.PacienteId} ya tiene una historia clínica abierta en el sistema.`);
    }

    const nuevaHc = this.historiaClinicaRepository.create(dto);
    try {
      return await this.historiaClinicaRepository.save(nuevaHc);
    } catch (e) {
      // Dos pedidos simultáneos pasan el findOne de arriba; el UNIQUE de PacienteId frena al segundo
      if (esViolacionUnique(e)) {
        throw new ConflictException(`El paciente ${dto.PacienteId} ya tiene una historia clínica abierta en el sistema.`);
      }
      throw e;
    }
  }

  // 2. Cargar una Evolución Médica (INMUTABLE: No programamos DELETE ni PATCH)
  async agregarEvolucion(dto: CrearEvolucionDto) {
    const historia = await this.historiaClinicaRepository.findOne({ 
      where: { Id: dto.HistoriaClinicaId } 
    });
    
    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada.');
    }
    
    const medico = await this.usuarioRepository.findOne({
      where: { id: dto.MedicoId },
      relations: { rol: true },
    });
    if (!medico) {
      throw new NotFoundException(`El médico ${dto.MedicoId} no existe.`);
    }
    if (medico.rol.nombre !== 'Médico') {
      throw new BadRequestException(
        `El usuario ${dto.MedicoId} no tiene rol de Médico, no puede registrar evoluciones.`,
      );
    }
    const nuevaEvolucion = this.evolucionRepository.create(dto);
    
    return await this.evolucionRepository.save(nuevaEvolucion);
  }

  async listarPacientes(){
    return await this.pacienteRepository.find({
      select: { Id: true, Nombre: true, Apellido: true, Documento: true },
      order: { Apellido: 'ASC', Nombre: 'ASC' },
    });
  }

  // 3. Visualización centralizada para el médico
  async obtenerPorPaciente(pacienteId: number) {
    const historia = await this.historiaClinicaRepository.findOne({
      where: { PacienteId: pacienteId },
      // Traemos las evoluciones médicas asociadas automáticamente
      relations: { Paciente: { Cobertura: true}, Evoluciones: true }, 
      order: { Evoluciones: { FechaHora: 'DESC' } },
    });

    if (!historia) {
      throw new NotFoundException(`No se encontró historia clínica para el paciente ID ${pacienteId}`);
    }
    
    return historia;
  }

  async actualizarHistoriaClinica(pacienteId: number, dto: ActualizarHistoriaClinicaDto) {
    const historia = await this.historiaClinicaRepository.findOne({
      where: { PacienteId: pacienteId },
    });
    if (!historia) {
      throw new NotFoundException(`No se encontró historia clínica para el paciente ID ${pacienteId}`);
    }

    if (dto.Alergias !== undefined) historia.Alergias = dto.Alergias;
    if (dto.AntecedentesFamiliares !== undefined) historia.AntecedentesFamiliares = dto.AntecedentesFamiliares;
    
    return await this.historiaClinicaRepository.save(historia);
  }

  async agregarEstudio(dto: CrearEstudioDto) {
    const historia = await this.historiaClinicaRepository.findOne({ 
      where: { Id: dto.HistoriaClinicaId } 
    });
    if (!historia) {
      throw new NotFoundException(`No se encontró historia clínica para el paciente ID ${dto.HistoriaClinicaId}`);
    }

    const nuevoEstudio = this.estudioRepository.create(dto);
    return await this.estudioRepository.save(nuevoEstudio);
  }

  async listarEstudios(historiaClinicaId: number) {
    const historia = await this.historiaClinicaRepository.findOne({ 
      where: { Id: historiaClinicaId } 
    });
    if (!historia) {
      throw new NotFoundException(`No se encontró historia clínica para el ID ${historiaClinicaId}`);
    }

    return await this.estudioRepository.find({
      where: { HistoriaClinicaId: historiaClinicaId },
      order: { FechaHora: 'DESC' },
    });
  }
}