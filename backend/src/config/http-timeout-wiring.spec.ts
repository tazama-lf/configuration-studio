import { Test } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ConfigProxyModule } from './config.module';

/**
 * Guards the #38 hardening fix: AuthModule and ConfigProxyModule must consume
 * the single global HttpModule registered in app.module.ts (which carries the
 * HTTP_TIMEOUT_MS timeout). If either module re-adds its own bare HttpModule,
 * its own import wins and HttpService.timeout falls back to axios's default of
 * 0 - so these assertions would fail.
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

  it('AuthService and AdminServiceClient use the global configured HttpService', async () => {
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

    const authHttp = moduleRef.select(AuthModule).get(HttpService);
    const configHttp = moduleRef.select(ConfigProxyModule).get(HttpService);

    expect(authHttp.axiosRef.defaults.timeout).toBe(7777);
    expect(configHttp.axiosRef.defaults.timeout).toBe(7777);

    await moduleRef.close();
  });
});
