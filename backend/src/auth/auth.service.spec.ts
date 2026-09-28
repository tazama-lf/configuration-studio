import { Test, type TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ServiceUnavailableException, HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    axiosRef: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };



  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw ServiceUnavailableException when TAZAMA_AUTH_URL is not set', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when TAZAMA_AUTH_URL is null', async () => {
      mockConfigService.get.mockReturnValue(null);

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should return token and expiresIn on successful login with token in response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'jwt-token', expires_in: 3600 } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.token).toBe('jwt-token');
      expect(result.expiresIn).toBe(3600);
      expect(result.message).toBe('Login successful');
    });

    it('should handle string response data as token', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(of({ data: 'raw-token-string' }));

      const result = await service.login('user', 'pass');
      expect(result.token).toBe('raw-token-string');
    });

    it('should handle access_token field in response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { access_token: 'access-token', expires_in: 1800 } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.token).toBe('access-token');
      expect(result.expiresIn).toBe(1800);
    });

    it('should handle jwt field in response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { jwt: 'jwt-field-token' } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.token).toBe('jwt-field-token');
    });

    it('should handle user.token nested field in response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { user: { token: 'nested-token' } } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.token).toBe('nested-token');
    });

    it('should handle expiresIn (camelCase) field in response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'tok', expiresIn: 7200 } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.expiresIn).toBe(7200);
    });

    it('should return null expiresIn when not provided', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'tok' } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.expiresIn).toBeNull();
    });

    it('should throw ServiceUnavailableException when response data is falsy', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(of({ data: null }));

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw UnauthorizedException on 401 error', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ response: { status: 401 }, message: 'Unauthorized' })),
      );

      await expect(service.login('user', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ServiceUnavailableException on non-401 error', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ response: { status: 500 }, message: 'Server error' })),
      );

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw HttpException with 429 status on account lockout', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 429, data: { message: 'Account locked' } },
          message: 'Too many requests',
        })),
      );

      await expect(service.login('user', 'pass')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException with 429 and default message when data.message missing', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 429, data: { error: 'some other field' } },
          message: 'Too many requests',
        })),
      );

      try {
        await service.login('user', 'pass');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = (error as HttpException).getResponse() as { message: string };
        expect(response.message).toBe('Account is locked. Too many failed attempts.');
      }
    });

    it('should throw HttpException with 429 and default message when data.message missing', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({
          response: { status: 429, data: { error: 'no message field' } },
          message: 'Too many requests',
        })),
      );

      try {
        await service.login('user', 'pass');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = (error as HttpException).getResponse() as { message: string };
        expect(response.message).toBe('Account is locked. Too many failed attempts.');
      }
    });

    it('should throw ServiceUnavailableException on network error without response', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        throwError(() => ({ message: 'Network error' })),
      );

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException when response object lacks any token', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      // response.data is an object but contains no token fields
      mockHttpService.post.mockReturnValue(of({ data: { some: 'value' } }));

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should call httpService.post with correct URL and credentials', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service:8080');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'tok' } }),
      );

      await service.login('myuser', 'mypass');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://auth-service:8080/v1/auth/login',
        { username: 'myuser', password: 'mypass' },
      );
    });

    it('should throw ServiceUnavailableException when TAZAMA_AUTH_URL is empty string', async () => {
      mockConfigService.get.mockReturnValue('');

      await expect(service.login('user', 'pass')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should handle response with both expires_in and expiresIn (snake_case takes priority)', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'tok', expires_in: 3600, expiresIn: 1800 } }),
      );

      const result = await service.login('user', 'pass');
      expect(result.expiresIn).toBe(3600);
    });

    it('should handle response with user.token when token field also exists', async () => {
      mockConfigService.get.mockReturnValue('http://auth-service');
      mockHttpService.post.mockReturnValue(
        of({ data: { token: 'primary-token', user: { token: 'nested-token' } } }),
      );

      const result = await service.login('user', 'pass');
      // token field takes priority over user.token
      expect(result.token).toBe('primary-token');
    });

    describe('private helpers (extractToken, extractExpiresIn)', () => {
      it('extractToken should prefer token then access_token then jwt then user.token', () => {
        const svc = service as any;

        expect(svc.extractToken('raw-string')).toBe('raw-string');

        expect(
          svc.extractToken({ token: 't1', access_token: 't2', jwt: 't3', user: { token: 't4' } }),
        ).toBe('t1');

        expect(svc.extractToken({ access_token: 'a1', jwt: 'j1', user: {} })).toBe('a1');

        expect(svc.extractToken({ jwt: 'jtoken', user: {} })).toBe('jtoken');

        expect(svc.extractToken({ user: { token: 'nested' } })).toBe('nested');
      });

      it('extractToken should throw when no token present', () => {
        const svc = service as any;
        expect(() => svc.extractToken({ some: 'value' })).toThrow();
      });

      it('extractExpiresIn should return snake_case or camelCase or null', () => {
        const svc = service as any;
        expect(svc.extractExpiresIn({ expires_in: 100 })).toBe(100);
        expect(svc.extractExpiresIn({ expiresIn: 200 })).toBe(200);
        expect(svc.extractExpiresIn({})).toBeNull();
      });
    });
  });
});

