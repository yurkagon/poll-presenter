import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { api } from '@/lib/api';
import { joinSession, onResultsUpdated, onQuestionChanged, onSessionReset } from '@/lib/socket';
import type { Session, SessionResults } from '@shared/types';

// ─── Bar chart row ────────────────────────────────────────────────────────────

function ResultBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-gray-800">{label}</span>
        <span className="text-4xl font-extrabold text-gray-900 tabular-nums">
          {count}
          <span className="text-lg font-normal text-gray-400 ml-2">({pct}%)</span>
        </span>
      </div>
      <div className="h-12 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%`, minWidth: count > 0 ? '3rem' : '0' }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const BAR_COLORS = ['bg-violet-500', 'bg-rose-400'];

export function ScreenPage() {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinUrl = `${window.location.origin}/join/${code}`;

  const loadData = useCallback(async () => {
    if (!code) return;
    try {
      const [s, r] = await Promise.all([api.getSession(code), api.getResults(code)]);
      setSession(s);
      setResults(r);
    } catch (e: any) {
      setError(e.message);
    }
  }, [code]);

  useEffect(() => {
    loadData();
    if (!code) return;

    joinSession(code);

    const unsubResults = onResultsUpdated((r) => setResults(r));
    const unsubQuestion = onQuestionChanged(({ session: s, results: r }) => {
      setSession(s);
      setResults(r);
    });
    const unsubReset = onSessionReset(({ session: s, results: r }) => {
      setSession(s);
      setResults(r);
    });

    return () => {
      unsubResults();
      unsubQuestion();
      unsubReset();
    };
  }, [code, loadData]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold">{error}</div>
  );
  if (!session || !results) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">Завантаження...</div>
  );

  const activeQ = session.questions.find((q) => q.id === session.activeQuestionId);
  const activeIdx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
  const total = session.questions.length;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Main */}
      <main className="flex-1 grid grid-cols-[1fr_320px]">

        {/* Left: question + results */}
        <div className="flex flex-col justify-center px-16 py-12 space-y-10">

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-500 mb-4">
              Питання {activeIdx + 1} з {total}
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              {activeQ?.text}
            </h1>
          </div>

          <div className="space-y-7 max-w-2xl">
            {results.results.map((r, i) => (
              <ResultBar
                key={r.optionId}
                label={r.label}
                count={r.count}
                total={results.totalVotes}
                color={BAR_COLORS[i % BAR_COLORS.length]}
              />
            ))}
            {results.totalVotes === 0 && (
              <p className="text-gray-400 text-lg">Голосів ще немає</p>
            )}
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {session.questions.map((q, i) => (
              <div
                key={q.id}
                className={[
                  'h-2 rounded-full transition-all',
                  i === activeIdx ? 'w-8 bg-violet-500' : 'w-2 bg-gray-200',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Right: QR panel */}
        <aside className="bg-gray-50 border-l border-gray-100 flex flex-col items-center justify-center px-10 py-12 space-y-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Відскануй для участі
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <QRCode value={joinUrl} size={200} fgColor="#1e1b4b" bgColor="#ffffff" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 font-medium">
              {window.location.host}/join/{code}
            </p>
          </div>

          <div className="w-full h-px bg-gray-200" />

          <div className="text-center">
            <p className="text-5xl font-extrabold text-gray-900">{results.totalVotes}</p>
            <p className="text-sm text-gray-500 mt-2">
              голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
