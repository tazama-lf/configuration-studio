import { Test, type TestingModule } from '@nestjs/testing';
import {
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigController } from './config.controller';
import { ConfigProxyService } from './config-proxy.service';
import { TazamaAuthGuard } from '../auth/tazama-auth.guard';

describe('ConfigController', () => {
  let controller: ConfigController;
  let configProxyService: ConfigProxyService;

  const mockConfigProxyService = {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    reload: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockUser = {
    token: { tokenString: 'test-token' },
    tenantId: 'tenant-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        { provide: ConfigProxyService, useValue: mockConfigProxyService },
        { provide: TazamaAuthGuard, useValue: mockAuthGuard },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    configProxyService = module.get<ConfigProxyService>(ConfigProxyService);

    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call configProxyService.list with resolved table and token', async () => {
      mockConfigProxyService.list.mockResolvedValue({ data: [], meta: { total: 0 } });

      await controller.list('network-map', { limit: '10', offset: '0' }, mockUser as any);

      expect(configProxyService.list).toHaveBeenCalledWith(
        'network_map',
        'test-token',
        { limit: '10', offset: '0' },
        'tenant-1',
      );
    });

    it('should resolve "rule" table correctly', async () => {
      mockConfigProxyService.list.mockResolvedValue({ data: [] });

      await controller.list('rule', {}, mockUser as any);

      expect(configProxyService.list).toHaveBeenCalledWith(
        'rule',
        'test-token',
        {},
        'tenant-1',
      );
    });

    it('should resolve "typology" table correctly', async () => {
      mockConfigProxyService.list.mockResolvedValue({ data: [] });

      await controller.list('typology', {}, mockUser as any);

      expect(configProxyService.list).toHaveBeenCalledWith(
        'typology',
        'test-token',
        {},
        'tenant-1',
      );
    });

    it('should resolve "network_map" (underscore) table correctly', async () => {
      mockConfigProxyService.list.mockResolvedValue({ data: [] });

      await controller.list('network_map', {}, mockUser as any);

      expect(configProxyService.list).toHaveBeenCalledWith(
        'network_map',
        'test-token',
        {},
        'tenant-1',
      );
    });

    it('should throw Error for invalid table', async () => {
      await expect(
        controller.list('invalid-table', {}, mockUser as any),
      ).rejects.toThrow('Invalid table: invalid-table');
    });
  });

  describe('getById', () => {
    it('should call configProxyService.getById with resolved table, id, cfg, and token', async () => {
      mockConfigProxyService.getById.mockResolvedValue({ id: 'test' });

      await controller.getById('rule', 'rule-1', '1.0.0', mockUser as any);

      expect(configProxyService.getById).toHaveBeenCalledWith(
        'rule',
        'rule-1',
        '1.0.0',
        'test-token',
        'tenant-1',
      );
    });

    it('should throw Error for invalid table', async () => {
      await expect(
        controller.getById('invalid', 'id', 'cfg', mockUser as any),
      ).rejects.toThrow('Invalid table: invalid');
    });
  });

  describe('create', () => {
    it('should call configProxyService.create with resolved table, body, and token', async () => {
      const body = { name: 'new-record' };
      mockConfigProxyService.create.mockResolvedValue({ created: true });

      await controller.create('typology', body, mockUser as any);

      expect(configProxyService.create).toHaveBeenCalledWith(
        'typology',
        body,
        'test-token',
        'tenant-1',
      );
    });

    it('should throw Error for invalid table', async () => {
      await expect(
        controller.create('invalid', {}, mockUser as any),
      ).rejects.toThrow('Invalid table: invalid');
    });
  });

  describe('update', () => {
    it('should call configProxyService.update with resolved table, id, cfg, body, and token', async () => {
      const body = { name: 'updated' };
      mockConfigProxyService.update.mockResolvedValue({ updated: true });

      await controller.update('network-map', 'map-1', '1.0.0', body, mockUser as any);

      expect(configProxyService.update).toHaveBeenCalledWith(
        'network_map',
        'map-1',
        '1.0.0',
        body,
        'test-token',
        'tenant-1',
      );
    });

    it('should throw Error for invalid table', async () => {
      await expect(
        controller.update('invalid', 'id', 'cfg', {}, mockUser as any),
      ).rejects.toThrow('Invalid table: invalid');
    });
  });

  describe('delete', () => {
    it('should call configProxyService.delete with resolved table, id, cfg, and token', async () => {
      mockConfigProxyService.delete.mockResolvedValue({});

      await controller.delete('rule', 'rule-1', '1.0.0', mockUser as any);

      expect(configProxyService.delete).toHaveBeenCalledWith(
        'rule',
        'rule-1',
        '1.0.0',
        'test-token',
        'tenant-1',
      );
    });

    it('should throw Error for invalid table', async () => {
      await expect(
        controller.delete('invalid', 'id', 'cfg', mockUser as any),
      ).rejects.toThrow('Invalid table: invalid');
    });
  });

  describe('deleteNetworkMap', () => {
    it('should call configProxyService.delete with network_map, empty id, cfg, and token', async () => {
      mockConfigProxyService.delete.mockResolvedValue({});

      await controller.deleteNetworkMap('1.0.0', mockUser as any);

      expect(configProxyService.delete).toHaveBeenCalledWith(
        'network_map',
        '',
        '1.0.0',
        'test-token',
        'tenant-1',
      );
    });
  });

  describe('activate', () => {
    it('should call configProxyService.activate with cfg, body, and token', async () => {
      const body = { reloadMode: 'broadcast' };
      mockConfigProxyService.activate.mockResolvedValue({ activated: true });

      await controller.activate('1.0.0', body, mockUser as any);

      expect(configProxyService.activate).toHaveBeenCalledWith(
        '1.0.0',
        body,
        'test-token',
        'tenant-1',
      );
    });
  });

  describe('deactivate', () => {
    it('should call configProxyService.deactivate with cfg and token', async () => {
      mockConfigProxyService.deactivate.mockResolvedValue({ deactivated: true });

      await controller.deactivate('1.0.0', mockUser as any);

      expect(configProxyService.deactivate).toHaveBeenCalledWith(
        '1.0.0',
        'test-token',
        'tenant-1',
      );
    });
  });

  describe('reload', () => {
    it('should call configProxyService.reload with body and token', async () => {
      const body = { reloadMode: 'cascade' };
      mockConfigProxyService.reload.mockResolvedValue({ reloaded: true });

      await controller.reload(body, mockUser as any);

      expect(configProxyService.reload).toHaveBeenCalledWith(
        body,
        'test-token',
        'tenant-1',
      );
    });
  });

  describe('resolveTable - all valid table aliases', () => {
    it('should resolve "network-map" to "network_map" for list', async () => {
      mockConfigProxyService.list.mockResolvedValue({ data: [] });
      await controller.list('network-map', {}, mockUser as any);
      expect(configProxyService.list).toHaveBeenCalledWith('network_map', 'test-token', {}, 'tenant-1');
    });

    it('should resolve "network_map" to "network_map" for getById', async () => {
      mockConfigProxyService.getById.mockResolvedValue({});
      await controller.getById('network_map', 'id', 'cfg', mockUser as any);
      expect(configProxyService.getById).toHaveBeenCalledWith('network_map', 'id', 'cfg', 'test-token', 'tenant-1');
    });

    it('should resolve "rule" for create', async () => {
      mockConfigProxyService.create.mockResolvedValue({});
      await controller.create('rule', {}, mockUser as any);
      expect(configProxyService.create).toHaveBeenCalledWith('rule', {}, 'test-token', 'tenant-1');
    });

    it('should resolve "typology" for update', async () => {
      mockConfigProxyService.update.mockResolvedValue({});
      await controller.update('typology', 'id', 'cfg', {}, mockUser as any);
      expect(configProxyService.update).toHaveBeenCalledWith('typology', 'id', 'cfg', {}, 'test-token', 'tenant-1');
    });

    it('should resolve "network-map" for delete', async () => {
      mockConfigProxyService.delete.mockResolvedValue({});
      await controller.delete('network-map', 'id', 'cfg', mockUser as any);
      expect(configProxyService.delete).toHaveBeenCalledWith('network_map', 'id', 'cfg', 'test-token', 'tenant-1');
    });

    it('should call updateNetworkMap and pass empty id to proxy update', async () => {
      const body = { name: 'nm' };
      mockConfigProxyService.update.mockResolvedValue({});

      await controller.updateNetworkMap('1.2.3', body, mockUser as any);

      expect(configProxyService.update).toHaveBeenCalledWith(
        'network_map',
        '',
        '1.2.3',
        body,
        'test-token',
        'tenant-1',
      );
    });

  describe('edge cases and error propagation', () => {
    it('should handle undefined tenantId and empty token gracefully', async () => {
      const anonUser = { token: { tokenString: '' }, tenantId: undefined } as any;
      mockConfigProxyService.list.mockResolvedValue({ data: [] });

      await controller.list('rule', {}, anonUser);
      expect(configProxyService.list).toHaveBeenCalledWith('rule', '', {}, undefined);
    });

    it('should pass null body through create and reload when provided', async () => {
      mockConfigProxyService.create.mockResolvedValue({});
      mockConfigProxyService.reload.mockResolvedValue({});

      await controller.create('typology', null as unknown as Record<string, unknown>, mockUser as any);
      expect(configProxyService.create).toHaveBeenCalledWith('typology', null, 'test-token', 'tenant-1');

      await controller.reload(null as unknown as Record<string, unknown>, mockUser as any);
      expect(configProxyService.reload).toHaveBeenCalledWith(null, 'test-token', 'tenant-1');
    });

    it('should propagate errors from proxy service calls', async () => {
      mockConfigProxyService.getById.mockRejectedValue(new Error('proxy failure'));

      await expect(controller.getById('rule', 'id', 'cfg', mockUser as any)).rejects.toThrow('proxy failure');
    });
  });
  });
});
