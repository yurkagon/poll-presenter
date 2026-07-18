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

      <div className="mt-5 flex items-center justify-center gap-8">
        <QRPanel size={72} />
        <div className="text-center">
          <div className="font-display text-2xl">{lobby.totalParticipants}</div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-[#8ea2b6]">
            приєдналось
          </div>
        </div>
      </div>
    </BigScreen>
  );
}
