import QRCode from 'react-qr-code';

export function QRPanel({ size = 150 }: { size?: number }) {
  const url = `${window.location.origin}/join`;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-3">
        <QRCode value={url} size={size} />
      </div>
      <div className="text-xs font-bold text-[#9db3c8]">Скануй, щоб приєднатись</div>
    </div>
  );
}
