import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../infra/prisma/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { VoteService } from '../vote/vote.service';
import { JuryService } from '../jury/jury.service';
import {
  EventDto,
  EventResultData,
  EventSnapshot,
  EventStatus,
  EuroRevealEntry,
} from '../../../shared/types';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EnterResultDto } from './dto/enter-result.dto';

type EventRow = Awaited<ReturnType<PrismaService['event']['findUniqueOrThrow']>>;

const ACTIVE_STATUSES: EventStatus[] = ['LOBBY', 'OPEN', 'CLOSED', 'REVEALED'];

@Injectable()
export class EventService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
    private readonly votes: VoteService,
    private readonly jury: JuryService,
  ) {}

  // ─── reads ─────────────────────────────────────────────────────────────

  public list(filter: { dayId?: string; status?: EventStatus }) {
    return this.prisma.event.findMany({
      where: {
        ...(filter.dayId ? { dayId: filter.dayId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  public async active(): Promise<EventSnapshot | null> {
    const event = await this.prisma.event.findFirst({
      where: { status: { in: ACTIVE_STATUSES } },
      orderBy: { updatedAt: 'desc' },
    });
    return event ? this.buildSnapshot(event) : null;
  }

  public async snapshot(id: string): Promise<EventSnapshot> {
    return this.buildSnapshot(await this.require(id));
  }

  /** Teams competing in this event: its own ad-hoc roster, or the permanent camp teams. */
  public async effectiveTeams(id: string) {
    const event = await this.require(id);
    return this.prisma.team.findMany({
      where: this.teamsWhere(event),
      orderBy: { order: 'asc' },
    });
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────

  public create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        name: dto.name,
        dayId: dto.dayId ?? null,
        category: dto.category,
        type: dto.type,
        weight: dto.weight,
        participantMode: dto.participantMode,
        affectsScore: dto.affectsScore,
      },
    });
  }

  public async update(id: string, dto: UpdateEventDto) {
    const event = await this.require(id);
    if (event.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT events can be edited');
    }
    return this.prisma.event.update({ where: { id }, data: dto });
  }

  public async remove(id: string): Promise<void> {
    await this.require(id);
    await this.prisma.event.delete({ where: { id } });
  }

  // ─── lifecycle control ───────────────────────────────────────────────────

  public async setStatus(id: string, status: EventStatus): Promise<EventSnapshot> {
    const event = await this.require(id);

    // Only one event may be live at a time.
    if ((status === 'LOBBY' || status === 'OPEN') && event.status === 'DRAFT') {
      const other = await this.prisma.event.findFirst({
        where: { status: { in: ACTIVE_STATUSES }, id: { not: id } },
      });
      if (other) {
        throw new ConflictException(
          `Another event ("${other.name}") is already live`,
        );
      }
    }

    const data: { status: EventStatus; revealStep?: number } = { status };
    if (status === 'REVEALED') data.revealStep = 0;
    const updated = await this.prisma.event.update({ where: { id }, data });
    return this.buildSnapshot(updated);
  }

  /** Close voting and derive the (hidden) audience tally for EURO events. */
  public async closeAndTally(id: string): Promise<EventSnapshot> {
    const event = await this.require(id);

    if (event.type === 'EURO') {
      const audienceRaw = await this.votes.rawScoreMap(id);
      await this.upsertResult(id, { audienceRaw });
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    return this.buildSnapshot(updated);
  }

  /** Manual result entry — raw team scores for SCORE_ENTRY events. */
  public async enterResult(id: string, dto: EnterResultDto): Promise<EventResultData> {
    const event = await this.require(id);

    if (event.type !== 'SCORE_ENTRY') {
      throw new BadRequestException(
        `enterResult is not applicable to ${event.type} events`,
      );
    }
    if (!dto.scores || Object.keys(dto.scores).length === 0) {
      throw new BadRequestException('scores is required for SCORE_ENTRY events');
    }

    const placement = await this.orderTeamsByRaw(event, dto.scores);
    const result = await this.upsertResult(id, { scores: dto.scores, placement });
    return this.toResultData(result);
  }

  /** Freeze computed points and mark the event completed. */
  public async complete(id: string): Promise<EventSnapshot> {
    const event = await this.require(id);
    const existing = await this.prisma.eventResult.findUnique({
      where: { eventId: id },
    });
    let resultData = existing ? this.toResultData(existing) : this.emptyResult();

    // EURO jury points live in the JuryScore table throughout the live jury
    // phase — freeze them into the result before computing final points.
    if (event.type === 'EURO') {
      const jury = await this.jury.scores(id);
      const juryRaw: Record<string, number> = {};
      for (const j of jury) juryRaw[j.teamId] = j.points;
      const result = await this.upsertResult(id, { juryRaw });
      resultData = this.toResultData(result);
    }

    const computedPoints = this.scoring.computeEventPoints(event, resultData);
    await this.upsertResult(id, { computedPoints });

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    return this.buildSnapshot(updated);
  }

  /**
   * Advance the EURO reveal by one team. Jury points are already visible live
   * (shown continuously while CLOSED), so each step here only reveals one
   * more team's hidden audience score on top of it.
   */
  public async advanceEuroReveal(id: string): Promise<EuroRevealEntry> {
    const event = await this.require(id);
    const teamCount = await this.prisma.team.count({ where: this.teamsWhere(event) });
    const updated = await this.prisma.event.update({
      where: { id },
      data: { revealStep: { increment: 1 } },
    });
    const step = updated.revealStep;
    const phase: EuroRevealEntry['phase'] = step >= teamCount ? 'done' : 'audience';
    return { eventId: id, step, phase };
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private async require(id: string): Promise<EventRow> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private teamsWhere(event: { participantMode: string; id: string }) {
    return event.participantMode === 'ADHOC' ? { eventId: event.id } : { eventId: null };
  }

  private async orderTeamsByRaw(
    event: EventRow,
    raw: Record<string, number>,
  ): Promise<string[]> {
    const teams = await this.prisma.team.findMany({
      where: this.teamsWhere(event),
      orderBy: { order: 'asc' },
    });
    return teams
      .slice()
      .sort((a, b) => (raw[b.id] ?? 0) - (raw[a.id] ?? 0) || a.order - b.order)
      .map((t) => t.id);
  }

  private upsertResult(eventId: string, data: Record<string, unknown>) {
    return this.prisma.eventResult.upsert({
      where: { eventId },
      update: data,
      create: { eventId, ...data },
    });
  }

  private async buildSnapshot(event: EventRow): Promise<EventSnapshot> {
    const [result, jury, progress] = await Promise.all([
      this.prisma.eventResult.findUnique({ where: { eventId: event.id } }),
      this.jury.scores(event.id),
      this.votes.progress(event.id),
    ]);
    return {
      event: this.toEventDto(event),
      result: result ? this.toResultData(result) : null,
      jury,
      progress,
    };
  }

  private toEventDto(event: EventRow): EventDto {
    return {
      id: event.id,
      name: event.name,
      dayId: event.dayId,
      category: event.category,
      type: event.type,
      weight: event.weight,
      participantMode: event.participantMode,
      affectsScore: event.affectsScore,
      status: event.status,
      revealStep: event.revealStep,
    };
  }

  private toResultData(
    result: Awaited<ReturnType<PrismaService['eventResult']['findUniqueOrThrow']>>,
  ): EventResultData {
    return {
      placement: (result.placement as string[]) ?? [],
      scores: (result.scores as Record<string, number> | null) ?? null,
      audienceRaw: (result.audienceRaw as Record<string, number> | null) ?? null,
      juryRaw: (result.juryRaw as Record<string, number> | null) ?? null,
      computedPoints: (result.computedPoints as Record<string, number>) ?? {},
    };
  }

  private emptyResult(): EventResultData {
    return {
      placement: [],
      scores: null,
      audienceRaw: null,
      juryRaw: null,
      computedPoints: {},
    };
  }
}
