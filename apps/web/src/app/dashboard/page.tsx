'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  BrainCircuit,
  LogOut,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase';
import { apiFetch, ApiError } from '@/lib/api';
import { sileo } from 'sileo';
import ThemeToggle from '@/components/theme';
import type { BoardSummary } from '@/types/board';
import { cn } from '@/shared/utils';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!session) return;
    apiFetch<{ boards: BoardSummary[] }>('/api/boards', { session })
      .then((res) => setBoards(res.boards))
      .catch((e) =>
        sileo.error({
          title: 'Failed to load boards',
          description: e instanceof ApiError ? e.message : 'Please try again',
        })
      )
      .finally(() => setLoading(false));
  }, [session]);

  const filtered = useMemo(
    () =>
      boards.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [boards, query]
  );

  const createBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiFetch<{ board: BoardSummary }>('/api/boards', {
        session,
        method: 'POST',
        body: { name: newName },
      });
      sileo.success({ title: 'Board created', description: res.board.name });
      router.push(`/canvas/${res.board.id}`);
    } catch (err) {
      sileo.error({
        title: 'Could not create board',
        description: err instanceof ApiError ? err.message : 'Please try again',
      });
      setCreating(false);
    }
  };

  const renameBoard = async (board: BoardSummary) => {
    const name = window.prompt('New board name', board.name)?.trim();
    if (!name || name === board.name) return;
    try {
      await apiFetch(`/api/boards/${board.id}`, {
        session,
        method: 'PATCH',
        body: { name },
      });
      setBoards((prev) =>
        prev.map((b) => (b.id === board.id ? { ...b, name } : b))
      );
    } catch (err) {
      sileo.error({
        title: 'Rename failed',
        description: err instanceof ApiError ? err.message : 'Please try again',
      });
    }
  };

  const deleteBoard = async (board: BoardSummary) => {
    if (!window.confirm(`Delete "${board.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/boards/${board.id}`, { session, method: 'DELETE' });
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
      sileo.success({ title: 'Board deleted' });
    } catch (err) {
      sileo.error({
        title: 'Delete failed',
        description: err instanceof ApiError ? err.message : 'Please try again',
      });
    }
  };

  const handleLogout = async () => {
    await getSupabase().auth.signOut();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 flex-col border-r border-border/70 glass p-5 gap-8 sticky top-0 h-screen">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BrainCircuit className="text-primary-foreground w-5 h-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Vineforge
            </span>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            <button className="flex items-center gap-3 rounded-xl border border-border bg-secondary/70 px-4 py-2.5 text-sm font-medium ring-focus transition-colors hover:bg-secondary">
              <BrainCircuit size={16} /> Boards
              <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                {boards.length}
              </span>
            </button>
          </nav>

          <div className="space-y-3 border-t border-border/70 pt-4">
            <div className="px-1">
              <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Signed in
              </p>
              <p className="truncate text-sm font-medium">{user.email}</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Theme
              </span>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors ring-focus"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-end justify-between gap-4 mb-8"
          >
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                WORKSPACE
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Idea <span className="text-gradient">boards</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your brainstorming sessions — shared and owned.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              <Plus size={16} /> New board
            </button>
          </motion.header>

          <div className="relative mb-6 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards…"
              className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary/50 placeholder:text-muted-foreground/60"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                <Plus size={20} className="text-muted-foreground" />
              </div>
              <p className="font-medium">
                {query ? 'No boards match your search' : 'No boards yet'}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {query
                  ? 'Try a different search term.'
                  : 'Create your first board and start forging ideas with your team.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((board, i) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    onClick={() => router.push(`/canvas/${board.id}`)}
                    className="group relative cursor-pointer rounded-2xl p-px transition-transform duration-300 hover:-translate-y-1"
                  >
                    {/* Gradient border on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-100 transition-opacity duration-300 group-hover:opacity-100 border border-border"
                      style={{
                        background:
                          'linear-gradient(160deg, hsl(var(--foreground) / 0.3), transparent 45%, transparent 65%, hsl(var(--foreground) / 0.12))',
                      }}
                    />
                    <div className="relative overflow-hidden rounded-2xl bg-card">
                      {/* Top hairline + corner glow on hover */}
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {board.role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFor(menuFor === board.id ? null : board.id);
                          }}
                          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-secondary hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 ring-focus"
                          aria-label={`Options for ${board.name}`}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      )}

                      {menuFor === board.id && (
                        <div
                          className="absolute right-3 top-11 z-20 w-36 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setMenuFor(null);
                              renameBoard(board);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
                          >
                            <Pencil size={13} /> Rename
                          </button>
                          <button
                            onClick={() => {
                              setMenuFor(null);
                              deleteBoard(board);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground transition-colors duration-300 group-hover:border-foreground group-hover:bg-primary group-hover:text-primary-foreground">
                            <BrainCircuit size={18} strokeWidth={1.75} />
                          </div>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                              board.role === 'owner'
                                ? 'border-border bg-secondary text-muted-foreground'
                                : 'border-border bg-primary text-primary-foreground'
                            )}
                          >
                            {board.role === 'owner' ? (
                              'Owner'
                            ) : (
                              <>
                                <Users size={9} /> Shared
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="mb-1 truncate font-display text-[15px] font-semibold">
                          {board.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {board.role !== 'owner'
                              ? `by ${board.ownerEmail ?? 'teammate'}`
                              : ''}{' '}
                            {timeAgo(board.updatedAt)}
                          </span>
                          <ArrowUpRight
                            size={14}
                            className="shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground group-hover:opacity-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setCreateOpen(false)}
        >
          <motion.form
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onSubmit={createBoard}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/10"
          >
            <h2 className="mb-1 text-lg font-bold">New board</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Name the space where your ideas will grow.
            </p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Q3 Product Brainstorm"
              className="w-full rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 placeholder:text-muted-foreground/60"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground',
                  'hover:bg-secondary hover:text-foreground transition-colors'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                Create board
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
