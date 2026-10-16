import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventarioDto } from './dto/create-inventario.dto.js';
import { UpdateInventarioDto } from './dto/update-inventario.dto.js';
import { Inventario } from './entities/inventario.entity.js';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
  ) {}

  async create(createInventarioDto: CreateInventarioDto) {
    const nuevoRecurso = this.inventarioRepository.create(createInventarioDto);
    return await this.inventarioRepository.save(nuevoRecurso);
  }

  async findAll() {
    return await this.inventarioRepository.find();
  }

  async findOne(id: number) {
    const recurso = await this.inventarioRepository.findOne({ where: { Id: id } });
    if (!recurso) throw new NotFoundException('Recurso no encontrado');
    return recurso;
  }

  async update(id: number, updateInventarioDto: UpdateInventarioDto) {
    const recursoAntiguo = await this.findOne(id);
    Object.assign(recursoAntiguo, updateInventarioDto);
    return await this.inventarioRepository.save(recursoAntiguo);
  }

  async remove(id: number) {
    const recurso = await this.findOne(id);
    return await this.inventarioRepository.remove(recurso);
  }

  @OnEvent('insumo.administrado', { async: true })
    async manejarDescuentoDeStock(payload: { insumoId: number; cantidad: number }) {
      console.log(`Evento recibido: Descontando ${payload.cantidad} unidades del insumo ID ${payload.insumoId}...`);

      try{
        const result = await this.inventarioRepository
          .createQueryBuilder()
          .update(Inventario)
          .set({ StockActual: () => `StockActual - ${payload.cantidad}` })
          .where("Id = :id", { id: payload.insumoId })
          .andWhere("StockActual >= :cantidad", { cantidad: payload.cantidad })
          .execute();

          if (result.affected === 0) {
            console.error(`No se pudo descontar el stock. Puede que el insumo no exista o que no haya suficiente stock.`);
          }
          else {
            console.log(`Stock descontado exitosamente para el insumo ID ${payload.insumoId}.`);
          }
      } catch (error) {
        console.error(`Error al descontar el stock del insumo ID ${payload.insumoId}:`, error);
      }
    }
}