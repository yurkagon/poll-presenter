import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { PrayerPollState } from '../../../shared/types';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { PrayerPollService } from './prayer-poll.service';
import { AddAgeDto, CastAgeVoteDto } from './dto/prayer-poll.dto';

@Controller('prayer-poll')
export class PrayerPollController {
  public constructor(
    private readonly poll: PrayerPollService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Get('state')
  public getState() {
    return this.poll.getState();
  }

  @Post('votes')
  public async castVote(@Body() dto: CastAgeVoteDto) {
    return this.broadcast(await this.poll.castVote(dto.deviceId, dto.age));
  }

  @Authorization()
  @Post('manual')
  public async addManual(@Body() dto: AddAgeDto) {
    return this.broadcast(await this.poll.addManual(dto.age));
  }

  @Authorization()
  @Get('entries')
  public listEntries() {
    return this.poll.listEntries();
  }

  @Authorization()
  @Delete('entries/:id')
  public async remove(@Param('id') id: string) {
    return this.broadcast(await this.poll.remove(id));
  }

  @Authorization()
  @Post('finish')
  public async finish() {
    return this.broadcast(await this.poll.finish());
  }

  @Authorization()
  @Post('reset')
  public async reset() {
    return this.broadcast(await this.poll.reset());
  }

  private broadcast(state: PrayerPollState): PrayerPollState {
    this.realtime.emitPrayerPoll(state);
    return state;
  }
}
