import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { IS_DEV_ENV } from '../../config';

export const UserAgent = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return request.headers['user-agent'] ?? 'unknown';
});

export const ClientIp = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (IS_DEV_ENV) {
    return '';
  }

  const cfIp = Array.isArray(req.headers['cf-connecting-ip'])
    ? req.headers['cf-connecting-ip'][0]
    : req.headers['cf-connecting-ip'];

  return cfIp ?? req.ip ?? req.socket.remoteAddress ?? 'unknown';
});
