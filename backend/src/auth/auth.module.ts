import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TazamaAuthGuard } from './tazama-auth.guard';

@Module({
  // No local HttpModule: it would shadow the global one registered in
  // app.module.ts and give AuthService's HttpService the default (0ms)
  // timeout, so a hung auth-service could stall login indefinitely.
  imports: [ConfigModule],
  providers: [AuthService, TazamaAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, TazamaAuthGuard],
})
export class AuthModule {}
