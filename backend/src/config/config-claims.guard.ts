import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
import { ConfigClaimsService } from './config-claims.service';
import type { AuthenticatedRequest } from '../auth/auth.types';

/** Trailing path segments that map to the activate permission class. */
const ACTIVATE_ACTIONS = new Set(['activate', 'deactivate', 'reload']);

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
   * matched by their trailing path segment before falling back to the
   * method-based classes. Trailing slashes (`.../activate/`) and query
   * strings are tolerated so a sloppy client cannot fall through to the
   * weaker write-claim class and skip the activate permission.
   */
  private requiredClaimsFor(
    context: ExecutionContext,
    request: AuthenticatedRequest,
  ): string[] {
    const lastSegment = (request.path ?? '')
      .split('?')[0]
      .replace(/\/+$/, '')
      .split('/')
      .pop();
    if (
      request.method === 'POST' &&
      lastSegment !== undefined &&
      ACTIVATE_ACTIONS.has(lastSegment)
    ) {
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
