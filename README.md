# Vineforge

Vineforge is a collaborative, node-based brainstorming workspace where teams capture ideas on an infinite canvas and AI helps them **forge** branches, **research** ideas, and **suggest** next steps.

This repository is a **single Next.js app** (`apps/web`) built with the App Router, Tailwind, and XYFlow. It is ready to deploy to Vercel — the Express server and Python AI engine from earlier iterations have been folded into Next.js API route handlers.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **React 18**, **Tailwind CSS**, **XYFlow** (node canvas)
- **Yjs** (CRDT board documents, persisted via API)
- **Supabase** (auth, boards, team members, board document + snapshot storage)
- **Mistral AI** (native SDK — no Python/LangChain needed)

## Features

- Email/password auth via Supabase
- Boards dashboard: create, rename, delete, search
- Infinite canvas: double-click to add idea nodes, drag to connect, edit in the inspector
- **Team sharing**: invite teammates by email as `editor` or `viewer`; owners can manage/remove members
- **AI coach**:
  - *Forge* — expand any node into 3 AI-generated sub-idea nodes
  - *Research* — attach structured research (summary / key points / open questions / risks) to a node
  - *Coach me* — whole-board suggestions you can add to the canvas with one click
- Auto-save: every change syncs through a Yjs doc (`board_documents`) plus readable JSON snapshots (`nodes`/`edges`)
- Graceful degradation: all AI features fall back to deterministic output when `MISTRAL_API_KEY` is missing

## Monorepo Structure

```text
apps/
	web/        # The entire product: frontend + API route handlers
supabase/
	schema.sql  # Tables + indexes (idempotent, safe to re-run)
```

### Pages & route handlers

```text
apps/web/src/app/
	page.tsx                          # Landing
	auth/page.tsx                     # Auth (Supabase email/password)
	dashboard/page.tsx                # Real boards list + CRUD
	canvas/[boardId]/page.tsx         # Collaborative node canvas
	api/boards/route.ts               # GET list (owned + shared) / POST create
	api/boards/[boardId]/route.ts             # PATCH rename / DELETE (owner only)
	api/boards/[boardId]/members/route.ts     # GET list / POST invite / DELETE remove
	api/boards/[boardId]/snapshot/route.ts    # GET full board snapshot + meta
	api/boards/[boardId]/yjs-update/route.ts  # POST apply a Yjs update
	api/forge/route.ts                # POST forge a node into AI branches
	api/research/route.ts             # POST research an idea
	api/boards/[boardId]/suggest/route.ts     # POST coach suggestions for the board
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-side only (used by API route handlers)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
MISTRAL_API_KEY=...
```

## Supabase Schema

Run [`supabase/schema.sql`](./supabase/schema.sql) in the SQL editor. Highlights:

```sql
create table boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  owner_email text,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team sharing: creator is seeded as 'owner'; invites add editor/viewer rows.
create table board_members (
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('owner','editor','viewer')),
  primary key (board_id, user_id)
);

-- Readable snapshots (nodes/edges as JSON).
create table nodes  (board_id uuid primary key references boards(id) on delete cascade, data jsonb, updated_at timestamptz);
create table edges  (board_id uuid primary key references boards(id) on delete cascade, data jsonb, updated_at timestamptz);

-- Encoded Yjs state so delta updates merge correctly across reloads.
create table board_documents (board_id uuid primary key references boards(id) on delete cascade, update text, updated_at timestamptz);
```

> Note: `nodes`/`edges`/`board_documents` are written with the **service role key**. The API routes authorize access themselves via `board_members`.

## Access model

| Role   | View board | Edit canvas | Rename/Delete | Manage members |
| ------ | ---------- | ----------- | ------------- | -------------- |
| owner  | ✅         | ✅          | ✅            | ✅             |
| editor | ✅         | ✅          | ❌            | ❌             |
| viewer | ✅         | ❌          | ❌            | ❌             |

All API routes require an `Authorization: Bearer <supabase-jwt>` header.

## Running Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (or use `vercel` CLI from the repo root).
2. Vercel detects the npm workspace and builds `apps/web`.
3. Add all environment variables from `apps/web/.env.example` in Project Settings → Environment Variables.
4. Deploy. The `next build` in `apps/web` produces the static site plus the API route handlers.

## API Overview

All API routes require an `Authorization: Bearer <supabase-jwt>` header and check membership via `board_members`.

- `GET /api/boards` — boards the caller owns or shares, each tagged with the caller's role.
- `POST /api/boards` — `{ name }`. Creates the board and seeds the owner membership.
- `PATCH /api/boards/:boardId` — `{ name }` (owner only).
- `DELETE /api/boards/:boardId` — cascades documents/snapshots/members (owner only).
- `POST /api/boards/:boardId/members` — `{ email, role }`. Resolves the Vineforge account by email.
- `DELETE /api/boards/:boardId/members?userId=` — remove a non-owner member.
- `GET /api/boards/:boardId/snapshot` — `{ nodes, edges, board, role }`.
- `POST /api/boards/:boardId/yjs-update` — body `{ update }` (base64 Yjs update). Persists the doc, flushes the readable snapshot, bumps `boards.updated_at`. Requires ≥ editor.
- `POST /api/forge` — body `{ nodeId, content, boardId, parentPosition? }`. Returns up to 3 positioned sub-idea nodes (deterministic fan-out fallback without an API key).
- `POST /api/research` — body `{ content }`. Returns `{ research: { summary, keyPoints[], openQuestions[], risks[] } }`.
- `POST /api/boards/:boardId/suggest` — returns `{ suggestions: [{ title, content }] }` derived from the whole board.
