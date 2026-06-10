import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionGateway } from './session.gateway';
import { VotePayload, RevotePayload, SetQuestionPayload, SetThemePayload } from '../../shared/types';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sessionGateway: SessionGateway,
  ) {}

  @Get(':code')
  public getSession(@Param('code') code: string) {
    return this.sessionService.getSession(code);
  }

  @Get(':code/results')
  public getResults(@Param('code') code: string) {
    return this.sessionService.getResults(code);
  }

  @Post(':code/vote')
  @HttpCode(HttpStatus.OK)
  public castVote(@Param('code') code: string, @Body() body: VotePayload) {
    const results = this.sessionService.castVote(code, body.optionId);
    this.sessionGateway.broadcastResults(code, results);
    return results;
  }

  @Post(':code/revote')
  @HttpCode(HttpStatus.OK)
  public revote(@Param('code') code: string, @Body() body: RevotePayload) {
    const results = this.sessionService.revote(code, body.fromOptionId, body.toOptionId);
    this.sessionGateway.broadcastResults(code, results);
    return results;
  }

  @Post(':code/question')
  @HttpCode(HttpStatus.OK)
  public setQuestion(@Param('code') code: string, @Body() body: SetQuestionPayload) {
    const session = this.sessionService.setActiveQuestion(code, body.questionId);
    const results = this.sessionService.getResults(code);
    this.sessionGateway.broadcastQuestionChanged(code, session, results);
    return session;
  }

  @Post(':code/reveal')
  @HttpCode(HttpStatus.OK)
  public revealResults(@Param('code') code: string) {
    const session = this.sessionService.revealResults(code);
    this.sessionGateway.broadcastResultsRevealed(code, session);
    return session;
  }

  @Post(':code/theme')
  @HttpCode(HttpStatus.OK)
  public setTheme(@Param('code') code: string, @Body() body: SetThemePayload) {
    const session = this.sessionService.setTheme(code, body.theme);
    this.sessionGateway.broadcastThemeChanged(code, session);
    return session;
  }

  @Post(':code/reset')
  @HttpCode(HttpStatus.OK)
  public resetSession(@Param('code') code: string) {
    const { session, results } = this.sessionService.resetSession(code);
    this.sessionGateway.broadcastReset(code, session, results);
    return session;
  }
}
