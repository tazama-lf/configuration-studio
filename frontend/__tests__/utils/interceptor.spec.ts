import { setupFetch401Interceptor } from '@/utils/common/interceptor';

const LOGIN_URL = 'http://example.com/auth/login';
const API_URL = 'http://example.com/config/rule';

const mockResponse = (status: number, ok = status >= 200 && status < 300) =>
  ({ ok, status, json: async () => ({}) }) as unknown as Response;

describe('interceptor', () => {
  let originalFetch: typeof fetch;
  let navigateToLogin: jest.Mock;

  beforeEach(() => {
    originalFetch = window.fetch;
    navigateToLogin = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    jest.useRealTimers();
  });

  const install = (fetchImpl: jest.Mock): void => {
    window.fetch = fetchImpl as unknown as typeof fetch;
    setupFetch401Interceptor(navigateToLogin);
  };

  it('calls navigateToLogin after the delay on a 401 from a config endpoint', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
    install(mockFetch);

    await window.fetch(API_URL);

    expect(navigateToLogin).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(navigateToLogin).toHaveBeenCalledTimes(1);
  });

  it('does not call navigateToLogin on non-401 responses', async () => {
    const mockFetch = jest.fn().mockResolvedValue(mockResponse(200));
    install(mockFetch);

    await window.fetch(API_URL);

    jest.advanceTimersByTime(2100);
    expect(navigateToLogin).not.toHaveBeenCalled();
  });

  it('passes through the response for non-401', async () => {
    const response = mockResponse(200);
    const mockFetch = jest.fn().mockResolvedValue(response);
    install(mockFetch);

    expect(await window.fetch(API_URL)).toBe(response);
  });

  it('returns the 401 response as well', async () => {
    const response = mockResponse(401, false);
    const mockFetch = jest.fn().mockResolvedValue(response);
    install(mockFetch);

    expect((await window.fetch(API_URL)).status).toBe(401);
  });

  describe('login endpoint exclusion', () => {
    it('never schedules a redirect for a 401 from the login endpoint', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
      install(mockFetch);

      await window.fetch(LOGIN_URL);

      jest.advanceTimersByTime(5000);
      expect(navigateToLogin).not.toHaveBeenCalled();
    });

    it('does not redirect after a failed login followed by a successful login', async () => {
      // The exact real-world sequence from the bug report: wrong password
      // (401 from /auth/login), then a correct one (200 from /auth/login).
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(mockResponse(401, false))
        .mockResolvedValueOnce(mockResponse(200));
      install(mockFetch);

      await window.fetch(LOGIN_URL); // failed attempt
      await window.fetch(LOGIN_URL); // successful attempt

      jest.advanceTimersByTime(5000);
      expect(navigateToLogin).not.toHaveBeenCalled();
    });

    it('excludes the login endpoint when passed as a Request-like object', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
      install(mockFetch);

      // Request is not available in the jsdom test environment; the
      // interceptor only reads `.url`, so a Request-like object is enough.
      await window.fetch({ url: LOGIN_URL } as unknown as Request);

      jest.advanceTimersByTime(5000);
      expect(navigateToLogin).not.toHaveBeenCalled();
    });

    it('excludes the login endpoint when passed as a URL object', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
      install(mockFetch);

      await window.fetch(new URL(LOGIN_URL));

      jest.advanceTimersByTime(5000);
      expect(navigateToLogin).not.toHaveBeenCalled();
    });
  });

  describe('pending redirect cancellation', () => {
    it('cancels a pending redirect when a later request succeeds', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(mockResponse(401, false))
        .mockResolvedValueOnce(mockResponse(200));
      install(mockFetch);

      await window.fetch(API_URL); // transient 401 schedules redirect
      jest.advanceTimersByTime(1000);
      await window.fetch(API_URL); // success cancels it

      jest.advanceTimersByTime(5000);
      expect(navigateToLogin).not.toHaveBeenCalled();
    });

    it('still redirects when no successful request follows the 401', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
      install(mockFetch);

      await window.fetch(API_URL);
      jest.advanceTimersByTime(2000);

      expect(navigateToLogin).toHaveBeenCalledTimes(1);
    });

    it('a new 401 replaces the pending redirect instead of stacking timers', async () => {
      const mockFetch = jest.fn().mockResolvedValue(mockResponse(401, false));
      install(mockFetch);

      await window.fetch(API_URL);
      jest.advanceTimersByTime(1000); // first timer has 1000ms left
      await window.fetch(API_URL); // second 401 reschedules from now

      // 1000ms more: the first timer would have fired here, but it was
      // replaced — no redirect yet.
      jest.advanceTimersByTime(1000);
      expect(navigateToLogin).not.toHaveBeenCalled();

      // Another 1000ms: the replacement timer fires — exactly one redirect.
      jest.advanceTimersByTime(1000);
      expect(navigateToLogin).toHaveBeenCalledTimes(1);
    });
  });
});

