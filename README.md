# Vineforge

Vineforge is a collaborative, node-based brainstorming workspace.

This repository is a monorepo with:
- A React + Vite canvas app (`apps/web`)
- An Express + TypeScript API server (`apps/server`)
- A Python FastAPI AI engine (`ai-engine`)
- Shared TypeScript types (`packages/types`)

## Monorepo Structure

```text
apps/
	web/        # Frontend (React, Vite, Tailwind, XYFlow)
	server/     # Backend API (Express, Supabase auth, Redis, Yjs persistence)
ai-engine/    # AI forge service (FastAPI + Mistral/LangChain)
packages/
	types/      # Shared TypeScript node types
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Python 3.11+
- Redis (local or hosted)
- Supabase project (for auth + board data)

## Installation

From repository root:

If `pnpm` is not recognized on Windows PowerShell, run:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

Then install dependencies:

```bash
pnpm install
```

If your PowerShell blocks `npm.ps1`, either use `npm.cmd` explicitly or allow local scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

For Python dependencies:

```bash
cd ai-engine
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment Variables

### `apps/server/.env`

```env
PORT=4000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://localhost:6379
MCP_URL=http://localhost:8000
FLUSH_INTERVAL_MS=5000
```

### `ai-engine/.env`

```env
MISTRAL_API_KEY=...
```

## Running Locally

Open separate terminals.

### 1) Start Redis

If Redis is installed locally:

```bash
redis-server
```

If you are on Windows and `redis-server` is not recognized, set `REDIS_URL` in `apps/server/.env` to point to a Windows Native Redis or a hosted Redis provider.

### 2) Start AI Engine (FastAPI)

From `ai-engine`:

```bash
python -m uvicorn src.server:app --reload --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

### 3) Start API Server (Express)

From repo root:

```bash
pnpm --filter apps-server dev
```

Health check: `GET http://localhost:4000/health`

### 4) Start Web App (Vite)

From repo root:

```bash
pnpm --filter apps-web dev
```

Open the local URL shown by Vite (typically `http://localhost:5173`).

## API Overview

### Server routes (`apps/server`)

- `GET /health`
- `POST /api/forge` (requires Supabase Bearer token + board access)
- `POST /api/boards/:boardId/yjs-update` (requires auth)
- `POST /api/boards/:boardId/flush` (requires auth)
- `GET /api/boards/:boardId/snapshot` (requires auth)

### AI Engine routes (`ai-engine`)

- `GET /health`
- `POST /forge`

`POST /forge` request body:

```json
{
	"parent_id": "root",
	"parent_content": "Brainstorm ideas",
	"parent_x": 0,
	"parent_y": 0
}
```

## Build

From repo root:

```bash
pnpm --filter apps-web build
pnpm --filter apps-server build
```

## Current Status

- Core backend, AI endpoint, and canvas scaffolding are in place.
- Some frontend hooks (`useAIStream`, `useCanvasSync`) are placeholders and still need full integration.

## Useful Scripts (root)

- `npm run dev` → runs web dev server
- `npm run dev:web` → runs web dev server
- `npm run dev:server` → runs API server dev mode
- `npm run build` → builds web app
- `npm run build:server` → builds server app
