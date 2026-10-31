import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TALK_SHOW_EVENTS, TalkShowState } from '../../shared/talk-show';

const ROOM = 'talkshow';

/**
 * Shares the socket.io server (and the CORS check) with SessionGateway — same
 * port and namespace — but uses its own room, so the two modes never mix.
 */
@WebSocketGateway()
export class TalkShowGateway {
  @WebSocketServer()
  public server: Server;

  @SubscribeMessage(TALK_SHOW_EVENTS.JOIN)
  public handleJoin(@ConnectedSocket() client: Socket): void {
    client.join(ROOM);
  }

  public broadcastState(state: TalkShowState): void {
    this.server.to(ROOM).emit(TALK_SHOW_EVENTS.STATE, state);
  }
}
