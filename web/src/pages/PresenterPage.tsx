import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import { joinSession, onResultsUpdated, onQuestionChanged } from '@/lib/socket';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xl font-bold text-gray-800">{label}</span>
        <span className="text-3xl font-extrabold text-gray-900 tabular-nums">
          {count}
          <span className="text-base font-normal text-gray-400 ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-10 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%`, minWidth: count > 0 ? '2.5rem' : '0' }}
        />
      </div>
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

  const joinUrl = `${window.location.origin}/join/${code}`;
  const formattedCode = code ? `${code.slice(0, 4)} ${code.slice(4)}` : '';

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

    return () => {
      unsubResults();
      unsubQuestion();
    };
  }, [code, loadData]);

  async function navigate(dir: 'prev' | 'next') {
    if (!session || !code || switching) return;
    const idx = session.questions.findIndex((q) => q.id === session.activeQuestionId);
    const nextIdx = dir === 'next' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= session.questions.length) return;
    setSwitching(true);
    try {
      await api.setQuestion(code, { questionId: session.questions[nextIdx].id });
    } catch {
      setSwitching(false);
    }
  }

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

      {/* Header */}
      <header className="border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗳</span>
          <span className="font-bold text-gray-900 text-lg">Poll Presenter</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-1.5 border">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live · {results.totalVotes} голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] overflow-hidden">

        {/* Left: question + results + nav */}
        <div className="flex flex-col justify-between px-10 py-10 lg:px-16">

          {/* Question block */}
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Counter + question */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-3">
                Питання {activeIdx + 1} з {total}
              </p>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                {activeQ?.text}
              </h1>
            </div>

            {/* Results */}
            <div className="space-y-6 max-w-2xl">
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
                <p className="text-gray-400 text-sm">Голосів ще немає — покажи QR учасникам</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('prev')}
              disabled={activeIdx === 0 || switching}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Попереднє
            </Button>

            {/* Dots */}
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
                    'w-2.5 h-2.5 rounded-full transition-all',
                    i === activeIdx
                      ? 'bg-violet-500 scale-125'
                      : 'bg-gray-300 hover:bg-gray-400',
                  ].join(' ')}
                />
              ))}
            </div>

            <Button
              variant={activeIdx === total - 1 ? 'secondary' : 'default'}
              size="lg"
              onClick={() => navigate('next')}
              disabled={activeIdx === total - 1 || switching}
              className="gap-2"
            >
              Наступне
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right: QR panel */}
        <aside className="bg-gray-50 border-l border-gray-100 flex flex-col items-center justify-center px-8 py-10 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Відскануй для участі
          </p>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <QRCode value={joinUrl} size={170} fgColor="#1e1b4b" bgColor="#ffffff" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 font-medium">
              Join at{' '}
              <span className="text-violet-600 font-semibold">
                {window.location.host}/join/{code}
              </span>
            </p>
            <p className="text-3xl font-extrabold text-gray-900 tracking-wider font-mono">
              {formattedCode}
            </p>
          </div>

          <div className="w-full h-px bg-gray-200" />

          <div className="text-center">
            <p className="text-4xl font-extrabold text-gray-900">{results.totalVotes}</p>
            <p className="text-sm text-gray-500 mt-1">
              всього голос{results.totalVotes === 1 ? '' : results.totalVotes < 5 ? 'и' : 'ів'}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
