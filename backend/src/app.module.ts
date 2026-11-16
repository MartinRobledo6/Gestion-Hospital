import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { CamasModule } from './modules/camas/camas.module.js';
import { InventarioModule } from './modules/inventario/inventario.module.js';
import { HceModule } from './modules/hce/hce.module.js';
import { EnfermeriaModule } from './modules/enfermeria/enfermeria.module.js';

import { AdmisionModule } from './modules/admision/admision.module.js';
import { IamModule } from './modules/iam/iam.module.js';
import { FacturacionModule } from './modules/facturacion/facturacion.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      // Credenciales desde backend/.env cada integrante usa las suyas
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 1433),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? 'GestionHospital',
      autoLoadEntities: true,
      synchronize: false,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      },
    }),

    EventEmitterModule.forRoot(),

    // Módulos existentes: Martín + Nacho
    CamasModule,
    InventarioModule,
    HceModule,
    EnfermeriaModule,

    // Módulos incorporados: Mulla + Acosta
    AdmisionModule,
    IamModule,
    FacturacionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}