import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TazamaAuthGuard } from './tazama-auth.guard';

@Module({
  // No local HttpModule: it would shadow the global one registered in
  // app.module.ts and give AuthService's HttpService the default (0ms)
  // timeout, so a hung auth-service could stall login indefinitely.
  imports: [
    ConfigModule,
    // Rate limiting for the login endpoint (ThrottlerGuard on the
    // controller). Limits are env-tunable so environments that share an
    // egress IP (e.g. an office NAT) can raise them without a code change.
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('LOGIN_RATE_TTL_MS') ?? 60_000,
          limit: configService.get<number>('LOGIN_RATE_LIMIT') ?? 5,
        },
      ],
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, TazamaAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, TazamaAuthGuard],
})
export class AuthModule {}
