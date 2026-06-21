import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '@url-shortener/shared';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & Partial<AuthenticatedRequest>>();
    const apiKey = this.extractApiKey(request);
    const { ownerId } = await this.apiKeysService.authenticate(apiKey);
    const user = await this.usersService.findById(ownerId);

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = this.toAuthenticatedUser(user._id.toString(), user.email);

    return true;
  }

  private extractApiKey(request: Request): string {
    const headerApiKey = request.headers['x-api-key'];

    if (typeof headerApiKey === 'string' && headerApiKey.trim()) {
      return headerApiKey.trim();
    }

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing API key');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid API key');
    }

    return token;
  }

  private toAuthenticatedUser(id: string, email: string): AuthenticatedUser {
    return { id, email };
  }
}
