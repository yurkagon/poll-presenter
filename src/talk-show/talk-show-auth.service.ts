import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { CookieOptions, Request } from 'express';

export const TALK_SHOW_COOKIE = 'talkShowAdmin';
/** Cookie is only sent to the talk-show API. */
const COOKIE_PATH = '/api/talk-show';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILED_LOGINS = 10;
const FAILED_LOGIN_WINDOW_MS = 5 * 60 * 1000;

/** Shared host password, hardcoded so every deployment has the same one. */
const ADMIN_PASSWORD = '12345678';

/**
 * Host authentication without a user table: one shared password, and a signed,
 * expiring httpOnly cookie.
 */
@Injectable()
export class TalkShowAuthService {
  private readonly failures = new Map<string, { count: number; resetAt: number }>();

  public constructor(private readonly config: ConfigService) {}

  /** Checks the password and returns the cookie value. */
  public login(ip: string, password: unknown): string {
    this.assertNotLocked(ip);

    if (typeof password !== 'string' || !this.sameSecret(password, ADMIN_PASSWORD)) {
      this.recordFailure(ip);
      throw new UnauthorizedException('Invalid password');
    }
    this.failures.delete(ip);
    return this.sign(Date.now() + SESSION_TTL_MS);
  }

  public isAuthorized(req: Request): boolean {
    const token = this.readCookie(req, TALK_SHOW_COOKIE);
    if (!token) return false;

    const [expiry, signature] = token.split('.');
    const expiresAt = Number(expiry);
    if (!signature || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
    return this.sameSecret(signature, this.signature(expiry));
  }

  public cookieOptions(req: Request): CookieOptions {
    const https = req.secure || req.headers['x-forwarded-proto'] === 'https';
    return { httpOnly: true, sameSite: 'lax', secure: https, path: COOKIE_PATH };
  }

  public get sessionTtlMs(): number {
    return SESSION_TTL_MS;
  }

  private sign(expiresAt: number): string {
    return `${expiresAt}.${this.signature(String(expiresAt))}`;
  }

  private signature(payload: string): string {
    const secret = this.config.get<string>('TALK_SHOW_AUTH_SECRET') || ADMIN_PASSWORD;
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /** Constant-time comparison of two strings of any length. */
  private sameSecret(a: string, b: string): boolean {
    const digest = (v: string) => createHash('sha256').update(v).digest();
    return timingSafeEqual(digest(a), digest(b));
  }

  private readCookie(req: Request, name: string): string | undefined {
    const header = req.headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key === name) return decodeURIComponent(rest.join('='));
    }
    return undefined;
  }

  private assertNotLocked(ip: string): void {
    const entry = this.failures.get(ip);
    if (!entry) return;
    if (entry.resetAt < Date.now()) {
      this.failures.delete(ip);
      return;
    }
    if (entry.count >= MAX_FAILED_LOGINS) {
      throw new HttpException('Too many attempts, try later', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordFailure(ip: string): void {
    const entry = this.failures.get(ip);
    if (entry && entry.resetAt >= Date.now()) {
      entry.count += 1;
    } else {
      this.failures.set(ip, { count: 1, resetAt: Date.now() + FAILED_LOGIN_WINDOW_MS });
    }
  }
}
