/* eslint-disable import/first -- dotenv must be imported and configured before other modules */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
/* eslint-enable import/first */

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  /**
   * Allowed CORS origins. `origin: true` reflected any Origin header back
   * together with credentials, letting any site make authenticated requests
   * to this API. Restrict to the origins configured via CORS_ORIGINS
   * (comma-separated); default to the local dev frontend when unset, and
   * allow none when explicitly set empty.
   */
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? 'http://localhost:5176')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Tazama Config Studio API')
    .setDescription('Tazama Config Studio APIs')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'jwt')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = configService.get<number>('PORT') ?? 3015;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
