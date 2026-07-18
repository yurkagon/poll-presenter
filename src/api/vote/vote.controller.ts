import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';

import { VoteService } from './vote.service';
import { CastEuroVoteDto, CastVoteDto } from './dto/vote.dto';

@Controller('events')
export class VoteController {
  public constructor(
    private readonly votes: VoteService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post(':id/votes')
  public async castVote(@Param('id') id: string, @Body() dto: CastVoteDto) {
    const progress = await this.votes.castVote(id, dto.deviceId, dto.targetTeamId);
    this.realtime.emitVoteProgress(progress);
    return progress;
  }

  @Post(':id/euro-votes')
  public async castEuroVote(
    @Param('id') id: string,
    @Body() dto: CastEuroVoteDto,
  ) {
    const progress = await this.votes.castEuroVote(id, dto.deviceId, dto.ranking);
    this.realtime.emitVoteProgress(progress);
    return progress;
  }

  @Get(':id/results')
  public results(@Param('id') id: string) {
    return this.votes.results(id);
  }
}
