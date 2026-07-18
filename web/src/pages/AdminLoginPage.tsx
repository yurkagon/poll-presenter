import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.auth.login(nickname, password);
      navigate('/admin');
    } catch {
      setError('Невірний нікнейм або пароль');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ef-surface-light flex min-h-[100dvh] items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/70 p-7 shadow-glass backdrop-blur"
      >
        <h1 className="mb-1 font-display text-2xl text-ink">
          є<span className="text-accent-blue">Френдшіп</span>
        </h1>
        <p className="mb-6 text-sm text-ink-soft">Вхід для ведучого</p>

        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
          Нікнейм
        </label>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mb-4"
          autoFocus
        />

        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
          Пароль
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5"
        />

        {error && <p className="mb-4 text-sm font-semibold text-red-500">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full" size="lg">
          {busy ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </div>
  );
}
