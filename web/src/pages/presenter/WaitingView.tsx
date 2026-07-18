import type { EventSnapshot } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';

export function WaitingView({ snapshot }: { snapshot: EventSnapshot }) {
  const { totalVotes, expected } = snapshot.progress;
  const pct = expected ? Math.min(100, Math.round((totalVotes / expected) * 100)) : 0;
  const done = expected !== null && totalVotes >= expected;

  return (
    <BigScreen live="ГОЛОСУВАННЯ ТРИВАЄ" title={snapshot.event.name}>
      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div
          className="relative flex h-[150px] w-[150px] items-center justify-center rounded-full transition-all duration-1000"
          style={{
            background: `conic-gradient(var(--ef-glow) ${pct}%, rgba(255,255,255,0.08) 0)`,
          }}
        >
          <div className="absolute inset-2.5 rounded-full bg-[#0a1424]" />
          <span className="relative z-[2] font-display text-3xl">{pct}%</span>
        </div>

        <div className="flex gap-2">
          <span className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-glow" />
          <span className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-glow" style={{ animationDelay: '0.15s' }} />
          <span className="h-2.5 w-2.5 animate-bounce2 rounded-full bg-glow" style={{ animationDelay: '0.3s' }} />
        </div>

        <div className="max-w-sm text-center text-sm text-[#9db3c8]">
          {done
            ? 'Усі проголосували! Переходимо до результатів →'
            : `Проголосувало ${totalVotes}${expected ? ` з ${expected}` : ''} учасників…`}
        </div>
      </div>
    </BigScreen>
  );
}
