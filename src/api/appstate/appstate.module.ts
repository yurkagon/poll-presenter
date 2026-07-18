import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';

import { AppStateController } from './appstate.controller';
import { AppStateService } from './appstate.service';

@Module({
  imports: [RealtimeModule],
  controllers: [AppStateController],
  providers: [AppStateService],
  exports: [AppStateService],
})
export class AppStateModule {}
