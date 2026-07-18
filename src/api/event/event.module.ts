import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';
import { ScoringModule } from '../scoring/scoring.module';
import { VoteModule } from '../vote/vote.module';
import { JuryModule } from '../jury/jury.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { ParticipantModule } from '../participant/participant.module';

import { EventController } from './event.controller';
import { EventService } from './event.service';

@Module({
  imports: [
    RealtimeModule,
    ScoringModule,
    VoteModule,
    JuryModule,
    LeaderboardModule,
    ParticipantModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
