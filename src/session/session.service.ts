import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Session,
  SessionResults,
  VoteResult,
  SessionOption,
  Theme,
} from '../../shared/types';

// ─── Hardcoded session data ───────────────────────────────────────────────────

const DEFAULT_OPTIONS: SessionOption[] = [
  { id: 'norm', label: 'НОРМ' },
  { id: 'strem', label: 'СТРЬОМ' },
];

const QUESTIONS = [
  {
    id: 'q1',
    text: 'Чи "норм" використовувати АІ для підготовки проповіді/домашньої групи, тощо',
    options: DEFAULT_OPTIONS,
    image: '/images/q1.webp',
  },
  {
    id: 'q2',
    text: 'Чи "норм" християнину вступати в суперечки в коментарях, захищаючи віру?',
    options: DEFAULT_OPTIONS,
    image: '/images/q2.webp',
  },
  {
    id: 'q3',
    text: '"Кар\'єризм" у церкві - чи окей бажати збільшувати свою роль у служінні?',
    options: DEFAULT_OPTIONS,
    image: '/images/q3.webp',
  },
  {
    id: 'q4',
    text: 'Чи окей служителю одягати дорогий одяг за тисячі долларів на служіння?',
    options: DEFAULT_OPTIONS,
    image: '/images/q4.webp',
  },
  {
    id: 'q5',
    text: 'Cancel culture - Чи «норм» християнам масово відписуватися і бойкотувати бренд або блогера через один вчинок?',
    options: DEFAULT_OPTIONS,
    image: '/images/q5.webp',
  },
  {
    id: 'q6',
    text: 'Work-life balance в церкві - Чи «норм» бути недоступним для членів церкви/команди у якісь дні тижня чи не відповідати після якоїсь години вечора?',
    options: DEFAULT_OPTIONS,
    image: '/images/q6.webp',
  },
  {
    id: 'q7',
    text: 'Пропустити свято в церкві бо "треба святкувати зі своїми родичами (не церковними)"',
    options: DEFAULT_OPTIONS,
    image: '/images/q7.webp',
  },
  {
    id: 'q8',
    text: 'Християнський Tinder: Чи "норм" шукати пару в дейтинг-додатках?',
    options: DEFAULT_OPTIONS,
    image: '/images/q8.webp',
  },
];

const SESSION_CODE = '88309117';

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SessionService {
  private activeQuestionId = QUESTIONS[0].id;
  private subSession = crypto.randomUUID();
  private theme: Theme = 'dark';
  private resultsVisible = false;

  /** Votes keyed by `questionId:optionId` */
  private readonly votes = new Map<string, number>();

  private voteKey(questionId: string, optionId: string): string {
    return `${questionId}:${optionId}`;
  }

  private findQuestion(questionId: string) {
    return QUESTIONS.find((q) => q.id === questionId);
  }

  public getSession(code: string): Session {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);
    return {
      code: SESSION_CODE,
      questions: QUESTIONS,
      activeQuestionId: this.activeQuestionId,
      subSession: this.subSession,
      theme: this.theme,
      resultsVisible: this.resultsVisible,
    };
  }

  public getResults(code: string): SessionResults {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);

    const activeQuestion = this.findQuestion(this.activeQuestionId)!;

    const results: VoteResult[] = activeQuestion.options.map((opt) => ({
      optionId: opt.id,
      label: opt.label,
      count: this.votes.get(this.voteKey(this.activeQuestionId, opt.id)) ?? 0,
    }));

    return {
      sessionCode: code,
      activeQuestionId: this.activeQuestionId,
      results,
      totalVotes: results.reduce((s, r) => s + r.count, 0),
    };
  }

  public castVote(code: string, optionId: string): SessionResults {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);

    const activeQuestion = this.findQuestion(this.activeQuestionId)!;
    if (!activeQuestion.options.find((o) => o.id === optionId)) {
      throw new NotFoundException(`Option "${optionId}" not found`);
    }

    const key = this.voteKey(this.activeQuestionId, optionId);
    this.votes.set(key, (this.votes.get(key) ?? 0) + 1);
    return this.getResults(code);
  }

  public revote(code: string, fromOptionId: string, toOptionId: string): SessionResults {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);

    const activeQuestion = this.findQuestion(this.activeQuestionId)!;
    if (!activeQuestion.options.find((o) => o.id === fromOptionId)) {
      throw new NotFoundException(`Option "${fromOptionId}" not found`);
    }
    if (!activeQuestion.options.find((o) => o.id === toOptionId)) {
      throw new NotFoundException(`Option "${toOptionId}" not found`);
    }

    const fromKey = this.voteKey(this.activeQuestionId, fromOptionId);
    const toKey = this.voteKey(this.activeQuestionId, toOptionId);

    const fromCount = this.votes.get(fromKey) ?? 0;
    this.votes.set(fromKey, Math.max(0, fromCount - 1));
    this.votes.set(toKey, (this.votes.get(toKey) ?? 0) + 1);

    return this.getResults(code);
  }

  public revealResults(code: string): Session {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);
    this.resultsVisible = true;
    return this.getSession(code);
  }

  public setActiveQuestion(code: string, questionId: string): Session {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);
    if (!this.findQuestion(questionId)) throw new NotFoundException(`Question "${questionId}" not found`);

    this.activeQuestionId = questionId;
    this.resultsVisible = false;
    return this.getSession(code);
  }

  public setTheme(code: string, theme: Theme): Session {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);
    this.theme = theme;
    return this.getSession(code);
  }

  public resetSession(code: string): { session: Session; results: SessionResults } {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);

    this.votes.clear();
    this.activeQuestionId = QUESTIONS[0].id;
    this.subSession = crypto.randomUUID();
    this.resultsVisible = false;

    return {
      session: this.getSession(code),
      results: this.getResults(code),
    };
  }
}
