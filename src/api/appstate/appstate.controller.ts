import { Body, Controller, Get, Post } from '@nestjs/common';

import { Authorization } from '../../common/decorators/authorization.decorator';
import { RealtimeGateway } from '../realtime/realtime.gateway';

import { AppStateService } from './appstate.service';
import { SetDisplayDto } from './dto/set-display.dto';

@Controller('game')
export class AppStateController {
  public constructor(
    private readonly appState: AppStateService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Get('state')
  public getState() {
    return this.appState.get();
  }

  @Authorization()
  @Post('display')
  public async setDisplay(@Body() dto: SetDisplayDto) {
    const state = await this.appState.setDisplay(
      dto.displayMode,
      dto.activeEventId ?? null,
    );
    this.realtime.emitGameState(state);
    return state;
  }
}
