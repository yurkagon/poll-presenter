import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { ParticipantService } from './participant.service';
import { SelectTeamDto, UpsertParticipantDto } from './dto/participant.dto';

@Controller('participants')
export class ParticipantController {
  public constructor(
    private readonly participants: ParticipantService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Admin roster — must be declared before ':deviceId' to avoid shadowing.
  @Authorization()
  @Get('roster')
  public roster() {
    return this.participants.listAll();
  }

  @Get('lobby')
  public lobby() {
    return this.participants.lobbySnapshot();
  }

  // Un-assign everyone from their team before a new day — votes untouched.
  @Authorization()
  @Post('reset')
  public async resetTeams() {
    await this.participants.resetTeams();
    const lobby = await this.participants.lobbySnapshot();
    this.realtime.emitLobby(lobby);
    return lobby;
  }

  @Post()
  public upsert(@Body() dto: UpsertParticipantDto) {
    return this.participants.upsertByDevice(dto.deviceId, dto.name);
  }

  @Get(':deviceId')
  public findByDevice(@Param('deviceId') deviceId: string) {
    return this.participants.findByDevice(deviceId);
  }

  @Patch(':deviceId/team')
  public async selectTeam(
    @Param('deviceId') deviceId: string,
    @Body() dto: SelectTeamDto,
  ) {
    const participant = await this.participants.selectTeam(deviceId, dto.teamId);
    this.realtime.emitLobby(await this.participants.lobbySnapshot());
    return participant;
  }
}
