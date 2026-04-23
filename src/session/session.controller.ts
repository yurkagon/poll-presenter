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

  /** GET /api/session/:code */
  @Get(':code')
  public getSession(@Param('code') code: string) {
    return this.sessionService.getSession(code);
  }

  /** GET /api/session/:code/results */
  @Get(':code/results')
  public getResults(@Param('code') code: string) {
    return this.sessionService.getResults(code);
  }

  /** POST /api/session/:code/vote */
  @Post(':code/vote')
  @HttpCode(HttpStatus.OK)
  public castVote(@Param('code') code: string, @Body() body: VotePayload) {
    const results = this.sessionService.castVote(code, body.optionId);
    this.sessionGateway.broadcastResults(code, results);
    return results;
  }

  /** POST /api/session/:code/revote — participant changes their vote */
  @Post(':code/revote')
  @HttpCode(HttpStatus.OK)
  public revote(@Param('code') code: string, @Body() body: RevotePayload) {
    const results = this.sessionService.revote(code, body.fromOptionId, body.toOptionId);
    this.sessionGateway.broadcastResults(code, results);
    return results;
  }

  /** POST /api/session/:code/question — presenter switches active question */
  @Post(':code/question')
  @HttpCode(HttpStatus.OK)
  public setQuestion(@Param('code') code: string, @Body() body: SetQuestionPayload) {
    const session = this.sessionService.setActiveQuestion(code, body.questionId);
    const results = this.sessionService.getResults(code);
    this.sessionGateway.broadcastQuestionChanged(code, session, results);
    return session;
  }

  /** POST /api/session/:code/reveal — presenter reveals results for current question */
  @Post(':code/reveal')
  @HttpCode(HttpStatus.OK)
  public revealResults(@Param('code') code: string) {
    const session = this.sessionService.revealResults(code);
    this.sessionGateway.broadcastResultsRevealed(code, session);
    return session;
  }

  /** POST /api/session/:code/theme — presenter switches light/dark theme */
  @Post(':code/theme')
  @HttpCode(HttpStatus.OK)
  public setTheme(@Param('code') code: string, @Body() body: SetThemePayload) {
    const session = this.sessionService.setTheme(code, body.theme);
    this.sessionGateway.broadcastThemeChanged(code, session);
    return session;
  }

  /** POST /api/session/:code/reset — clears all votes and returns to Q1 */
  @Post(':code/reset')
  @HttpCode(HttpStatus.OK)
  public resetSession(@Param('code') code: string) {
    const { session, results } = this.sessionService.resetSession(code);
    this.sessionGateway.broadcastReset(code, session, results);
    return session;
  }
}
