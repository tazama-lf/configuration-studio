import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ConfigProxyService, type ConfigTable } from './config-proxy.service';
import { validateConfigPayload } from './dto/config-payload.validator';
import { TazamaAuthGuard } from '../auth/tazama-auth.guard';
import { User } from '../auth/user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

const TABLES: Partial<Record<string, ConfigTable>> = {
  'network-map': 'network_map',
  'network_map': 'network_map',
  rule: 'rule',
  typology: 'typology',
};

@Controller('config')
@UseGuards(TazamaAuthGuard)
export class ConfigController {
  constructor(private readonly configProxyService: ConfigProxyService) { }

  /**
   * List records for a table (paginated)
   * GET /config/:table?limit=&offset=&sort=&order=&filters=
   */
  @Get(':table')
  async list(
    @Param('table') tableParam: string,
    @Query() query: Record<string, string>,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable(tableParam);
    return await this.configProxyService.list(
      table,
      user.token.tokenString,
      query,
      user.tenantId,
    );
  }

  /**
   * Get a single record by id and cfg
   * GET /config/:table/:id/:cfg
   */
  @Get(':table/:id/:cfg')
  async getById(
    @Param('table') tableParam: string,
    @Param('id') id: string,
    @Param('cfg') cfg: string,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable(tableParam);
    return await this.configProxyService.getById(table, id, cfg, user.token.tokenString, user.tenantId);
  }

  /**
   * Create a new record
   * POST /config/:table
   */
  @Post(':table')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('table') tableParam: string,
    @Body() body: unknown,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable(tableParam);
    validateConfigPayload(table, body);
    return await this.configProxyService.create(table, body, user.token.tokenString, user.tenantId);
  }

  /**
   * Update a record by id and cfg
   * PUT /config/:table/:id/:cfg
   */
  @Put(':table/:id/:cfg')
  async update(
    @Param('table') tableParam: string,
    @Param('id') id: string,
    @Param('cfg') cfg: string,
    @Body() body: unknown,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable(tableParam);
    validateConfigPayload(table, body);
    return await this.configProxyService.update(
      table,
      id,
      cfg,
      body,
      user.token.tokenString,
      user.tenantId,
    );
  }

  /**
   * Update a network map by cfg (single-key table)
   * PUT /config/network-map/:cfg
   */
  @Put('network-map/:cfg')
  async updateNetworkMap(
    @Param('cfg') cfg: string,
    @Body() body: unknown,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable('network-map');
    validateConfigPayload(table, body);
    // For single-key tables the id path segment is not used by the proxy service.
    return await this.configProxyService.update(
      table,
      '',
      cfg,
      body,
      user.token.tokenString,
      user.tenantId,
    );
  }

  /**
   * Delete a record by id and cfg
   * DELETE /config/:table/:id/:cfg
   */
  @Delete(':table/:id/:cfg')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('table') tableParam: string,
    @Param('id') id: string,
    @Param('cfg') cfg: string,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable(tableParam);
    return await this.configProxyService.delete(table, id, cfg, user.token.tokenString, user.tenantId);
  }

  /**
   * Delete a network map by cfg (single-key table)
   * DELETE /config/network-map/:cfg
   */
  @Delete('network-map/:cfg')
  @HttpCode(HttpStatus.OK)
  async deleteNetworkMap(
    @Param('cfg') cfg: string,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    const table = this.resolveTable('network-map');
    // For single-key tables the id path segment is not used by the proxy service.
    return await this.configProxyService.delete(table, '', cfg, user.token.tokenString, user.tenantId);
  }

  /**
   * Activate a network map by cfg
   * POST /config/network-map/:cfg/activate
   */
  @Post('network-map/:cfg/activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('cfg') cfg: string,
    @Body() body: unknown,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    return await this.configProxyService.activate(cfg, body, user.token.tokenString, user.tenantId);
  }

  /**
   * Deactivate a network map by cfg
   * POST /config/network-map/:cfg/deactivate
   */
  @Post('network-map/:cfg/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('cfg') cfg: string,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    return await this.configProxyService.deactivate(cfg, user.token.tokenString, user.tenantId);
  }

  /**
   * Reload the active network map
   * POST /config/network-map/reload
   */
  @Post('network-map/reload')
  @HttpCode(HttpStatus.OK)
  async reload(
    @Body() body: unknown,
    @User() user: AuthenticatedUser,
  ): Promise<unknown> {
    return await this.configProxyService.reload(body, user.token.tokenString, user.tenantId);
  }

  private resolveTable(tableParam: string): ConfigTable {
    const table = TABLES[tableParam];
    if (table === undefined) {
      throw new BadRequestException(`Invalid table: ${tableParam}`);
    }
    return table;
  }
}
