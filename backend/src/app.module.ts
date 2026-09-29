import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CamasModule } from './camas/camas.module.js';
import { InventarioModule } from './inventario/inventario.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1433,
      username: 'sa', // Usuario nativo habilitado
      password: '123456', // Contraseña del usuario nativo
      database: 'GestionHospital',
      autoLoadEntities: true,
      synchronize: false, 
      options: {
        encrypt: false, 
        trustServerCertificate: true,
      },
    }),
    CamasModule,
    InventarioModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}