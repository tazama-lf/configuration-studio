import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TazamaAuthGuard } from './tazama-auth.guard';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
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
