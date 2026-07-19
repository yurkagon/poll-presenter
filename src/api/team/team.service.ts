import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

import { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';

@Injectable()
export class TeamService {
  public constructor(private readonly prisma: PrismaService) {}

  /** `eventId: null` (default) = permanent camp roster; pass an id for a single event's ad-hoc teams. */
  public list(eventId: string | null = null) {
    return this.prisma.team.findMany({ where: { eventId }, orderBy: { order: 'asc' } });
  }

  public async get(id: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  public async create(dto: CreateTeamDto) {
    const eventId = dto.eventId ?? null;
    const order = dto.order ?? (await this.nextOrder(eventId));
    return this.prisma.team.create({
      data: { name: dto.name, icon: dto.icon, color: dto.color, order, eventId },
    });
  }

  public async update(id: string, dto: UpdateTeamDto) {
    await this.get(id);
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  public async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.team.delete({ where: { id } });
  }

  private async nextOrder(eventId: string | null): Promise<number> {
    const last = await this.prisma.team.findFirst({
      where: { eventId },
      orderBy: { order: 'desc' },
    });
    return (last?.order ?? 0) + 1;
  }
}
