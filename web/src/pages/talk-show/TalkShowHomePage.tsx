import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useForceDark } from '@/lib/useForceDark';

const LINKS = [
  { to: '/talk-show/admin', label: 'Панель ведучого', hint: 'Керування голосуваннями й запитаннями' },
  { to: '/talk-show/screen', label: 'Екран шоу', hint: 'Для проєктора чи телевізора' },
  { to: '/talk-show/join', label: 'Сторінка глядача', hint: 'Те, що відкривається за QR-кодом' },
];

/** Entry point of the talk show mode. */
export function TalkShowHomePage() {
  useForceDark();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md space-y-6 text-center">
        <div>
          <div className="mb-2 text-5xl">🎙</div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ток-шоу</h1>
          <p className="mt-1 text-muted-foreground">Голосування «Або / або» та анонімні запитання</p>
        </div>
        <div className="space-y-3">
          {LINKS.map((l) => (
            <Button key={l.to} asChild size="xl" variant="secondary" className="h-auto w-full flex-col py-4">
              <Link to={l.to}>
                <span>{l.label}</span>
                <span className="text-xs font-normal text-muted-foreground">{l.hint}</span>
              </Link>
            </Button>
          ))}
        </div>
        <Link to="/" className="inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Конференційне опитування
        </Link>
      </div>
    </div>
  );
}
