import QRCode from 'react-qr-code';

export const talkShowJoinUrl = () => `${window.location.origin}/talk-show/join`;

/** QR on a white tile; `size` is any CSS length (the tile stays square). */
export function JoinQr({ size }: { size: string }) {
  return (
    <div className="rounded-3xl bg-white p-[min(2vh,1.5vw)]">
      <div style={{ width: size, height: size }}>
        <QRCode
          value={talkShowJoinUrl()}
          size={256}
          style={{ height: '100%', width: '100%' }}
          viewBox="0 0 256 256"
        />
      </div>
    </div>
  );
}
