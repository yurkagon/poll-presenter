import { useState } from 'react';
import QRCode from 'react-qr-code';

export function QRPanel({ size = 150 }: { size?: number }) {
  const url = `${window.location.origin}/join`;
  const [full, setFull] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setFull(true)}
        className="flex flex-col items-center gap-[0.8vw]"
        aria-label="Показати QR на весь екран"
      >
        <div className="rounded-2xl bg-white p-[1vw] transition-transform hover:scale-105">
          <QRCode value={url} size={size} />
        </div>
        <div className="tv-label font-bold text-[#9db3c8]">Скануй, щоб приєднатись</div>
      </button>

      {full && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 bg-white p-8"
          onClick={() => setFull(false)}
          role="button"
          aria-label="Закрити"
        >
          {/* Scale to the shorter viewport side so it fills the screen on any TV/projector. */}
          <div style={{ width: 'min(80vh, 80vw)', height: 'min(80vh, 80vw)' }}>
            <QRCode
              value={url}
              size={256}
              style={{ height: '100%', width: '100%' }}
              viewBox="0 0 256 256"
            />
          </div>
          <div className="text-2xl font-extrabold text-ink">Скануй, щоб приєднатись</div>
          <div className="text-sm font-semibold text-ink-faint">Торкнись, щоб закрити</div>
        </div>
      )}
    </>
  );
}
