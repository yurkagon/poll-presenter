import { useEffect, useMemo, useState } from 'react';
import {
  TALK_SHOW_QUESTION_COOLDOWN_MS,
  TALK_SHOW_QUESTION_MAX,
  type TalkShowOption,
  type TalkShowState,
} from '@shared/talk-show';
import { talkShowApi, TalkShowApiError } from '@/lib/talk-show-api';
import { ensureDeviceId } from '@/lib/device-id';
import { useForceDark } from '@/lib/useForceDark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTalkShow } from './useTalkShow';

type Tab = 'vote' | 'ask';

/** Phone page behind the QR code: vote and send anonymous questions. */
export function TalkShowJoinPage() {
  useForceDark();
  const deviceId = useMemo(ensureDeviceId, []);
  const { state, setState, reload } = useTalkShow(deviceId);
  const [tab, setTab] = useState<Tab>('vote');

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background px-4 pb-8 pt-5 text-foreground">
      <div className="mb-4 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        🎙 Ток-шоу
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {(
          [
            ['vote', 'Голосування'],
            ['ask', 'Запитання'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded-xl py-2.5 text-sm font-bold transition-colors',
              tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!state ? (
        <Message title="Завантаження…" />
      ) : state.finished ? (
        <Message title="Шоу завершено" text="Дякуємо, що були з нами!" />
      ) : tab === 'vote' ? (
        <VoteTab state={state} deviceId={deviceId} onState={setState} onReload={reload} />
      ) : (
        <AskTab deviceId={deviceId} />
      )}
    </div>
  );
}

function Message({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <div className="text-2xl font-extrabold">{title}</div>
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  );
}

function VoteTab({
  state,
  deviceId,
  onState,
  onReload,
}: {
  state: TalkShowState;
  deviceId: string;
  onState: (s: TalkShowState) => void;
  onReload: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const poll = state.poll;

  if (!poll) {
    return <Message title="Чекаємо на запитання" text="Ведучий скоро запустить голосування" />;
  }

  const labels: Record<TalkShowOption, string> = { a: poll.optionA, b: poll.optionB };
  const voted = state.myVote ?? null;
  const open = poll.status === 'OPEN';

  const vote = async (option: TalkShowOption) => {
    if (busy || voted || !open) return;
    setBusy(true);
    setError('');
    try {
      onState(await talkShowApi.vote(deviceId, poll.id, option));
    } catch (e) {
      if (e instanceof TalkShowApiError && e.status === 409) {
        onReload(); // already voted, or voting just closed — show the real state
      } else {
        setError('Не вдалося надіслати голос. Спробуйте ще раз.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mb-6 break-words text-center text-2xl font-extrabold leading-snug">
        {poll.text}
      </h1>

      <div className="flex flex-1 flex-col gap-4">
        {(['a', 'b'] as const).map((option) => {
          const chosen = voted === option;
          return (
            <button
              key={option}
              type="button"
              disabled={busy || !!voted || !open}
              onClick={() => vote(option)}
              className={cn(
                'min-h-[9rem] flex-1 break-words rounded-3xl px-4 text-3xl font-extrabold transition-all',
                option === 'a' ? 'bg-violet-500 text-white' : 'bg-amber-400 text-black',
                (voted || !open) && !chosen && 'opacity-30',
                chosen && 'ring-4 ring-white',
              )}
            >
              {labels[option]}
              {chosen && <div className="mt-1 text-base font-bold">✓ Ваш вибір</div>}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center font-semibold text-muted-foreground">
        {voted
          ? 'Дякуємо, ваш голос враховано!'
          : !open
            ? 'Голосування закрите'
            : 'Оберіть один варіант'}
      </p>
      {error && <p className="mt-2 text-center text-sm font-semibold text-red-500">{error}</p>}
    </div>
  );
}

function AskTab({ deviceId }: { deviceId: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  const waitSec = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const valid = text.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy || waitSec > 0) return;
    setBusy(true);
    setError('');
    setSent(false);
    try {
      await talkShowApi.ask(deviceId, text);
      setText('');
      setSent(true);
      setNow(Date.now());
      setCooldownUntil(Date.now() + TALK_SHOW_QUESTION_COOLDOWN_MS);
    } catch (err) {
      if (err instanceof TalkShowApiError && err.status === 429) {
        setNow(Date.now());
        setCooldownUntil(Date.now() + (err.retryAfterMs ?? TALK_SHOW_QUESTION_COOLDOWN_MS));
        setError('Занадто часто. Зачекайте трохи перед наступним запитанням.');
      } else if (err instanceof TalkShowApiError && err.status === 409) {
        setError('Зараз надсилання запитань недоступне.');
      } else {
        setError('Не вдалося надіслати. Спробуйте ще раз.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col">
      <h1 className="mb-2 text-center text-2xl font-extrabold">Ваше запитання</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Анонімно — без імені і реєстрації
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, TALK_SHOW_QUESTION_MAX));
          setSent(false);
        }}
        rows={7}
        placeholder="Напишіть запитання…"
        className="w-full flex-1 resize-none rounded-2xl border-2 border-input bg-card p-4 text-lg outline-none focus:border-primary"
      />
      <div className="mb-4 mt-1 text-right text-xs text-muted-foreground">
        {text.length} / {TALK_SHOW_QUESTION_MAX}
      </div>

      <Button type="submit" size="xl" disabled={!valid || busy || waitSec > 0} className="w-full">
        {waitSec > 0 ? `Наступне можна через ${waitSec} с` : busy ? 'Надсилання…' : 'Надіслати'}
      </Button>

      {sent && (
        <p className="mt-3 text-center font-semibold text-emerald-400">
          ✓ Запитання надіслано. Воно з'явиться на екрані.
        </p>
      )}
      {error && <p className="mt-3 text-center text-sm font-semibold text-red-500">{error}</p>}
    </form>
  );
}
