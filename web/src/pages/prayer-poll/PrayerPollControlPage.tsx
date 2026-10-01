import { useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  PRAYER_POLL_MAX_AGE,
  PRAYER_POLL_MIN_AGE,
  type PrayerPollEntry,
} from '@shared/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { usePrayerPoll } from './usePrayerPoll';

export function PrayerPollControlPage() {
  const { state, setState } = usePrayerPoll('presenter');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<PrayerPollEntry[]>([]);

  const age = Number(value);
  const valid =
    Number.isInteger(age) && age >= PRAYER_POLL_MIN_AGE && age <= PRAYER_POLL_MAX_AGE;
  const finished = state?.status === 'FINISHED';

  // Ages are presenter-only (not in the broadcast), so refetch whenever the state changes.
  useEffect(() => {
    if (!state) return;
    api.prayerPoll.entries().then(setEntries).catch(() => {});
  }, [state?.count, state?.round, state?.status]);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.age - a.age), [entries]);

  const run = async (action: () => Promise<NonNullable<typeof state>>) => {
    setError('');
    try {
      setState(await action());
    } catch {
      setError('Не вдалося виконати дію. Перевірте з’єднання або увійдіть знову.');
    }
  };

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || finished) return;
    await run(() => api.prayerPoll.addManual(age));
    setValue('');
  };

  const remove = (e: PrayerPollEntry) => {
    if (window.confirm(`Видалити відповідь «${e.age}»?`)) run(() => api.prayerPoll.remove(e.id));
  };

  const finish = () => {
    if (!state?.count) return;
    if (window.confirm(`Завершити опитування і показати середній вік (${state.count} голосів)?`)) {
      run(api.prayerPoll.finish);
    }
  };

  const reset = () => {
    if (window.confirm('Почати спочатку? Усі голоси буде видалено.')) run(api.prayerPoll.reset);
  };

  const card = 'rounded-2xl border border-white/80 bg-white/70 shadow-glass backdrop-blur';

  return (
    <div className="ef-surface-light h-[100dvh] overflow-hidden p-4">
      <div className="mx-auto flex h-full max-w-md flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-lg text-ink">Опитування: середній вік</h1>
          <div className="text-right leading-tight">
            <span className="font-display text-3xl text-ink">{state?.count ?? '–'}</span>
            <span className="ml-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">
              проголосувало
            </span>
          </div>
        </div>

        {finished && state?.averageAge != null && (
          <div className={`${card} px-4 py-2 text-center font-bold text-accent-blue`}>
            Середній вік: {state.averageAge.toFixed(1)}
          </div>
        )}

        {!finished && (
          <form onSubmit={addManual} className={`${card} p-3`}>
            <label className="mb-1.5 block text-xs font-bold text-ink">
              Додати голос за людину без телефону
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={3}
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
                placeholder="Вік"
                className="w-full rounded-xl border-[1.5px] border-[#e4e8eb] bg-white px-3 py-2 text-center font-display text-xl text-ink outline-none focus:border-accent-blue"
              />
              <Button type="submit" disabled={!valid}>
                Додати
              </Button>
            </div>
          </form>
        )}

        {/* Takes all remaining height; only the list scrolls, so the page never grows. */}
        <div className={`${card} flex min-h-0 flex-1 flex-col p-3`}>
          <div className="mb-2 text-xs font-bold text-ink">
            Усі відповіді · від більшої до меншої
          </div>
          {sorted.length === 0 ? (
            <p className="text-sm text-ink-soft">Поки що немає відповідей.</p>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-[#e4e8eb] overflow-y-auto pr-1">
              {sorted.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-1.5">
                  <span className="w-12 font-display text-xl text-ink">{e.age}</span>
                  <span className="flex-1 text-xs font-semibold text-ink-soft">
                    {e.source === 'phone' ? 'з телефона' : 'додав ведучий'}
                  </span>
                  {!finished && (
                    <button
                      type="button"
                      aria-label={`Видалити відповідь ${e.age}`}
                      onClick={() => remove(e)}
                      className="rounded-lg p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        <div className="flex gap-2">
          {!finished && (
            <Button className="flex-1" onClick={finish} disabled={!state?.count}>
              Завершити і показати
            </Button>
          )}
          <Button variant="outline" className={finished ? 'flex-1' : ''} onClick={reset}>
            Почати спочатку
          </Button>
        </div>
      </div>
    </div>
  );
}
