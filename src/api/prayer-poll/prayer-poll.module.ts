import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';

import { PrayerPollController } from './prayer-poll.controller';
import { PrayerPollService } from './prayer-poll.service';

@Module({
  imports: [RealtimeModule],
  controllers: [PrayerPollController],
  providers: [PrayerPollService],
})
export class PrayerPollModule {}
