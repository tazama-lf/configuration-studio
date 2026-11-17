import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
import { ConfigClaimsService } from './config-claims.service';
import type { AuthenticatedRequest } from '../auth/auth.types';

/**
 * Route-class-aware claim gating for the config endpoints.
 *
 * TazamaAuthGuard authenticates the user; this guard authorizes the action:
 * read (GET), write (POST/PUT/DELETE) or activate (activate/deactivate/reload)
 * against the env-configured claim lists (ANY-of semantics). An empty list
 * means "no gating" — the pre-existing behavior — so deploying without the
 * env vars changes nothing until the auth team publishes claim names.
 */
@Injectable()
export class ConfigClaimsGuard implements CanActivate {
  constructor(private readonly configClaims: ConfigClaimsService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const required = this.requiredClaimsFor(context, request);

    if (required.length === 0) {
      return true;
    }

    const token = request.user?.token?.tokenString;
    if (!token) {
      // No authenticated user means TazamaAuthGuard already rejected the
      // request; nothing further to check here.
      return true;
    }

    const validated = validateTokenAndClaims(token, required);
    const hasAnyClaim = required.some((claim) => validated[claim]);
    if (!hasAnyClaim) {
      throw new ForbiddenException(
        `Missing required claims: ${required.join(', ')}`,
      );
    }
    return true;
  }

  /**
   * Pick the env claim list for the route. The activate/deactivate/reload
   * endpoints are POSTs but are a distinct permission class, so they are
   * matched by path before falling back to the method-based classes.
   */
  private requiredClaimsFor(
    context: ExecutionContext,
    request: AuthenticatedRequest,
  ): string[] {
    const path = request.path ?? '';
    if (/(activate|deactivate|reload)$/.test(path)) {
      return this.configClaims.activateClaims;
    }
    switch (request.method) {
      case 'GET':
        return this.configClaims.readClaims;
      case 'POST':
      case 'PUT':
      case 'PATCH':
      case 'DELETE':
        return this.configClaims.writeClaims;
      default:
        return [];
    }
  }
}
