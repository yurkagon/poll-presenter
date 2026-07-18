import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import {
  EventCategory,
  LeaderboardDto,
  LeaderboardFilters,
} from '../../../shared/types';

@Injectable()
export class LeaderboardService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  public async standings(filters: LeaderboardFilters): Promise<LeaderboardDto> {
    const scope = filters.scope ?? 'overall';
    const teams = await this.prisma.team.findMany({ orderBy: { order: 'asc' } });

    const dayIds = await this.resolveDayIds(scope, filters);

    const events = await this.prisma.event.findMany({
      where: {
        status: 'COMPLETED',
        affectsScore: true,
        ...(scope === 'category' && filters.category
          ? { category: filters.category as EventCategory }
          : {}),
        ...(dayIds ? { dayId: { in: dayIds } } : {}),
      },
      include: { result: true },
    });

    const entries = events
      .map((e) => e.result)
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => ({
        computedPoints: (r.computedPoints as Record<string, number>) ?? {},
      }));

    const rows = this.scoring.teamLeaderboard(
      entries,
      teams.map((t) => ({
        id: t.id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        order: t.order,
      })),
    );

    return { scope, rows };
  }

  /**
   * Which day ids constrain the query.
   * - overall / category → null (all days)
   * - day + single → just the selected day
   * - day + cumulative → every day with order <= the selected day's order
   */
  private async resolveDayIds(
    scope: string,
    filters: LeaderboardFilters,
  ): Promise<string[] | null> {
    if (scope !== 'day' || !filters.dayId) return null;

    const mode = filters.mode ?? 'cumulative';
    const selected = await this.prisma.day.findUnique({
      where: { id: filters.dayId },
    });
    if (!selected) return [filters.dayId];

    if (mode === 'single') return [selected.id];

    const days = await this.prisma.day.findMany({
      where: { order: { lte: selected.order } },
      select: { id: true },
    });
    return days.map((d) => d.id);
  }
}
