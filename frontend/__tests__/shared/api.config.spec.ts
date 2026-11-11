import { API_CONFIG } from '@/shared/config/api.config';

describe('api.config', () => {
  it('exports API_BASE_URL', () => {
    expect(API_CONFIG.API_BASE_URL).toBeDefined();
  });
  it('exports AUTH_BASE_URL', () => {
    expect(API_CONFIG.AUTH_BASE_URL).toBeDefined();
  });
  it('exports TIMEOUT', () => {
    expect(API_CONFIG.TIMEOUT).toBe(30000);
  });
  it('exports DEFAULT_HEADERS', () => {
    expect(API_CONFIG.DEFAULT_HEADERS['Content-Type']).toBe('application/json');
    expect(API_CONFIG.DEFAULT_HEADERS.Accept).toBe('application/json');
  });
  it('exports ENDPOINTS.AUTH', () => {
    expect(API_CONFIG.ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(API_CONFIG.ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
    expect(API_CONFIG.ENDPOINTS.AUTH.PROFILE).toBe('/auth/profile');
  });
  it('exports ENDPOINTS.CONFIG', () => {
    expect(API_CONFIG.ENDPOINTS.CONFIG.NETWORK_MAP).toBe('/config/network-map');
    expect(API_CONFIG.ENDPOINTS.CONFIG.RULE).toBe('/config/rule');
    expect(API_CONFIG.ENDPOINTS.CONFIG.TYPOLOGY).toBe('/config/typology');
  });
});
