import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventarioDto } from './dto/create-inventario.dto.js';
import { UpdateInventarioDto } from './dto/update-inventario.dto.js';
import { Inventario } from './entities/inventario.entity.js';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
  ) {}

  async create(createInventarioDto: CreateInventarioDto) {
    // 1. Creá el recurso usando this.inventarioRepository.create(createInventarioDto)
    const nuevoRecurso = this.inventarioRepository.create(createInventarioDto);
    // 2. Guardalo y retornalo con this.inventarioRepository.save(...)
    return await this.inventarioRepository.save(nuevoRecurso);
  }

  async findAll() {
    // Retorná todos los recursos con this.inventarioRepository.find()
    return await this.inventarioRepository.find();
  }

  async findOne(id: number) {
    const recurso = await this.inventarioRepository.findOne({ where: { Id: id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  async update(id: number, updateInventarioDto: UpdateInventarioDto) {
    // 1. Buscá el recurso usando await this.findOne(id)
    const recursoAntiguo = await this.findOne(id);
    // 2. Mezclá los datos nuevos usando Object.assign(recursoViejo, updateInventarioDto)
    Object.assign(recursoAntiguo, updateInventarioDto);
    // 3. Guardá y retorná
    return await this.inventarioRepository.save(recursoAntiguo);
  }

  async remove(id: number) {
    // 1. Buscá el recurso usando await this.findOne(id)
    const recurso = await this.findOne(id);
    // 2. Borralo usando this.inventarioRepository.remove(recurso)
    return await this.inventarioRepository.remove(recurso);
  }
}