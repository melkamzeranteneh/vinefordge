# Vineforge Web

Frontend + API for Vineforge, built with Next.js 14 (App Router), Tailwind CSS, and XYFlow.

## Pages

- `/` — Landing
- `/auth` — Supabase email/password auth
- `/dashboard` — Board list
- `/canvas/[boardId]` — Node canvas

## API Route Handlers

- `POST /api/forge` — generate AI sub-idea nodes (Mistral) for a parent node
- `POST /api/boards/[boardId]/yjs-update` — apply a base64 Yjs update and persist
- `GET /api/boards/[boardId]/snapshot` — fetch the board snapshot

All API handlers require `Authorization: Bearer <supabase-jwt>` and check board ownership.

## Getting Started

```bash
npm install         # from repo root
npm run dev         # http://localhost:3000
```

Set environment variables from `.env.example`. See the repo root `README.md` for the full setup, Supabase schema, and Vercel deployment guide.