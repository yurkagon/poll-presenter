import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Day,
  EventCategory,
  EventType,
  EventWeight,
  ParticipantMode,
} from '@shared/types';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import {
  CATEGORIES,
  EVENT_TYPES,
  WEIGHTS,
  PARTICIPANT_MODES,
  BASE_POINTS,
  weightOf,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

export function AdminEventFormPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState<Day[]>([]);
  const [name, setName] = useState('');
  const [dayId, setDayId] = useState<string | null>(null);
  const [category, setCategory] = useState<EventCategory>('GENERAL');
  const [type, setType] = useState<EventType>('SCORE_ENTRY');
  const [weight, setWeight] = useState<EventWeight>('NORMAL');
  const [participantMode, setParticipantMode] = useState<ParticipantMode>('TEAMS');
  const [affectsScore, setAffectsScore] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.days.list().then((d) => {
      setDays(d);
      if (d.length) setDayId(d[0].id);
    });
  }, []);

  const mult = weightOf(weight).mult;

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.events.create({
        name: name.trim(),
        dayId,
        category,
        type,
        weight,
        participantMode,
        affectsScore,
      });
      navigate('/admin');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-lg text-ink">Нова подія</h2>

      <Field label="Назва події">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. Загальнотабірна гра" />
      </Field>

      <Field label="День зміни">
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Chip key={d.id} active={d.id === dayId} onClick={() => setDayId(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Категорія">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={c.id === category} onClick={() => setCategory(c.id)}>
              {c.icon} {c.label}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Як рахувати результат">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {EVENT_TYPES.map((t) => {
            const active = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  'relative rounded-2xl border-[1.5px] bg-[#fafbfc] p-3.5 text-left transition-all',
                  active ? 'border-ink bg-white shadow-glass' : 'border-[#eef0f2]',
                )}
              >
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent-green text-[11px] font-extrabold text-white">
                    ✓
                  </span>
                )}
                <div className="mb-2 text-lg">{t.icon}</div>
                <div className="mb-1 text-[12.5px] font-extrabold text-ink">{t.title}</div>
                <div className="text-[11px] font-semibold leading-tight text-ink-soft">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Вага події">
        <div className="flex flex-wrap gap-2">
          {WEIGHTS.map((w) => (
            <Chip key={w.id} active={w.id === weight} onClick={() => setWeight(w.id)}>
              {w.label} ×{w.mult}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Таблиця балів (авто)">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] p-4">
          {BASE_POINTS.map((p, i) => (
            <div key={i} className="min-w-[44px] text-center">
              <div className="text-[10px] font-extrabold uppercase text-ink-faint">{i + 1} місце</div>
              <div className="mt-0.5 font-display text-base text-ink">{Math.round(p * mult)}</div>
            </div>
          ))}
        </div>
      </Field>

      <Field label="Хто змагається">
        <div className="flex flex-wrap gap-2">
          {PARTICIPANT_MODES.map((m) => (
            <Chip
              key={m.id}
              active={m.id === participantMode}
              onClick={() => {
                setParticipantMode(m.id);
                setAffectsScore(m.id !== 'ADHOC');
              }}
            >
              {m.label}
            </Chip>
          ))}
        </div>
        {participantMode === 'ADHOC' && (
          <p className="mt-2 text-[11.5px] font-semibold text-ink-soft">
            Команди для цієї події додаси після збереження — на вкладці «Введення результату» чи «Керування».
          </p>
        )}
      </Field>

      <Field label="Впливає на загальний рейтинг">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] px-4 py-3.5">
          <div>
            <div className="text-[12.5px] font-bold text-ink">
              {affectsScore ? 'Так, додається в турнірну таблицю' : 'Ні, окрема нагорода'}
            </div>
          </div>
          <ToggleSwitch on={affectsScore} onToggle={() => setAffectsScore((v) => !v)} />
        </div>
      </Field>

      <Button onClick={save} disabled={busy || !name.trim()} className="w-full bg-ink" size="lg">
        Зберегти подію в розклад
      </Button>
    </div>
  );
}
