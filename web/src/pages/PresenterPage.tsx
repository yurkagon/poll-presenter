import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { ChevronLeft, ChevronRight, RotateCcw, Sun, Moon } from 'lucide-react';
import { api } from '@/lib/api';
import { joinSession, onResultsUpdated, onQuestionChanged, onSessionReset, onResultsRevealed } from '@/lib/socket';
import { useSessionTheme, applyTheme } from '@/lib/useSessionTheme';
import { Button } from '@/components/ui/button';
import type { Session, SessionResults, Theme } from '@shared/types';

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
    <div className="flex flex-col items-center gap-3 flex-1">
      <div className="text-center">
        <span className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">{count}</span>
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">({pct}%)</span>
      </div>
      <div className="w-full h-44 bg-gray-100 dark:bg-[#2a2a2a] rounded-2xl flex items-end overflow-hidden">
        <div
          className={`w-full rounded-t-2xl transition-all duration-700 ease-out ${color}`}
          style={{ height: `${pct}%`, minHeight: count > 0 ? '8px' : '0', filter: 'var(--bar-filter, none)' }}
        />
      </div>
      <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{label}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const BAR_COLORS = ['bg-violet-500', 'bg-rose-400'];

export function PresenterPage() {
  const { code } = useParams<{ code: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [resetting, setResetting] = useState(false);

  useSessionTheme(session);

  const joinUrl = `${window.location.origin}/join/${code}`;
  const formattedCode = code ? `${code.slice(0, 4)} ${code.slice(4)}` : '';
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
      setSwitching(false);
    });
    const unsubReset = onSessionReset(({ session: s, results: r }) => {
      setSession(s);
      setResults(r);
      setSwitching(false);
      setResetting(false);
    });

    const unsubRevealed = onResultsRevealed(({ session: s }) => {
      setSession(s);
      setSwitching(false);
    });

    return () => {
      unsubResults();
      unsubQuestion();
      unsubReset();
      unsubRevealed();
    };
  }, [code, loadData]);

  async function navigate(dir: 'prev' | 'next') {
    if (!session || !code || switching) return;
    const idx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
    setSwitching(true);

    try {
      if (dir === 'next') {
        if (!session.resultsVisible) {
          // First "next" — reveal results
          await api.revealResults(code);
        } else {
          // Second "next" — go to next question
          const nextIdx = idx + 1;
          if (nextIdx >= session.questions.length) { setSwitching(false); return; }
          await api.setQuestion(code, { questionId: session.questions[nextIdx].id });
        }
      } else {
        const prevIdx = idx - 1;
        if (prevIdx < 0) { setSwitching(false); return; }
        await api.setQuestion(code, { questionId: session.questions[prevIdx].id });
      }
    } catch {
      setSwitching(false);
    }
  }

  async function handleReset() {
    if (!code || resetting) return;
    const confirmed = window.confirm('Скинути всі голоси та повернутись до першого питання?');
    if (!confirmed) return;
    setResetting(true);
    try {
      await api.resetSession(code);
    } catch {
      setResetting(false);
    }
  }

  async function handleThemeToggle() {
    if (!code || !session) return;
    const next: Theme = session.theme === 'light' ? 'dark' : 'light';
    // Optimistic — apply immediately
    applyTheme(next);
    setSession((s) => s ? { ...s, theme: next } : s);
    try {
      await api.setTheme(code, { theme: next });
    } catch {
      // Revert on error
      applyTheme(session.theme);
      setSession((s) => s ? { ...s, theme: session.theme } : s);
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold">{error}</div>
  );
  if (!session || !results) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">Завантаження...</div>
  );

  const activeQ = session.questions.find((q) => q.id === session.activeQuestionId);
  const activeIdx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
  const total = session.questions.length;

  return (
    <div className="min-h-screen bg-white dark:bg-[#141414] flex flex-col transition-colors duration-300">

      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗳</span>
          <span className="font-bold text-gray-900 dark:text-white text-lg">Poll Presenter</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={handleThemeToggle}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? 'Світла тема' : 'Темна тема'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting}
            className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Скинути
          </Button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-full px-4 py-1.5 border border-gray-200 dark:border-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live · {results.totalVotes} голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden">

        {/* Left: question + results + nav */}
        <div className="flex flex-col px-10 py-10 lg:px-16">

          {/* Question — anchored to top */}
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-3">
              Питання {activeIdx + 1} з {total}
            </p>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {activeQ?.text}
            </h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Image / Chart — same fixed-height block, anchored to bottom */}
          <div className="max-w-2xl mb-8 h-80 relative">
            {/* Image — visible until results revealed */}
            {activeQ?.image && (
              <img
                src={activeQ.image}
                alt=""
                className={`absolute inset-0 w-full h-full object-contain rounded-2xl transition-opacity duration-500 ${session.resultsVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              />
            )}
            {/* Chart — appears when results revealed */}
            <div className={`absolute inset-0 flex gap-6 transition-opacity duration-500 ${session.resultsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('prev')}
              disabled={activeIdx === 0 || switching}
              className="gap-2 select-none"
            >
              <ChevronLeft className="w-4 h-4" />
              Попереднє
            </Button>

            <div className="flex gap-1.5">
              {session.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={async () => {
                    if (i === activeIdx || switching || !code) return;
                    setSwitching(true);
                    try { await api.setQuestion(code, { questionId: q.id }); }
                    catch { setSwitching(false); }
                  }}
                  className={[
                    'w-2.5 h-2.5 rounded-full transition-all select-none',
                    i === activeIdx
                      ? 'bg-violet-500 scale-125'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400',
                  ].join(' ')}
                />
              ))}
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => navigate('next')}
              disabled={switching || (session.resultsVisible && activeIdx === total - 1)}
              className="gap-2 select-none"
            >
              {!session.resultsVisible ? 'Показати результати' : 'Наступне'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right: QR panel */}
        <aside className="bg-gray-50 dark:bg-[#1c1c1c] border-l border-gray-100 dark:border-[#2a2a2a] flex flex-col items-center justify-center px-8 py-10 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Відскануй для участі
          </p>

          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2a2a2a]">
            <QRCode
              value={joinUrl}
              size={170}
              fgColor={isDark ? '#ffffff' : '#1e1b4b'}
              bgColor={isDark ? '#1c1c1c' : '#ffffff'}
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Join at{' '}
              <span className="text-violet-600 dark:text-violet-400 font-semibold">
                {window.location.host}/join/{code}
              </span>
            </p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-wider font-mono">
              {formattedCode}
            </p>
          </div>

          <div className="w-full h-px bg-gray-200 dark:bg-gray-700" />

          <div className="text-center">
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{results.totalVotes}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              всього голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
