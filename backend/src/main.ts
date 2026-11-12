import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(Number(process.env.PORT ?? 3000));
}

bootstrap().catch((error: unknown) => {
  console.error('No se pudo iniciar el backend:', error);
  process.exitCode = 1;
});