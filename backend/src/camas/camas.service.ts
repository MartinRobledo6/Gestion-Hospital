import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cama, EstadoCama } from './entities/cama.entity.js';
import { AsignacionCama } from './entities/asignacion-cama.entity.js';

@Injectable()
export class CamasService {
  constructor(
    @InjectRepository(Cama)
    private camasRepository: Repository<Cama>,
    
    @InjectRepository(AsignacionCama)
    private asignacionRepository: Repository<AsignacionCama>,
  ) {}

  async asignarCama(camaNumero: string, pacienteId: number) {
    // Iniciamos una TRANSACCIÓN. transactionalEntityManager maneja todo el bloque.
    return await this.camasRepository.manager.transaction(async (transactionalEntityManager) => {
      
      const camaActual = await transactionalEntityManager.findOne(Cama, { where: { Numero: camaNumero } });

      if (!camaActual) throw new BadRequestException('La cama no existe');
      if (camaActual.Estado !== EstadoCama.LIBRES) throw new BadRequestException(`La cama está ${camaActual.Estado}, no se puede asignar.`);

      try {
        // 1. Marcamos la cama como ocupada usando el manager transaccional
        camaActual.Estado = EstadoCama.OCUPADAS;
        await transactionalEntityManager.save(Cama, camaActual);

        // 2. Registramos el historial
        const nuevaAsignacion = transactionalEntityManager.create(AsignacionCama, {
          CamaId: camaActual.Id,
          PacienteId: pacienteId // Si este ID no existe, ahora se revertirá el Paso 1 automáticamente
        });
        await transactionalEntityManager.save(AsignacionCama, nuevaAsignacion);
        
        return { 
          mensaje: 'Cama asignada exitosamente', 
          cama: camaActual, 
          asignacion: nuevaAsignacion 
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'OptimisticLockVersionMismatchError') {
          throw new ConflictException('Error: La cama acaba de ser ocupada por otro usuario.');
        }
        throw error; // Si falla la Foreign Key, NestJS aborta y deshace los cambios en la cama
      }
    });
  }
}