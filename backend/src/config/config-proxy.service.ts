import { Injectable, Logger, ServiceUnavailableException, HttpException, HttpStatus } from '@nestjs/common';
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
    const bodyWithTimestamps = this.injectTimestamps(table, body, true);
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
    const bodyWithTimestamps = this.injectTimestamps(table, body, false);
    await this.preserveOmittedFields(table, id, cfg, bodyWithTimestamps, token, tenantId);
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
   *
   * On create we stamp both for every table. On update, `creDtTm` must never be
   * caller-controlled, so it is never stamped here (preserveOmittedFields keeps
   * the stored value). `updDtTm` is only stamped for `rule`: admin-service's own
   * repositories stamp `updDtTm` for network_map and typology, and those stored
   * records never carry it, so adding it here would diverge from the DB shape.
   */
  private injectTimestamps(table: ConfigTable, body: unknown, isCreate: boolean): unknown {
    if (body === null || typeof body !== 'object') {
      return body;
    }
    const record = body as Record<string, unknown>;
    const now = new Date().toISOString();
    if (isCreate) {
      record.creDtTm = now;
      record.updDtTm = now;
    } else if (table === 'rule') {
      record.updDtTm = now;
    }
    return record;
  }

  /**
   * Restore or enforce fields a full-replace PUT would otherwise wipe or let
   * the caller forge.
   *
   * A PUT replaces the whole stored configuration, so any key the caller omits
   * is deleted. The frontend builds its update payload from the form and does
   * not carry creDtTm forward, which used to silently wipe the creation
   * timestamp on every edit. `creDtTm` is merged back from the stored record
   * whenever it is omitted.
   *
   * If the preservation read fails (transient admin-service error) we cannot
   * safely send the PUT — it would drop creDtTm (the very #29 data loss) — so
   * the update is rejected with a retryable 503. A 404 is a confirmed-absent
   * record (create-style upsert) and proceeds normally.
   */
  private async preserveOmittedFields(
    table: ConfigTable,
    id: string,
    cfg: string,
    body: unknown,
    token: string,
    tenantId?: string,
  ): Promise<void> {
    if (!this.isPlainRecord(body)) {
      return;
    }

    // creDtTm is audit data: it is always taken from the stored record and
    // never from the caller. We therefore read the stored record even when the
    // caller supplied a value — a supplied value is overwritten (store has one)
    // or dropped (store has none) below, so it can never be forged.
    const existing = await this.fetchExistingRecord(table, id, cfg, token, tenantId);
    if (existing === null) {
      throw new ServiceUnavailableException(
        'Could not read the stored record to preserve its creation timestamp. Please retry.',
      );
    }
    if (existing && existing.creDtTm !== undefined) {
      body.creDtTm = existing.creDtTm;
    } else if (body.creDtTm !== undefined) {
      // The store has no creation timestamp to enforce — a caller-supplied
      // value would be a forgery, so drop it.
      delete body.creDtTm;
    }
  }

  /**
   * Read the stored record so update() can preserve creDtTm. Returns:
   *   - the record object when found
   *   - undefined when the record is confirmed absent (a 404 → upsert path)
   *   - null when the read failed transiently (caller must not proceed)
   */
  private async fetchExistingRecord(
    table: ConfigTable,
    id: string,
    cfg: string,
    token: string,
    tenantId?: string,
  ): Promise<Record<string, unknown> | undefined | null> {
    try {
      const existing = await this.getById(table, id, cfg, token, tenantId);
      return this.isPlainRecord(existing) ? existing : undefined;
    } catch (error) {
      // AdminServiceClient throws HttpException. A 404 is a confirmed-absent
      // record (create-style upsert) - proceed without preservation. Any other
      // deliberate 4xx (401 expired session, 403 permission, 400 bad request)
      // is the client's real problem and must surface as-is - masking it as a
      // 503 "please retry" would hide an unrecoverable error. Only 5xx /
      // connection failures are transient and return null (-> 503).
      if (error instanceof HttpException) {
        const status = error.getStatus();
        if (status === HttpStatus.NOT_FOUND) {
          return undefined;
        }
        if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
          throw error;
        }
      }
      this.logger.warn(
        `Could not read existing ${table} ${id}/${cfg} to preserve creDtTm: ${(error as Error).message}`,
      );
      return null;
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
