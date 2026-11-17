import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Claim lists for the config routes, sourced from the environment so the
 * auth team can adjust them per deployment without a code change:
 *   CONFIG_READ_CLAIMS     - GET routes
 *   CONFIG_WRITE_CLAIMS    - POST/PUT/DELETE routes
 *   CONFIG_ACTIVATE_CLAIMS - activate/deactivate/reload routes
 *
 * Empty or unset means "no claim gating" — any authenticated user passes,
 * which is the current behavior and the safe default until the auth team
 * publishes the claim names.
 */
@Injectable()
export class ConfigClaimsService {
  readonly readClaims: string[];
  readonly writeClaims: string[];
  readonly activateClaims: string[];

  constructor(configService: ConfigService) {
    const parse = (value: string | undefined): string[] =>
      (value ?? '')
        .split(',')
        .map((claim) => claim.trim())
        .filter((claim) => claim.length > 0);

    this.readClaims = parse(configService.get<string>('CONFIG_READ_CLAIMS'));
    this.writeClaims = parse(configService.get<string>('CONFIG_WRITE_CLAIMS'));
    this.activateClaims = parse(configService.get<string>('CONFIG_ACTIVATE_CLAIMS'));
  }
}
