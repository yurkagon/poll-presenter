# Poll Presenter — Agent Notes

Live polling MVP. Presenter drives questions on stage; participants vote from phones; results stream in real time.

## Stack

- **Backend**: NestJS 10 (`src/`), Express adapter, socket.io gateway. No DB — all state lives in `SessionService` memory and resets on restart.
- **Frontend**: React 18 + Vite 5 (`web/`), Tailwind + shadcn/ui primitives, react-router-dom, socket.io-client.
- **Shared types**: `shared/types.ts` — imported by backend as relative path, by frontend via `@shared/*` alias.
- **Runtime**: Node ≥ 18. Single process serves API + WS + built SPA on `PORT` (default 3000).

## Layout

```
src/                      NestJS app
  main.ts                 bootstrap, CORS, static assets, SPA fallback
  app.module.ts           root module → SessionModule
  app.controller.ts       catch-all that serves build/index.html (SPA)
  session/
    session.module.ts
    session.service.ts    in-memory state: votes, active question, theme, resultsVisible
    session.controller.ts REST endpoints under /api/session/:code/*
    session.gateway.ts    socket.io gateway, room = `session:<code>`
    images/q1..q8.webp    served at /images/*
shared/types.ts           Session/Results/Payloads/WS_EVENTS — single source of truth
web/                      Vite root
  vite.config.ts          proxies /api + /socket.io → :3000 in dev
  src/
    main.tsx              router: / · /present/:code · /join/:code · /screen/:code
    pages/                HomePage, PresenterPage, ParticipantPage, ScreenPage
    lib/api.ts            REST client (fetch wrapper)
    lib/socket.ts         single socket.io-client instance + event subscriptions
    lib/useSessionTheme.ts
    components/ui/        shadcn primitives
build/                    Vite output (served by Nest in prod)
dist/                     tsc output for backend
```

## Runtime model

- **One hardcoded session** with code `88309117`. Any other code returns 404.
- `SessionService` owns: `activeQuestionId`, `subSession` (UUID, rotated on reset — clients use it to detect a reset), `theme`, `resultsVisible`, and a `Map<"questionId:optionId", number>` of vote counts.
- Questions list (8 items, options `НОРМ` / `СТРЬОМ`) is hardcoded in `session.service.ts`.
- Votes reset only on `POST /api/session/:code/reset` or server restart. Switching the active question does NOT clear prior counts — they remain keyed by question id.

## API

All routes are prefixed `/api`. Payload/response shapes live in `shared/types.ts`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET  | `/session/:code` | Full session snapshot |
| GET  | `/session/:code/results` | Vote counts for active question |
| POST | `/session/:code/vote` | `{ optionId }` — increment, broadcast `RESULTS_UPDATED` |
| POST | `/session/:code/revote` | `{ fromOptionId, toOptionId }` — move one vote |
| POST | `/session/:code/question` | `{ questionId }` — switch active, clears `resultsVisible`, broadcasts `QUESTION_CHANGED` |
| POST | `/session/:code/reveal` | Set `resultsVisible=true`, broadcast `RESULTS_REVEALED` |
| POST | `/session/:code/theme` | `{ theme: 'light' \| 'dark' }`, broadcast `THEME_CHANGED` |
| POST | `/session/:code/reset` | Clear votes, rotate `subSession`, broadcast `SESSION_RESET` |

Mutating endpoints update state then call the gateway to broadcast. Don't broadcast from `SessionService` — keep it ignorant of transport.

## WebSocket

- Single namespace, room per session (`session:<code>`).
- Client emits `JOIN_SESSION` with `{ sessionCode }` after connecting.
- Server-emitted events (all keys in `WS_EVENTS`): `RESULTS_UPDATED`, `QUESTION_CHANGED`, `SESSION_RESET`, `THEME_CHANGED`, `RESULTS_REVEALED`.
- CORS for the WS engine is enforced via a custom `allowRequest` against `CORS_ORIGINS`.

## Frontend routes

| Route | Page | Role |
| --- | --- | --- |
| `/` | HomePage | Landing |
| `/present/:code` | PresenterPage | Operator UI: switch questions, reveal results, toggle theme, reset |
| `/join/:code` | ParticipantPage | Vote / revote from a phone |
| `/screen/:code` | ScreenPage | Read-only stage display (big chart) |

`web/src/lib/socket.ts` exports a single shared `Socket` and `onX(cb)` helpers that return unsubscribe functions — call them from `useEffect` cleanups.

## Commands

```bash
npm run dev      # concurrently: NestJS :3000 (watch) + Vite :5173
npm run build    # Vite → build/, then tsc → dist/
npm run start    # node dist/src/main  (serves API + built SPA on :3000)
npm run prod     # build + pm2 start
```

In dev, hit `http://localhost:5173` — Vite proxies `/api` and `/socket.io` to `:3000`. In prod, Nest serves `build/index.html` as the SPA fallback (see `main.ts` middleware) and exposes `/images/*` from `src/session/images/`.

## Environment

`.env` (see `.env.example`):

- `PORT` — HTTP port (required, `getOrThrow`).
- `CORS_ORIGINS` — comma-separated allowed origins (required). Applied to both Express CORS and the socket.io `allowRequest` check.

## Conventions & gotchas

- **Shared types are canonical.** When changing a payload, edit `shared/types.ts` first; backend and frontend both pick it up.
- **Type-only imports on the frontend** (`import type { ... } from '@shared/types'`) — the file is path-aliased, not a package.
- **No auth, no validation pipeline.** `class-validator` is in deps but not wired. Trust client input at your own risk; this is an MVP for a known audience.
- **No persistence.** Server restart = blank slate. Don't add file/db writes without flagging it — the in-memory design is intentional for the MVP.
- **Image assets live under the backend** (`src/session/images/`) and are served at `/images/*`. Reference them from question data as `/images/qN.webp`.
- **`subSession`** is rotated on reset so participant clients can detect "the session restarted" and clear local UI state — preserve this behavior if you touch `resetSession`.
- **Static-asset prefix order matters** in `main.ts`: API, socket.io, and `/images` must short-circuit before the SPA fallback.

## Git

- Do **not** add `Co-Authored-By` lines to commit messages.
- Main branch is `main`.

## Localization

Questions and option labels are Ukrainian. UI strings on the pages are mixed Ukrainian/English — match the surrounding text when editing.
