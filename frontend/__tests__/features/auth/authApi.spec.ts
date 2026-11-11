import { AuthApiService, authApi } from '@/features/auth/services/authApi';

// Helper to create a JWT token from a payload
function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('AuthApiService', () => {
  describe('decodeToken', () => {
    it('decodes a valid token with standard claims', () => {
      const token = makeToken({
        sub: 'user123',
        preferred_username: 'testuser',
        email: 'test@example.com',
        claims: ['admin'],
        tenantId: 'TenantA',
      });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('user123');
      expect(user!.username).toBe('testuser');
      expect(user!.email).toBe('test@example.com');
      expect(user!.claims).toEqual(['admin']);
      expect(user!.tenantId).toBe('tenanta');
    });

    it('decodes a token with inner tokenString', () => {
      const innerPayload = {
        sub: 'inner-sub',
        preferred_username: 'inner-user',
        email: 'inner@example.com',
      };
      const innerToken = makeToken(innerPayload);
      const token = makeToken({ tokenString: innerToken });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('inner-sub');
      expect(user!.username).toBe('inner-user');
      expect(user!.email).toBe('inner@example.com');
    });

    it('returns null for invalid token', () => {
      expect(AuthApiService.decodeToken('invalid')).toBeNull();
    });

    it('returns null for empty token', () => {
      expect(AuthApiService.decodeToken('')).toBeNull();
    });

    it('returns null for token with no payload part', () => {
      expect(AuthApiService.decodeToken('headeronly')).toBeNull();
    });

    it('falls back to clientId when sub is missing', () => {
      const token = makeToken({ clientId: 'client123' });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('client123');
    });

    it('falls back to "unknown" when no id fields present', () => {
      const token = makeToken({});
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.id).toBe('unknown');
      expect(user!.username).toBe('user');
    });

    it('uses realm_access.roles when claims not present', () => {
      const token = makeToken({ realm_access: { roles: ['role1', 'role2'] } });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.claims).toEqual(['role1', 'role2']);
    });

    it('handles token with username instead of preferred_username', () => {
      const token = makeToken({ username: 'customuser' });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.username).toBe('customuser');
    });

    it('handles inner token with invalid base64', () => {
      const token = makeToken({ tokenString: 'invalid.inner.token' });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
    });

    it('handles tenantId from inner payload', () => {
      const innerPayload = { sub: 'inner-sub', tenantId: 'InnerTenant' };
      const innerToken = makeToken(innerPayload);
      const token = makeToken({ tokenString: innerToken });
      const user = AuthApiService.decodeToken(token);
      expect(user).not.toBeNull();
      expect(user!.tenantId).toBe('innertenant');
    });

    it('returns null when JSON.parse fails on decoded payload', () => {
      // Create a token where the payload part is valid base64 but not valid JSON
      const header = Buffer.from('{"alg":"HS256"}').toString('base64url');
      const body = Buffer.from('not-json').toString('base64url');
      const token = `${header}.${body}.sig`;
      expect(AuthApiService.decodeToken(token)).toBeNull();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('calls fetch with correct endpoint and returns response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success', token: makeToken({ sub: 'test' }) }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      const result = await authApi.login({ username: 'test', password: 'pass' });
      expect(result.token).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws on 401 response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      await expect(authApi.login({ username: 'test', password: 'pass' })).rejects.toThrow(
        'Unauthorized - Token expired',
      );
    });

    it('throws on non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      await expect(authApi.login({ username: 'test', password: 'pass' })).rejects.toThrow(
        'HTTP error! status: 500',
      );
    });

    it('throws network error on TypeError', async () => {
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed')) as unknown as typeof fetch;

      await expect(authApi.login({ username: 'test', password: 'pass' })).rejects.toThrow(
        'Network error',
      );
    });

    it('includes Authorization header when token exists in localStorage', async () => {
      localStorage.setItem('authToken', 'existing-token');
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success', token: 'new-token' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      await authApi.login({ username: 'test', password: 'pass' });
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBe('Bearer existing-token');
    });
  });

  describe('getProfile', () => {
    it('calls fetch with profile endpoint', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ id: '1', username: 'test' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      await authApi.getProfile();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/profile'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('removes localStorage on 401 for non-login endpoint', async () => {
      localStorage.setItem('authToken', 'some-token');
      localStorage.setItem('user', 'some-user');
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse) as unknown as typeof fetch;

      await expect(authApi.getProfile()).rejects.toThrow('Unauthorized - Token expired');
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('authApi instance', () => {
    it('is an instance of AuthApiService', () => {
      expect(authApi).toBeInstanceOf(AuthApiService);
    });
  });

  describe('error handling', () => {
    it('throws Network error on "Cannot read properties of undefined" error', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(
          new Error('Cannot read properties of undefined (reading \'json\')'),
        ) as unknown as typeof fetch;

      await expect(authApi.login({ username: 'test', password: 'pass' })).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('decodeToken with invalid inner token', () => {
    it('handles tokenString with invalid inner content that throws', () => {
      // Create a token where tokenString is not valid base64 and will cause
      // decodeBase64Url to throw, hitting the catch block in parseInnerToken
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      // tokenString with content that will fail JSON.parse after decode
      const body = Buffer.from(JSON.stringify({ tokenString: 'not.a.valid-base64!!!' })).toString('base64url');
      const token = `${header}.${body}.signature`;
      const user = AuthApiService.decodeToken(token);
      // Should return a user object (falls back to outer payload)
      expect(user).not.toBeNull();
    });

    it('handles tokenString where inner base64 decode throws (atob fails)', () => {
      // Create a token where the inner part of tokenString is invalid base64
      // that will cause atob() to throw, hitting the catch block in parseInnerToken
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      // Use characters that are invalid in base64: !@#$%^&*() are not valid base64 chars
      const body = Buffer.from(JSON.stringify({ tokenString: 'header.!!!invalid!!!.sig' })).toString('base64url');
      const token = `${header}.${body}.signature`;
      const user = AuthApiService.decodeToken(token);
      // Should return a user object (falls back to outer payload via catch)
      expect(user).not.toBeNull();
    });

    it('handles tokenString with only one part (no dot)', () => {
      // tokenString with no dot means split gives ['nodots'], innerBase64Url is undefined
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify({ tokenString: 'nodots' })).toString('base64url');
      const token = `${header}.${body}.signature`;
      const user = AuthApiService.decodeToken(token);
      // Should return a user object (falls back to outer payload)
      expect(user).not.toBeNull();
    });
  });
});
