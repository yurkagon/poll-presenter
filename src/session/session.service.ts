import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Session,
  SessionResults,
  VoteResult,
  SessionOption,
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
  },
  {
    id: 'q2',
    text: 'Чи "норм" християнину вступати в суперечки в коментарях, захищаючи віру?',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q3',
    text: '"Кар\'єризм" у церкві - чи окей бажати збільшувати свою роль у служінні?',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q4',
    text: 'Чи окей служителю одягати дорогий одяг за тисячі долларів на служіння?',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q5',
    text: 'Cancel culture - Чи «норм» християнам масово відписуватися і бойкотувати бренд або блогера через один вчинок?',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q6',
    text: 'Work-life balance в церкві - Чи «норм» бути недоступним для членів церкви/команди у якісь дні тижня чи не відповідати після якоїсь години вечора?',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q7',
    text: 'Пропустити свято в церкві бо "треба святкувати зі своїми родичами (не церковними)"',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'q8',
    text: 'Християнський Tinder: Чи "норм" шукати пару в дейтинг-додатках?',
    options: DEFAULT_OPTIONS,
  },
];

const SESSION_CODE = '88309117';

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SessionService {
  private activeQuestionId = QUESTIONS[0].id;
  private resetVersion = 0;

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
      resetVersion: this.resetVersion,
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

  public setActiveQuestion(code: string, questionId: string): Session {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);
    if (!this.findQuestion(questionId)) throw new NotFoundException(`Question "${questionId}" not found`);

    this.activeQuestionId = questionId;
    return this.getSession(code);
  }

  public resetSession(code: string): { session: Session; results: SessionResults } {
    if (code !== SESSION_CODE) throw new NotFoundException(`Session "${code}" not found`);

    this.votes.clear();
    this.activeQuestionId = QUESTIONS[0].id;
    this.resetVersion += 1;

    return {
      session: this.getSession(code),
      results: this.getResults(code),
    };
  }
}
