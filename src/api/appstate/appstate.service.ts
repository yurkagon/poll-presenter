import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { DisplayMode, GameState } from '../../../shared/types';

const SINGLETON_ID = 'singleton';

@Injectable()
export class AppStateService {
  public constructor(private readonly prisma: PrismaService) {}

  public async get(): Promise<GameState> {
    const row = await this.prisma.appState.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
    return { displayMode: row.displayMode, activeEventId: row.activeEventId };
  }

  public async setDisplay(
    displayMode: DisplayMode,
    activeEventId: string | null = null,
  ): Promise<GameState> {
    const row = await this.prisma.appState.upsert({
      where: { id: SINGLETON_ID },
      update: { displayMode, activeEventId },
      create: { id: SINGLETON_ID, displayMode, activeEventId },
    });
    return { displayMode: row.displayMode, activeEventId: row.activeEventId };
  }
}
