'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Loader2, Trash2, Crown, Pencil, Eye, Users } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import type { Session } from '@supabase/supabase-js';
import type { BoardMember, BoardRole } from '@/types/board';
import { cn } from '@/shared/utils';

type Props = {
  boardId: string;
  session: Session;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
};

const RoleIcon: Record<BoardRole, typeof Crown> = {
  owner: Crown,
  editor: Pencil,
  viewer: Eye,
};

export default function ShareModal({ boardId, session, isOwner, open, onClose }: Props) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch<{ members: BoardMember[] }>(`/api/boards/${boardId}/members`, { session })
      .then((res) => setMembers(res.members))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load members'))
      .finally(() => setLoading(false));
  }, [open, boardId, session]);

  if (!open) return null;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviting(true);
    try {
      const res = await apiFetch<{ member: BoardMember }>(
        `/api/boards/${boardId}/members`,
        { session, method: 'POST', body: { email, role } }
      );
      setMembers((prev) => [
        ...prev.filter((m) => m.user_id !== res.member.user_id),
        res.member,
      ]);
      setEmail('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await apiFetch(`/api/boards/${boardId}/members?userId=${userId}`, {
        session,
        method: 'DELETE',
      });
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove member');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              <h2 className="font-semibold">Share board</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {isOwner && (
              <form onSubmit={invite} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="flex-1 bg-secondary/70 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/60"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                    className="bg-secondary/70 border border-border rounded-lg px-2 py-2 text-sm outline-none cursor-pointer"
                  >
                    <option value="editor">Can edit</option>
                    <option value="viewer">Can view</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 ring-focus"
                >
                  {inviting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <UserPlus size={14} />
                  )}
                  Invite
                </button>
              </form>
            )}

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Members
              </p>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No one else has access yet.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-slim">
                  {members.map((m) => {
                    const Icon = RoleIcon[m.role] ?? Eye;
                    return (
                      <li
                        key={m.user_id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2"
                      >
                        <span
                          className={cn(
                            'w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold uppercase',
                            m.role === 'owner'
                              ? 'bg-primary/20 text-primary'
                              : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {(m.email || '?').slice(0, 2)}
                        </span>
                        <span className="flex-1 truncate text-sm">{m.email}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground capitalize">
                          <Icon size={11} /> {m.role}
                        </span>
                        {isOwner && m.role !== 'owner' && (
                          <button
                            onClick={() => removeMember(m.user_id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
