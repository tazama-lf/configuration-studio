/**
 * Pure, side-effect-free helpers for bootstrap-time configuration.
 *
 * They live outside main.ts so they can be unit-tested: main.ts calls
 * bootstrap() at import time, which would start a real Nest application.
 */

/** Development frontend origin used when CORS_ORIGINS is not configured. */
export const DEFAULT_DEV_ORIGIN = 'http://localhost:5176';

/**
 * Parse the comma-separated CORS_ORIGINS value into a list of allowed origins.
 *
 * - unset  -> the dev frontend origin only (fail-safe for local development)
 * - set    -> exactly the listed (trimmed, non-empty) origins
 * - empty  -> no origins allowed (fail closed, not fail open)
 */
export const parseCorsOrigins = (raw: string | undefined): string[] =>
  (raw ?? DEFAULT_DEV_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

/**
 * Whether the given NODE_ENV counts as production. Both `production` and the
 * `prod` shorthand are treated as production; an unset value defaults to
 * `development`.
 */
export const isProductionEnv = (env: string | undefined): boolean => {
  const nodeEnv = env ?? 'development';
  return nodeEnv === 'production' || nodeEnv === 'prod';
};
