import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionGateway } from './session.gateway';

@Module({
  providers: [SessionService, SessionGateway],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
