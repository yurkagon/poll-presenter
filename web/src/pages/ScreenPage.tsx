import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { api } from '@/lib/api';
import { joinSession, onResultsUpdated, onQuestionChanged, onSessionReset, onResultsRevealed } from '@/lib/socket';
import { useSessionTheme } from '@/lib/useSessionTheme';
import type { Session, SessionResults } from '@shared/types';

// ─── Column chart ─────────────────────────────────────────────────────────────

function ResultColumn({
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
    <div className="flex flex-col items-center gap-4 flex-1 h-full">
      <div className="text-center">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">{count}</span>
        <span className="text-lg font-normal text-gray-400 dark:text-gray-500 ml-2">({pct}%)</span>
      </div>
      <div className="w-full flex-1 bg-gray-100 dark:bg-[#2a2a2a] rounded-2xl flex items-end overflow-hidden">
        <div
          className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${color}`}
          style={{ height: `${pct}%`, minHeight: count > 0 ? '8px' : '0', filter: 'var(--bar-filter, none)' }}
        />
      </div>
      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{label}</span>
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

    const unsubRevealed = onResultsRevealed(({ session: s }) => {
      setSession(s);
    });

    return () => {
      unsubResults();
      unsubQuestion();
      unsubReset();
      unsubRevealed();
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
      <div className="flex-1 flex flex-col px-16 py-12">

        {/* Question — anchored to top */}
        <div className="space-y-4 pt-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
            Питання {activeIdx + 1} з {total}
          </p>
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
            {activeQ?.text}
          </h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Chart — anchored to bottom, always takes space */}
        <div className={`flex gap-8 h-72 mb-12 ${session.resultsVisible ? 'visible' : 'invisible'}`}>
          {results.results.map((r, i) => (
            <ResultColumn
              key={r.optionId}
              label={r.label}
              count={r.count}
              total={results.totalVotes}
              color={BAR_COLORS[i % BAR_COLORS.length]}
            />
          ))}
        </div>

      </div>

      {/* Dot indicators — fixed bottom left */}
      <div className="fixed bottom-6 left-16 flex gap-3">
        {session.questions.map((q, i) => (
          <div
            key={q.id}
            className={[
              'h-2 rounded-full transition-all',
              i === activeIdx ? 'w-8 bg-violet-500' : 'w-2 bg-gray-200 dark:bg-gray-700',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Right: QR panel */}
      <aside className="w-96 bg-gray-50 dark:bg-[#1c1c1c] border-l border-gray-100 dark:border-[#2a2a2a] flex flex-col items-center justify-center px-8 py-10 space-y-6 flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Відскануй для участі
        </p>

        <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a2a2a]">
          <QRCode
            value={joinUrl}
            size={260}
            fgColor={isDark ? '#ffffff' : '#1e1b4b'}
            bgColor={isDark ? '#1c1c1c' : '#ffffff'}
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium text-center">
          {window.location.host}/join/{code}
        </p>

        <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

        <div className="text-center">
          <p className="text-5xl font-extrabold text-gray-900 dark:text-white">{results.totalVotes}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
          </p>
        </div>
      </aside>
    </div>
  );
}
