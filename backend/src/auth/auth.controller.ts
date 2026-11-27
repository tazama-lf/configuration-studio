import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
  HttpCode,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Rate-limited by ThrottlerGuard using the env-tunable defaults configured
   * in AuthModule (LOGIN_RATE_LIMIT per LOGIN_RATE_TTL_MS window). No
   * @Throttle override here: hardcoded decorator values would silently
   * defeat the env configuration. The global ValidationPipe already
   * validates the body against LoginDto; no per-route pipe is needed.
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto): Promise<{
    message: string;
    token: string;
    expiresIn?: number;
  }> {
    try {
      const result = await this.authService.login(body.username, body.password);
      const response: { message: string; token: string; expiresIn?: number } = {
        message: 'Login successful',
        token: result.token,
      };
      if (result.expiresIn) {
        response.expiresIn = result.expiresIn;
      }
      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // No username in the log: credential attempts must not be persisted.
        this.logger.warn('Authentication failed');
        throw error;
      }
      if (error instanceof HttpException) {
        // Pass through every other deliberate HttpException from the service
        // (401 invalid credentials, 429 locked account, 503 auth-service
        // unavailable) with its status and message intact — the previous
        // catch-all turned the 429 "account locked" response into a 500.
        this.logger.warn(`Login rejected with status ${error.getStatus()}`);
        throw error;
      }
      this.logger.error('Unexpected error during login');
      throw new InternalServerErrorException(
        'An unexpected error occurred during login',
      );
    }
  }
}
