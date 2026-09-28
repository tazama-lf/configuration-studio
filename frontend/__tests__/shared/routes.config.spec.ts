import { ROUTES } from '@/shared/config/routes.config';

describe('routes.config', () => {
  it('exports expected route paths', () => {
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
    expect(ROUTES.NETWORK_MAP).toBe('/network-map');
    expect(ROUTES.RULE).toBe('/rule');
    expect(ROUTES.TYPOLOGY).toBe('/typology');
  });
});
