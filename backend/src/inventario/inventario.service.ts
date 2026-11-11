import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventarioDto } from './dto/create-inventario.dto.js';
import { UpdateInventarioDto } from './dto/update-inventario.dto.js';
import { Inventario } from './entities/inventario.entity.js';
import { OnEvent } from '@nestjs/event-emitter';
import { esViolacionForeignKey } from '../common/db-errors.js';

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

  async reponer(id: number, cantidad: number) {
    const result = await this.inventarioRepository.increment({ Id: id }, 'StockActual', cantidad);
    if (!result.affected) throw new NotFoundException('Recurso no encontrado');
    return await this.findOne(id);
  }

  async remove(id: number) {
    const recurso = await this.findOne(id);
    try{
      return await this.inventarioRepository.remove(recurso);
    } catch (error) {
      if (esViolacionForeignKey(error)) {
        throw new ConflictException('No se puede eliminar el recurso porque está siendo referenciado por otros registros.');
      }
    }
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
        console.error(
          `No se pudo descontar ${payload.cantidad} u. del insumo ID ${payload.insumoId}: no existe o no hay suficiente stock.`,
        );
        return;
      }
      console.log(`Stock descontado exitosamente para el insumo ID ${payload.insumoId}.`);
      const insumo = await this.inventarioRepository.findOne({ where: { Id: payload.insumoId } });
      if (insumo && insumo.StockActual <= insumo.StockMinimo) {
        console.warn(
          `ALERTA STOCK BAJO: "${insumo.Nombre}" quedó en ${insumo.StockActual} u. (mínimo: ${insumo.StockMinimo}).`,
        );
      }
      } catch (error) {
        console.error(`Error al descontar el stock del insumo ID ${payload.insumoId}:`, error);
      }
    }
}