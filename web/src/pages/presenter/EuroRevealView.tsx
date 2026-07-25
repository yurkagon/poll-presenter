import type { Team, EventSnapshot } from '@shared/types';
import { BASE_POINTS, WEIGHT_MULTIPLIER } from '@shared/types';
import { rankIndices } from '@shared/ranking';
import { audienceScore, round1, MAX_EURO } from '@shared/euro';
import { BigScreen } from '@/components/frames/BigScreen';
import { cn } from '@/lib/utils';

/**
 * Eurovision-style reveal. Jury marks (0–12 each) are already visible; this
 * reveals the hidden audience score (0–12, normalized) team-by-team on top,
 * for a combined 0–24. Then it shows how the combined scores convert to places
 * → tournament points (so a 0.1 gap = a place apart, but both map to 12/10/8…).
 */
export function EuroRevealView({
  snapshot,
  teams,
  step,
  phase,
}: {
  snapshot: EventSnapshot;
  teams: Team[];
  step: number;
  phase: 'audience' | 'done';
}) {
  const audienceRaw = (snapshot.result?.audienceRaw ?? {}) as Record<string, number>;
  const voters = snapshot.result?.audienceVoters ?? 0;
  const mult = WEIGHT_MULTIPLIER[snapshot.event.weight] ?? 1;

  const juryOf = (teamId: string) =>
    snapshot.jury.find((j) => j.teamId === teamId)?.points ?? 0;
  const audOf = (teamId: string) => audienceScore(audienceRaw[teamId] ?? 0, voters);

  const ordered = [...teams].sort((a, b) => a.order - b.order);
  const audienceRevealed = Math.min(step, teams.length);

  // Combined (full) score used for the final ranking + conversion.
  const fullTotals = Object.fromEntries(
    teams.map((t) => [t.id, juryOf(t.id) + audOf(t.id)]),
  );
  const finalRanked = [...teams].sort((a, b) => fullTotals[b.id] - fullTotals[a.id]);
  const finalRanks = rankIndices(
    finalRanked.map((r) => r.id),
    fullTotals,
  );
  const tournamentPoints = (rank: number) =>
    rank < BASE_POINTS.length ? Math.round(BASE_POINTS[rank] * mult) : 0;

  return (
    <BigScreen
      brandIcon="🎤"
      live="ТВОРЧИЙ ВЕЧІР · РЕВІЛ"
      liveTone="gold"
      title={phase === 'done' ? '🏆 Підсумок вечора' : 'Оголошуємо бали глядачів'}
      subtitle={
        phase === 'done'
          ? 'Бали журі + глядачів → місця → бали в таблицю'
          : `Додаємо таємні голоси ${voters} глядачів до балів журі`
      }
    >
      <div className="mb-3 flex justify-center gap-5 text-xs font-bold text-[#9db3c8]">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: '#3ad0ff' }} /> Журі
          (макс 12)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ background: '#ffcb3d' }} /> Глядачі
          (макс 12)
        </span>
      </div>

      {phase !== 'done' && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-3">
          {ordered.map((team, idx) => {
            const jury = juryOf(team.id);
            const aud = idx < audienceRevealed ? audOf(team.id) : 0;
            return (
              <div
                key={team.id}
                className="grid grid-cols-[34px_150px_1fr_130px] items-center gap-3"
              >
                <div
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[15px]"
                  style={{ background: team.color }}
                >
                  {team.icon}
                </div>
                <div className="truncate text-[12.5px] font-extrabold">{team.name}</div>
                <div className="flex h-[22px] overflow-hidden rounded-lg bg-white/[0.06]">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${(jury / MAX_EURO) * 100}%`,
                      background: 'linear-gradient(90deg,#3d7fe0,#3ad0ff)',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${(aud / MAX_EURO) * 100}%`,
                      background: 'linear-gradient(90deg,#ffcb3d,#ff9f45)',
                    }}
                  />
                </div>
                <div className="text-right text-[11px] font-bold text-[#9db3c8]">
                  <span style={{ color: '#3ad0ff' }}>{round1(jury)}</span>
                  {' + '}
                  <span style={{ color: '#ffcb3d' }}>{round1(aud)}</span>
                  {' = '}
                  <span className="font-display text-sm text-white">
                    {round1(jury + aud)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {phase === 'done' && (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
          <div className="mb-2 grid grid-cols-[36px_1fr_150px_110px] items-center gap-3 px-3 text-[10.5px] font-extrabold uppercase tracking-wide text-[#8ea2b6]">
            <span>Місце</span>
            <span>Команда</span>
            <span className="text-right">Журі + глядачі</span>
            <span className="text-right">У таблицю</span>
          </div>
          {finalRanked.map((team, i) => {
            const rank = finalRanks[i];
            const jury = juryOf(team.id);
            const aud = audOf(team.id);
            return (
              <div
                key={team.id}
                className={cn(
                  'grid grid-cols-[36px_1fr_150px_110px] items-center gap-3 rounded-xl border px-3 py-2.5',
                  rank === 0
                    ? 'border-[#ffcb3d]/40 bg-[#ffcb3d]/10'
                    : 'border-white/[0.08] bg-white/[0.04]',
                  'mb-1.5',
                )}
              >
                <span
                  className={cn(
                    'font-display text-xl',
                    rank === 0 ? 'text-[#ffcb3d]' : 'text-[#8ea2b6]',
                  )}
                >
                  {rank + 1}
                </span>
                <span className="flex items-center gap-2 truncate font-bold">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    style={{ background: team.color }}
                  >
                    {team.icon}
                  </span>
                  {team.name}
                </span>
                <span className="text-right text-[12px] font-bold text-[#9db3c8]">
                  <span style={{ color: '#3ad0ff' }}>{round1(jury)}</span> +{' '}
                  <span style={{ color: '#ffcb3d' }}>{round1(aud)}</span> ={' '}
                  <span className="font-display text-base text-white">
                    {round1(jury + aud)}
                  </span>
                </span>
                <span className="text-right font-display text-2xl text-white">
                  +{tournamentPoints(rank)}
                </span>
              </div>
            );
          })}
          <p className="mt-2 text-center text-[11.5px] font-semibold text-[#9db3c8]">
            Навіть якщо різниця між командами лише 0.1 бала — це різні місця, і в
            турнірну таблицю йдуть бали за місце (1-ше — {tournamentPoints(0)}, 2-ге —{' '}
            {tournamentPoints(1)}, 3-тє — {tournamentPoints(2)}…).
          </p>
        </div>
      )}
    </BigScreen>
  );
}
