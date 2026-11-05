import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdmisionModule } from './modules/admision/admision.module.js';
import { IamModule } from './modules/iam/iam.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: 'localhost',
      port: 64042,
      username: 'sa',
      password: 'joamula15243',
      database: 'HospitalDB',
      autoLoadEntities: true,
      synchronize: true,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),
    AdmisionModule,
    IamModule,
  ],
})
export class AppModule {} 