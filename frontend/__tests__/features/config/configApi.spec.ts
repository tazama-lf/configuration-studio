import { configApi, ConfigApiService } from '@/features/config/services/configApi';

describe('ConfigApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('fetches list with query params', async () => {
      const mockData = { data: [{ id: '1', cfg: '1.0.0' }], meta: { total: 1, limit: 20, offset: 0 } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      }) as unknown as typeof fetch;

      const result = await configApi.list('rule', { limit: 20, offset: 0 });
      expect(result.data).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/config/rule?'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('includes sort and order params', async () => {
      const mockData = { data: [], meta: { total: 0, limit: 20, offset: 0 } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      }) as unknown as typeof fetch;

      await configApi.list('typology', { limit: 20, offset: 0, sort: 'id', order: 'ASC' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('sort=id');
      expect(url).toContain('order=ASC');
    });

    it('includes filter params', async () => {
      const mockData = { data: [], meta: { total: 0, limit: 20, offset: 0 } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      }) as unknown as typeof fetch;

      await configApi.list('network_map', { limit: 'all', offset: 0, filters: { active: 'true' } });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('filters%5Bactive%5D=true');
    });

    it('skips empty filter values', async () => {
      const mockData = { data: [], meta: { total: 0, limit: 20, offset: 0 } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      }) as unknown as typeof fetch;

      await configApi.list('rule', { limit: 20, offset: 0, filters: { active: '' } });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).not.toContain('filters');
    });

    it('throws on 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }) as unknown as typeof fetch;

      await expect(configApi.list('rule', { limit: 20, offset: 0 })).rejects.toThrow(
        'Session expired. Please log in again.',
      );
    });

    it('throws on non-ok with error message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      }) as unknown as typeof fetch;

      await expect(configApi.list('rule', { limit: 20, offset: 0 })).rejects.toThrow('Server error');
    });

    it('throws on non-ok with default message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('parse error'); },
      }) as unknown as typeof fetch;

      await expect(configApi.list('rule', { limit: 20, offset: 0 })).rejects.toThrow(
        'HTTP error! status: 500',
      );
    });
  });

  describe('getById', () => {
    it('fetches by id and cfg for rule', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', cfg: '1.0.0' }),
      }) as unknown as typeof fetch;

      await configApi.getById('rule', 'testid', '1.0.0');
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/rule/testid/1.0.0');
    });

    it('fetches by cfg only for network_map', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ cfg: '1.0.0' }),
      }) as unknown as typeof fetch;

      await configApi.getById('network_map', 'testid', '1.0.0');
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/network-map/1.0.0');
      expect(url).not.toContain('testid');
    });

    it('fetches by id and cfg for typology', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', cfg: '1.0.0' }),
      }) as unknown as typeof fetch;

      await configApi.getById('typology', 'testid', '1.0.0');
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/typology/testid/1.0.0');
    });
  });

  describe('create', () => {
    it('sends POST request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: '1' }),
      }) as unknown as typeof fetch;

      await configApi.create('rule', { id: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/config/rule'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('update', () => {
    it('sends PUT request for rule', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      }) as unknown as typeof fetch;

      await configApi.update('rule', 'testid', '1.0.0', { id: 'test' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/rule/testid/1.0.0');
    });

    it('sends PUT request for network_map', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ cfg: '1.0.0' }),
      }) as unknown as typeof fetch;

      await configApi.update('network_map', 'testid', '1.0.0', { cfg: '1.0.0' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/network-map/1.0.0');
    });

    it('sends PUT request for typology', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      }) as unknown as typeof fetch;

      await configApi.update('typology', 'testid', '1.0.0', { id: 'test' });
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/typology/testid/1.0.0');
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }) as unknown as typeof fetch;

      const result = await configApi.delete('rule', 'testid', '1.0.0');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(result).toEqual({ success: true });
    });

    it('returns undefined when response json fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => { throw new Error('no body'); },
      }) as unknown as typeof fetch;

      const result = await configApi.delete('rule', 'testid', '1.0.0');
      expect(result).toBeUndefined();
    });

    it('throws on 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      }) as unknown as typeof fetch;

      await expect(configApi.delete('rule', 'testid', '1.0.0')).rejects.toThrow(
        'Session expired. Please log in again.',
      );
    });

    it('throws on non-ok with error message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Delete failed' }),
      }) as unknown as typeof fetch;

      await expect(configApi.delete('rule', 'testid', '1.0.0')).rejects.toThrow('Delete failed');
    });

    it('sends DELETE request for network_map', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }) as unknown as typeof fetch;

      await configApi.delete('network_map', 'testid', '1.0.0');
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain('/config/network-map/1.0.0');
      expect(url).not.toContain('testid');
    });

    it('throws on non-ok with default message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('parse error'); },
      }) as unknown as typeof fetch;

      await expect(configApi.delete('rule', 'testid', '1.0.0')).rejects.toThrow(
        'HTTP error! status: 500',
      );
    });
  });

  describe('activateNetworkMap', () => {
    it('sends POST activate request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }) as unknown as typeof fetch;

      await configApi.activateNetworkMap('1.0.0', 'broadcast');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/activate'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('defaults reloadMode to none', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }) as unknown as typeof fetch;

      await configApi.activateNetworkMap('1.0.0');
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reloadMode).toBe('none');
    });
  });

  describe('deactivateNetworkMap', () => {
    it('sends POST deactivate request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }) as unknown as typeof fetch;

      await configApi.deactivateNetworkMap('1.0.0');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/deactivate'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('reloadNetworkMap', () => {
    it('sends POST reload request', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }) as unknown as typeof fetch;

      await configApi.reloadNetworkMap('broadcast');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reload'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('configApi instance', () => {
    it('is an instance of ConfigApiService', () => {
      expect(configApi).toBeInstanceOf(ConfigApiService);
    });
  });

  describe('getAuthHeaders with token', () => {
    it('includes Authorization header when token exists', async () => {
      localStorage.setItem('authToken', 'test-token');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: { total: 0, limit: 20, offset: 0 } }),
      }) as unknown as typeof fetch;

      await configApi.list('rule', { limit: 20, offset: 0 });
      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
    });
  });
});
