# єФрендшіп

Інтерактивна гра для табору (у стилі Mentimeter/Kahoot + оформлення «Дія»): ведучий-адмін керує спільним екраном, учасники сканують QR і голосують зі своїх телефонів у реальному часі.

Стек: **NestJS + Socket.IO + Prisma 7 + PostgreSQL + Redis** (бекенд) та **React + Vite + Tailwind** (фронтенд) — один моно-репозиторій.

---

## Вимоги

- **Node.js 24** (див. `.nvmrc` → `nvm use`)
- **Docker** + Docker Compose (для PostgreSQL і Redis)

---

## Локальний запуск

### 1. Залежності та змінні оточення

```bash
npm install
cp .env.example .env
```

`.env` за замовчуванням уже налаштований під локальний docker-compose (порти 3000/5173/5432/6379). За потреби зміни `JWT_SECRET` тощо.

### 2. База даних (Postgres + Redis)

```bash
npm run db        # підняти контейнери
# npm run db:down # зупинити
```

Дані зберігаються локально в `./storage/db/postgres` та `./storage/db/redis` — переносяться разом з проектом.

### 3. Міграції, клієнт Prisma і сид

```bash
npx prisma migrate dev     # застосувати міграції
npx prisma generate        # згенерувати Prisma-клієнт
npx prisma db seed         # 7 команд, дні та адмін-акаунт
```

Сид створює адміна `admin` / `admin12345` (змінюється через `SEED_ADMIN_NICKNAME` / `SEED_ADMIN_PASSWORD`).

### 4. Запуск у dev-режимі

```bash
npm run dev
```

Піднімає одночасно бекенд (NestJS, `:3000`) і фронтенд (Vite, `:5173`). Vite проксує `/api` та `/socket.io` на `:3000`.

Відкрий у браузері:

| Роль | URL |
| --- | --- |
| Головна | http://localhost:5173 |
| Панель ведучого | http://localhost:5173/login |
| Спільний екран | http://localhost:5173/present |
| Телефон учасника | http://localhost:5173/join |

Корисне: `npm run prisma:studio` — GUI для БД.

---

## Продакшн

У проді NestJS сам віддає зібраний фронтенд (`build/`) як SPA і обслуговує API на `PORT` — окремий веб-сервер для статики не потрібен.

### 1. Змінні оточення

Задай на сервері (не коміть у git) щонайменше:

```bash
PORT=3000
CORS_ORIGINS=https://your-domain            # реальні origin-и через кому
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
REDIS_HOST=...            REDIS_PORT=6379      REDIS_PASSWORD=...
JWT_SECRET=<довгий-випадковий-рядок>
JWT_EXPIRATION_TIME=15m   JWT_REFRESH_EXPIRATION_TIME=7d
COOKIE_DOMAIN=your-domain
SEED_ADMIN_PASSWORD=<надійний-пароль>        # якщо запускатимеш сид
NODE_ENV=production
```

> `NODE_ENV=production` вмикає `secure` + `SameSite=None` для auth-cookie — тобто застосунок має віддаватися лише через **HTTPS**.

### 2. Міграції та сид (одноразово при деплої)

```bash
npx prisma generate
npx prisma migrate deploy    # застосовує наявні міграції без інтерактиву
npx prisma db seed           # лише при першому розгортанні
```

### 3. Збірка та запуск

```bash
npm ci
npm run build      # frontend → build/, backend → dist/
npm run start      # node dist/src/main  (простий запуск)
```

або під керуванням процес-менеджера **pm2**:

```bash
npm run prod       # build + pm2 start dist/src/main.js --name poll-presenter
```

Після запуску застосунок доступний на `http://<host>:<PORT>` (за ним постав reverse-proxy з HTTPS, напр. Nginx/Caddy, і додай його origin у `CORS_ORIGINS`).

### Оновлення на проді

```bash
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart poll-presenter
```

---

## Корисні скрипти

| Команда | Призначення |
| --- | --- |
| `npm run dev` | Dev: Nest (`:3000`) + Vite (`:5173`) |
| `npm run build` | Зібрати фронтенд і бекенд |
| `npm run start` | Запустити зібраний бекенд |
| `npm run prod` | Build + запуск через pm2 |
| `npm run db` / `db:down` | Підняти / зупинити Postgres + Redis |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:generate` | Згенерувати Prisma-клієнт |
| `npm run prisma:studio` | GUI для БД |
