import { API_CONFIG } from '../../shared/config/api.config';

const HTTP_STATUS_UNAUTHORIZED = 401;
const LOGIN_REDIRECT_DELAY_MS = 2000;

/**
 * Pending redirect timer, if any. A 401 schedules a redirect to /login after
 * a short delay; any subsequent successful request cancels it, so a stale
 * timer can never fire mid-session (e.g. after the user re-authenticates).
 */
let pendingRedirect: ReturnType<typeof setTimeout> | undefined;

/** Resolve the URL of a fetch input, whatever shape it was passed as. */
function resolveRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/** True when the request targets the login endpoint itself. */
function isLoginRequest(input: RequestInfo | URL): boolean {
  return resolveRequestUrl(input).includes(API_CONFIG.ENDPOINTS.AUTH.LOGIN);
}

export function setupFetch401Interceptor(navigateToLogin: () => void): void {
  const originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    const response = await originalFetch(input, init);

    // A 401 from the login endpoint means "wrong credentials", not "session
    // expired" — it must never schedule a redirect, otherwise a mistyped
    // password followed by a successful login would still bounce the user
    // back to /login a couple of seconds later.
    if (response.status === HTTP_STATUS_UNAUTHORIZED && !isLoginRequest(input)) {
      // Replace any pending redirect rather than stacking timers, so the
      // delay always counts from the most recent 401.
      if (pendingRedirect !== undefined) {
        clearTimeout(pendingRedirect);
      }
      pendingRedirect = setTimeout(() => {
        pendingRedirect = undefined;
        navigateToLogin();
      }, LOGIN_REDIRECT_DELAY_MS);
      return response;
    }

    // Any successful request proves the session is alive: cancel a pending
    // redirect scheduled by an earlier transient 401.
    if (response.ok && pendingRedirect !== undefined) {
      clearTimeout(pendingRedirect);
      pendingRedirect = undefined;
    }

    return response;
  };
}

