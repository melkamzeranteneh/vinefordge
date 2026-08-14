# Vineforge

Vineforge is a collaborative, node-based brainstorming workspace.

This repository is a **single Next.js app** (`apps/web`) built with the App Router, Tailwind, and XYFlow. It is ready to deploy to Vercel — the Express server and Python AI engine from earlier iterations have been folded into Next.js API route handlers.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **React 18**, **Tailwind CSS**, **XYFlow** (node canvas)
- **Supabase** (auth, boards, board document + snapshot storage)
- **Mistral AI** (native SDK, powers the "forge" endpoint — no Python/LangChain needed)

## Monorepo Structure

```text
apps/
	web/        # The entire product: frontend + API route handlers
```

API route handlers live next to the pages:

```text
apps/web/src/app/
	page.tsx                          # Landing
	auth/page.tsx                     # Auth (Supabase email/password)
	dashboard/page.tsx                # Board list
	canvas/[boardId]/page.tsx         # Node canvas
	api/forge/route.ts                # POST - AI forge a node into branches
	api/boards/[boardId]/yjs-update/route.ts   # POST - apply a Yjs update
	api/boards/[boardId]/snapshot/route.ts     # GET  - full board snapshot
```

## Prerequisites

- Node.js 20+
- npm (workspaces)
- A Supabase project (auth + board data)
- A Mistral API key (`mistral-small-latest` on the free tier)

## Installation

```bash
npm install
```

## Environment Variables

Set these in `apps/web/.env` locally (see `apps/web/.env.example`), or in the Vercel project dashboard for deployment.

```env
# Public (bundled into the browser)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Server-side only (used by API route handlers)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MISTRAL_API_KEY=...
```

## Supabase Schema

The server-side route handlers expect these tables:

```sql
-- Auth-managed users are provided by Supabase Auth.

create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Readable snapshot of a board (nodes/edges as JSON).
create table nodes (
  board_id uuid primary key references boards(id) on delete cascade,
  data jsonb,
  updated_at timestamptz
);

create table edges (
  board_id uuid primary key references boards(id) on delete cascade,
  data jsonb,
  updated_at timestamptz
);

-- Encoded Yjs document state, so delta updates merge correctly across reloads.
create table board_documents (
  board_id uuid primary key references boards(id) on delete cascade,
  update text,  -- base64-encoded Yjs state
  updated_at timestamptz
);
```

> Note: `nodes`/`edges`/`board_documents` are written with the **service role key**. Enable Row Level Security on `boards` only if your clients need to read it directly; the API routes authorize access themselves.

## Running Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (or use `vercel` CLI from the repo root).
2. Vercel detects the npm workspace and builds `apps/web` (see `vercel.json` → `rootDirectory`).
3. Add all environment variables from `apps/web/.env.example` in Project Settings → Environment Variables.
4. Deploy. The `next build` in `apps/web` produces the static site plus the API route handlers.

## API Overview

All API routes require an `Authorization: Bearer <supabase-jwt>` header and check board ownership.

- `POST /api/forge` — body `{ nodeId, content, boardId, parentPosition? }`. Calls Mistral to generate up to 3 sub-idea nodes (falls back to deterministic fan-out if the API key is missing or the call fails).
- `POST /api/boards/:boardId/yjs-update` — body `{ update }` (base64 Yjs update). Applies the update, persists the doc, and flushes the readable snapshot to Supabase.
- `GET /api/boards/:boardId/snapshot` — returns `{ nodes, edges }`.
