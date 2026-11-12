import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FacturacionModule } from "./modules/facturacion/facturacion.module"; // 1. Agregá esta importación

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "mssql",
      host: "localhost",
      username: "sa",
      password: "Joaco123",
      database: "hospital_local_facturacion",
      extra: {
        options: {
          instanceName: "SQLEXPRESS",
          trustServerCertificate: true,
        },
      },
      autoLoadEntities: true,
      synchronize: true,
    }),
    FacturacionModule, // 2. Sumá tu módulo acá
  ],
})
export class AppModule {}
