import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { ParticipantService } from '../participant/participant.service';

import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EnterResultDto } from './dto/enter-result.dto';
import { EventStatus } from '../../../shared/types';

@Controller('events')
export class EventController {
  public constructor(
    private readonly events: EventService,
    private readonly leaderboard: LeaderboardService,
    private readonly participants: ParticipantService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // ─── reads ─────────────────────────────────────────────────────────────

  @Get('active')
  public active() {
    return this.events.active();
  }

  @Authorization()
  @Get()
  public list(
    @Query('dayId') dayId?: string,
    @Query('status') status?: EventStatus,
  ) {
    return this.events.list({ dayId, status });
  }

  @Get(':id')
  public snapshot(@Param('id') id: string) {
    return this.events.snapshot(id);
  }

  @Get(':id/teams')
  public teams(@Param('id') id: string) {
    return this.events.effectiveTeams(id);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────

  @Authorization()
  @Post()
  public create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Authorization()
  @Patch(':id')
  public update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @Authorization()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(@Param('id') id: string) {
    return this.events.remove(id);
  }

  // ─── lifecycle control ───────────────────────────────────────────────────

  @Authorization()
  @Post(':id/lobby')
  public async lobby(@Param('id') id: string) {
    const snapshot = await this.events.setStatus(id, 'LOBBY');
    this.realtime.emitEventState(snapshot);
    this.realtime.emitLobby(await this.participants.lobbySnapshot());
    return snapshot;
  }

  @Authorization()
  @Post(':id/open')
  public async open(@Param('id') id: string) {
    const snapshot = await this.events.setStatus(id, 'OPEN');
    this.realtime.emitEventState(snapshot);
    return snapshot;
  }

  @Authorization()
  @Post(':id/close')
  public async close(@Param('id') id: string) {
    const snapshot = await this.events.closeAndTally(id);
    this.realtime.emitEventState(snapshot);
    return snapshot;
  }

  @Authorization()
  @Post(':id/result')
  public async result(@Param('id') id: string, @Body() dto: EnterResultDto) {
    await this.events.enterResult(id, dto);
    const snapshot = await this.events.snapshot(id);
    this.realtime.emitEventState(snapshot);
    return snapshot;
  }

  @Authorization()
  @Post(':id/reveal')
  public async reveal(@Param('id') id: string) {
    const snapshot = await this.events.setStatus(id, 'REVEALED');
    this.realtime.emitEventState(snapshot);
    if (snapshot.event.type === 'EURO') {
      this.realtime.emitEuroReveal({ eventId: id, step: 0, phase: 'audience' });
    }
    return snapshot;
  }

  @Authorization()
  @Post(':id/euro/next')
  public async euroNext(@Param('id') id: string) {
    const entry = await this.events.advanceEuroReveal(id);
    this.realtime.emitEuroReveal(entry);
    return entry;
  }

  @Authorization()
  @Post(':id/complete')
  public async complete(@Param('id') id: string) {
    const snapshot = await this.events.complete(id);
    this.realtime.emitEventState(snapshot);
    this.realtime.emitLeaderboard(await this.leaderboard.standings({ scope: 'overall' }));
    return snapshot;
  }
}
