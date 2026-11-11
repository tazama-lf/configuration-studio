import { Injectable, Logger } from '@nestjs/common';
import { AdminServiceClient } from '../services/admin-service-client.service';

export type ConfigTable = 'network_map' | 'rule' | 'typology';

@Injectable()
export class ConfigProxyService {
  private readonly logger = new Logger(ConfigProxyService.name);

  constructor(private readonly adminServiceClient: AdminServiceClient) { }

  /**
   * List records from a config table (paginated)
   * GET /v1/admin/configuration/{table}?limit=&offset=&sort=&order=&filters=
   */
  async list(
    table: ConfigTable,
    token: string,
    query: Record<string, string | undefined>,
    tenantId?: string,
  ): Promise<unknown> {
    const queryString = this.buildQueryString(query);
    const path = `/v1/admin/configuration/${table}${queryString}`;
    this.logger.log(`Listing ${table}: ${path}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('GET', path, token, tenantId);
  }

  /**
   * Get a single record by id and cfg (or just cfg for single-key tables like network_map)
   * GET /v1/admin/configuration/{table}/{id}/{cfg}  (rule, typology)
   * GET /v1/admin/configuration/{table}/{cfg}        (network_map)
   */
  async getById(
    table: ConfigTable,
    id: string,
    cfg: string,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = this.isSingleKeyTable(table)
      ? `/v1/admin/configuration/${table}/${encodeURIComponent(cfg)}`
      : `/v1/admin/configuration/${table}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    this.logger.log(`Getting ${table} ${id}/${cfg}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('GET', path, token, tenantId);
  }

  /**
   * Create a new record
   * POST /v1/admin/configuration/{table}
   */
  async create(
    table: ConfigTable,
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = `/v1/admin/configuration/${table}`;
    this.logger.log(`Creating ${table}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    // Inject tenantId into the body so the generated column in the DB has a value
    if (body !== null && typeof body === 'object') {
      (body as Record<string, unknown>).tenantId = tenantId;
    }
    const bodyWithTimestamps = this.injectTimestamps(body, true);
    return await this.adminServiceClient.executeHttpRequest('POST', path, token, tenantId, bodyWithTimestamps);
  }

  /**
   * Update a record by id and cfg (or just cfg for single-key tables like network_map)
   * PUT /v1/admin/configuration/{table}/{id}/{cfg}  (rule, typology)
   * PUT /v1/admin/configuration/{table}/{cfg}        (network_map)
   */
  async update(
    table: ConfigTable,
    id: string,
    cfg: string,
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = this.isSingleKeyTable(table)
      ? `/v1/admin/configuration/${table}/${encodeURIComponent(cfg)}`
      : `/v1/admin/configuration/${table}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    this.logger.log(`Updating ${table} ${id}/${cfg}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    // Inject tenantId into the body so the generated column in the DB has a value
    if (body !== null && typeof body === 'object') {
      (body as Record<string, unknown>).tenantId = tenantId;
    }
    const bodyWithTimestamps = this.injectTimestamps(body, false);
    await this.preserveCreationTimestamp(table, id, cfg, bodyWithTimestamps, token, tenantId);
    return await this.adminServiceClient.executeHttpRequest('PUT', path, token, tenantId, bodyWithTimestamps);
  }

  /**
   * Delete a record by id and cfg (or just cfg for single-key tables like network_map)
   * DELETE /v1/admin/configuration/{table}/{id}/{cfg}  (rule, typology)
   * DELETE /v1/admin/configuration/{table}/{cfg}        (network_map)
   */
  async delete(
    table: ConfigTable,
    id: string,
    cfg: string,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = this.isSingleKeyTable(table)
      ? `/v1/admin/configuration/${table}/${encodeURIComponent(cfg)}`
      : `/v1/admin/configuration/${table}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    this.logger.log(`Deleting ${table} ${id}/${cfg}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('DELETE', path, token, tenantId);
  }

  /**
   * Activate a network map by cfg
   * POST /v1/admin/configuration/network_map/{cfg}/activate
   */
  async activate(
    cfg: string,
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = `/v1/admin/configuration/network_map/${encodeURIComponent(cfg)}/activate`;
    this.logger.log(`Activating network_map ${cfg}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('POST', path, token, tenantId, body);
  }

  /**
   * Deactivate a network map by cfg
   * POST /v1/admin/configuration/network_map/{cfg}/deactivate
   *
   * An explicit empty body must be forwarded (matching activate/reload),
   * otherwise no Content-Type header is sent and the admin-service rejects
   * the request with 415 Unsupported Media Type.
   */
  async deactivate(
    cfg: string,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = `/v1/admin/configuration/network_map/${encodeURIComponent(cfg)}/deactivate`;
    this.logger.log(`Deactivating network_map ${cfg}${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('POST', path, token, tenantId, {});
  }

  /**
   * Reload the active network map
   * POST /v1/admin/configuration/network_map/reload
   */
  async reload(
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<unknown> {
    const path = `/v1/admin/configuration/network_map/reload`;
    this.logger.log(`Reloading network_map${tenantId ? ` [tenant: ${tenantId}]` : ''}`);
    return await this.adminServiceClient.executeHttpRequest('POST', path, token, tenantId, body);
  }

  /**
   * Inject creDtTm and updDtTm timestamps into the request body.
   * On create: both creDtTm and updDtTm are set to the current time.
   * On update: only updDtTm is refreshed; creDtTm is preserved by
   * preserveCreationTimestamp().
   */
  private injectTimestamps(body: unknown, isCreate: boolean): unknown {
    if (body === null || typeof body !== 'object') {
      return body;
    }
    const record = body as Record<string, unknown>;
    const now = new Date().toISOString();
    if (isCreate) {
      record.creDtTm = now;
      record.updDtTm = now;
    } else {
      record.updDtTm = now;
    }
    return record;
  }

  /**
   * Restore creDtTm on update.
   *
   * A PUT replaces the whole stored configuration, so any key the caller omits
   * is deleted. The frontend builds its update payload from the form and does
   * not carry creDtTm forward, which used to silently wipe the creation
   * timestamp on every edit. When the caller did not supply one, read the
   * stored record and merge its creDtTm back in.
   */
  private async preserveCreationTimestamp(
    table: ConfigTable,
    id: string,
    cfg: string,
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<void> {
    if (!this.isPlainRecord(body) || body.creDtTm !== undefined) {
      return;
    }

    const existing = await this.fetchExistingRecord(table, id, cfg, token, tenantId);
    if (existing?.creDtTm !== undefined) {
      body.creDtTm = existing.creDtTm;
    }
  }

  /**
   * Read the stored record so update() can preserve fields the caller omitted.
   * Failures are non-fatal: the record may not exist yet, or admin-service may
   * be unreachable, and the update itself is what reports those outcomes.
   */
  private async fetchExistingRecord(
    table: ConfigTable,
    id: string,
    cfg: string,
    token: string,
    tenantId?: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const existing = await this.getById(table, id, cfg, token, tenantId);
      return this.isPlainRecord(existing) ? existing : undefined;
    } catch (error) {
      this.logger.warn(
        `Could not read existing ${table} ${id}/${cfg} to preserve creDtTm: ${(error as Error).message}`,
      );
      return undefined;
    }
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
  }

  /**
   * Determine if a table uses a single-key (cfg only) path.
   * network_map PK is (cfg, tenantId) — no id column.
   * rule and typology PK is (id, cfg, tenantId) — composite key.
   */
  private isSingleKeyTable(table: ConfigTable): boolean {
    return table === 'network_map';
  }

  private buildQueryString(query: Record<string, string | undefined>): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        params.append(key, value);
      }
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }
}
