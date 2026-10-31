import type { TalkShowCounts, TalkShowPoll, TalkShowState } from '@shared/talk-show';
import { useForceDark } from '@/lib/useForceDark';
import { cn } from '@/lib/utils';
import { JoinQr } from './JoinQr';
import { useTalkShow } from './useTalkShow';

/** Read-only stage display for the projector — no controls. */
export function TalkShowScreenPage() {
  useForceDark();
  const { state } = useTalkShow();

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      <header className="flex items-center justify-between px-[clamp(1.5rem,3vw,4rem)] pt-[clamp(1.2rem,2.4vw,3rem)]">
        <div className="text-[clamp(1.4rem,2.2vw,2.6rem)] font-extrabold tracking-tight">
          🎙 Ток-шоу
        </div>
        {state && <StatusChip state={state} />}
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-[clamp(1.5rem,3vw,4rem)] pb-[clamp(1.5rem,3vw,4rem)] pt-[clamp(0.8rem,1.5vw,2rem)]">
        {!state ? null : state.finished ? (
          <Centered title="Дякуємо, що були з нами!" subtitle="Шоу завершено" />
        ) : state.screenMode === 'QR' ? (
          <QrView />
        ) : state.screenMode === 'QUESTIONS' ? (
          <QuestionsView state={state} />
        ) : state.poll ? (
          <VotingView poll={state.poll} results={state.results} />
        ) : (
          <QrView />
        )}
      </main>
    </div>
  );
}

function StatusChip({ state }: { state: TalkShowState }) {
  const open = state.poll?.status === 'OPEN' && !state.finished && state.screenMode === 'VOTING';
  const label = state.finished
    ? 'ШОУ ЗАВЕРШЕНО'
    : state.screenMode === 'QUESTIONS'
      ? 'ЗАПИТАННЯ ВІД ГЛЯДАЧІВ'
      : state.screenMode === 'QR'
        ? 'ПРИЄДНУЙСЯ'
        : !state.poll
          ? 'ОЧІКУВАННЯ'
          : open
            ? 'ГОЛОСУВАННЯ ВІДКРИТЕ'
            : 'ГОЛОСУВАННЯ ЗАКРИТЕ';
  return (
    <div className="flex items-center gap-[0.6vw] rounded-full border border-border bg-card px-[1.3vw] py-[0.65vw] text-[clamp(0.85rem,1.05vw,1.25rem)] font-bold">
      <span
        className={cn(
          'h-[clamp(8px,0.8vw,14px)] w-[clamp(8px,0.8vw,14px)] rounded-full',
          open ? 'animate-pulse bg-emerald-400' : 'bg-muted-foreground',
        )}
      />
      {label}
    </div>
  );
}

function Centered({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="text-[clamp(2.4rem,5vw,6rem)] font-extrabold leading-tight">{title}</div>
      {subtitle && (
        <div className="mt-[1vw] text-[clamp(1.1rem,1.8vw,2.2rem)] text-muted-foreground">
          {subtitle}
        </div>
      )}
    </div>
  );
}

function QrView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[1.5vh]">
      <JoinQr size="min(60vh, 50vw)" />
      <div className="text-[clamp(1.3rem,2.4vw,3rem)] font-bold">
        Скануй QR — голосуй і став запитання
      </div>
      <div className="text-[clamp(0.9rem,1.3vw,1.6rem)] text-muted-foreground">
        Без реєстрації, анонімно
      </div>
    </div>
  );
}

const OPTION_STYLES = {
  a: 'bg-violet-500',
  b: 'bg-amber-400',
} as const;

function VotingView({ poll, results }: { poll: TalkShowPoll; results: TalkShowCounts | null }) {
  const total = results?.total ?? 0;
  // Second share is the remainder so the pair always adds up to 100.
  const pctA = total ? Math.round(((results?.a ?? 0) / total) * 100) : 0;
  const pctB = total ? 100 - pctA : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mx-auto max-w-[90%] text-center text-[clamp(1.8rem,3.8vw,4.4rem)] font-extrabold leading-tight">
        {poll.text}
      </h1>

      <div className="mx-auto mt-[2vw] flex w-full max-w-[85vw] flex-1 flex-col justify-center gap-[2.5vw]">
        <OptionBar
          label={poll.optionA}
          style={OPTION_STYLES.a}
          count={results?.a}
          pct={pctA}
          hidden={!results}
        />
        <OptionBar
          label={poll.optionB}
          style={OPTION_STYLES.b}
          count={results?.b}
          pct={pctB}
          hidden={!results}
        />
      </div>

      <div className="text-center text-[clamp(1rem,1.5vw,1.8rem)] text-muted-foreground">
        {results ? `Усього голосів: ${total}` : 'Результати приховані'}
      </div>
    </div>
  );
}

function OptionBar({
  label,
  style,
  count,
  pct,
  hidden,
}: {
  label: string;
  style: string;
  count?: number;
  pct: number;
  hidden: boolean;
}) {
  return (
    <div>
      <div className="mb-[0.6vw] flex items-baseline justify-between gap-[2vw]">
        <div className="min-w-0 break-words text-[clamp(1.5rem,3vw,3.6rem)] font-extrabold">
          {label}
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[clamp(2rem,4.5vw,5.5rem)] font-extrabold leading-none">
            {hidden ? '?' : `${pct}%`}
          </span>
          {!hidden && (
            <span className="ml-[1vw] text-[clamp(1rem,1.8vw,2.2rem)] text-muted-foreground">
              {count}
            </span>
          )}
        </div>
      </div>
      <div className="h-[clamp(1.4rem,3vw,3.6rem)] overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all duration-700', style)}
          style={{ width: hidden ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuestionsView({ state }: { state: TalkShowState }) {
  const { featuredQuestion, questions } = state;

  if (featuredQuestion) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <div className="mb-[1.5vw] text-[clamp(1rem,1.6vw,2rem)] font-bold uppercase tracking-wide text-muted-foreground">
          Запитання від глядача
        </div>
        <p className="max-w-[90%] break-words text-[clamp(2rem,4.6vw,5.6rem)] font-extrabold leading-tight">
          {featuredQuestion.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="mb-[1.5vw] text-center text-[clamp(1.8rem,3.2vw,3.8rem)] font-extrabold">
        Запитання від глядачів
      </h1>
      {questions.length === 0 ? (
        <Centered title="Поки що немає запитань" subtitle="Скануй QR і став своє" />
      ) : (
        // Newest first. Cards that do not fit wrap into a second column outside the
        // overflow-hidden box, so none is ever cut in half.
        <div className="mx-auto flex min-h-0 w-full max-w-[90vw] flex-1 flex-col flex-wrap content-start gap-[0.9vw] overflow-hidden">
          {questions.map((q) => (
            <div
              key={q.id}
              className="w-full shrink-0 rounded-2xl border border-border bg-card px-[1.6vw] py-[1vw] text-[clamp(1.1rem,1.9vw,2.3rem)] font-semibold leading-snug"
            >
              <span className="line-clamp-3 break-words">{q.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
