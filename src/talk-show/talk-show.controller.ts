import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  TalkShowAdminState,
  TalkShowAskPayload,
  TalkShowCreatePollPayload,
  TalkShowLoginPayload,
  TalkShowState,
  TalkShowVotePayload,
} from '../../shared/talk-show';

import { TalkShowAdminGuard } from './talk-show-admin.guard';
import { TALK_SHOW_COOKIE, TalkShowAuthService } from './talk-show-auth.service';
import { TalkShowGateway } from './talk-show.gateway';
import { TalkShowService } from './talk-show.service';

@Controller('talk-show')
export class TalkShowController {
  public constructor(
    private readonly show: TalkShowService,
    private readonly gateway: TalkShowGateway,
    private readonly auth: TalkShowAuthService,
  ) {}

  // ─── Audience (no auth) ────────────────────────────────────────────────────

  @Get('state')
  public getState(@Query('deviceId') deviceId?: string): TalkShowState {
    return this.show.getState(deviceId || undefined);
  }

  @Post('votes')
  @HttpCode(HttpStatus.OK)
  public vote(@Body() body: TalkShowVotePayload): TalkShowState {
    this.show.castVote(body?.deviceId, body?.pollId, body?.option);
    return this.publish(body.deviceId);
  }

  @Post('questions')
  @HttpCode(HttpStatus.OK)
  public ask(@Body() body: TalkShowAskPayload): TalkShowState {
    this.show.addQuestion(body?.deviceId, body?.text);
    return this.publish(body.deviceId);
  }

  // ─── Host session ──────────────────────────────────────────────────────────

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  public login(
    @Body() body: TalkShowLoginPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): { ok: true } {
    const token = this.auth.login(req.ip, body?.password);
    res.cookie(TALK_SHOW_COOKIE, token, {
      ...this.auth.cookieOptions(req),
      maxAge: this.auth.sessionTtlMs,
    });
    return { ok: true };
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  public logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(TALK_SHOW_COOKIE, this.auth.cookieOptions(req));
    return { ok: true };
  }

  @UseGuards(TalkShowAdminGuard)
  @Get('auth/me')
  public me(): { ok: true } {
    return { ok: true };
  }

  // ─── Host controls ─────────────────────────────────────────────────────────

  @UseGuards(TalkShowAdminGuard)
  @Get('admin/state')
  public adminState(): TalkShowAdminState {
    return this.show.getAdminState();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/polls')
  @HttpCode(HttpStatus.OK)
  public createPoll(@Body() body: TalkShowCreatePollPayload): TalkShowAdminState {
    this.show.createPoll(body?.text, body?.optionA, body?.optionB);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/polls/next')
  @HttpCode(HttpStatus.OK)
  public startNext(): TalkShowAdminState {
    this.show.startNextPoll();
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/polls/:id/start')
  @HttpCode(HttpStatus.OK)
  public startPoll(@Param('id') id: string): TalkShowAdminState {
    this.show.startPoll(id);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/polls/:id/close')
  @HttpCode(HttpStatus.OK)
  public closePoll(@Param('id') id: string): TalkShowAdminState {
    this.show.closePoll(id);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Delete('admin/polls/:id')
  public deletePoll(@Param('id') id: string): TalkShowAdminState {
    this.show.deletePoll(id);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/results-visible')
  @HttpCode(HttpStatus.OK)
  public resultsVisible(@Body() body: { visible: boolean }): TalkShowAdminState {
    this.show.setResultsVisible(body?.visible);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/screen-mode')
  @HttpCode(HttpStatus.OK)
  public screenMode(@Body() body: { mode: string }): TalkShowAdminState {
    this.show.setScreenMode(body?.mode);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/questions/feature')
  @HttpCode(HttpStatus.OK)
  public feature(@Body() body: { id: string | null }): TalkShowAdminState {
    this.show.featureQuestion(body?.id ?? null);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/questions/:id/hidden')
  @HttpCode(HttpStatus.OK)
  public hideQuestion(
    @Param('id') id: string,
    @Body() body: { hidden: boolean },
  ): TalkShowAdminState {
    this.show.setQuestionHidden(id, body?.hidden);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Delete('admin/questions/:id')
  public deleteQuestion(@Param('id') id: string): TalkShowAdminState {
    this.show.deleteQuestion(id);
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/finish')
  @HttpCode(HttpStatus.OK)
  public finish(): TalkShowAdminState {
    this.show.finish();
    return this.publishAdmin();
  }

  @UseGuards(TalkShowAdminGuard)
  @Post('admin/reset')
  @HttpCode(HttpStatus.OK)
  public reset(): TalkShowAdminState {
    this.show.reset();
    return this.publishAdmin();
  }

  // ─── Broadcast ─────────────────────────────────────────────────────────────

  /** Push the public snapshot to everyone; the caller gets their own view back. */
  private publish(deviceId?: string): TalkShowState {
    this.gateway.broadcastState(this.show.getState());
    return this.show.getState(deviceId);
  }

  private publishAdmin(): TalkShowAdminState {
    this.gateway.broadcastState(this.show.getState());
    return this.show.getAdminState();
  }
}
