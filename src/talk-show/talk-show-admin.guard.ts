import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { TalkShowAuthService } from './talk-show-auth.service';

@Injectable()
export class TalkShowAdminGuard implements CanActivate {
  public constructor(private readonly auth: TalkShowAuthService) {}

  public canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!this.auth.isAuthorized(req)) throw new UnauthorizedException();
    return true;
  }
}
