import { Body, Controller, Param, Post } from '@nestjs/common';

import { RealtimeGateway } from '../realtime/realtime.gateway';

import { VoteService } from './vote.service';
import { CastEuroVoteDto } from './dto/vote.dto';

@Controller('events')
export class VoteController {
  public constructor(
    private readonly votes: VoteService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post(':id/euro-votes')
  public async castEuroVote(
    @Param('id') id: string,
    @Body() dto: CastEuroVoteDto,
  ) {
    const progress = await this.votes.castEuroVote(id, dto.deviceId, dto.ranking);
    this.realtime.emitVoteProgress(progress);
    return progress;
  }
}
