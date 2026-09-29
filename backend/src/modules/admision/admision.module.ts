import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmisionController } from './admision.controller';
import { AdmisionService } from './admision.service';
import { TurnoEntity } from './entities/turno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TurnoEntity])],
  controllers: [AdmisionController],
  providers: [AdmisionService],
  exports: [AdmisionService],
})
export class AdmisionModule {} // 👈 Tiene que llamarse exactamente AdmisionModule