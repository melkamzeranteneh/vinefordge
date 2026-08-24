-- Vineforge schema (idempotent — safe to re-run)

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  owner_email text,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team access. One row per member; the creator is seeded with role 'owner'.
create table if not exists board_members (
  board_id uuid not null references boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now(),
  primary key (board_id, user_id)
);
create index if not exists board_members_user_idx on board_members(user_id);

-- Readable snapshot of a board (nodes/edges as JSON).
create table if not exists nodes (
  board_id uuid primary key references boards(id) on delete cascade,
  data jsonb,
  updated_at timestamptz
);

create table if not exists edges (
  board_id uuid primary key references boards(id) on delete cascade,
  data jsonb,
  updated_at timestamptz
);

-- Encoded Yjs document state, so delta updates merge correctly across reloads.
create table if not exists board_documents (
  board_id uuid primary key references boards(id) on delete cascade,
  update text,
  updated_at timestamptz
);

-- Migrate pre-existing boards into board_members (no-ops when already present).
insert into board_members (board_id, user_id, email, role)
select b.id, b.user_id, coalesce(b.owner_email, ''), 'owner'
from boards b
where b.user_id is not null
on conflict (board_id, user_id) do nothing;
