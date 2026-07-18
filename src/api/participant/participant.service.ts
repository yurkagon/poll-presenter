import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { LobbySnapshot } from '../../../shared/types';

@Injectable()
export class ParticipantService {
  public constructor(private readonly prisma: PrismaService) {}

  public upsertByDevice(deviceId: string, name?: string) {
    return this.prisma.participant.upsert({
      where: { deviceId },
      update: name !== undefined ? { name } : {},
      create: { deviceId, name: name ?? null },
    });
  }

  public findByDevice(deviceId: string) {
    return this.prisma.participant.findUnique({ where: { deviceId } });
  }

  public async selectTeam(deviceId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    // upsert so a fresh device that navigated straight to team-select still works
    return this.prisma.participant.upsert({
      where: { deviceId },
      update: { teamId },
      create: { deviceId, teamId },
    });
  }

  public listAll() {
    return this.prisma.participant.findMany({
      orderBy: { createdAt: 'asc' },
      include: { team: true },
    });
  }

  public async lobbySnapshot(): Promise<LobbySnapshot> {
    const [grouped, total] = await Promise.all([
      this.prisma.participant.groupBy({
        by: ['teamId'],
        where: { teamId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.participant.count({ where: { teamId: { not: null } } }),
    ]);

    const teams = grouped.map((g) => ({
      teamId: g.teamId as string,
      count: g._count._all,
    }));

    return { teams, totalParticipants: total };
  }

  /** Resolve a participant that is allowed to vote (exists + has a team). */
  public async resolveVotingParticipant(deviceId: string) {
    const participant = await this.findByDevice(deviceId);
    if (!participant) throw new NotFoundException('Participant not found');
    if (!participant.teamId) {
      throw new BadRequestException('Pick a team before voting');
    }
    return participant;
  }
}
