import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const Cookies = createParamDecorator((key: string | undefined, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!key) {
    return req.cookies;
  }
  return req.cookies?.[key];
});
