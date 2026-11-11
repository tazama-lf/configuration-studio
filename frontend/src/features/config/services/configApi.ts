import { API_CONFIG } from '../../../shared/config/api.config';

export type ConfigTable = 'network_map' | 'rule' | 'typology';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PaginationParams {
  limit: number | 'all';
  offset: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  filters?: Record<string, string>;
}

const HTTP_UNAUTHORIZED = 401;

export class ConfigApiService {
  private readonly baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.API_BASE_URL;
  }

  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === HTTP_UNAUTHORIZED) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        errorData.message ?? `HTTP error! status: ${response.status}`,
      );
    }
    return (await response.json()) as T;
  }

  private static buildQuery(params: PaginationParams): string {
    const search = new URLSearchParams();
    search.set('limit', String(params.limit));
    search.set('offset', String(params.offset));
    if (params.sort) search.set('sort', params.sort);
    if (params.order) search.set('order', params.order);
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== '') {
          search.set(`filters[${key}]`, value);
        }
      }
    }
    return `?${search.toString()}`;
  }

  private static getTablePath(table: ConfigTable): string {
    switch (table) {
      case 'network_map':
        return API_CONFIG.ENDPOINTS.CONFIG.NETWORK_MAP;
      case 'rule':
        return API_CONFIG.ENDPOINTS.CONFIG.RULE;
      case 'typology':
        return API_CONFIG.ENDPOINTS.CONFIG.TYPOLOGY;
    }
  }

  async list<T>(
    table: ConfigTable,
    params: PaginationParams,
  ): Promise<PaginatedResponse<T>> {
    const path = `${ConfigApiService.getTablePath(table)}${ConfigApiService.buildQuery(params)}`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'GET',
      headers: ConfigApiService.getAuthHeaders(),
    });
    return await ConfigApiService.handleResponse<PaginatedResponse<T>>(response);
  }

  async getById<T>(
    table: ConfigTable,
    id: string,
    cfg: string,
  ): Promise<T> {
    const path = table === 'network_map'
      ? `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(cfg)}`
      : `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'GET',
      headers: ConfigApiService.getAuthHeaders(),
    });
    return await ConfigApiService.handleResponse<T>(response);
  }

  async create<T>(table: ConfigTable, body: unknown): Promise<T | T[]> {
    const path = ConfigApiService.getTablePath(table);
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: ConfigApiService.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return await ConfigApiService.handleResponse<T | T[]>(response);
  }

  async update<T>(
    table: ConfigTable,
    id: string,
    cfg: string,
    body: unknown,
  ): Promise<T> {
    const path = table === 'network_map'
      ? `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(cfg)}`
      : `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: ConfigApiService.getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return await ConfigApiService.handleResponse<T>(response);
  }

  async delete(
    table: ConfigTable,
    id: string,
    cfg: string,
  ): Promise<{ success: boolean } | void> {
    const path = table === 'network_map'
      ? `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(cfg)}`
      : `${ConfigApiService.getTablePath(table)}/${encodeURIComponent(id)}/${encodeURIComponent(cfg)}`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: ConfigApiService.getAuthHeaders(),
    });
    if (response.status === HTTP_UNAUTHORIZED) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        errorData.message ?? `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json().catch(() => undefined);
  }

  /**
   * Activate a network map by cfg
   * POST /config/network-map/:cfg/activate
   */
  async activateNetworkMap(
    cfg: string,
    reloadMode?: 'none' | 'broadcast' | 'cascade',
  ): Promise<unknown> {
    const path = `${API_CONFIG.ENDPOINTS.CONFIG.NETWORK_MAP}/${encodeURIComponent(cfg)}/activate`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: ConfigApiService.getAuthHeaders(),
      body: JSON.stringify({ reloadMode: reloadMode ?? 'none' }),
    });
    return await ConfigApiService.handleResponse(response);
  }

  /**
   * Deactivate a network map by cfg
   * POST /config/network-map/:cfg/deactivate
   */
  async deactivateNetworkMap(cfg: string): Promise<unknown> {
    const path = `${API_CONFIG.ENDPOINTS.CONFIG.NETWORK_MAP}/${encodeURIComponent(cfg)}/deactivate`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: ConfigApiService.getAuthHeaders(),
      body: JSON.stringify({}),
    });
    return await ConfigApiService.handleResponse(response);
  }

  /**
   * Reload the active network map
   * POST /config/network-map/reload
   */
  async reloadNetworkMap(
    reloadMode: 'broadcast' | 'cascade',
  ): Promise<unknown> {
    const path = `${API_CONFIG.ENDPOINTS.CONFIG.NETWORK_MAP}/reload`;
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: ConfigApiService.getAuthHeaders(),
      body: JSON.stringify({ reloadMode }),
    });
    return await ConfigApiService.handleResponse(response);
  }
}

export const configApi = new ConfigApiService();
