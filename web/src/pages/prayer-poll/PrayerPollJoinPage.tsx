import { useEffect, useState } from 'react';
import { PRAYER_POLL_MAX_AGE, PRAYER_POLL_MIN_AGE } from '@shared/types';
import { api } from '@/lib/api';
import { ensureDeviceId } from '@/lib/identity';
import { PhoneScreen } from '@/components/frames/PhoneScreen';
import { PhoneStatus } from '@/pages/participant/PhoneStatus';
import { Button } from '@/components/ui/button';
import { usePrayerPoll } from './usePrayerPoll';

const votedKey = 'efrendship:prayerpoll:votedRound';

const readVotedRound = (): number | null => {
  const raw = localStorage.getItem(votedKey);
  return raw === null ? null : Number(raw);
};

export function PrayerPollJoinPage() {
  const { state } = usePrayerPoll('participant');
  const [votedRound, setVotedRound] = useState<number | null>(readVotedRound);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // A presenter reset starts a new round — let this phone vote again.
  useEffect(() => {
    if (state && votedRound !== null && votedRound !== state.round) {
      localStorage.removeItem(votedKey);
      setVotedRound(null);
      setValue('');
    }
  }, [state, votedRound]);

  if (!state) {
    return <PhoneStatus tag="єОпитування" title="Завантаження…" message="З'єднуємось з сервером" />;
  }

  if (state.status === 'FINISHED') {
    return (
      <PhoneStatus
        tag="єОпитування"
        title="Опитування завершено"
        message="Дякуємо! Середній вік дивіться на великому екрані 🙏"
      />
    );
  }

  if (votedRound === state.round) {
    return (
      <PhoneStatus
        tag="єОпитування"
        title="Дякуємо!"
        message="Ваш голос враховано. Результат скоро з'явиться на екрані."
      />
    );
  }

  const age = Number(value);
  const valid =
    Number.isInteger(age) && age >= PRAYER_POLL_MIN_AGE && age <= PRAYER_POLL_MAX_AGE;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await api.prayerPoll.vote(ensureDeviceId(), age);
      localStorage.setItem(votedKey, String(next.round));
      setVotedRound(next.round);
    } catch {
      setError('Не вдалося надіслати. Спробуйте ще раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PhoneScreen
        tag="єОпитування"
        title="Ваш вік"
        cta={
          <Button type="submit" size="xl" className="w-full" disabled={!valid || busy}>
            Надіслати
          </Button>
        }
      >
        <p className="mb-6 text-[15px] font-semibold text-ink-soft">
          Вкажіть, скільки вам повних років — так ми порахуємо середній вік нашої церкви.
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          autoComplete="off"
          maxLength={3}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          aria-label="Ваш вік"
          className="w-full rounded-2xl border-[1.5px] border-[#e4e8eb] bg-white px-4 py-5 text-center font-display text-6xl text-ink outline-none transition-colors focus:border-accent-blue"
        />
        {value !== '' && !valid && (
          <p className="mt-3 text-center text-sm font-semibold text-red-500">
            Введіть вік від {PRAYER_POLL_MIN_AGE} до {PRAYER_POLL_MAX_AGE}
          </p>
        )}
        {error && <p className="mt-3 text-center text-sm font-semibold text-red-500">{error}</p>}
      </PhoneScreen>
    </form>
  );
}
