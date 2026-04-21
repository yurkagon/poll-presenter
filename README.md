# Poll Presenter

Мінімалістичний live-опитувальник для проведення інтерактивних голосувань в реальному часі. Дві сторінки — для ведучого і для учасників.

## Стек

| Частина | Технологія |
|---|---|
| Backend | NestJS, socket.io |
| Frontend | React, Vite, Tailwind CSS, shadcn/ui |
| Типи | TypeScript (shared) |
| Realtime | WebSocket (socket.io) |
| QR-код | react-qr-code |

## Вимоги

- Node.js **≥ 18.0.0** (рекомендовано v24, є `.nvmrc`)
- npm

```bash
nvm install   # встановить версію з .nvmrc
nvm use
```

## Встановлення та запуск

```bash
npm install
```

### Dev режим

```bash
npm run dev
```

- Backend (NestJS) → `http://localhost:3000`
- Frontend (Vite, HMR) → **`http://localhost:5173`** ← відкривай це

### Production

```bash
npm run build   # збирає frontend → build/ і backend → dist/
npm start       # запускає сервер на :3000, роздає SPA
```

Після `npm start` все доступне на `http://localhost:3000`.

## Структура проекту

```
poll-presenter/
├── src/                        # NestJS backend
│   ├── main.ts                 # bootstrap, static assets, SPA fallback
│   ├── app.module.ts
│   └── session/
│       ├── session.module.ts
│       ├── session.service.ts  # in-memory стан, питання, голоси
│       ├── session.controller.ts # REST API
│       └── session.gateway.ts  # WebSocket gateway
│
├── web/                        # React + Vite frontend
│   ├── index.html
│   ├── vite.config.ts          # проксі /api і /socket.io → :3000
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── lib/
│       │   ├── api.ts          # fetch-клієнт для REST API
│       │   ├── socket.ts       # socket.io клієнт
│       │   └── utils.ts        # cn() helper
│       ├── components/ui/      # shadcn/ui компоненти (Button, Card)
│       └── pages/
│           ├── HomePage.tsx
│           ├── PresenterPage.tsx
│           └── ParticipantPage.tsx
│
├── shared/
│   └── types.ts                # спільні TypeScript типи
│
├── build/                      # Vite output (генерується npm run build)
├── dist/                       # tsc output (генерується npm run build)
├── package.json                # один кореневий, один node_modules
├── tsconfig.json               # для NestJS
└── nest-cli.json
```

## API

| Метод | Шлях | Опис |
|---|---|---|
| `GET` | `/api/session/:code` | Дані сесії (питання, опції) |
| `GET` | `/api/session/:code/results` | Поточні результати голосування |
| `POST` | `/api/session/:code/vote` | Проголосувати `{ optionId }` |
| `POST` | `/api/session/:code/question` | Змінити активне питання `{ questionId }` |

## WebSocket події

| Подія | Напрям | Payload |
|---|---|---|
| `join_session` | client → server | `{ sessionCode }` |
| `results_updated` | server → client | `SessionResults` |
| `question_changed` | server → client | `{ session, results }` |

## Сесія

Захардкоджена сесія з кодом **`88309117`**:

- `/present/88309117` — presenter view (питання, QR, live-результати, навігація)
- `/join/88309117` — participant view (кнопки голосування, мобільна версія)

8 питань, варіанти відповіді на кожному: **НОРМ** / **СТРЬОМ**.

Результати зберігаються в пам'яті — скидаються при перезапуску сервера.

## Додавання питань чи варіантів

Все в `src/session/session.service.ts`, масив `QUESTIONS`. Кожне питання має своє поле `options`:

```typescript
{
  id: 'q9',
  text: 'Нове питання?',
  options: [
    { id: 'yes', label: 'ТАК' },
    { id: 'no',  label: 'НІ' },
    { id: 'idk', label: 'НЕ ЗНАЮ' },
  ],
},
```

Після зміни — перезапуск сервера (`npm run dev` перезапустить автоматично).
