import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  validateSync,
} from 'class-validator';

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

  @IsString()
  FUNCTION_NAME: string;

  @IsString()
  TAZAMA_AUTH_URL: string;

  @IsString()
  AUTH_PUBLIC_KEY_PATH: string;

  @IsString()
  CERT_PATH_PUBLIC: string;

  @IsString()
  ADMIN_SERVICE_URL: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  /** Numeric knobs: enableImplicitConversion parses the env string to a number. */
  @IsOptional()
  @IsNumber()
  HTTP_TIMEOUT_MS?: number;

  @IsOptional()
  @IsNumber()
  LOGIN_RATE_TTL_MS?: number;

  @IsOptional()
  @IsNumber()
  LOGIN_RATE_LIMIT?: number;

  /**
   * Claim-based authorization. Comma-separated claim lists (ANY-of
   * semantics) applied by TazamaAuthGuard to the config routes:
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

export const validate = (
  config: Record<string, unknown>,
): EnvironmentVariables => {
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
