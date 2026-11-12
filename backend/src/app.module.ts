import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CamasModule } from './camas/camas.module.js';
import { InventarioModule } from './inventario/inventario.module.js';
import {EventEmitterModule} from "@nestjs/event-emitter";
import { HceModule } from './hce/hce.module.js';
import { EnfermeriaModule } from './enfermeria/enfermeria.module.js';

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

    CamasModule,
    InventarioModule,
    HceModule,
    EnfermeriaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

