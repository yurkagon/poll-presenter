import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';

import { ParticipantController } from './participant.controller';
import { ParticipantService } from './participant.service';

@Module({
  imports: [RealtimeModule],
  controllers: [ParticipantController],
  providers: [ParticipantService],
  exports: [ParticipantService],
})
export class ParticipantModule {}
