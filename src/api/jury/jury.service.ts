import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { JuryScoreDto } from '../../../shared/types';

@Injectable()
export class JuryService {
  public constructor(private readonly prisma: PrismaService) {}

  public async addPoints(
    eventId: string,
    teamId: string,
    delta: number,
  ): Promise<JuryScoreDto[]> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.type !== 'EURO') {
      throw new BadRequestException('This event does not accept jury points');
    }

    await this.prisma.juryScore.upsert({
      where: { eventId_teamId: { eventId, teamId } },
      update: { points: { increment: delta } },
      create: { eventId, teamId, points: delta },
    });
    return this.scores(eventId);
  }

  public async scores(eventId: string): Promise<JuryScoreDto[]> {
    const rows = await this.prisma.juryScore.findMany({ where: { eventId } });
    return rows.map((r) => ({ teamId: r.teamId, points: r.points }));
  }
}
