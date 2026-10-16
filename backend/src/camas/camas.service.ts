import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MetadataWithSuchNameAlreadyExistsError, Repository } from 'typeorm';
import { Cama, EstadoCama } from './entities/cama.entity.js';
import { AsignacionCama } from './entities/asignacion-cama.entity.js';
import { dateTimestampProvider } from 'rxjs/internal/scheduler/dateTimestampProvider';

@Injectable()
export class CamasService {
  constructor(
    @InjectRepository(Cama)
    private camasRepository: Repository<Cama>,
    
    @InjectRepository(AsignacionCama)
    private asignacionRepository: Repository<AsignacionCama>,
  ) {}

  async asignarCama(camaNumero: string, pacienteId: number) {
    return await this.camasRepository.manager.transaction(async (transactionalEntityManager) => {
      
      const camaActual = await transactionalEntityManager.findOne(Cama, { where: { Numero: camaNumero } });

      if (!camaActual) throw new BadRequestException('La cama no existe');
      if (camaActual.Estado !== EstadoCama.LIBRES) throw new BadRequestException(`La cama está ${camaActual.Estado}, no se puede asignar.`);

      try {
        camaActual.Estado = EstadoCama.OCUPADAS;
        await transactionalEntityManager.save(Cama, camaActual);

        const nuevaAsignacion = transactionalEntityManager.create(AsignacionCama, {
          CamaId: camaActual.Id,
          PacienteId: pacienteId 
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
        throw error; 
      }
    });
  }

  async liberarCama(CamaNumero: string){
    
    const camaActual = await this.camasRepository.findOne({ where: { Numero: CamaNumero}});

    if(!camaActual){
      throw new BadRequestException('La cama no existe')
    }

    if(camaActual.Estado !== EstadoCama.OCUPADAS){
      throw new BadRequestException(`La cama esta ${camaActual.Estado}`)
    }

    return await this.camasRepository.manager.transaction(async (transactionalEntityManager) => {
      try{
          camaActual.Estado = EstadoCama.EN_LIMPIEZA
          await transactionalEntityManager.save(Cama, camaActual)
          
          const asignacionActiva = await transactionalEntityManager.findOne(AsignacionCama, {
            where:{
              CamaId: camaActual.Id,
              FechaEgreso: IsNull(),
            },
          });
          if(!asignacionActiva){
            throw new BadRequestException('La cama figura ocupada pero no se encontro el registro del paciente')
          }

          asignacionActiva.FechaEgreso = new Date();
          await transactionalEntityManager.save(AsignacionCama, asignacionActiva)

          return{
            mensaje: 'Paciente dado de alta. Cama enviada a limpieza',
            cama: camaActual,
            asignacion: asignacionActiva,
          };
      } catch (error){
        throw error;
      }
    })
  }

  async limpiarCama(camaNumero: string){

    const camaActual = await this.camasRepository.findOne({ where: {Numero: camaNumero}});

    if(!camaActual){
      throw new BadRequestException('La cama no existe')
    }

    if(camaActual.Estado !== EstadoCama.EN_LIMPIEZA){
      throw new BadRequestException(`La cama esta ${camaActual.Estado}, no se puede limpiar`)
    }

    camaActual.Estado = EstadoCama.LIBRES
    await this.camasRepository.save(camaActual)

    return{
      mensaje: 'Cama libre y lista para usar',
      cama: camaActual,
    }
  }

  async obtenerCamas(){
    return await this.camasRepository.find()
  }

  async bloquearCama(camaNumero: string){
    const camaActual = await this.camasRepository.findOne({ where: {Numero: camaNumero}});

    if(!camaActual){
      throw new BadRequestException('La cama no existe')
    }

    if(camaActual.Estado === EstadoCama.BLOQUEADAS){
      throw new BadRequestException(`La cama esta ${camaActual.Estado}, no se puede bloquear`)
    }

    camaActual.Estado = EstadoCama.BLOQUEADAS
    await this.camasRepository.save(camaActual)

    return{
      mensaje: 'Cama bloqueada exitosamente',
      cama: camaActual,
    }
  }

  async  desbloquearCama(camaNumero: string){
    const camaActual = await this.camasRepository.findOne({where: {Numero: camaNumero}});

    if(!camaActual){
      throw new BadRequestException('La cama no  existe')
    }

    if(camaActual.Estado !== EstadoCama.BLOQUEADAS){
      throw new BadRequestException(`La cama esta ${camaActual.Estado}`)
    }

    camaActual.Estado = EstadoCama.LIBRES
    await this.camasRepository.save(camaActual)

    return{
      mensaje: 'Cama desbloqueada, esta libre',
      cama: camaActual
    }
  }
}