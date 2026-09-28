import { ConfigProxyService, type ConfigTable } from './config-proxy.service';
import { AdminServiceClient } from '../services/admin-service-client.service';

describe('ConfigProxyService', () => {
  let service: ConfigProxyService;
  let adminServiceClient: AdminServiceClient;

  const mockAdminServiceClient = {
    executeHttpRequest: jest.fn(),
  };

  beforeEach(() => {
    service = new ConfigProxyService(mockAdminServiceClient as unknown as AdminServiceClient);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call executeHttpRequest with GET and correct path', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('network_map', 'token', { limit: '10', offset: '0' }, 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/network_map?limit=10&offset=0',
        'token',
        'tenant-1',
      );
    });

    it('should pass tenantId to executeHttpRequest', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('rule', 'token', {}, 'tenant-abc');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/rule',
        'token',
        'tenant-abc',
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('rule', 'token', {});

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/rule',
        'token',
        undefined,
      );
    });

    it('should build query string with sort and order', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('rule', 'token', { limit: '20', offset: '0', sort: 'id', order: 'ASC' });

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[0]).toBe('GET');
      expect(call[1]).toContain('limit=20');
      expect(call[1]).toContain('sort=id');
      expect(call[1]).toContain('order=ASC');
    });

    it('should return empty query string when no query params', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('typology', 'token', {});

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/typology',
        'token',
        undefined,
      );
    });

    it('should skip undefined and empty values in query string', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ data: [] });

      await service.list('rule', 'token', { limit: '10', offset: undefined, sort: '', order: 'DESC' });

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[1]).toContain('limit=10');
      expect(call[1]).toContain('order=DESC');
      expect(call[1]).not.toContain('offset');
      expect(call[1]).not.toContain('sort');
    });
  });

  describe('getById', () => {
    it('should call executeHttpRequest with GET and correct path including id and cfg', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ id: 'test' });

      await service.getById('rule', 'rule-1', '1.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/rule/rule-1/1.0.0',
        'token',
        'tenant-1',
      );
    });

    it('should use single-key path for network_map (no id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.getById('network_map', 'ignored-id', '1.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/network_map/1.0.0',
        'token',
        'tenant-1',
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.getById('rule', 'rule-1', '1.0.0', 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/rule/rule-1/1.0.0',
        'token',
        undefined,
      );
    });

    it('should URL-encode special characters in id and cfg', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.getById('typology', 'id with spaces', 'cfg/special', 'token');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[1]).toContain(encodeURIComponent('id with spaces'));
      expect(call[1]).toContain(encodeURIComponent('cfg/special'));
    });
  });

  describe('create', () => {
    it('should call executeHttpRequest with POST and body', async () => {
      const body = { name: 'test', cfg: '1.0.0' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ created: true });

      await service.create('network_map', body, 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map',
        'token',
        'tenant-1',
        body,
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      const body = { name: 'test' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.create('network_map', body, 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map',
        'token',
        undefined,
        body,
      );
    });

    it('should inject timestamps on create and preserve tenantId field', async () => {
      const body: Record<string, unknown> = { name: 'test' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.create('network_map', body, 'token', 'tenant-1');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      const sentBody = call[4] as Record<string, unknown>;
      expect(sentBody).toHaveProperty('creDtTm');
      expect(sentBody).toHaveProperty('updDtTm');
      expect(sentBody).toHaveProperty('tenantId', 'tenant-1');
    });

    it('should return non-object body unchanged on create', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.create('network_map', 'string-body' as unknown as Record<string, unknown>, 'token');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[4]).toBe('string-body');
    });
  });

  describe('update', () => {
    it('should call executeHttpRequest with PUT, path, and body', async () => {
      const body = { name: 'updated' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ updated: true });

      await service.update('rule', 'rule-1', '1.0.0', body, 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'PUT',
        '/v1/admin/configuration/rule/rule-1/1.0.0',
        'token',
        'tenant-1',
        body,
      );
    });

    it('should use single-key path for network_map update (no id segment)', async () => {
      const body = { name: 'updated-nm' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('network_map', 'ignored-id', '2.0.0', body, 'token', 'tenant-1');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[0]).toBe('PUT');
      expect(call[1]).toBe('/v1/admin/configuration/network_map/2.0.0');
      expect(call[2]).toBe('token');
      expect(call[3]).toBe('tenant-1');
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('rule', 'rule-1', '1.0.0', {}, 'token');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[0]).toBe('PUT');
      expect(call[1]).toBe('/v1/admin/configuration/rule/rule-1/1.0.0');
      expect(call[2]).toBe('token');
      expect(call[3]).toBeUndefined();
      expect(call[4]).toHaveProperty('updDtTm');
      expect(call[4]).toHaveProperty('tenantId', undefined);
    });

    it('should URL-encode id and cfg in update path', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('typology', 'id#1', 'cfg@2', {}, 'token');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[1]).toContain(encodeURIComponent('id#1'));
      expect(call[1]).toContain(encodeURIComponent('cfg@2'));
    });

    it('should inject updDtTm on update and not overwrite creDtTm if present', async () => {
      const body: Record<string, unknown> = { name: 'original', creDtTm: '2020-01-01T00:00:00.000Z' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('rule', 'rule-1', '1.0.0', body, 'token', 'tenant-1');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      const sentBody = call[4] as Record<string, unknown>;
      expect(sentBody).toHaveProperty('updDtTm');
      expect(sentBody.creDtTm).toBe('2020-01-01T00:00:00.000Z');
      expect(sentBody).toHaveProperty('tenantId', 'tenant-1');
    });

    it('should return non-object bodies unchanged for injectTimestamps', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('rule', 'rule-1', '1.0.0', 'a-string-body' as unknown as Record<string, unknown>, 'token');

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[4]).toBe('a-string-body');
    });

    it('should inject timestamps on update when creDtTm missing', async () => {
      const body: Record<string, unknown> = { name: 'updated' };
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('rule', 'rule-1', '1.0.0', body, 'token');

      const sent = mockAdminServiceClient.executeHttpRequest.mock.calls[0][4] as Record<string, unknown>;
      expect(sent).toHaveProperty('updDtTm');
      expect(sent).not.toHaveProperty('creDtTm');
    });

    it('should use single-key path for network_map update (no id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.update('network_map', 'ignored-id', '2.0.0', { name: 'nm' }, 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'PUT',
        '/v1/admin/configuration/network_map/2.0.0',
        'token',
        'tenant-1',
        expect.objectContaining({ name: 'nm' }),
      );
    });
  });

  describe('delete', () => {
    it('should call executeHttpRequest with DELETE and correct path', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('network_map', 'map-1', '2.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/network_map/2.0.0',
        'token',
        'tenant-1',
      );
    });

    it('should use composite-key path for rule delete (with id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('rule', 'rule-1', '1.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/rule/rule-1/1.0.0',
        'token',
        'tenant-1',
      );
    });

    it('should use composite-key path for typology delete (with id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('typology', 'typ-1', '1.0.0', 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/typology/typ-1/1.0.0',
        'token',
        undefined,
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('network_map', 'map-1', '2.0.0', 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/network_map/2.0.0',
        'token',
        undefined,
      );
    });

    it('should use composite-key path for rule delete (with id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('rule', 'rule-1', '1.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/rule/rule-1/1.0.0',
        'token',
        'tenant-1',
      );
    });

    it('should use composite-key path for typology delete (with id segment)', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.delete('typology', 'typ-1', '1.0.0', 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'DELETE',
        '/v1/admin/configuration/typology/typ-1/1.0.0',
        'token',
        undefined,
      );
    });
  });

  describe('buildQueryString (private, tested via list)', () => {
    it('should handle filters as JSON string', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.list('rule', 'token', {
        limit: '10',
        offset: '0',
        filters: '{"active":true}',
      });

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[1]).toContain('filters=');
    });

    it('should handle all query params together', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.list('network_map', 'token', {
        limit: '50',
        offset: '100',
        sort: 'name',
        order: 'DESC',
        filters: '{"active":true}',
      });

      const call = mockAdminServiceClient.executeHttpRequest.mock.calls[0];
      expect(call[1]).toContain('limit=50');
      expect(call[1]).toContain('offset=100');
      expect(call[1]).toContain('sort=name');
      expect(call[1]).toContain('order=DESC');
      expect(call[1]).toContain('filters=');
    });

    it('should handle undefined values in query', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.list('typology', 'token', {
        limit: undefined,
        offset: undefined,
        sort: undefined,
        order: undefined,
        filters: undefined,
      });

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/v1/admin/configuration/typology',
        'token',
        undefined,
      );
    });
  });

  describe('all table types', () => {
    it('should work with network_map table', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});
      await service.list('network_map', 'token', {});
      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalled();
    });

    it('should work with rule table', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});
      await service.list('rule', 'token', {});
      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalled();
    });

    it('should work with typology table', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});
      await service.list('typology', 'token', {});
      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should call executeHttpRequest with POST and correct activate path', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ activated: true });

      await service.activate('1.0.0', { reloadMode: 'broadcast' }, 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/1.0.0/activate',
        'token',
        'tenant-1',
        { reloadMode: 'broadcast' },
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.activate('1.0.0', {}, 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/1.0.0/activate',
        'token',
        undefined,
        {},
      );
    });
  });

  describe('deactivate', () => {
    it('should call executeHttpRequest with POST, correct deactivate path and empty body', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ deactivated: true });

      await service.deactivate('1.0.0', 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/1.0.0/deactivate',
        'token',
        'tenant-1',
        {},
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.deactivate('1.0.0', 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/1.0.0/deactivate',
        'token',
        undefined,
        {},
      );
    });
  });

  describe('reload', () => {
    it('should call executeHttpRequest with POST and correct reload path', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({ reloaded: true });

      await service.reload({ reloadMode: 'cascade' }, 'token', 'tenant-1');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/reload',
        'token',
        'tenant-1',
        { reloadMode: 'cascade' },
      );
    });

    it('should pass undefined tenantId when not provided', async () => {
      mockAdminServiceClient.executeHttpRequest.mockResolvedValue({});

      await service.reload({ reloadMode: 'broadcast' }, 'token');

      expect(mockAdminServiceClient.executeHttpRequest).toHaveBeenCalledWith(
        'POST',
        '/v1/admin/configuration/network_map/reload',
        'token',
        undefined,
        { reloadMode: 'broadcast' },
      );
    });
  });
});
