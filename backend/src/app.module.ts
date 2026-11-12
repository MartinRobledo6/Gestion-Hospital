import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmisionModule } from './modules/admision/admision.module.js';
import { IamModule } from './modules/iam/iam.module.js';
import { FacturacionModule } from './modules/facturacion/facturacion.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: process.env.DB_HOST ?? 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'HospitalDB',
      autoLoadEntities: true,
      synchronize: true,
      options: {
        encrypt: false,
        trustServerCertificate: true,
        // Para quien usa una instancia con nombre (ej. SQLEXPRESS) en vez de puerto
        instanceName: process.env.DB_INSTANCE || undefined,
      },
    }),
    AdmisionModule,
    IamModule,
    FacturacionModule,
  ],
})
export class AppModule {}