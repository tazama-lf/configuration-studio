import { describe, it, expect } from 'vitest';

// Re-export barrel file to ensure it's covered
export * from './authApi';

describe('auth services barrel export', () => {
  it('should re-export AuthApiService and authApi', async () => {
    const mod = await import('./index');
    expect(mod.AuthApiService).toBeDefined();
    expect(mod.authApi).toBeDefined();
  });

  it('should export LoginCredentials type (runtime check via authApi instance)', async () => {
    const mod = await import('./index');
    expect(mod.authApi).toBeInstanceOf(mod.AuthApiService);
  });
});
