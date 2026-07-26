import type { Team, LobbySnapshot } from '@shared/types';
import { BigScreen } from '@/components/frames/BigScreen';
import { LobbyGrid } from '@/components/lobby/LobbyGrid';
import { QRPanel } from '@/components/lobby/QRPanel';

export function LobbyView({
  teams,
  lobby,
  myTeamId,
}: {
  teams: Team[];
  lobby: LobbySnapshot;
  myTeamId?: string | null;
}) {
  return (
    <BigScreen
      live="ЗБІР УЧАСНИКІВ"
      title="Скануй QR і обирай свою команду"
      subtitle="Кабінети заповнюються наживо — дивись, хто вже з нами"
    >
      <LobbyGrid teams={teams} lobby={lobby} myTeamId={myTeamId} />

      <div className="mt-[0.4vw] flex items-center justify-center gap-[3vw]">
        <QRPanel size={130} />
        <div className="text-center">
          <div className="font-display text-[clamp(2.2rem,4vw,4rem)]">{lobby.totalParticipants}</div>
          <div className="tv-label font-bold uppercase tracking-wide text-[#8ea2b6]">
            приєдналось
          </div>
        </div>
      </div>
    </BigScreen>
  );
}
