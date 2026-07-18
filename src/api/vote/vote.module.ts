import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';
import { ParticipantModule } from '../participant/participant.module';

import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

@Module({
  imports: [RealtimeModule, ParticipantModule],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
