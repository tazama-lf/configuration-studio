import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { isProductionEnv, parseCorsOrigins } from './config/runtime-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // NODE_ENV drives environment-specific behavior below (Swagger, CSP);
  // 'production' and 'prod' both count as production.
  const isProduction = isProductionEnv(configService.get<string>('NODE_ENV'));

  // Allowed CORS origins. `origin: true` used to reflect any Origin header
  // back together with credentials; restrict to the origins configured via
  // CORS_ORIGINS (comma-separated), default to the dev frontend when unset,
  // and allow none when explicitly set empty. See parseCorsOrigins.
  const corsOrigins = parseCorsOrigins(configService.get<string>('CORS_ORIGINS'));

  /**
   * Security headers. Full helmet in production; in development the CSP is
   * relaxed so the Swagger UI (which loads its assets from a CDN) still
   * renders, and Swagger is only mounted outside production anyway.
   */
  app.use(helmet());
  if (!isProduction) {
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: [`'self'`, 'cdn.jsdelivr.net'],
          scriptSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net'],
          imgSrc: [`'self'`, 'data:'],
          // Helmet defaults this on; Safari honours it even for
          // http://localhost and then refuses to load Swagger's assets, so
          // drop it outside production where Swagger is served over http.
          upgradeInsecureRequests: null,
        },
      }),
    );
  }
  // Never advertise the server framework.
  const httpAdapter = app.getHttpAdapter().getInstance() as {
    disable: (name: string) => void;
  };
  httpAdapter.disable('x-powered-by');

  /**
   * Behind a load balancer, Express reports the proxy's address as the
   * client IP unless `trust proxy` is configured for the deployment
   * topology (TRUST_PROXY: 'true', hop count, IP/subnet, or a list).
   * Express expects a real boolean for the 'true'/'false' cases — passing
   * the string "true" (via Number("true") === NaN) makes it throw — so map
   * the boolean words explicitly and only treat other values as a hop
   * count when they are genuinely numeric (otherwise keep the raw string,
   * which covers IP/subnet/list values).
   */
  const trustProxy = configService.get<string>('TRUST_PROXY');
  if (trustProxy !== undefined && trustProxy.trim().length > 0) {
    const value = trustProxy.trim();
    let setting: boolean | number | string;
    if (value.toLowerCase() === 'true') {
      setting = true;
    } else if (value.toLowerCase() === 'false') {
      setting = false;
    } else if (/^\d+$/.test(value)) {
      setting = Number(value);
    } else {
      setting = value;
    }
    app.getHttpAdapter().getInstance().set('trust proxy', setting);
  }

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

  /**
   * Swagger exposes the full API surface (paths, DTOs, auth scheme) to
   * anyone without authentication. Serving it in production hands an
   * attacker a complete map of the API. Only mount it outside production.
   */
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Tazama Config Studio API')
      .setDescription('Tazama Config Studio APIs')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'jwt')
      .build();

    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  } else {
    logger.log('Swagger UI disabled in production (set NODE_ENV != production to enable)');
  }

  const port = configService.get<number>('PORT') ?? 3015;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
