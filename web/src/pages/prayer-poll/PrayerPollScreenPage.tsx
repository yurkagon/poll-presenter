import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { BigScreen } from '@/components/frames/BigScreen';
import { usePrayerPoll } from './usePrayerPoll';

/** Animates 0 → value with one decimal, for the final reveal. */
function useCountUpDecimal(value: number, durationMs = 1800): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(value * (1 - (1 - t) ** 3) * 10) / 10);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);
  return display;
}

function AverageReveal({ average, count }: { average: number; count: number }) {
  const shown = useCountUpDecimal(average);
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="tv-subtitle font-bold uppercase tracking-wide text-[#9db3c8]">
        Середній вік нашої церкви
      </div>
      <div className="font-display text-glow text-[clamp(8rem,28vw,30rem)] leading-none">
        {shown.toFixed(1)}
      </div>
      <div className="tv-subtitle mt-[1vw] text-[#9db3c8]">
        за відповідями {count} {count === 1 ? 'людини' : 'людей'}
      </div>
    </div>
  );
}

export function PrayerPollScreenPage() {
  const { state } = usePrayerPoll('screen');
  const url = `${window.location.origin}/prayer-poll/join`;

  if (state?.status === 'FINISHED' && state.averageAge !== null) {
    return (
      <BigScreen brandName="Опитування" live="РЕЗУЛЬТАТ" liveTone="gold">
        <AverageReveal average={state.averageAge} count={state.count} />
      </BigScreen>
    );
  }

  return (
    <BigScreen brandName="Опитування" live="ОПИТУВАННЯ">
      <div className="flex min-h-0 flex-1 items-center justify-center gap-[5vw]">
        <div className="flex flex-col items-center gap-[1.5vh]">
          <div className="rounded-3xl bg-white p-[2vh]">
            <div style={{ width: 'min(68vh, 55vw)', height: 'min(68vh, 55vw)' }}>
              <QRCode
                value={url}
                size={256}
                style={{ height: '100%', width: '100%' }}
                viewBox="0 0 256 256"
              />
            </div>
          </div>
          <div className="tv-subtitle font-bold text-[#cfe8ff]">
            Скануй QR і вкажи свій вік
          </div>
        </div>

        <div className="text-center">
          <div className="font-display text-[clamp(4rem,12vw,14rem)] leading-none">
            {state?.count ?? 0}
          </div>
          <div className="tv-label mt-[0.5vw] font-bold uppercase tracking-wide text-[#8ea2b6]">
            проголосувало
          </div>
        </div>
      </div>
    </BigScreen>
  );
}
