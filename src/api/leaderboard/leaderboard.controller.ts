import { Controller, Get, Query } from '@nestjs/common';

import { LeaderboardService } from './leaderboard.service';
import { EventCategory, LeaderboardFilters } from '../../../shared/types';

@Controller('leaderboard')
export class LeaderboardController {
  public constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  public standings(
    @Query('scope') scope?: LeaderboardFilters['scope'],
    @Query('dayId') dayId?: string,
    @Query('category') category?: EventCategory,
    @Query('mode') mode?: LeaderboardFilters['mode'],
  ) {
    return this.leaderboard.standings({ scope, dayId, category, mode });
  }
}
