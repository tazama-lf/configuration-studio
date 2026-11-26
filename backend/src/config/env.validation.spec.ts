import 'reflect-metadata';
import { validate } from './env.validation';

// Build a copy of env without the given keys, so "missing variable" tests read
// clearly without leaving an unused destructured binding behind.
const omit = <T extends object>(obj: T, ...keys: (keyof T)[]): Partial<T> => {
  const copy: Partial<T> = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
};

describe('env.validation', () => {
  const validEnv = {
    NODE_ENV: 'development',
    FUNCTION_NAME: 'test-function',
    TAZAMA_AUTH_URL: 'http://auth-service:8080',
    AUTH_PUBLIC_KEY_PATH: '/path/to/key',
    CERT_PATH_PUBLIC: '/path/to/cert',
    ADMIN_SERVICE_URL: 'http://admin:5100',
    PORT: '3015',
  };

  describe('validate', () => {
    it('should return validated config when all required env vars are present', () => {
      const result = validate(validEnv);
      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.FUNCTION_NAME).toBe('test-function');
      expect(result.TAZAMA_AUTH_URL).toBe('http://auth-service:8080');
    });

    it('should accept production NODE_ENV', () => {
      const result = validate({ ...validEnv, NODE_ENV: 'production' });
      expect(result.NODE_ENV).toBe('production');
    });

    it('should accept test NODE_ENV', () => {
      const result = validate({ ...validEnv, NODE_ENV: 'test' });
      expect(result.NODE_ENV).toBe('test');
    });

    it('should accept dev NODE_ENV', () => {
      const result = validate({ ...validEnv, NODE_ENV: 'dev' });
      expect(result.NODE_ENV).toBe('dev');
    });

    it('should accept prod NODE_ENV', () => {
      const result = validate({ ...validEnv, NODE_ENV: 'prod' });
      expect(result.NODE_ENV).toBe('prod');
    });

    it('should throw when NODE_ENV is invalid enum value', () => {
      expect(() => validate({ ...validEnv, NODE_ENV: 'invalid-env' })).toThrow();
    });

    it('should throw when NODE_ENV is a number (not valid enum)', () => {
      expect(() => validate({ ...validEnv, NODE_ENV: 123 })).toThrow();
    });

    it('should accept config without PORT (optional)', () => {
      const result = validate(omit(validEnv, 'PORT'));
      expect(result).toBeDefined();
      expect(result.PORT).toBeUndefined();
    });

    it('should accept PORT as string', () => {
      const result = validate({ ...validEnv, PORT: '4000' });
      expect(result.PORT).toBe('4000');
    });

    it('should accept a numeric HTTP_TIMEOUT_MS', () => {
      const result = validate({ ...validEnv, HTTP_TIMEOUT_MS: '10000' });
      expect(result.HTTP_TIMEOUT_MS).toBe('10000');
    });

    it('should accept the smallest positive HTTP_TIMEOUT_MS', () => {
      const result = validate({ ...validEnv, HTTP_TIMEOUT_MS: '1' });
      expect(result.HTTP_TIMEOUT_MS).toBe('1');
    });

    it('should reject a non-numeric HTTP_TIMEOUT_MS so startup fails fast', () => {
      expect(() => validate({ ...validEnv, HTTP_TIMEOUT_MS: '10s' })).toThrow(/HTTP_TIMEOUT_MS/);
    });

    it('should reject a decimal HTTP_TIMEOUT_MS (parseInt would yield NaN)', () => {
      expect(() => validate({ ...validEnv, HTTP_TIMEOUT_MS: '.5' })).toThrow(/HTTP_TIMEOUT_MS/);
    });

    it('should reject HTTP_TIMEOUT_MS=0 (axios treats the string "0" as a zero-delay timer)', () => {
      expect(() => validate({ ...validEnv, HTTP_TIMEOUT_MS: '0' })).toThrow(/HTTP_TIMEOUT_MS/);
    });

    it('should accept config with only required fields', () => {
      const result = validate({
        NODE_ENV: 'development',
        FUNCTION_NAME: 'fn',
        TAZAMA_AUTH_URL: 'http://auth',
        AUTH_PUBLIC_KEY_PATH: '/key',
        CERT_PATH_PUBLIC: '/cert',
        ADMIN_SERVICE_URL: 'http://admin',
      });
      expect(result).toBeDefined();
    });

    it('should throw when required env vars are missing (no skipMissingProperties)', () => {
      expect(() => validate(omit(validEnv, 'TAZAMA_AUTH_URL'))).toThrow(/TAZAMA_AUTH_URL/);
    });

    it('should reject an empty TAZAMA_AUTH_URL (present but blank)', () => {
      expect(() => validate({ ...validEnv, TAZAMA_AUTH_URL: '' })).toThrow(/TAZAMA_AUTH_URL/);
    });

    it('should reject an empty ADMIN_SERVICE_URL (present but blank)', () => {
      expect(() => validate({ ...validEnv, ADMIN_SERVICE_URL: '' })).toThrow(/ADMIN_SERVICE_URL/);
    });

    it('should throw when ADMIN_SERVICE_URL is missing', () => {
      expect(() => validate(omit(validEnv, 'ADMIN_SERVICE_URL'))).toThrow(/ADMIN_SERVICE_URL/);
    });

    it('should throw when CERT_PATH_PUBLIC is missing', () => {
      expect(() => validate(omit(validEnv, 'CERT_PATH_PUBLIC'))).toThrow(/CERT_PATH_PUBLIC/);
    });

    it('should throw on an empty config object', () => {
      expect(() => validate({})).toThrow();
    });

    it('should convert numeric strings to strings with enableImplicitConversion', () => {
      const result = validate({ ...validEnv, TAZAMA_AUTH_URL: 12345 });
      // enableImplicitConversion converts to string
      expect(result).toBeDefined();
    });

    it('should validate multiple env configs', () => {
      const result1 = validate({ ...validEnv, PORT: '3001' });
      const result2 = validate({ ...validEnv, PORT: '3002' });
      expect(result1.PORT).toBe('3001');
      expect(result2.PORT).toBe('3002');
    });
  });
});
