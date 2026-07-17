import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { UserService } from '../../user/user.service';

import { JWTAccessTokenPayload } from '../auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req.cookies as Record<string, string | undefined> | undefined;
          const token = cookies?.accessToken;
          return typeof token === 'string' ? token : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  public async validate(payload: JWTAccessTokenPayload) {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return this.userService.findByIdForAuth(payload.userId);
  }
}
