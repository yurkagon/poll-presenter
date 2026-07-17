import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { OptionalJwtGuard } from '../guards/optional-jwt.guard';

export const Authorization = () => {
  return applyDecorators(UseGuards(AuthGuard('jwt')));
};

/**
 * Attaches `req.user` if a valid JWT cookie is present, otherwise lets the
 * request through with `req.user === undefined`. Use for endpoints that
 * behave differently for anonymous vs authenticated callers without rejecting
 * anonymous traffic.
 */
export const OptionalAuthorization = () => {
  return applyDecorators(UseGuards(OptionalJwtGuard));
};
