import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MonitorPlay, Smartphone, Tv2 } from 'lucide-react';

const SESSION_CODE = '88309117';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-10 text-center">

        {/* Logo / wordmark */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-4xl mb-2">
            🗳
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Poll Presenter
          </h1>
          <p className="text-gray-500 text-lg">
            Живе опитування в реальному часі
          </p>
        </div>

        {/* Session info pill */}
        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2 shadow-sm text-sm text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Активна сесія: <span className="font-mono font-semibold text-gray-900">8830&nbsp;9117</span>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-2 hover:border-primary/30"
            onClick={() => navigate(`/present/${SESSION_CODE}`)}
          >
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MonitorPlay className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xl">Presenter View</p>
                <p className="text-gray-500 text-base mt-2">
                  Показуй питання, QR та live-результати
                </p>
              </div>
              <Button className="w-full" size="lg">
                Відкрити
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-2 hover:border-indigo-200"
            onClick={() => navigate(`/screen/${SESSION_CODE}`)}
          >
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Tv2 className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xl">Screen View</p>
                <p className="text-gray-500 text-base mt-2">
                  Для великого екрану без кнопок керування
                </p>
              </div>
              <Button variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50" size="lg">
                Відкрити
              </Button>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-2 hover:border-violet-200"
            onClick={() => navigate(`/join/${SESSION_CODE}`)}
          >
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-violet-600" />
                </div>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xl">Participant View</p>
                <p className="text-gray-500 text-base mt-2">
                  Відскануй QR або відкрий на телефоні
                </p>
              </div>
              <Button variant="outline" className="w-full" size="lg">
                Приєднатись
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-gray-400">
          Presenter — керування; Screen — великий екран; Participant — телефон
        </p>
      </div>
    </div>
  );
}
