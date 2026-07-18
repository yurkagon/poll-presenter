import { Module } from '@nestjs/common';

import { DayController } from './day.controller';
import { DayService } from './day.service';

@Module({
  controllers: [DayController],
  providers: [DayService],
  exports: [DayService],
})
export class DayModule {}
