import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';

export interface DayInput {
  label?: string;
  order?: number;
}

@Injectable()
export class DayService {
  public constructor(private readonly prisma: PrismaService) {}

  public list() {
    return this.prisma.day.findMany({ orderBy: { order: 'asc' } });
  }

  public async create(dto: { label: string; order?: number }) {
    const order = dto.order ?? (await this.nextOrder());
    return this.prisma.day.create({ data: { label: dto.label, order } });
  }

  public async update(id: string, dto: DayInput) {
    await this.get(id);
    return this.prisma.day.update({ where: { id }, data: dto });
  }

  public async remove(id: string): Promise<void> {
    await this.get(id);
    await this.prisma.day.delete({ where: { id } });
  }

  private async get(id: string) {
    const day = await this.prisma.day.findUnique({ where: { id } });
    if (!day) throw new NotFoundException('Day not found');
    return day;
  }

  private async nextOrder(): Promise<number> {
    const last = await this.prisma.day.findFirst({ orderBy: { order: 'desc' } });
    return (last?.order ?? 0) + 1;
  }
}
