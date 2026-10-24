import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnfermeriaModule } from './enfermeria/enfermeria.module';
import { VitalSigns } from './enfermeria/vital-signs.entity';
import { MedicationAdministration } from './enfermeria/medication-administration.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1433,
      username: 'sa',     // Reemplaza por tu usuario
      password: 'nacho123', // Reemplaza por tu contraseña
      database: 'GestionHospital',
      entities: [VitalSigns, MedicationAdministration],
      synchronize: false, // Mantenlo en false porque ya creaste las tablas por script
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),
    EnfermeriaModule,
  ],
})
export class AppModule {}