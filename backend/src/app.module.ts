import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './config/env.validation';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { ConfigProxyModule } from './config/config.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validate,
    }),
    // Bound the outbound requests to auth-service and admin-service so an
    // unresponsive downstream cannot hang request handlers indefinitely.
    // HTTP_TIMEOUT_MS is in milliseconds (default 10s per the hardening issue).
    HttpModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT_MS') ?? 10_000,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ConfigProxyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
