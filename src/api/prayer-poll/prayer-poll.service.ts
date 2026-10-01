import { randomUUID } from 'crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { RedisService } from '../../infra/redis/redis.service';
import { PrayerPollEntry, PrayerPollState } from '../../../shared/types';

const ENTRIES = 'prayerpoll:entries';
const DEVICES = 'prayerpoll:devices';
const STATUS = 'prayerpoll:status';
const ROUND = 'prayerpoll:round';

/** Stored form: public entry plus the device it came from (phone votes only). */
type StoredEntry = PrayerPollEntry & { deviceId?: string };

/**
 * Average-age poll state lives in Redis (AOF-persisted in docker-compose), so a
 * backend restart in the middle of a gathering doesn't lose the votes.
 * `ENTRIES` holds every counted vote as JSON (phone + manual); `DEVICES` makes phone
 * votes one-per-device.
 */
@Injectable()
export class PrayerPollService {
  public constructor(private readonly redis: RedisService) {}

  public async getState(): Promise<PrayerPollState> {
    const r = this.redis.client;
    const [status, round, entries] = await Promise.all([
      r.get(STATUS),
      r.get(ROUND),
      this.readEntries(),
    ]);
    const finished = status === 'FINISHED';
    const nums = entries.map((e) => e.age);
    const average = nums.length
      ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
      : null;
    return {
      status: finished ? 'FINISHED' : 'OPEN',
      round: Number(round ?? 0),
      count: nums.length,
      averageAge: finished ? average : null,
    };
  }

  /** Phone vote: one per device. Re-submitting from the same device is a no-op. */
  public async castVote(deviceId: string, age: number): Promise<PrayerPollState> {
    await this.assertOpen();
    const added = await this.redis.client.sadd(DEVICES, deviceId);
    if (added === 1) await this.push({ id: randomUUID(), age, source: 'phone', deviceId });
    return this.getState();
  }

  /** Presenter adds a vote on behalf of someone without a phone. */
  public async addManual(age: number): Promise<PrayerPollState> {
    await this.assertOpen();
    await this.push({ id: randomUUID(), age, source: 'manual' });
    return this.getState();
  }

  /** All votes, oldest first (callers sort). Ages are only exposed to the presenter. */
  public async listEntries(): Promise<PrayerPollEntry[]> {
    return (await this.readEntries()).map(({ id, age, source }) => ({ id, age, source }));
  }

  /** Presenter removes a wrongly entered vote (e.g. someone asks to correct their age). */
  public async remove(id: string): Promise<PrayerPollState> {
    await this.assertOpen();
    const raw = (await this.redis.client.lrange(ENTRIES, 0, -1)).find(
      (r) => (JSON.parse(r) as StoredEntry).id === id,
    );
    if (!raw) throw new NotFoundException('Vote not found');
    await this.redis.client.lrem(ENTRIES, 1, raw);
    const { deviceId } = JSON.parse(raw) as StoredEntry;
    if (deviceId) await this.redis.client.srem(DEVICES, deviceId);
    return this.getState();
  }

  public async finish(): Promise<PrayerPollState> {
    await this.redis.client.set(STATUS, 'FINISHED');
    return this.getState();
  }

  /** Start over: wipe votes, reopen, and bump the round so phones can vote again. */
  public async reset(): Promise<PrayerPollState> {
    await this.redis.client.del(ENTRIES, DEVICES);
    await this.redis.client.set(STATUS, 'OPEN');
    await this.redis.client.incr(ROUND);
    return this.getState();
  }

  private push(entry: StoredEntry) {
    return this.redis.client.rpush(ENTRIES, JSON.stringify(entry));
  }

  private async readEntries(): Promise<StoredEntry[]> {
    const raw = await this.redis.client.lrange(ENTRIES, 0, -1);
    return raw.map((r) => JSON.parse(r) as StoredEntry);
  }

  private async assertOpen(): Promise<void> {
    if ((await this.redis.client.get(STATUS)) === 'FINISHED') {
      throw new ConflictException('Poll is finished');
    }
  }
}
