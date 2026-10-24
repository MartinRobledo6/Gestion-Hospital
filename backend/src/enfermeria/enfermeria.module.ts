import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VitalSigns } from './vital-signs.entity';
import { MedicationAdministration } from './medication-administration.entity'; // 1. Importar la entidad nueva
import { EnfermeriaController } from './enfermeria.controller';
import { EnfermeriaService } from './enfermeria.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VitalSigns, 
      MedicationAdministration // 2. Incluirla aquí dentro
    ])
  ],
  controllers: [EnfermeriaController],
  providers: [EnfermeriaService],
  exports: [EnfermeriaService],
})
export class EnfermeriaModule {}