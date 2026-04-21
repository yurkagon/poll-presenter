# Poll Presenter — Project Notes

## Git commits
- Do NOT add `Co-Authored-By` lines to commit messages.

## Stack
- NestJS backend (`src/`) — in-memory, no DB, no auth
- React + Vite frontend (`web/`) — Tailwind + shadcn/ui
- Shared TypeScript types (`shared/types.ts`)
- socket.io for real-time vote broadcasts

## Commands
```bash
npm run dev     # dev: NestJS :3000 + Vite :5173
npm run build   # frontend → build/ + backend → dist/
npm run start   # production server on :3000
```

## Hardcoded session
- Code: `88309117`
- Routes: `/present/88309117`, `/join/88309117`
- In-memory votes reset on server restart (by design for MVP)
