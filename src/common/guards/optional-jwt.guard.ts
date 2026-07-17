import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { User } from '../../api/user/user.service';

/**
 * Same as AuthGuard('jwt') but does NOT throw when the token is missing or
 * invalid. Instead, req.user is left undefined and the request proceeds.
 *
 * Use via the `@OptionalAuthorization()` decorator for endpoints that work for
 * both authenticated and anonymous callers.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  public handleRequest<TUser = User>(_err: unknown, user: TUser | false): TUser | undefined {
    return user || undefined;
  }
}
