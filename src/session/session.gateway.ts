import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { Session, SessionResults, WS_EVENTS } from '../../shared/types';

@WebSocketGateway()
export class SessionGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  constructor(private readonly config: ConfigService) {}

  public afterInit(server: Server): void {
    const rawOrigins = this.config.get<string>('CORS_ORIGINS');
    if (!rawOrigins) throw new Error('CORS_ORIGINS is not set in environment');
    const origins = rawOrigins.split(',').map((o) => o.trim());

    server.engine.opts.allowRequest = (req: any, callback: any) => {
      const origin = req.headers.origin as string | undefined;
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback('Cross-origin forbidden', false);
      }
    };

    console.log('WebSocket gateway initialised');
  }

  public handleConnection(client: Socket): void {
    console.log(`WS client connected: ${client.id}`);
  }

  public handleDisconnect(client: Socket): void {
    console.log(`WS client disconnected: ${client.id}`);
  }

  /** Client subscribes to live updates for a session */
  @SubscribeMessage(WS_EVENTS.JOIN_SESSION)
  public handleJoinSession(
    @MessageBody() data: { sessionCode: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`session:${data.sessionCode}`);
    console.log(`Client ${client.id} joined session:${data.sessionCode}`);
  }

  /** Broadcast new vote counts to all clients in session room */
  public broadcastResults(sessionCode: string, results: SessionResults): void {
    this.server
      .to(`session:${sessionCode}`)
      .emit(WS_EVENTS.RESULTS_UPDATED, results);
  }

  /** Broadcast active question change to all clients (presenter + participants) */
  public broadcastQuestionChanged(
    sessionCode: string,
    session: Session,
    results: SessionResults,
  ): void {
    this.server
      .to(`session:${sessionCode}`)
      .emit(WS_EVENTS.QUESTION_CHANGED, { session, results });
  }

  /** Broadcast results revealed to all clients */
  public broadcastResultsRevealed(sessionCode: string, session: Session): void {
    this.server
      .to(`session:${sessionCode}`)
      .emit(WS_EVENTS.RESULTS_REVEALED, { session });
  }

  /** Broadcast theme change to all clients */
  public broadcastThemeChanged(sessionCode: string, session: Session): void {
    this.server
      .to(`session:${sessionCode}`)
      .emit(WS_EVENTS.THEME_CHANGED, { session });
  }

  /** Broadcast session reset to all clients — clears votes and returns to Q1 */
  public broadcastReset(
    sessionCode: string,
    session: Session,
    results: SessionResults,
  ): void {
    this.server
      .to(`session:${sessionCode}`)
      .emit(WS_EVENTS.SESSION_RESET, { session, results });
  }
}
