import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './session/session.module';
import { TalkShowModule } from './talk-show/talk-show.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SessionModule,
    TalkShowModule,
  ],
})
export class AppModule {}
