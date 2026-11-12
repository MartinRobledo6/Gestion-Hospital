import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:5173" });
  await app.listen(Number(process.env.PORT ?? 3000));
}

bootstrap().catch((error: unknown) => {
  console.error("No se pudo iniciar el backend:", error);
  process.exitCode = 1;
});
