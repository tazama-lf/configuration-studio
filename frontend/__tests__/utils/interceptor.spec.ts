import { setupFetch401Interceptor } from '@/utils/common/interceptor';

describe('interceptor', () => {
  it('calls navigateToLogin on 401 response', async () => {
    const originalFetch = window.fetch;
    const navigateToLogin = jest.fn();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 401,
      json: async () => ({}),
    });
    window.fetch = mockFetch as unknown as typeof fetch;

    setupFetch401Interceptor(navigateToLogin);

    await window.fetch('http://example.com/api');

    // Wait for setTimeout(2000ms) to fire
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(navigateToLogin).toHaveBeenCalled();

    window.fetch = originalFetch;
  });

  it('does not call navigateToLogin on non-401 response', async () => {
    const originalFetch = window.fetch;
    const navigateToLogin = jest.fn();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    window.fetch = mockFetch as unknown as typeof fetch;

    setupFetch401Interceptor(navigateToLogin);

    await window.fetch('http://example.com/api');

    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(navigateToLogin).not.toHaveBeenCalled();

    window.fetch = originalFetch;
  });

  it('passes through response for non-401', async () => {
    const originalFetch = window.fetch;
    const navigateToLogin = jest.fn();
    const mockResponse = { ok: true, status: 200, json: async () => ({ data: 'test' }) };
    const mockFetch = jest.fn().mockResolvedValue(mockResponse);
    window.fetch = mockFetch as unknown as typeof fetch;

    setupFetch401Interceptor(navigateToLogin);

    const response = await window.fetch('http://example.com/api');
    expect(response).toBe(mockResponse);

    window.fetch = originalFetch;
  });

  it('returns the 401 response as well', async () => {
    const originalFetch = window.fetch;
    const navigateToLogin = jest.fn();
    const mockResponse = { ok: false, status: 401, json: async () => ({}) };
    const mockFetch = jest.fn().mockResolvedValue(mockResponse);
    window.fetch = mockFetch as unknown as typeof fetch;

    setupFetch401Interceptor(navigateToLogin);

    const response = await window.fetch('http://example.com/api');
    expect(response.status).toBe(401);

    await new Promise((resolve) => setTimeout(resolve, 2100));
    window.fetch = originalFetch;
  });
});
