import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { joinSession, onQuestionChanged, onSessionReset } from '@/lib/socket';
import { CheckCircle2 } from 'lucide-react';
import type { Session, SessionResults } from '@shared/types';

const voteKey = (code: string, questionId: string) => `voted:${code}:${questionId}`;
const subSessionKey = (code: string) => `subSession:${code}`;

/** Clear all vote keys if server subSession differs from what's stored locally */
function syncSubSession(code: string, s: Session) {
  const stored = localStorage.getItem(subSessionKey(code));
  if (s.subSession !== stored) {
    s.questions.forEach((q) => localStorage.removeItem(voteKey(code, q.id)));
    localStorage.setItem(subSessionKey(code), s.subSession);
  }
}

// ─── Option button ────────────────────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  disabled,
  colorClass,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full rounded-3xl py-7 text-2xl font-extrabold tracking-wide transition-all duration-200',
        'border-4 focus:outline-none',
        selected
          ? `${colorClass} text-white border-transparent shadow-lg scale-[1.02]`
          : disabled
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : `bg-white text-gray-900 border-gray-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95`,
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const OPTION_COLORS = ['bg-violet-500', 'bg-rose-500'];

export function ParticipantPage() {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Sync vote state from localStorage for the given question */
  function syncVoteState(s: Session) {
    if (!code) return;
    syncSubSession(code, s);
    const saved = localStorage.getItem(voteKey(code, s.activeQuestionId));
    if (saved) {
      setSelectedId(saved);
      setHasVoted(true);
    } else {
      setSelectedId(null);
      setHasVoted(false);
    }
  }

  useEffect(() => {
    if (!code) return;

    api.getSession(code)
      .then((s) => {
        setSession(s);
        syncVoteState(s);
      })
      .catch((e) => setError(e.message));

    joinSession(code);

    const unsubQuestion = onQuestionChanged(
      ({ session: s }: { session: Session; results: SessionResults }) => {
        setSession(s);
        const saved = code
          ? localStorage.getItem(voteKey(code, s.activeQuestionId))
          : null;
        if (saved) {
          setSelectedId(saved);
          setHasVoted(true);
        } else {
          setSelectedId(null);
          setHasVoted(false);
        }
      },
    );

    const unsubReset = onSessionReset(
      ({ session: s }: { session: Session; results: SessionResults }) => {
        if (code) {
          s.questions.forEach((q) => localStorage.removeItem(voteKey(code, q.id)));
          localStorage.setItem(subSessionKey(code), s.subSession);
        }
        setSession(s);
        setSelectedId(null);
        setHasVoted(false);
      },
    );

    return () => {
      unsubQuestion();
      unsubReset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleVote(optionId: string) {
    if (!code || !session || hasVoted || loading) return;
    setLoading(true);
    try {
      await api.castVote(code, { optionId });
      setSelectedId(optionId);
      setHasVoted(true);
      localStorage.setItem(voteKey(code, session.activeQuestionId), optionId);
      localStorage.setItem(subSessionKey(code), session.subSession);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div className="space-y-2">
        <p className="text-red-500 font-semibold">{error}</p>
        <p className="text-gray-400 text-sm">Перевір код сесії та спробуй ще раз</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">
      Завантаження...
    </div>
  );

  const activeQ = session.questions.find((q) => q.id === session.activeQuestionId);
  const activeIdx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
  const formattedCode = code ? `${code.slice(0, 4)} ${code.slice(4)}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col">

      {/* Header */}
      <header className="px-6 pt-8 pb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          Код сесії
        </p>
        <p className="font-mono font-bold text-xl text-gray-700">{formattedCode}</p>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full space-y-8">

        {/* Progress */}
        <div className="w-full flex items-center gap-1.5">
          {session.questions.map((q, i) => (
            <div
              key={q.id}
              className={[
                'h-1 flex-1 rounded-full transition-all',
                i === activeIdx ? 'bg-violet-500' : i < activeIdx ? 'bg-violet-200' : 'bg-gray-200',
              ].join(' ')}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 -mt-6 self-start">
          Питання {activeIdx + 1} з {session.questions.length}
        </p>

        {/* Question */}
        <h1 className="text-2xl font-extrabold text-gray-900 leading-snug text-center">
          {activeQ?.text}
        </h1>

        {/* Already voted banner */}
        {hasVoted && (
          <div className="w-full flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm">Ви вже відповіли на це питання</span>
          </div>
        )}

        {/* Option buttons */}
        <div className="w-full space-y-4">
          {activeQ.options.map((opt, i) => (
            <OptionButton
              key={opt.id}
              label={opt.label}
              selected={selectedId === opt.id}
              disabled={hasVoted || loading}
              colorClass={OPTION_COLORS[i % OPTION_COLORS.length]}
              onClick={() => handleVote(opt.id)}
            />
          ))}
        </div>

        {!hasVoted && (
          <p className="text-xs text-gray-400 text-center">Натисни варіант відповіді вище</p>
        )}
      </main>

      <footer className="pb-8 text-center">
        <p className="text-xs text-gray-300 font-semibold tracking-widest uppercase">Poll Presenter</p>
      </footer>
    </div>
  );
}
