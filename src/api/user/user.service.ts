import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import type { UserModel } from '../../generated/prisma/models';

import { CreateUserDto } from './dto/create-user.dto';

/** Full user row, including the password hash. */
export type UserWithPassword = UserModel;

/** User row safe to return to clients — no password hash. */
export type User = Omit<UserModel, 'password'>;

/** Strip the password hash before exposing a user to a caller. */
export const toSafeUser = (user: UserWithPassword): User => {
  const { password, ...safe } = user;
  return safe;
};

// Cache authenticated-user lookups briefly to spare the DB on every request.
const AUTH_CACHE_TTL_SECONDS = 60;
const authCacheKey = (id: string) => `user:auth:${id}`;

@Injectable()
export class UserService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Create a user. The `password` is expected to be ALREADY HASHED by the
   * caller (see AuthService) — this service never hashes.
   */
  public async create(dto: CreateUserDto): Promise<UserWithPassword> {
    const existing = await this.prisma.user.findUnique({
      where: { nickname: dto.nickname },
    });

    if (existing) {
      throw new ConflictException('Nickname is already taken');
    }

    return this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        password: dto.password,
      },
    });
  }

  public findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      omit: { password: true },
    });
  }

  public findByNickname(nickname: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { nickname } });
  }

  public findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  /** Cached lookup used on every authenticated request. Throws if the user is gone. */
  public async findByIdForAuth(id: string): Promise<User> {
    const user = await this.redis.retrieve<User | null>({
      key: authCacheKey(id),
      ttl: AUTH_CACHE_TTL_SECONDS,
      strategy: () => this.findById(id),
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }
}
