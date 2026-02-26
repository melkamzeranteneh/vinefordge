# Vineforge Server

Express + TypeScript backend for Vineforge.

## Features
- POST /api/forge bridge to Python MCP server
- Yjs persistence backed by Redis
- Flush loop to Supabase (nodes/edges tables)
- Supabase Auth middleware for board access

## Setup

Required env vars:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL
- MCP_URL
- FLUSH_INTERVAL_MS (optional, default 5000)

## Dev

```bash
cd apps/server
pnpm install
pnpm dev
```
