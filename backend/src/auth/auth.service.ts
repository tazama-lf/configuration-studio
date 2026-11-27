import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  UnauthorizedException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ message: string; token: string; expiresIn: number | null }> {
    const authUrl = this.configService.get<string>('TAZAMA_AUTH_URL');
    if (!authUrl) {
      this.logger.error('TAZAMA_AUTH_URL is not set in environment variables');
      throw new ServiceUnavailableException(
        'Authentication service unavailable',
      );
    }

    let response: { data: unknown };
    try {
        response = await firstValueFrom(
        this.httpService.post(`${authUrl}/v1/auth/login`, { username, password }),
      );
    } catch (error) {
        this.handleRequestError(error);
    }

    if (!response.data) {
        this.logger.error('Auth service did not return a valid response');
        throw new ServiceUnavailableException(
          'Authentication service unavailable',
        );
    }
    this.logger.log('Auth service responded');

    // Token extraction happens outside the request try/catch: a malformed
    // auth-service response used to be re-caught by the request error handler
    // and mis-logged as "service unavailable".
    const token = this.extractToken(response.data);
    const expiresIn = this.extractExpiresIn(response.data);

    return { message: 'Login successful', token, expiresIn };
  }

  private extractToken(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }
    const obj = data as Record<string, unknown>;
    const userObj = (obj.user ?? {}) as Record<string, unknown>;
    const token =
      (obj.token as string | undefined) ??
      (obj.access_token as string | undefined) ??
      (obj.jwt as string | undefined) ??
      (userObj.token as string | undefined);

    if (!token) {
      this.logger.error('Auth service response did not contain a token');
      throw new ServiceUnavailableException(
        'Authentication service unavailable',
      );
    }
    return token;
  }

  private extractExpiresIn(data: unknown): number | null {
    const obj = data as Record<string, unknown>;
    return (
      (obj.expires_in as number | undefined) ??
      (obj.expiresIn as number | undefined) ??
      null
    );
  }

  /**
   * Handle a failed request to the auth-service. No username is logged:
   * credential attempts must not be persisted in logs.
   */
  private handleRequestError(error: unknown): never {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    if (err.response?.status === 401) {
      this.logger.warn('Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }
    if (err.response?.status === 429) {
      this.logger.warn('Account locked');
      const data = err.response?.data as { message?: string } | undefined;
      throw new HttpException(
        { message: data?.message ?? 'Account is locked. Too many failed attempts.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.logger.error(
      `Auth service error during login: ${(error as Error).message}`,
    );
    throw new ServiceUnavailableException(
      'Authentication service unavailable',
    );
  }
}
