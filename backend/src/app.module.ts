import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnfermeriaModule } from './enfermeria/enfermeria.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 1433,
      username: 'sa',     // Reemplaza por tu usuario
      password: 'nacho123', // Reemplaza por tu contraseña
      database: 'GestionHospital',
      // Las entidades se registran solas desde cada módulo (TypeOrmModule.forFeature),
      // así no hay que agregarlas a mano acá cada vez que se crea una.
      autoLoadEntities: true,
      // true: TypeORM crea/actualiza las tablas a partir de las entidades al arrancar.
      // Sirve para desarrollo y para el TP; NO usar en una base real (puede borrar columnas).
      // La base GestionHospital tiene que existir (vacía alcanza).
      synchronize: true,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),
    EnfermeriaModule,
  ],
})
export class AppModule {}
