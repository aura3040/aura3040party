# AURA 3040 | 그때그밤

모바일 우선 참가신청 웹앱입니다. 날짜·시간·프로필을 입력하면 성별별 참가비가 자동 계산되고, 신청 후 계좌이체 안내와 입금자명 보고까지 이어집니다. 관리자(`/admin`)는 OAuth로 보호됩니다.

## Stack

- React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- Express + tRPC
- MySQL (TiDB) via Drizzle ORM
- pnpm

## Setup

```bash
pnpm install
cp .env.example .env   # or create .env with DATABASE_URL / JWT_SECRET
pnpm run db:push       # apply migrations when schema changes
pnpm run dev
```

App defaults to [http://127.0.0.1:3847](http://127.0.0.1:3847) when `PORT=3847`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm run dev` | Dev server (API + Vite) |
| `pnpm run build` | Production build |
| `pnpm start` | Run production build |
| `pnpm test` | Vitest |
| `pnpm run check` | TypeScript check |
| `pnpm run db:push` | Generate & apply Drizzle migrations |

## Routes

- `/` — 참가신청
- `/payment/:referenceCode` — 입금 안내·입금자명 보고
- `/admin` — 신청자 관리 (OAuth)

## Deploy

Production build:

```bash
pnpm install
pnpm run build
NODE_ENV=production PORT=3847 HOST=0.0.0.0 node dist/index.js
```

Docker:

```bash
docker build -t aura-3040 .
docker run --env-file .env -p 3847:3847 aura-3040
```

`Dockerfile` and `Procfile` are included for Railway / Render / Fly.io style hosts. Set the same env vars as `.env.example` (especially `DATABASE_URL` and `JWT_SECRET`).

## Notes

- Do not commit `.env` or `.project-config.json` (they hold secrets).
- Bank account and fee amounts live in `shared/registration.ts`.
