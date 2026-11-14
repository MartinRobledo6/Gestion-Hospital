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
      host: 'localhost',
      port: 1433,
      username: 'sa',
      password: '123456',
      database: 'GestionHospital',
      autoLoadEntities: true,
      synchronize: false,
      options: {
        encrypt: false,
        trustServerCertificate: true,
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