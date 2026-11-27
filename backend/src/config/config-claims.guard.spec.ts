import { ForbiddenException } from '@nestjs/common';
import { ConfigClaimsGuard } from './config-claims.guard';
import { ConfigClaimsService } from './config-claims.service';

describe('ConfigClaimsGuard', () => {
  const makeContext = (method: string, path: string, token?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          path,
          user: token ? { token: { tokenString: token } } : undefined,
        }),
      }),
    }) as never;

  describe('with no configured claims', () => {
    const service = new ConfigClaimsService({ get: () => undefined } as never);
    const guard = new ConfigClaimsGuard(service);

    it('allows any authenticated request (backwards compatible)', () => {
      expect(guard.canActivate(makeContext('POST', '/config/rule', 'tok'))).toBe(true);
    });

    it('allows requests without a user (auth guard already rejected them)', () => {
      expect(guard.canActivate(makeContext('POST', '/config/rule'))).toBe(true);
    });
  });

  describe('with configured claims', () => {
    const service = new ConfigClaimsService({
      get: (key: string) =>
        ({
          CONFIG_READ_CLAIMS: 'GET_CONFIG',
          CONFIG_WRITE_CLAIMS: 'POST_CONFIG,PUT_CONFIG,DELETE_CONFIG',
          CONFIG_ACTIVATE_CLAIMS: 'ACTIVATE_CONFIG',
        })[key],
    } as never);
    const guard = new ConfigClaimsGuard(service);

    it('allows a write when the token carries one of the write claims', () => {
      jest.mocked(validateTokenAndClaims).mockReturnValue({
        POST_CONFIG: true,
        PUT_CONFIG: false,
        DELETE_CONFIG: false,
      } as never);
      expect(guard.canActivate(makeContext('POST', '/config/rule', 'tok'))).toBe(true);
    });

    it('rejects a write with 403 when no write claim is present', () => {
      jest.mocked(validateTokenAndClaims).mockReturnValue({
        POST_CONFIG: false,
        PUT_CONFIG: false,
        DELETE_CONFIG: false,
      } as never);
      expect(() => guard.canActivate(makeContext('POST', '/config/rule', 'tok'))).toThrow(
        ForbiddenException,
      );
    });

    it('uses the read claim list for GET routes', () => {
      jest.mocked(validateTokenAndClaims).mockReturnValue({ GET_CONFIG: true } as never);
      expect(guard.canActivate(makeContext('GET', '/config/rule', 'tok'))).toBe(true);
      expect(validateTokenAndClaims).toHaveBeenCalledWith('tok', ['GET_CONFIG']);
    });

    it('uses the activate claim list for activate/deactivate/reload paths', () => {
      jest.mocked(validateTokenAndClaims).mockReturnValue({ ACTIVATE_CONFIG: true } as never);
      expect(
        guard.canActivate(makeContext('POST', '/config/network-map/1.0.0/activate', 'tok')),
      ).toBe(true);
      expect(validateTokenAndClaims).toHaveBeenCalledWith('tok', ['ACTIVATE_CONFIG']);
    });

    it('still applies the activate claim list when the path has a trailing slash', () => {
      // A sloppy client (or reverse proxy) can add a trailing slash; without
      // normalisation it fell through to the write-claim class and skipped
      // the activate permission.
      jest.mocked(validateTokenAndClaims).mockReturnValue({} as never);
      expect(() =>
        guard.canActivate(
          makeContext('POST', '/config/network-map/1.0.0/activate/', 'tok'),
        ),
      ).toThrow(ForbiddenException);
      expect(validateTokenAndClaims).toHaveBeenCalledWith('tok', ['ACTIVATE_CONFIG']);
    });

    it('ignores a query string when classifying the route', () => {
      jest.mocked(validateTokenAndClaims).mockReturnValue({ ACTIVATE_CONFIG: true } as never);
      expect(
        guard.canActivate(
          makeContext('POST', '/config/network-map/reload?mode=cascade', 'tok'),
        ),
      ).toBe(true);
      expect(validateTokenAndClaims).toHaveBeenCalledWith('tok', ['ACTIVATE_CONFIG']);
    });
  });
});

jest.mock('@tazama-lf/auth-lib', () => ({
  validateTokenAndClaims: jest.fn(),
}));

import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
