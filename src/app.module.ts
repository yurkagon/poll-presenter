import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './api/auth/auth.module';
import { RealtimeModule } from './api/realtime/realtime.module';
import { ScoringModule } from './api/scoring/scoring.module';
import { AppStateModule } from './api/appstate/appstate.module';
import { TeamModule } from './api/team/team.module';
import { DayModule } from './api/day/day.module';
import { ParticipantModule } from './api/participant/participant.module';
import { VoteModule } from './api/vote/vote.module';
import { JuryModule } from './api/jury/jury.module';
import { LeaderboardModule } from './api/leaderboard/leaderboard.module';
import { EventModule } from './api/event/event.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    UserModule,
    AuthModule,
    RealtimeModule,
    ScoringModule,
    AppStateModule,
    TeamModule,
    DayModule,
    ParticipantModule,
    VoteModule,
    JuryModule,
    LeaderboardModule,
    EventModule,
  ],
})
export class AppModule {}
