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

## Talk show mode (`/talk-show`)

A second, independent mode next to the conference session: either/or polls plus anonymous audience questions, for one show of up to ~100 people. It shares only the socket.io server, the Vite app and the UI primitives — **don't touch `src/session/` to change it**.

```
src/talk-show/
  talk-show.service.ts        in-memory state: polls, votes per device, questions, screen mode, finished
  talk-show.controller.ts     REST under /api/talk-show/* (audience + host); controller broadcasts
  talk-show.gateway.ts        socket.io, room `talkshow`, event `talkshow:state` (public snapshot)
  talk-show-auth.service.ts   host login: env password → signed httpOnly cookie (12 h), login lockout
  talk-show-admin.guard.ts    guards every host route
shared/talk-show.ts           types, limits (500-char question, 10 s cooldown), WS event names
web/src/pages/talk-show/      Home · Screen · Join · Admin (+ useTalkShow hook, JoinQr)
web/src/lib/talk-show-api.ts  REST client; device-id.ts = anonymous per-browser id
```

| Route | Role |
| --- | --- |
| `/talk-show` | hub with the three links |
| `/talk-show/screen` | read-only stage display (voting bars / questions list / QR) |
| `/talk-show/admin` | host panel, password-protected |
| `/talk-show/join` | phone page from the QR: vote + send a question |

- **Auth**: the host password is hardcoded (`ADMIN_PASSWORD` in `talk-show-auth.service.ts`). Optional `TALK_SHOW_AUTH_SECRET` signs the cookie (defaults to the password). 10 wrong passwords per IP / 5 min → 429.
- **Votes**: one per `deviceId` per poll, enforced on the server (`409 Already voted`). `GET /state?deviceId=` returns `myVote`, so a reload keeps the "voted" state.
- **Results visibility**: while the host hides results, `results` is `null` in the public snapshot — counts never leave the server. The host view always has them.
- **Questions**: auto-published, newest first; `hidden` ones are only in the host snapshot. Per-device cooldown → `429 { retryAfterMs }`.
- **Finish** stops all intake and drops per-device data (vote ledger, cooldowns); aggregates and questions stay for the host. **Reset** wipes everything.
- Like the rest of the app: state is in memory, a restart is a blank slate.

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
- `TALK_SHOW_AUTH_SECRET` — optional cookie signing key for the talk show mode.

## Conventions & gotchas

- **Shared types are canonical.** When changing a payload, edit `shared/types.ts` first; backend and frontend both pick it up.
- **Type-only imports on the frontend** (`import type { ... } from '@shared/types'`) — the file is path-aliased, not a package.
- **No auth, no validation pipeline** (conference session; the talk show host panel is the only password-protected part, and validates input by hand). `class-validator` is in deps but not wired. Trust client input at your own risk; this is an MVP for a known audience.
- **No persistence.** Server restart = blank slate. Don't add file/db writes without flagging it — the in-memory design is intentional for the MVP.
- **Image assets live under the backend** (`src/session/images/`) and are served at `/images/*`. Reference them from question data as `/images/qN.webp`.
- **`subSession`** is rotated on reset so participant clients can detect "the session restarted" and clear local UI state — preserve this behavior if you touch `resetSession`.
- **Static-asset prefix order matters** in `main.ts`: API, socket.io, and `/images` must short-circuit before the SPA fallback.

## Git

- Do **not** add `Co-Authored-By` lines to commit messages.
- Main branch is `main`.

## Localization

Questions and option labels are Ukrainian. UI strings on the pages are mixed Ukrainian/English — match the surrounding text when editing.
