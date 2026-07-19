import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { isEmpty } from 'lodash';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisClient: Redis;

  public constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: Number(this.configService.getOrThrow<string>('REDIS_PORT')),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      // Fail fast instead of hanging a request when Redis is unreachable:
      // commands reject immediately while disconnected (caller falls back to DB),
      // and a single command never queues a long retry chain.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      // Keep trying to reconnect (capped) so caching resumes when Redis returns.
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });

    this.redisClient.on('error', (error: unknown) => {
      // Log once at debug level — a full stack per reconnect attempt is noise.
      this.logger.debug(
        `Redis connection error: ${(error as Error)?.message ?? error}`,
      );
    });
  }

  public async get(key: string) {
    return this.redisClient.get(key);
  }

  public async save(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }

    return this.redisClient.set(key, value);
  }

  public async retrieve<T>({
    strategy,
    key,
    isDisabled,
    ttl,
  }: {
    key: string;
    strategy: () => Promise<T> | T;
    isDisabled?: boolean;
    ttl?: number;
  }): Promise<T> {
    if (isDisabled) {
      return strategy();
    }

    // Cache is an optimization, never a hard dependency: if Redis is down,
    // fall back to the source of truth instead of failing the request.
    try {
      const redisData = await this.get(key);
      if (redisData) {
        return JSON.parse(redisData) as T;
      }
    } catch (error) {
      this.logger.warn(
        `Redis unavailable — bypassing cache for "${key}": ${(error as Error)?.message ?? error}`,
      );
      return strategy();
    }

    const data = await strategy();

    if (!isEmpty(data)) {
      try {
        await this.save(key, JSON.stringify(data), ttl);
      } catch (error) {
        this.logger.warn(
          `Redis save failed for "${key}": ${(error as Error)?.message ?? error}`,
        );
      }
    }

    return data;
  }

  public async del(key: string) {
    return this.redisClient.del(key);
  }

  public get client() {
    return this.redisClient;
  }

  public onModuleDestroy() {
    return this.redisClient.quit();
  }
}
