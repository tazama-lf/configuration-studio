import { Test } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { ConfigProxyModule } from './config.module';
import { AdminServiceClient } from '../services/admin-service-client.service';

/**
 * Guards the #38 hardening fix: AuthModule and ConfigProxyModule must consume
 * the single global HttpModule registered in app.module.ts (which carries the
 * HTTP_TIMEOUT_MS timeout). If either module re-adds its own bare HttpModule,
 * its own import wins and that client's HttpService falls back to axios's
 * default timeout of 0.
 *
 * The assertions read the HttpService actually injected into AuthService and
 * AdminServiceClient (not a container-wide `get(HttpService)`, which can hand
 * back the same provider regardless). A local HttpModule in *either* module
 * therefore fails the corresponding assertion.
 */
describe('HTTP timeout wiring', () => {
  const originalAdminUrl = process.env.ADMIN_SERVICE_URL;

  beforeAll(() => {
    // ConfigProxyModule's AdminServiceClient fails fast without this URL.
    process.env.ADMIN_SERVICE_URL = 'http://admin:5100';
  });

  afterAll(() => {
    if (originalAdminUrl === undefined) {
      delete process.env.ADMIN_SERVICE_URL;
    } else {
      process.env.ADMIN_SERVICE_URL = originalAdminUrl;
    }
  });

  it('injects the global configured HttpService into both clients', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        HttpModule.registerAsync({
          global: true,
          useFactory: () => ({ timeout: 7777 }),
        }),
        AuthModule,
        ConfigProxyModule,
      ],
    }).compile();

    // `httpService` is private on both clients; bracket access keeps the
    // runtime lookup while avoiding a TS2341 error under `tsc --noEmit`
    // (nest build skips *.spec.ts, so it would otherwise go unnoticed).
    const authSvc = moduleRef.get<AuthService>(AuthService);
    const adminSvc = moduleRef.get<AdminServiceClient>(AdminServiceClient);

    expect(authSvc['httpService'].axiosRef.defaults.timeout).toBe(7777);
    expect(adminSvc['httpService'].axiosRef.defaults.timeout).toBe(7777);

    await moduleRef.close();
  });
});
