import { Module } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigProxyService } from './config-proxy.service';
import { AdminServiceClient } from '../services/admin-service-client.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  // No local HttpModule: it would shadow the global one registered in
  // app.module.ts, so AdminServiceClient would use the default (0ms) timeout
  // and every config call could hang if admin-service stopped responding.
  imports: [ConfigModule, AuthModule],
  providers: [AdminServiceClient, ConfigProxyService],
  controllers: [ConfigController],
  exports: [ConfigProxyService, AdminServiceClient],
})
export class ConfigProxyModule {}
