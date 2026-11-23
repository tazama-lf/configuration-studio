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
   * Restore fields the caller omitted that a full-replace PUT would wipe.
   *
   * A PUT replaces the whole stored configuration, so any key the caller omits
   * is deleted. The frontend builds its update payload from the form and does
   * not carry creDtTm forward, which used to silently wipe the creation
   * timestamp on every edit. `creDtTm` is merged back from the stored record
   * whenever it is omitted; if that read fails we proceed without it rather
   * than blocking every rule/typology edit (the field is recoverable, not
   * identity-bearing, and admin-service stamps its own timestamps).
   *
   * `name` is different: it is a required identity field on network maps, so
   * a network-map update that omits it cannot proceed if the preservation read
   * fails — a full-replace PUT would erase the stored name. In that case we
   * reject the update with a retryable 503 rather than silently lose data.
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
    const preserveCreDtTm = body.creDtTm === undefined;
    const preserveName = table === 'network_map' && body.name === undefined;
    if (!preserveCreDtTm && !preserveName) {
      return;
    }

    const existing = await this.fetchExistingRecord(table, id, cfg, token, tenantId);
    if (existing === null) {
      // The preservation read failed (transient admin-service error).
      if (preserveName) {
        // Losing a network map's name is unacceptable - reject and retry.
        throw new ServiceUnavailableException(
          'Could not read the stored network map to preserve its name. Please retry.',
        );
      }
      // Otherwise carry on without creDtTm (see docstring).
      return;
    }
    if (!existing) {
      return;
    }
    if (preserveCreDtTm && existing.creDtTm !== undefined) {
      body.creDtTm = existing.creDtTm;
    }
    if (preserveName && existing.name !== undefined) {
      body.name = existing.name;
    }
  }

  /**
   * Read the stored record so update() can preserve fields the caller omitted.
   * A failed read is distinguished from a confirmed-absent record: the
   * returned marker tells update() whether the stored record is known to not
   * exist (safe to proceed without preservation) or whether the read failed
   * (the update must be rejected — proceeding would send a full-replace PUT
   * that wipes the fields this mechanism exists to preserve).
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
      // A 404 from admin-service is a confirmed absent record: the update
      // may proceed without preservation (create-style upsert). Any other
      // deliberate 4xx (400/401/403/...) is the client's real problem and must
      // surface as-is - turning a 403 into a 503 "please retry" would hide
      // the actual cause. Only 5xx / connection failures are transient.
      // AdminServiceClient throws HttpException, so the status comes from
      // getStatus() — the body's statusCode key is not the HTTP status.
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
        `Could not read existing ${table} ${id}/${cfg} to preserve omitted fields: ${(error as Error).message}`,
      );
      // null = the read failed (transient 5xx / network); undefined = confirmed absent.
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
