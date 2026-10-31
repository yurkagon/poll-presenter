import { Module } from '@nestjs/common';

import { TalkShowAdminGuard } from './talk-show-admin.guard';
import { TalkShowAuthService } from './talk-show-auth.service';
import { TalkShowController } from './talk-show.controller';
import { TalkShowGateway } from './talk-show.gateway';
import { TalkShowService } from './talk-show.service';

@Module({
  providers: [TalkShowService, TalkShowAuthService, TalkShowAdminGuard, TalkShowGateway],
  controllers: [TalkShowController],
})
export class TalkShowModule {}
