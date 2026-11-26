import { plainToClass } from 'class-transformer';
import { IsEnum, IsString, IsOptional, Matches, validateSync } from 'class-validator';

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
  // exceeded"). Require a positive integer so these fail fast at startup.
  @IsOptional()
  @Matches(/^[1-9]\d*$/, {
    message: 'HTTP_TIMEOUT_MS must be a positive integer (milliseconds)',
  })
  HTTP_TIMEOUT_MS?: string;
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
