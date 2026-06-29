import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  // Rate limit en login
  app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Demasiados intentos, esperá 15 minutos' } }));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // CORS: en producción solo el dominio configurado; en dev permisivo
  const dominio = process.env.DOMINIO;
  if (dominio) {
    app.enableCors({ origin: `https://${dominio}`, credentials: true });
  }

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`API corriendo en puerto ${port}`);
}

bootstrap();
