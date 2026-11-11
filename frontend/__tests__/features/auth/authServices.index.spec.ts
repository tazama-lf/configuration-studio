// Test the barrel export
import * as authServices from '@/features/auth/services/index';

describe('auth services index', () => {
  it('exports authApi', () => {
    expect(authServices.authApi).toBeDefined();
  });
  it('exports AuthApiService', () => {
    expect(authServices.AuthApiService).toBeDefined();
  });
});
