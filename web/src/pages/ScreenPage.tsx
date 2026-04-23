import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { api } from '@/lib/api';
import { joinSession, onResultsUpdated, onQuestionChanged, onSessionReset } from '@/lib/socket';
import { useSessionTheme } from '@/lib/useSessionTheme';
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
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-4xl font-bold text-gray-800 dark:text-gray-100">{label}</span>
        <span className="text-6xl font-extrabold text-gray-900 dark:text-white tabular-nums">
          {count}
          <span className="text-2xl font-normal text-gray-400 dark:text-gray-500 ml-3">({pct}%)</span>
        </span>
      </div>
      <div className="h-16 w-full rounded-full bg-gray-100 dark:bg-[#2a2a2a] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%`, minWidth: count > 0 ? '4rem' : '0', filter: 'var(--bar-filter, none)' }}
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

  useSessionTheme(session);

  const joinUrl = `${window.location.origin}/join/${code}`;
  const isDark = session?.theme === 'dark';

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
    <div className="min-h-screen flex items-center justify-center text-red-500 text-3xl font-semibold">{error}</div>
  );
  if (!session || !results) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 text-3xl">Завантаження...</div>
  );

  const activeQ = session.questions.find((q) => q.id === session.activeQuestionId);
  const activeIdx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
  const total = session.questions.length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#141414] flex transition-colors duration-300">

      {/* Left: question + results */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12 space-y-12">

        <div className="space-y-6">
          <p className="text-xl font-semibold uppercase tracking-widest text-violet-500">
            Питання {activeIdx + 1} з {total}
          </p>
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {activeQ?.text}
          </h1>
        </div>

        <div className="space-y-10">
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
            <p className="text-gray-400 dark:text-gray-500 text-2xl">Голосів ще немає</p>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex gap-3">
          {session.questions.map((q, i) => (
            <div
              key={q.id}
              className={[
                'h-3 rounded-full transition-all',
                i === activeIdx ? 'w-12 bg-violet-500' : 'w-3 bg-gray-200 dark:bg-gray-700',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Right: QR panel */}
      <aside className="w-96 bg-gray-50 dark:bg-[#1c1c1c] border-l border-gray-100 dark:border-[#2a2a2a] flex flex-col items-center justify-center px-10 py-12 space-y-10 flex-shrink-0">
        <p className="text-base font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Відскануй для участі
        </p>

        <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-[#2a2a2a]">
          <QRCode
            value={joinUrl}
            size={280}
            fgColor={isDark ? '#ffffff' : '#1e1b4b'}
            bgColor={isDark ? '#1c1c1c' : '#ffffff'}
          />
        </div>

        <p className="text-base text-gray-500 dark:text-gray-400 font-medium text-center">
          {window.location.host}/join/{code}
        </p>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        <div className="text-center">
          <p className="text-7xl font-extrabold text-gray-900 dark:text-white">{results.totalVotes}</p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
          </p>
        </div>
      </aside>
    </div>
  );
}
