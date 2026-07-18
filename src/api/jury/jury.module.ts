import { Module } from '@nestjs/common';

import { RealtimeModule } from '../realtime/realtime.module';

import { JuryController } from './jury.controller';
import { JuryService } from './jury.service';

@Module({
  imports: [RealtimeModule],
  controllers: [JuryController],
  providers: [JuryService],
  exports: [JuryService],
})
export class JuryModule {}
