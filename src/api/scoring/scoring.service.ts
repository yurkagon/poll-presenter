import { Injectable } from '@nestjs/common';
import {
  BASE_POINTS,
  WEIGHT_MULTIPLIER,
  EventWeight,
  EventType,
  EventResultData,
  Team,
  LeaderboardRow,
} from '../../../shared/types';
import { rankIndices } from '../../../shared/ranking';

/**
 * Pure, stateless scoring. Takes plain data, returns plain data — reused by the
 * event module (freeze points at COMPLETE) and the leaderboard module.
 */
@Injectable()
export class ScoringService {
  public weightMultiplier(weight: EventWeight): number {
    return WEIGHT_MULTIPLIER[weight] ?? 1;
  }

  public rankToPoints(rankIndex: number, weight: EventWeight): number {
    if (rankIndex < 0 || rankIndex >= BASE_POINTS.length) return 0;
    return Math.round(BASE_POINTS[rankIndex] * this.weightMultiplier(weight));
  }

  /**
   * Rank a raw-score map into points. Equal raw values share the same rank
   * (and therefore the same points) — standard competition ranking.
   */
  private rawToPoints(
    raw: Record<string, number>,
    weight: EventWeight,
  ): Record<string, number> {
    const ordered = Object.keys(raw).sort((a, b) => (raw[b] ?? 0) - (raw[a] ?? 0));
    const ranks = rankIndices(ordered, raw);
    const out: Record<string, number> = {};
    ordered.forEach((teamId, i) => {
      out[teamId] = this.rankToPoints(ranks[i], weight);
    });
    return out;
  }

  /**
   * EURO: rank audience raw and jury raw independently into points, then sum
   * (Eurovision principle — equal weight).
   */
  public hybridPoints(
    audienceRaw: Record<string, number>,
    juryRaw: Record<string, number>,
    weight: EventWeight,
  ): Record<string, number> {
    const aud = this.rawToPoints(audienceRaw, weight);
    const jur = this.rawToPoints(juryRaw, weight);
    const out: Record<string, number> = {};
    for (const teamId of new Set([...Object.keys(aud), ...Object.keys(jur)])) {
      out[teamId] = (aud[teamId] ?? 0) + (jur[teamId] ?? 0);
    }
    return out;
  }

  /** Dispatch on event type using the persisted result. {} if no team points. */
  public computeEventPoints(
    event: { type: EventType; weight: EventWeight; affectsScore: boolean },
    result: EventResultData,
  ): Record<string, number> {
    if (!event.affectsScore) return {};

    switch (event.type) {
      case 'SCORE_ENTRY':
        return this.rawToPoints(result.scores ?? {}, event.weight);
      case 'EURO':
        return this.hybridPoints(
          result.audienceRaw ?? {},
          result.juryRaw ?? {},
          event.weight,
        );
      default:
        return {};
    }
  }

  /** Aggregate frozen computedPoints across events into ranked standings. */
  public teamLeaderboard(
    entries: { computedPoints: Record<string, number> }[],
    teams: Team[],
  ): LeaderboardRow[] {
    const totals: Record<string, number> = {};
    for (const t of teams) totals[t.id] = 0;
    for (const e of entries) {
      for (const [teamId, pts] of Object.entries(e.computedPoints ?? {})) {
        totals[teamId] = (totals[teamId] ?? 0) + pts;
      }
    }

    const rows = teams
      .map((t) => ({ teamId: t.id, name: t.name, points: totals[t.id] ?? 0, rank: 0 }))
      .sort((a, b) => b.points - a.points);

    // standard competition ranking (ties share the higher rank, next skips)
    let lastPoints: number | null = null;
    let lastRank = 0;
    rows.forEach((row, i) => {
      if (lastPoints === null || row.points !== lastPoints) {
        row.rank = i + 1;
        lastRank = row.rank;
        lastPoints = row.points;
      } else {
        row.rank = lastRank;
      }
    });

    return rows;
  }
}
