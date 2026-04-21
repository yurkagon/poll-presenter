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
import { VotePayload, SetQuestionPayload } from '../../shared/types';

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

  /** POST /api/session/:code/question — presenter switches active question */
  @Post(':code/question')
  @HttpCode(HttpStatus.OK)
  public setQuestion(@Param('code') code: string, @Body() body: SetQuestionPayload) {
    const session = this.sessionService.setActiveQuestion(code, body.questionId);
    const results = this.sessionService.getResults(code);
    this.sessionGateway.broadcastQuestionChanged(code, session, results);
    return session;
  }
}
