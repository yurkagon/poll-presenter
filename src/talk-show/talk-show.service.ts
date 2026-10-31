import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TALK_SHOW_OPTION_MAX,
  TALK_SHOW_POLL_TEXT_MAX,
  TALK_SHOW_QUESTION_COOLDOWN_MS,
  TALK_SHOW_QUESTION_MAX,
  TalkShowAdminState,
  TalkShowCounts,
  TalkShowOption,
  TalkShowPollStatus,
  TalkShowQuestion,
  TalkShowScreenMode,
  TalkShowState,
} from '../../shared/talk-show';

const MAX_STORED_QUESTIONS = 1000;
/** Newest-first window of questions sent to every client. */
const PUBLIC_QUESTIONS_LIMIT = 50;

interface PollRecord {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  status: TalkShowPollStatus;
  counts: { a: number; b: number };
  /** deviceId → option. Only exists to keep one vote per device; dropped on finish. */
  votes: Map<string, TalkShowOption>;
}

interface QuestionRecord extends TalkShowQuestion {
  hidden: boolean;
}

/**
 * Talk show state. In memory only (like the conference session): a restart is a
 * blank slate. Keep it ignorant of transport — controllers broadcast.
 */
@Injectable()
export class TalkShowService {
  private polls: PollRecord[] = [];
  private activePollId: string | null = null;
  private resultsVisible = true;
  private screenMode: TalkShowScreenMode = 'VOTING';
  private finished = false;

  private questions: QuestionRecord[] = [];
  private featuredQuestionId: string | null = null;
  /** deviceId → last question time, for the per-device cooldown. */
  private readonly lastAskedAt = new Map<string, number>();

  // ─── Snapshots ─────────────────────────────────────────────────────────────

  public getState(deviceId?: string): TalkShowState {
    const poll = this.activePoll();
    const visible = this.visibleQuestions();
    const featured = this.featuredQuestionId
      ? visible.find((q) => q.id === this.featuredQuestionId)
      : undefined;

    const state: TalkShowState = {
      finished: this.finished,
      screenMode: this.screenMode,
      poll: poll ? this.toPublicPoll(poll) : null,
      resultsVisible: this.resultsVisible,
      results: poll && this.resultsVisible ? this.countsOf(poll) : null,
      questions: visible.slice(0, PUBLIC_QUESTIONS_LIMIT).map(this.toPublicQuestion),
      featuredQuestion: featured ? this.toPublicQuestion(featured) : null,
    };
    if (deviceId !== undefined) {
      state.myVote = poll?.votes.get(deviceId) ?? null;
    }
    return state;
  }

  public getAdminState(): TalkShowAdminState {
    return {
      ...this.getState(),
      // The host always sees the live numbers, even while the screen hides them.
      results: this.activePoll() ? this.countsOf(this.activePoll()) : null,
      polls: this.polls.map((p) => ({ ...this.toPublicPoll(p), counts: this.countsOf(p) })),
      allQuestions: [...this.questions].reverse().map((q) => ({
        ...this.toPublicQuestion(q),
        hidden: q.hidden,
      })),
    };
  }

  // ─── Polls (host) ──────────────────────────────────────────────────────────

  public createPoll(text: unknown, optionA: unknown, optionB: unknown): void {
    const poll: PollRecord = {
      id: crypto.randomUUID(),
      text: this.requireText(text, 'text', TALK_SHOW_POLL_TEXT_MAX),
      optionA: this.requireText(optionA, 'optionA', TALK_SHOW_OPTION_MAX),
      optionB: this.requireText(optionB, 'optionB', TALK_SHOW_OPTION_MAX),
      status: 'DRAFT',
      counts: { a: 0, b: 0 },
      votes: new Map(),
    };
    if (poll.optionA.toLowerCase() === poll.optionB.toLowerCase()) {
      throw new BadRequestException('Options must differ');
    }
    this.polls.push(poll);
  }

  public deletePoll(id: string): void {
    const poll = this.requirePoll(id);
    this.polls = this.polls.filter((p) => p !== poll);
    if (this.activePollId === id) this.activePollId = null;
  }

  /** Put a poll on screen and open it for votes; closes the poll it replaces. */
  public startPoll(id: string): void {
    this.assertRunning();
    const poll = this.requirePoll(id);
    const previous = this.activePoll();
    if (previous && previous !== poll && previous.status === 'OPEN') previous.status = 'CLOSED';

    poll.status = 'OPEN';
    this.activePollId = poll.id;
    this.resultsVisible = true;
    this.screenMode = 'VOTING';
  }

  public closePoll(id: string): void {
    const poll = this.requirePoll(id);
    if (poll.status === 'OPEN') poll.status = 'CLOSED';
  }

  /** Start the next poll that has not run yet, after the one on screen. */
  public startNextPoll(): void {
    this.assertRunning();
    const from = this.activePollId ? this.polls.findIndex((p) => p.id === this.activePollId) + 1 : 0;
    const next = this.polls.slice(from).find((p) => p.status === 'DRAFT');
    if (!next) throw new NotFoundException('No next poll');
    this.startPoll(next.id);
  }

  public setResultsVisible(visible: unknown): void {
    this.resultsVisible = visible === true;
  }

  public setScreenMode(mode: unknown): void {
    if (mode !== 'VOTING' && mode !== 'QUESTIONS' && mode !== 'QR') {
      throw new BadRequestException('Unknown screen mode');
    }
    this.screenMode = mode;
  }

  // ─── Audience ──────────────────────────────────────────────────────────────

  public castVote(deviceId: unknown, pollId: unknown, option: unknown): void {
    this.assertRunning();
    const device = this.requireText(deviceId, 'deviceId', 100);
    if (option !== 'a' && option !== 'b') throw new BadRequestException('Unknown option');

    const poll = this.activePoll();
    if (!poll || poll.id !== pollId) throw new ConflictException('This poll is not on screen');
    if (poll.status !== 'OPEN') throw new ConflictException('Voting is closed');
    if (poll.votes.has(device)) throw new ConflictException('Already voted');

    poll.votes.set(device, option);
    poll.counts[option] += 1;
  }

  public addQuestion(deviceId: unknown, text: unknown): void {
    this.assertRunning();
    const device = this.requireText(deviceId, 'deviceId', 100);
    const body = this.requireText(text, 'text', TALK_SHOW_QUESTION_MAX);

    const now = Date.now();
    const wait = (this.lastAskedAt.get(device) ?? 0) + TALK_SHOW_QUESTION_COOLDOWN_MS - now;
    if (wait > 0) {
      throw new HttpException(
        { message: 'Too many questions', retryAfterMs: wait },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (this.questions.length >= MAX_STORED_QUESTIONS) {
      throw new ConflictException('Question limit reached');
    }

    this.lastAskedAt.set(device, now);
    this.questions.push({ id: crypto.randomUUID(), text: body, createdAt: now, hidden: false });
  }

  // ─── Questions (host) ──────────────────────────────────────────────────────

  public setQuestionHidden(id: string, hidden: unknown): void {
    const question = this.requireQuestion(id);
    question.hidden = hidden === true;
    if (question.hidden && this.featuredQuestionId === id) this.featuredQuestionId = null;
  }

  public deleteQuestion(id: string): void {
    const question = this.requireQuestion(id);
    this.questions = this.questions.filter((q) => q !== question);
    if (this.featuredQuestionId === id) this.featuredQuestionId = null;
  }

  /** `null` goes back to the list. */
  public featureQuestion(id: string | null): void {
    if (id === null) {
      this.featuredQuestionId = null;
      return;
    }
    const question = this.requireQuestion(id);
    if (question.hidden) throw new ConflictException('Question is hidden');
    this.featuredQuestionId = id;
    this.screenMode = 'QUESTIONS';
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Stop all intake. Per-device data is dropped; aggregates and questions stay for the host. */
  public finish(): void {
    for (const poll of this.polls) {
      if (poll.status === 'OPEN') poll.status = 'CLOSED';
      poll.votes.clear();
    }
    this.lastAskedAt.clear();
    this.finished = true;
  }

  /** Wipe everything and start a fresh show. */
  public reset(): void {
    this.polls = [];
    this.activePollId = null;
    this.resultsVisible = true;
    this.screenMode = 'VOTING';
    this.finished = false;
    this.questions = [];
    this.featuredQuestionId = null;
    this.lastAskedAt.clear();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private activePoll(): PollRecord | null {
    return this.polls.find((p) => p.id === this.activePollId) ?? null;
  }

  private visibleQuestions(): QuestionRecord[] {
    return this.questions.filter((q) => !q.hidden).reverse();
  }

  private countsOf(poll: PollRecord): TalkShowCounts {
    return { ...poll.counts, total: poll.counts.a + poll.counts.b };
  }

  private toPublicPoll(poll: PollRecord) {
    const { id, text, optionA, optionB, status } = poll;
    return { id, text, optionA, optionB, status };
  }

  private toPublicQuestion = (q: QuestionRecord): TalkShowQuestion => ({
    id: q.id,
    text: q.text,
    createdAt: q.createdAt,
  });

  private requirePoll(id: string): PollRecord {
    const poll = this.polls.find((p) => p.id === id);
    if (!poll) throw new NotFoundException('Poll not found');
    return poll;
  }

  private requireQuestion(id: string): QuestionRecord {
    const question = this.questions.find((q) => q.id === id);
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  private assertRunning(): void {
    if (this.finished) throw new ConflictException('The show is finished');
  }

  /** Trimmed non-empty string within `max` characters. */
  private requireText(value: unknown, field: string, max: number): string {
    if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
    const text = value.trim();
    if (!text) throw new BadRequestException(`${field} must not be empty`);
    if (text.length > max) throw new BadRequestException(`${field} is longer than ${max}`);
    return text;
  }
}
