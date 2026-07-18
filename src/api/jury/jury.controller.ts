import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { JuryService } from './jury.service';
import { AddJuryDto } from './dto/jury.dto';

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
  public async add(@Param('id') id: string, @Body() dto: AddJuryDto) {
    const scores = await this.jury.addPoints(id, dto.teamId, dto.points);
    this.realtime.emitJury(id, scores);
    return scores;
  }
}
