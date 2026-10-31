import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import {
  TALK_SHOW_EVENTS,
  TALK_SHOW_OPTION_MAX,
  TALK_SHOW_POLL_TEXT_MAX,
  type TalkShowAdminPoll,
  type TalkShowAdminState,
  type TalkShowScreenMode,
} from '@shared/talk-show';
import { talkShowApi, TalkShowApiError } from '@/lib/talk-show-api';
import { socket } from '@/lib/socket';
import { useForceDark } from '@/lib/useForceDark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { JoinQr, talkShowJoinUrl } from './JoinQr';

const card = 'rounded-2xl border border-border bg-card p-4';
const input =
  'w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary';
const sectionTitle = 'mb-3 text-xs font-extrabold uppercase tracking-wide text-muted-foreground';

const SCREEN_MODES: { id: TalkShowScreenMode; label: string }[] = [
  { id: 'VOTING', label: 'Голосування' },
  { id: 'QUESTIONS', label: 'Запитання' },
  { id: 'QR', label: 'QR-код' },
];

/** Host panel. Locked behind a password; every action shows on screen immediately. */
export function TalkShowAdminPage() {
  useForceDark();
  const [auth, setAuth] = useState<'pending' | 'ok' | 'no'>('pending');

  useEffect(() => {
    talkShowApi
      .me()
      .then(() => setAuth('ok'))
      .catch(() => setAuth('no'));
  }, []);

  if (auth === 'pending') {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground">Завантаження…</div>;
  }
  if (auth === 'no') return <LoginForm onDone={() => setAuth('ok')} />;
  return <Panel onLoggedOut={() => setAuth('no')} />;
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await talkShowApi.login(password);
      onDone();
    } catch (err) {
      const status = err instanceof TalkShowApiError ? err.status : 0;
      setError(status === 429 ? 'Забагато спроб. Спробуйте за кілька хвилин.' : 'Невірний пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-foreground">
      <form onSubmit={submit} className={cn(card, 'w-full max-w-sm p-7')}>
        <h1 className="mb-1 text-2xl font-extrabold">🎙 Ток-шоу</h1>
        <p className="mb-6 text-sm text-muted-foreground">Вхід для ведучого</p>
        <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
          Пароль
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(input, 'mb-5')}
        />
        {error && <p className="mb-4 text-sm font-semibold text-red-500">{error}</p>}
        <Button type="submit" size="lg" disabled={busy || !password} className="w-full">
          {busy ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </div>
  );
}

function Panel({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [admin, setAdmin] = useState<TalkShowAdminState | null>(null);
  const [error, setError] = useState('');

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof TalkShowApiError && e.status === 401) return onLoggedOut();
      setError(e instanceof TalkShowApiError ? e.message : 'Не вдалося виконати дію.');
    },
    [onLoggedOut],
  );

  const reload = useCallback(
    () => talkShowApi.adminState().then(setAdmin).catch(handleError),
    [handleError],
  );

  // The socket push carries the public view only — refetch the host view (debounced
  // so a burst of votes is one request).
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    const refresh = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(reload, 150);
    };
    const join = () => {
      socket.emit(TALK_SHOW_EVENTS.JOIN);
      reload();
    };
    if (socket.connected) join();
    socket.on('connect', join);
    socket.on(TALK_SHOW_EVENTS.STATE, refresh);
    return () => {
      clearTimeout(timer.current);
      socket.off('connect', join);
      socket.off(TALK_SHOW_EVENTS.STATE, refresh);
    };
  }, [reload]);

  const run = async (action: () => Promise<TalkShowAdminState>) => {
    setError('');
    try {
      setAdmin(await action());
    } catch (e) {
      handleError(e);
    }
  };

  const logout = async () => {
    await talkShowApi.logout().catch(() => {});
    onLoggedOut();
  };

  if (!admin) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground">Завантаження…</div>;
  }

  const hasNext = admin.polls.some(
    (p, i) =>
      p.status === 'DRAFT' &&
      i > admin.polls.findIndex((x) => x.id === admin.poll?.id),
  );

  return (
    <div className="min-h-[100dvh] bg-background p-4 text-foreground lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold">🎙 Ток-шоу · Панель ведучого</h1>
          <div className="flex flex-wrap items-center gap-2">
            {admin.finished && (
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400">
                Шоу завершено
              </span>
            )}
            <Button asChild variant="outline" size="sm">
              <a href="/talk-show/screen" target="_blank" rel="noreferrer">
                Відкрити екран ↗
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              Вийти
            </Button>
          </div>
        </div>

        {error && <p className="mb-3 text-sm font-semibold text-red-500">{error}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Voting */}
          <section className={cn(card, 'lg:row-span-2')}>
            <div className={sectionTitle}>Голосування «Або / або»</div>
            <PollForm disabled={admin.finished} onCreate={(p) => run(() => talkShowApi.createPoll(p))} />

            <div className="mb-3 mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={admin.finished || !hasNext}
                onClick={() => run(talkShowApi.startNext)}
              >
                Запустити наступне ▶
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => run(() => talkShowApi.setResultsVisible(!admin.resultsVisible))}
              >
                {admin.resultsVisible ? (
                  <>
                    <EyeOff size={14} className="mr-1.5" /> Приховати результати
                  </>
                ) : (
                  <>
                    <Eye size={14} className="mr-1.5" /> Показати результати
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {admin.polls.length === 0 && (
                <p className="text-sm text-muted-foreground">Додайте перше запитання вище.</p>
              )}
              {admin.polls.map((p) => (
                <PollRow
                  key={p.id}
                  poll={p}
                  onScreen={admin.poll?.id === p.id}
                  finished={admin.finished}
                  onStart={() => run(() => talkShowApi.startPoll(p.id))}
                  onClose={() => run(() => talkShowApi.closePoll(p.id))}
                  onDelete={() => {
                    if (window.confirm(`Видалити «${p.text}»?`)) run(() => talkShowApi.deletePoll(p.id));
                  }}
                />
              ))}
            </div>
          </section>

          {/* Screen + QR */}
          <section className={card}>
            <div className={sectionTitle}>Екран шоу</div>
            <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
              {SCREEN_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => run(() => talkShowApi.setScreenMode(m.id))}
                  className={cn(
                    'rounded-lg py-2 text-sm font-bold transition-colors',
                    admin.screenMode === m.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className={sectionTitle}>QR-код для глядачів</div>
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <JoinQr size="100%" />
              </div>
              <div className="min-w-0 text-sm">
                <div className="break-all font-mono text-xs text-muted-foreground">
                  {talkShowJoinUrl()}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => run(() => talkShowApi.setScreenMode('QR'))}
                >
                  Показати QR на екрані
                </Button>
              </div>
            </div>
          </section>

          {/* Questions */}
          <section className={cn(card, 'lg:col-span-2')}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className={cn(sectionTitle, 'mb-0')}>
                Запитання глядачів · {admin.allQuestions.length}
              </div>
              {admin.featuredQuestion && (
                <Button size="sm" variant="secondary" onClick={() => run(() => talkShowApi.featureQuestion(null))}>
                  ← Повернутись до списку
                </Button>
              )}
            </div>
            {admin.allQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Запитань ще немає.</p>
            ) : (
              <ul className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
                {admin.allQuestions.map((q) => {
                  const featured = admin.featuredQuestion?.id === q.id;
                  return (
                    <li
                      key={q.id}
                      className={cn(
                        'flex flex-wrap items-start gap-3 rounded-xl border border-border p-3',
                        q.hidden && 'opacity-50',
                        featured && 'border-primary',
                      )}
                    >
                      <p className="min-w-0 flex-1 break-words text-sm">{q.text}</p>
                      <div className="flex shrink-0 gap-1.5">
                        <Button
                          size="sm"
                          variant={featured ? 'default' : 'secondary'}
                          disabled={q.hidden}
                          onClick={() => run(() => talkShowApi.featureQuestion(q.id))}
                        >
                          {featured ? 'На екрані' : 'На екран'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => run(() => talkShowApi.setQuestionHidden(q.id, !q.hidden))}
                        >
                          {q.hidden ? 'Показати' : 'Приховати'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          aria-label="Видалити запитання"
                          onClick={() => {
                            if (window.confirm('Видалити запитання назавжди?')) {
                              run(() => talkShowApi.deleteQuestion(q.id));
                            }
                          }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Finish */}
          <section className={cn(card, 'lg:col-span-2')}>
            <div className={sectionTitle}>Завершення</div>
            <p className="mb-3 text-sm text-muted-foreground">
              «Завершити шоу» зупиняє нові голоси й запитання та видаляє дані пристроїв; результати
              і запитання залишаються для перегляду. «Очистити все» стирає всі дані й починає шоу
              з нуля.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                disabled={admin.finished}
                onClick={() => {
                  if (window.confirm('Завершити шоу? Нові голоси й запитання більше не приймаються.')) {
                    run(talkShowApi.finish);
                  }
                }}
              >
                Завершити шоу
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Видалити всі голосування, голоси й запитання?')) run(talkShowApi.reset);
                }}
              >
                Очистити все
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PollForm({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: (p: { text: string; optionA: string; optionB: string }) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const valid = text.trim() && optionA.trim() && optionB.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || disabled) return;
    await onCreate({ text, optionA, optionB });
    setText('');
    setOptionA('');
    setOptionB('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={TALK_SHOW_POLL_TEXT_MAX}
        rows={2}
        placeholder="Текст запитання"
        className={cn(input, 'resize-none')}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={optionA}
          onChange={(e) => setOptionA(e.target.value)}
          maxLength={TALK_SHOW_OPTION_MAX}
          placeholder="Варіант 1"
          className={input}
        />
        <input
          value={optionB}
          onChange={(e) => setOptionB(e.target.value)}
          maxLength={TALK_SHOW_OPTION_MAX}
          placeholder="Варіант 2"
          className={input}
        />
      </div>
      <Button type="submit" size="sm" disabled={!valid || disabled} className="self-start">
        + Додати запитання
      </Button>
    </form>
  );
}

const STATUS_LABEL = { DRAFT: 'Чернетка', OPEN: 'Відкрите', CLOSED: 'Закрите' } as const;

function PollRow({
  poll,
  onScreen,
  finished,
  onStart,
  onClose,
  onDelete,
}: {
  poll: TalkShowAdminPoll;
  onScreen: boolean;
  finished: boolean;
  onStart: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const { a, b, total } = poll.counts;
  const pctA = total ? Math.round((a / total) * 100) : 0;

  return (
    <div className={cn('rounded-xl border border-border p-3', onScreen && 'border-primary')}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-bold">{poll.text}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
            poll.status === 'OPEN'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          {STATUS_LABEL[poll.status]}
          {onScreen && ' · на екрані'}
        </span>
      </div>

      <div className="mb-2 text-xs text-muted-foreground">
        <span className="font-bold text-violet-400">{poll.optionA}</span>: {a}
        {total > 0 && ` (${pctA}%)`} ·{' '}
        <span className="font-bold text-amber-400">{poll.optionB}</span>: {b}
        {total > 0 && ` (${100 - pctA}%)`} · усього {total}
      </div>

      <div className="flex gap-1.5">
        {poll.status === 'OPEN' ? (
          <Button size="sm" variant="secondary" onClick={onClose}>
            Закрити голосування
          </Button>
        ) : (
          <Button size="sm" disabled={finished} onClick={onStart}>
            {poll.status === 'CLOSED' ? 'Відкрити знову' : 'Запустити'}
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Видалити" onClick={onDelete}>
          <Trash2 size={15} />
        </Button>
      </div>
    </div>
  );
}
