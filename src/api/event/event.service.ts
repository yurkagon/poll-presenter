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
  IndividualWinner,
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

  /** Close voting and derive placement / audience raw from the cast votes. */
  public async closeAndTally(id: string): Promise<EventSnapshot> {
    const event = await this.require(id);

    if (event.type === 'SIMPLE_VOTE' || event.type === 'EURO_VOTE') {
      const raw = await this.votes.rawScoreMap(id, event.type);
      const placement = await this.orderTeamsByRaw(raw);
      // For euro events the medal tally is the "audience" score revealed
      // alongside admin-entered jury points in the Eurovision-style reveal.
      const extra = event.type === 'EURO_VOTE' ? { audienceRaw: raw } : {};
      await this.upsertResult(id, { placement, ...extra });
    } else if (event.type === 'HYBRID') {
      const audienceRaw = await this.votes.rawScoreMap(id, 'SIMPLE_VOTE');
      await this.upsertResult(id, { audienceRaw });
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    return this.buildSnapshot(updated);
  }

  /** Manual result entry (placement / hybrid jury / individual winners). */
  public async enterResult(id: string, dto: EnterResultDto): Promise<EventResultData> {
    const event = await this.require(id);

    const data: Record<string, unknown> = {};
    if (event.type === 'PLACEMENT') {
      if (!dto.placement?.length) {
        throw new BadRequestException('placement is required for PLACEMENT events');
      }
      data.placement = dto.placement;
    } else if (event.type === 'HYBRID') {
      if (dto.juryRaw) data.juryRaw = dto.juryRaw;
      if (dto.audienceRaw) data.audienceRaw = dto.audienceRaw;
    } else if (event.type === 'INDIVIDUAL') {
      data.individualWinners = (dto.individualWinners ?? []) as unknown;
    } else {
      throw new BadRequestException(
        `enterResult is not applicable to ${event.type} events`,
      );
    }

    const result = await this.upsertResult(id, data);
    return this.toResultData(result);
  }

  /** Freeze computed points and mark the event completed. */
  public async complete(id: string): Promise<EventSnapshot> {
    const event = await this.require(id);
    const existing = await this.prisma.eventResult.findUnique({
      where: { eventId: id },
    });
    const resultData = existing
      ? this.toResultData(existing)
      : this.emptyResult();

    const computedPoints = this.scoring.computeEventPoints(event, resultData);
    await this.upsertResult(id, { computedPoints });

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
    return this.buildSnapshot(updated);
  }

  public async advanceEuroReveal(id: string): Promise<EuroRevealEntry> {
    const event = await this.require(id);
    const teamCount = await this.prisma.team.count();
    const updated = await this.prisma.event.update({
      where: { id },
      data: { revealStep: { increment: 1 } },
    });
    const step = updated.revealStep;
    let phase: EuroRevealEntry['phase'] = 'jury';
    if (step >= teamCount * 2) phase = 'done';
    else if (step >= teamCount) phase = 'audience';
    return { eventId: id, step, phase };
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private async require(id: string): Promise<EventRow> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private async orderTeamsByRaw(raw: Record<string, number>): Promise<string[]> {
    const teams = await this.prisma.team.findMany({ orderBy: { order: 'asc' } });
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
      audienceRaw: (result.audienceRaw as Record<string, number> | null) ?? null,
      juryRaw: (result.juryRaw as Record<string, number> | null) ?? null,
      individualWinners:
        (result.individualWinners as unknown as IndividualWinner[] | null) ?? null,
      computedPoints: (result.computedPoints as Record<string, number>) ?? {},
    };
  }

  private emptyResult(): EventResultData {
    return {
      placement: [],
      audienceRaw: null,
      juryRaw: null,
      individualWinners: null,
      computedPoints: {},
    };
  }
}
