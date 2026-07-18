import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import {
  WS_EVENTS,
  PresenceJoinPayload,
  GameState,
  EventSnapshot,
  LobbySnapshot,
  VoteProgress,
  VoteResults,
  JuryScoreDto,
  LeaderboardDto,
  EuroRevealEntry,
} from '../../../shared/types';

const ROOM = 'live';

/**
 * Single global room `live`. There is exactly one game running for the whole
 * camp, so presenter, big-screen and every participant watch the same shared
 * state — every broadcast is identical for all of them. The gateway is
 * broadcast-only: REST controllers mutate, then call these emit methods.
 */
@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  public server: Server;

  public constructor(private readonly config: ConfigService) {}

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

  @SubscribeMessage(WS_EVENTS.PRESENCE_JOIN)
  public handlePresenceJoin(
    @MessageBody() _data: PresenceJoinPayload,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(ROOM);
  }

  public emitGameState(state: GameState): void {
    this.server.to(ROOM).emit(WS_EVENTS.GAME_STATE, state);
  }

  public emitEventState(snapshot: EventSnapshot): void {
    this.server.to(ROOM).emit(WS_EVENTS.EVENT_STATE, snapshot);
  }

  public emitLobby(lobby: LobbySnapshot): void {
    this.server.to(ROOM).emit(WS_EVENTS.LOBBY_UPDATED, lobby);
  }

  public emitVoteProgress(progress: VoteProgress): void {
    this.server.to(ROOM).emit(WS_EVENTS.VOTE_PROGRESS, progress);
  }

  public emitResults(results: VoteResults): void {
    this.server.to(ROOM).emit(WS_EVENTS.RESULTS_UPDATED, results);
  }

  public emitJury(eventId: string, scores: JuryScoreDto[]): void {
    this.server.to(ROOM).emit(WS_EVENTS.JURY_UPDATED, { eventId, scores });
  }

  public emitLeaderboard(leaderboard: LeaderboardDto): void {
    this.server.to(ROOM).emit(WS_EVENTS.LEADERBOARD_UPDATED, leaderboard);
  }

  public emitEuroReveal(entry: EuroRevealEntry): void {
    this.server.to(ROOM).emit(WS_EVENTS.EURO_REVEAL, entry);
  }
}
