import { useAuth } from '../auth/contexts/AuthContext';

/**
 * The tenant ID exactly as it appears in the token.
 *
 * The backend uses the token's tenantId unchanged, so the frontend must not
 * transform it either — lowercasing here used to break tenant matching for
 * tenants with capital letters. A token without a tenant is a session
 * problem, not a reason to fall back to a "default" tenant: `missingTenant`
 * lets pages block writes instead of silently targeting the wrong tenant.
 */
export function useTenant(): { tenantId: string | undefined; missingTenant: boolean } {
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  return { tenantId, missingTenant: tenantId === undefined || tenantId === '' };
}
