import { useEffect, useState } from 'react';
import type { Team, Day, LeaderboardDto, EventCategory } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Chip } from '@/components/ui/chip';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Scope = 'overall' | 'day' | 'category';

export function LeaderboardView({
  teams,
  teamById,
}: {
  teams: Team[];
  teamById: (id: string) => Team | undefined;
}) {
  const [scope, setScope] = useState<Scope>('overall');
  const [days, setDays] = useState<Day[]>([]);
  const [dayId, setDayId] = useState<string | undefined>();
  const [mode, setMode] = useState<'cumulative' | 'single'>('cumulative');
  const [category, setCategory] = useState<EventCategory>('PUNCT');
  const [data, setData] = useState<LeaderboardDto | null>(null);

  useEffect(() => {
    api.days.list().then((d) => {
      setDays(d);
      if (d.length) setDayId((prev) => prev ?? d[d.length - 1].id);
    });
  }, []);

  useEffect(() => {
    api
      .leaderboard({
        scope,
        dayId: scope === 'day' ? dayId : undefined,
        mode: scope === 'day' ? mode : undefined,
        category: scope === 'category' ? category : undefined,
      })
      .then(setData)
      .catch(() => {});
  }, [scope, dayId, mode, category]);

  const rows = data?.rows ?? [];
  const max = Math.max(1, ...rows.map((r) => r.points));

  return (
    <BigScreen live="ТУРНІРНА ТАБЛИЦЯ" title="Загальний рейтинг команд">
      <SegmentedControl<Scope>
        value={scope}
        onChange={setScope}
        options={[
          { value: 'overall', label: 'Загалом' },
          { value: 'day', label: 'По днях' },
          { value: 'category', label: 'По категоріях' },
        ]}
      />

      {scope === 'day' && (
        <>
          <div className="mb-[0.5vw] flex flex-wrap justify-center gap-[0.4vw]">
            {days.map((d) => (
              <Chip key={d.id} tone="dark" active={d.id === dayId} onClick={() => setDayId(d.id)}>
                {d.label}
              </Chip>
            ))}
          </div>
          <div className="mb-[0.6vw] flex flex-wrap justify-center gap-[0.4vw]">
            <Chip tone="dark" active={mode === 'cumulative'} onClick={() => setMode('cumulative')}>
              Накопичувально
            </Chip>
            <Chip tone="dark" active={mode === 'single'} onClick={() => setMode('single')}>
              Тільки цей день
            </Chip>
          </div>
        </>
      )}

      {scope === 'category' && (
        <div className="mb-[0.6vw] flex flex-wrap justify-center gap-[0.4vw]">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} tone="dark" active={c.id === category} onClick={() => setCategory(c.id)}>
              {c.icon} {c.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-[0.3vw] overflow-hidden">
        {rows.map((row) => {
          const team = teamById(row.teamId);
          if (!team) return null;
          const top = row.rank === 1 && row.points > 0;
          return (
            <div
              key={row.teamId}
              className={cn(
                'grid grid-cols-[clamp(1.3rem,1.8vw,2rem)_clamp(1.7rem,2.4vw,2.8rem)_1fr_auto] items-center gap-[1vw] rounded-xl border px-[1.2vw] py-[0.32vw] transition-all',
                top ? 'border-[#ffcb3d]/35 bg-[#ffcb3d]/10' : 'border-white/[0.09] bg-white/[0.045]',
              )}
            >
              <div className={cn('font-display text-[clamp(1rem,1.4vw,1.6rem)]', top ? 'text-[#ffcb3d]' : 'text-[#8ea2b6]')}>
                {row.rank}
              </div>
              <div
                className="flex h-[clamp(1.7rem,2.4vw,2.8rem)] w-[clamp(1.7rem,2.4vw,2.8rem)] items-center justify-center rounded-full text-[clamp(0.9rem,1.2vw,1.4rem)]"
                style={{ background: team.color }}
              >
                {team.icon}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[clamp(1.05rem,1.5vw,1.8rem)] font-extrabold">{team.name}</div>
                <div className="mt-[0.3vw] h-[clamp(4px,0.5vw,8px)] max-w-[26vw] overflow-hidden rounded bg-white/[0.06]">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(row.points / max) * 100}%`, background: team.color }}
                  />
                </div>
              </div>
              <div className="text-right font-display text-[clamp(1.2rem,1.8vw,2.2rem)]">{row.points}</div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="mt-[3vw] text-center tv-subtitle text-[#9db3c8]">
            Ще немає завершених подій для підрахунку
          </p>
        )}
      </div>
    </BigScreen>
  );
}
