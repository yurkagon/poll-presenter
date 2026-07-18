import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Day, EventDto } from '@shared/types';
import { api } from '@/lib/api';
import { categoryOf, typeOf, weightOf } from '@/lib/constants';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'чернетка',
  LOBBY: 'лобі',
  OPEN: 'йде голосування',
  CLOSED: 'закрито',
  REVEALED: 'розкрито',
  COMPLETED: 'завершено',
};

export function AdminSchedulePage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [days, setDays] = useState<Day[]>([]);

  useEffect(() => {
    api.events.list().then(setEvents).catch(() => {});
    api.days.list().then(setDays).catch(() => {});
  }, []);

  const dayGroups = [
    ...days.map((d) => ({ day: d, items: events.filter((e) => e.dayId === d.id) })),
    { day: null, items: events.filter((e) => !e.dayId) },
  ].filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink">Розклад програми</h2>
        <span className="rounded-full border border-white/90 bg-white/70 px-3 py-1 text-[11.5px] font-bold text-ink-soft">
          {events.length} подій
        </span>
      </div>

      {dayGroups.map(({ day, items }) => (
        <div key={day?.id ?? 'none'}>
          <div className="mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
            {day?.label ?? 'Без дня'}
          </div>
          {items.map((e) => {
            const c = categoryOf(e.category);
            const t = typeOf(e.type);
            const w = weightOf(e.weight);
            return (
              <div
                key={e.id}
                className="mb-2 flex items-center gap-3 rounded-2xl border border-[#eef0f2] bg-[#f8f9fb] px-4 py-3"
              >
                <div
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm"
                  style={{ background: c.colorVar }}
                >
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-extrabold text-ink">{e.name}</div>
                  <div className="text-[11px] font-semibold text-ink-soft">
                    {t.icon} {t.title} · {STATUS_LABEL[e.status]}
                  </div>
                </div>
                <div className="text-[11px] font-extrabold text-accent-blue">×{w.mult}</div>
              </div>
            );
          })}
        </div>
      ))}

      {events.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-faint">
          Подій ще немає — почни з «+ Нова подія»
        </p>
      )}

      <Link
        to="/admin/events/new"
        className="mt-3 block rounded-2xl border-[1.5px] border-dashed border-[#c9d0d6] py-3.5 text-center font-bold text-ink-soft hover:border-accent-blue hover:text-accent-blue"
      >
        + Створити нову подію
      </Link>
    </div>
  );
}
