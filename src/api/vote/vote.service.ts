import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { ParticipantService } from '../participant/participant.service';
import { VoteProgress, VoteResultRow, VoteResults } from '../../../shared/types';

// Eurovision medal → raw points contributed by one ranked vote.
const EURO_MEDAL_POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

@Injectable()
export class VoteService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly participants: ParticipantService,
  ) {}

  public async castVote(
    eventId: string,
    deviceId: string,
    targetTeamId: string,
  ): Promise<VoteProgress> {
    const event = await this.requireOpenEvent(eventId);
    if (!['SIMPLE_VOTE', 'HYBRID'].includes(event.type)) {
      throw new BadRequestException('This event does not accept simple votes');
    }

    const participant = await this.participants.resolveVotingParticipant(deviceId);
    if (targetTeamId === participant.teamId) {
      throw new ForbiddenException('Cannot vote for your own team');
    }
    await this.requireTeam(targetTeamId);

    try {
      await this.prisma.vote.create({
        data: { eventId, participantId: participant.id, targetTeamId, rank: 0 },
      });
    } catch (e) {
      throw this.asConflict(e);
    }

    return this.progress(eventId);
  }

  public async castEuroVote(
    eventId: string,
    deviceId: string,
    ranking: string[],
  ): Promise<VoteProgress> {
    const event = await this.requireOpenEvent(eventId);
    if (event.type !== 'EURO_VOTE') {
      throw new BadRequestException('This event is not a Eurovision vote');
    }
    if (ranking.length !== 3 || new Set(ranking).size !== 3) {
      throw new BadRequestException('Rank exactly 3 distinct teams');
    }

    const participant = await this.participants.resolveVotingParticipant(deviceId);
    if (ranking.includes(participant.teamId as string)) {
      throw new ForbiddenException('Cannot rank your own team');
    }

    const teams = await this.prisma.team.findMany({
      where: { id: { in: ranking } },
      select: { id: true },
    });
    if (teams.length !== 3) throw new NotFoundException('Unknown team in ranking');

    try {
      await this.prisma.$transaction(
        ranking.map((targetTeamId, i) =>
          this.prisma.vote.create({
            data: {
              eventId,
              participantId: participant.id,
              targetTeamId,
              rank: i + 1,
            },
          }),
        ),
      );
    } catch (e) {
      throw this.asConflict(e);
    }

    return this.progress(eventId);
  }

  /** Team → raw count (simple votes) or raw euro points, depending on event type. */
  public async tally(eventId: string, type: string): Promise<VoteResultRow[]> {
    if (type === 'EURO_VOTE') {
      const rows = await this.prisma.vote.findMany({
        where: { eventId, rank: { gt: 0 } },
        select: { targetTeamId: true, rank: true },
      });
      const points: Record<string, number> = {};
      for (const r of rows) {
        points[r.targetTeamId] =
          (points[r.targetTeamId] ?? 0) + (EURO_MEDAL_POINTS[r.rank] ?? 0);
      }
      return Object.entries(points).map(([teamId, count]) => ({ teamId, count }));
    }

    const grouped = await this.prisma.vote.groupBy({
      by: ['targetTeamId'],
      where: { eventId, rank: 0 },
      _count: { _all: true },
    });
    return grouped.map((g) => ({ teamId: g.targetTeamId, count: g._count._all }));
  }

  /** teamId → raw score map (for storing audienceRaw / deriving placement). */
  public async rawScoreMap(
    eventId: string,
    type: string,
  ): Promise<Record<string, number>> {
    const rows = await this.tally(eventId, type);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.teamId] = r.count;
    return map;
  }

  public async results(eventId: string): Promise<VoteResults> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    return { eventId, results: await this.tally(eventId, event.type) };
  }

  public async progress(eventId: string): Promise<VoteProgress> {
    const [voters, expected] = await Promise.all([
      this.prisma.vote.findMany({
        where: { eventId },
        select: { participantId: true },
        distinct: ['participantId'],
      }),
      this.prisma.participant.count({ where: { teamId: { not: null } } }),
    ]);
    return {
      eventId,
      totalVotes: voters.length,
      expected: expected || null,
    };
  }

  private async requireOpenEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.status !== 'OPEN') {
      throw new ConflictException('Voting is not open for this event');
    }
    return event;
  }

  private async requireTeam(teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  private asConflict(e: unknown): Error {
    if (e && typeof e === 'object' && (e as { code?: string }).code === 'P2002') {
      return new ConflictException('You have already voted in this event');
    }
    return e as Error;
  }
}
