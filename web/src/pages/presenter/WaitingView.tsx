import type { EventSnapshot } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';

export function WaitingView({ snapshot }: { snapshot: EventSnapshot }) {
  const { totalVotes, expected } = snapshot.progress;
  const pct = expected ? Math.min(100, Math.round((totalVotes / expected) * 100)) : 0;
  const done = expected !== null && totalVotes >= expected;

  return (
    <BigScreen live="ГОЛОСУВАННЯ ТРИВАЄ" title={snapshot.event.name}>
      <div className="flex flex-1 flex-col items-center justify-center gap-[3vw]">
        <div
          className="relative flex h-[clamp(220px,26vw,420px)] w-[clamp(220px,26vw,420px)] items-center justify-center rounded-full transition-all duration-1000"
          style={{
            background: `conic-gradient(var(--ef-glow) ${pct}%, rgba(255,255,255,0.08) 0)`,
          }}
        >
          <div className="absolute inset-[2%] rounded-full bg-[#0a1424]" />
          <span className="relative z-[2] font-display text-[clamp(2.6rem,5.2vw,6rem)]">{pct}%</span>
        </div>

        <div className="flex gap-[0.8vw]">
          <span className="h-[clamp(10px,1vw,18px)] w-[clamp(10px,1vw,18px)] animate-bounce2 rounded-full bg-glow" />
          <span className="h-[clamp(10px,1vw,18px)] w-[clamp(10px,1vw,18px)] animate-bounce2 rounded-full bg-glow" style={{ animationDelay: '0.15s' }} />
          <span className="h-[clamp(10px,1vw,18px)] w-[clamp(10px,1vw,18px)] animate-bounce2 rounded-full bg-glow" style={{ animationDelay: '0.3s' }} />
        </div>

        <div className="max-w-2xl text-center tv-subtitle text-[#9db3c8]">
          {done
            ? 'Усі проголосували! Переходимо до результатів →'
            : `Проголосувало ${totalVotes}${expected ? ` з ${expected}` : ''} учасників…`}
        </div>
      </div>
    </BigScreen>
  );
}
