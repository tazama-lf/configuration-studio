import { plainToClass } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsOptional, Matches, validateSync } from 'class-validator';

// A required value must contain at least one non-whitespace character:
// @IsNotEmpty() alone accepts whitespace-only strings like "   ", which then
// reach config as an unusable URL/path and fail at request time instead of at
// startup.
const REQUIRED_NON_BLANK = /\S/;
const nonBlank = { message: '$property must not be blank' };

enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
  DEV = 'dev',
  PROD = 'prod',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.DEVELOPMENT;

  @Matches(REQUIRED_NON_BLANK, nonBlank)
  FUNCTION_NAME: string;

  @Matches(REQUIRED_NON_BLANK, nonBlank)
  TAZAMA_AUTH_URL: string;

  @Matches(REQUIRED_NON_BLANK, nonBlank)
  AUTH_PUBLIC_KEY_PATH: string;

  @Matches(REQUIRED_NON_BLANK, nonBlank)
  CERT_PATH_PUBLIC: string;

  @Matches(REQUIRED_NON_BLANK, nonBlank)
  ADMIN_SERVICE_URL: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  // Positive integer only. app.module.ts reads this with
  // configService.get<number>(), a type hint only, so the raw string reaches
  // axios. Non-numeric ("10s") and decimals (".5") become NaN/no timeout, and
  // "0" is worse: axios parses the string '0' and starts a zero-delay timer,
  // so every auth/admin request aborts immediately ("timeout of 0ms
  // exceeded"). Cap at 6 digits (~16 minutes): values above Node's timer limit
  // of 2147483647 overflow and fire after ~1ms, aborting every request. So
  // require a positive integer up to 999999 and fail fast at startup otherwise.
  @IsOptional()
  @Matches(/^[1-9]\d{0,5}$/, {
    message: 'HTTP_TIMEOUT_MS must be a positive integer in milliseconds (max 999999, ~16 minutes)',
  })
  HTTP_TIMEOUT_MS?: string;

  @IsOptional()
  @IsNumber()
  LOGIN_RATE_TTL_MS?: number;

  @IsOptional()
  @IsNumber()
  LOGIN_RATE_LIMIT?: number;

  /**
   * Claim-based authorization. Comma-separated claim lists (ANY-of
   * semantics) applied by the TazamaAuthGuard/ConfigClaimsGuard to the config
   * routes:
   *   CONFIG_READ_CLAIMS     - GET routes
   *   CONFIG_WRITE_CLAIMS    - POST/PUT/DELETE routes
   *   CONFIG_ACTIVATE_CLAIMS - activate/deactivate/reload routes
   * Empty or unset = no claim gating (any authenticated user passes), which
   * preserves today's behavior until the auth team publishes claim names.
   */
  @IsOptional()
  @IsString()
  CONFIG_READ_CLAIMS?: string;

  @IsOptional()
  @IsString()
  CONFIG_WRITE_CLAIMS?: string;

  @IsOptional()
  @IsString()
  CONFIG_ACTIVATE_CLAIMS?: string;

  /**
   * Express `trust proxy` setting for the deployment topology: behind a
   * load balancer, request.ip is the proxy's IP unless this is configured.
   * Values: 'true', a hop count ('1'), a subnet/IP, or comma-separated list.
   */
  @IsOptional()
  @IsString()
  TRUST_PROXY?: string;
}

export const validate = (config: Record<string, unknown>): EnvironmentVariables => {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  // No skipMissingProperties: a missing required variable (TAZAMA_AUTH_URL,
  // ADMIN_SERVICE_URL, CERT_PATH_PUBLIC, ...) must abort startup with a clear
  // error instead of letting the app boot half-configured and fail at request
  // time - or worse, silently fall back to a localhost default in production.
  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
