import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { JuryService } from './jury.service';
import { SetJuryDto } from './dto/jury.dto';

@Controller('events')
export class JuryController {
  public constructor(
    private readonly jury: JuryService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Get(':id/jury')
  public scores(@Param('id') id: string) {
    return this.jury.scores(id);
  }

  @Authorization()
  @Post(':id/jury')
  public async set(@Param('id') id: string, @Body() dto: SetJuryDto) {
    const scores = await this.jury.setScore(id, dto.teamId, dto.score);
    this.realtime.emitJury(id, scores);
    return scores;
  }
}
