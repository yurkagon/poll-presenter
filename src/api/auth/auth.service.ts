import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import type { CookieOptions, Response } from 'express';
import ms from 'ms';

import { UserService, toSafeUser } from '../user/user.service';
import { IS_DEV_ENV } from '../../config';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth.constants';
import { JWTAccessTokenPayload } from './auth.interfaces';

@Injectable()
export class AuthService {
  private readonly JWT_EXPIRATION_TIME: string;
  private readonly JWT_REFRESH_EXPIRATION_TIME: string;

  private readonly COOKIE_DOMAIN: string;

  public constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_EXPIRATION_TIME = this.configService.getOrThrow<string>('JWT_EXPIRATION_TIME');
    this.JWT_REFRESH_EXPIRATION_TIME = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRATION_TIME',
    );

    this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  public async register(res: Response, registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;
    const hashedPassword = await hash(password);

    const user = await this.userService.create({
      ...userData,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    this.setAuthCookies(res, accessToken, refreshToken);

    return { user: toSafeUser(user) };
  }

  public async login(res: Response, loginDto: LoginDto) {
    const user = await this.userService.findByNickname(loginDto.nickname);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await verify(user.password, loginDto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id);
    this.setAuthCookies(res, accessToken, refreshToken);

    return { user: toSafeUser(user) };
  }

  public async refresh(res: Response, refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: JWTAccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<JWTAccessTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userService.findByIdForAuth(payload.userId);

    const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(user.id);

    this.setAuthCookies(res, accessToken, newRefreshToken);
  }

  public logout(res: Response): void {
    this.clearAuthCookies(res);
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ userId, tokenType: 'access' } satisfies JWTAccessTokenPayload, {
        expiresIn: this.JWT_EXPIRATION_TIME,
      }),
      this.jwtService.signAsync({ userId, tokenType: 'refresh' } satisfies JWTAccessTokenPayload, {
        expiresIn: this.JWT_REFRESH_EXPIRATION_TIME,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const cookieOptions = this.getAuthCookieOptions();

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: ms(this.JWT_EXPIRATION_TIME as ms.StringValue),
    });
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: ms(this.JWT_REFRESH_EXPIRATION_TIME as ms.StringValue),
    });
  }

  private clearAuthCookies(res: Response): void {
    const cookieOptions = this.getAuthCookieOptions();

    res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
    res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);
  }

  private getAuthCookieOptions(): CookieOptions {
    return {
      path: '/',
      httpOnly: true,
      secure: !IS_DEV_ENV,
      domain: this.COOKIE_DOMAIN,
      sameSite: IS_DEV_ENV ? 'lax' : 'none',
    };
  }
}
