'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as Y from 'yjs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  Plus,
  X,
  Loader2,
  FileSearch,
  Trash2,
  Wand2,
  Eye,
  AlertCircle,
  UploadCloud,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch, ApiError, bytesToBase64 } from '@/lib/api';
import { sileo } from 'sileo';
import { nodeTypes, IdeaFlowNode } from '@/components/canvas/CustomNodes';
import ShareModal from '@/components/ShareModal';
import type { BoardRole, IdeaNodeData, ResearchResult, SuggestionCard } from '@/types/board';
import { cn } from '@/shared/utils';

type SnapshotResponse = {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  board: { id: string; name: string };
  role: BoardRole;
};

type SaveState = 'pending' | 'saving' | 'saved' | 'error';

function normalizeNode(raw: Record<string, unknown>): IdeaFlowNode {
  const data = (raw.data ?? {}) as Partial<IdeaNodeData>;
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    type: 'idea',
    position: (raw.position as { x: number; y: number }) ?? { x: 0, y: 0 },
    selected: Boolean(raw.selected),
    data: {
      title: typeof data.title === 'string' ? data.title : '',
      content: typeof data.content === 'string' ? data.content : '',
      kind: data.kind === 'ai' ? 'ai' : 'user',
      status: 'idle',
      authorEmail:
        typeof data.authorEmail === 'string' ? data.authorEmail : undefined,
      research: (data.research as ResearchResult) ?? null,
    },
  };
}

function syncToDoc(
  ydoc: Y.Doc,
  nodes: IdeaFlowNode[],
  edges: Edge[]
): void {
  const nodesArr = ydoc.getArray('nodes');
  const edgesArr = ydoc.getArray('edges');
  ydoc.transact(() => {
    if (nodesArr.length > 0) nodesArr.delete(0, nodesArr.length);
    if (edgesArr.length > 0) edgesArr.delete(0, edgesArr.length);
    nodesArr.insert(
      0,
      nodes.map((n) => JSON.parse(JSON.stringify(n)))
    );
    edgesArr.insert(
      0,
      edges.map((e) => JSON.parse(JSON.stringify(e)))
    );
  });
}

const SAVE_LABEL: Record<SaveState, string> = {
  pending: 'Unsaved changes',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Save failed — retrying on next edit',
};

type HelpTopic = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
};

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'add-ideas',
    title: 'Adding ideas',
    summary: 'Drop new idea cards onto the canvas.',
    steps: [
      'Double-click anywhere on the canvas to create an idea at that spot.',
      'You can also press the “Add idea” button in the top-left corner.',
      'Drag cards around to arrange your thinking.',
    ],
  },
  {
    id: 'editing',
    title: 'Editing & connecting',
    summary: 'Refine an idea and link related ones.',
    steps: [
      'Click an idea once to open the Inspector panel on the right.',
      'Give it a title and a longer description there.',
      'Drag from the edge of one card to another to connect them.',
      'Select a card and press Delete/Backspace to remove it.',
    ],
  },
  {
    id: 'forge',
    title: 'Forging branches (AI)',
    summary: 'Let AI expand an idea into sub-ideas.',
    steps: [
      'Select the idea you want to grow.',
      'Press “Forge branches” in the Inspector.',
      'AI generates child ideas that appear connected to the original.',
    ],
  },
  {
    id: 'research',
    title: 'Researching an idea',
    summary: 'Attach facts, questions and risks.',
    steps: [
      'Select an idea and press “Research” in the Inspector.',
      'A research block is attached with key points, open questions and risks.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing boards',
    summary: 'Collaborate with your team.',
    steps: [
      'Press “Share” in the header.',
      'Invite teammates by email — owners can grant editor or viewer access.',
      'Viewers can read the board but not change it (a “View only” badge shows).',
    ],
  },
  {
    id: 'coach-suggestions',
    title: 'Coach suggestions (AI)',
    summary: 'Get AI suggestions for the whole board.',
    steps: [
      'Open this Coach me panel any time from the help icon.',
      'Press “Suggest improvements” below.',
      'The coach reviews every idea on the board and proposes new ones you can add or dismiss.',
    ],
  },
];

const COACH_PREF_KEY = 'vineforge.coach-enabled';

function CanvasInner() {
  const router = useRouter();
  const params = useParams<{ boardId: string }>();
  const boardId = params.boardId;
  const { user, session, loading: authLoading } = useAuth();
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<IdeaFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loaded, setLoaded] = useState(false);
  const [boardName, setBoardName] = useState('Untitled board');
  const [role, setRole] = useState<BoardRole>('owner');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [shareOpen, setShareOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionCard[] | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [coachEnabled, setCoachEnabled] = useState(true);

  const ydocRef = useRef<Y.Doc | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPaneClick = useRef(0);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const busyNodeIds = useRef<Set<string>>(new Set());

  const isViewer = role === 'viewer';
  const editable = !isViewer;

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    const stored = window.localStorage.getItem(COACH_PREF_KEY);
    if (stored !== null) setCoachEnabled(stored === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(COACH_PREF_KEY, String(coachEnabled));
  }, [coachEnabled]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!session || !boardId) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await apiFetch<SnapshotResponse>(
          `/api/boards/${boardId}/snapshot`,
          { session }
        );
        if (cancelled) return;
        const loadedNodes = (snap.nodes ?? []).map(normalizeNode);
        const loadedEdges = (snap.edges ?? []).map((e) => e as unknown as Edge);
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        syncToDoc(ydoc, loadedNodes, loadedEdges);
        setBoardName(snap.board?.name ?? 'Untitled board');
        setRole(snap.role);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setLoaded(true);
      } catch (err) {
        sileo.error({
          title: 'Board unavailable',
          description:
            err instanceof ApiError ? err.message : 'Failed to load the board',
        });
        router.replace('/dashboard');
      }
    })();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [session, boardId, router, setNodes, setEdges]);

  const persistNow = useCallback(async () => {
    const ydoc = ydocRef.current;
    if (!ydoc || !session || !boardId) return;
    try {
      setSaveState('saving');
      await apiFetch(`/api/boards/${boardId}/yjs-update`, {
        session,
        method: 'POST',
        body: { update: bytesToBase64(Y.encodeStateAsUpdate(ydoc)) },
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [session, boardId]);

  const schedulePersist = useCallback(() => {
    if (!editable) return;
    setSaveState('pending');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const ydoc = ydocRef.current;
      if (ydoc) syncToDoc(ydoc, nodesRef.current, edgesRef.current);
      void persistNow();
    }, 900);
  }, [editable, persistNow]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<IdeaFlowNode>[]) => {
      onNodesChange(changes);
      if (
        editable &&
        changes.some((c) => c.type !== 'select' && c.type !== 'dimensions')
      ) {
        schedulePersist();
      }
    },
    [onNodesChange, schedulePersist, editable]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      onEdgesChange(changes);
      if (editable && changes.some((c) => c.type !== 'select')) {
        schedulePersist();
      }
    },
    [onEdgesChange, schedulePersist, editable]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!editable) return;
      setEdges((eds) => addEdge(connection, eds));
      schedulePersist();
    },
    [setEdges, schedulePersist, editable]
  );

  const addIdeaNode = useCallback(
    (position: { x: number; y: number }) => {
      if (!editable) return;
      const node: IdeaFlowNode = {
        id: crypto.randomUUID(),
        type: 'idea',
        position,
        data: {
          title: '',
          content: '',
          kind: 'user',
          status: 'idle',
          research: null,
        },
      };
      setNodes((cur) => [...cur, node]);
      schedulePersist();
      return node;
    },
    [editable, setNodes, schedulePersist]
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastPaneClick.current < 350) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        addIdeaNode({ x: position.x - 128, y: position.y - 40 });
      }
      lastPaneClick.current = now;
    },
    [addIdeaNode, screenToFlowPosition]
  );

  const updateNodeData = useCallback(
    (nodeId: string, patch: Partial<IdeaNodeData>) => {
      setNodes((cur) =>
        cur.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
      schedulePersist();
    },
    [setNodes, schedulePersist]
  );

  const deleteSelected = useCallback(() => {
    const selected = nodes.find((n) => n.selected);
    if (!selected) return;
    setNodes((cur) => cur.filter((n) => n.id !== selected.id));
    setEdges((cur) =>
      cur.filter((e) => e.source !== selected.id && e.target !== selected.id)
    );
    schedulePersist();
  }, [nodes, setNodes, setEdges, schedulePersist]);

  const forgeFrom = useCallback(
    async (source: IdeaFlowNode) => {
      if (!editable || !session || busyNodeIds.current.has(source.id)) return;
      busyNodeIds.current.add(source.id);
      updateNodeData(source.id, { status: 'forging' });
      try {
        const res = await apiFetch<{
          nodes: Array<{ position: { x: number; y: number }; data: { title: string; content: string } }>;
        }>('/api/forge', {
          session,
          method: 'POST',
          body: {
            nodeId: source.id,
            content: `${source.data.title}\n${source.data.content}`.trim(),
            boardId,
            parentPosition: source.position,
          },
        });
        const branches = res.nodes.map((n) => ({
          id: crypto.randomUUID(),
          type: 'idea' as const,
          position: n.position,
          data: {
            title: n.data.title,
            content: n.data.content,
            kind: 'ai' as const,
            status: 'idle' as const,
            authorEmail: 'Mistral AI',
            research: null,
          },
        }));
        const branchEdges = branches.map((b) => ({
          id: `e-${source.id}-${b.id}`,
          source: source.id,
          target: b.id,
          animated: true,
        }));
        setNodes((cur) => [
          ...cur.map((n) =>
            n.id === source.id ? { ...n, data: { ...n.data, status: 'idle' as const } } : n
          ),
          ...branches,
        ]);
        setEdges((cur) => [...cur, ...branchEdges]);
        schedulePersist();
        sileo.success({
          title: 'Forged',
          description: `${branches.length} new branches added.`,
        });
      } catch (err) {
        updateNodeData(source.id, { status: 'idle' });
        sileo.error({
          title: 'Forge failed',
          description:
            err instanceof ApiError ? err.message : 'Please try again',
        });
      } finally {
        busyNodeIds.current.delete(source.id);
      }
    },
    [editable, session, boardId, updateNodeData, setNodes, setEdges, schedulePersist]
  );

  const research = useCallback(
    async (target: IdeaFlowNode) => {
      if (!session || busyNodeIds.current.has(target.id)) return;
      busyNodeIds.current.add(target.id);
      updateNodeData(target.id, { status: 'researching' });
      try {
        const res = await apiFetch<{ research: ResearchResult }>('/api/research', {
          session,
          method: 'POST',
          body: {
            content: `${target.data.title}\n${target.data.content}`.trim(),
          },
        });
        updateNodeData(target.id, { status: 'idle', research: res.research });
        sileo.success({ title: 'Research attached', description: target.data.title });
      } catch (err) {
        updateNodeData(target.id, { status: 'idle' });
        sileo.error({
          title: 'Research failed',
          description:
            err instanceof ApiError ? err.message : 'Please try again',
        });
      } finally {
        busyNodeIds.current.delete(target.id);
      }
    },
    [session, updateNodeData]
  );

  const runSuggest = useCallback(async () => {
    if (!session || suggesting) return;
    setSuggesting(true);
    try {
      const res = await apiFetch<{ suggestions: SuggestionCard[] }>(
        `/api/boards/${boardId}/suggest`,
        { session, method: 'POST' }
      );
      setSuggestions(res.suggestions);
      setHelpOpen(false);
    } catch (err) {
      sileo.error({
        title: 'Suggestions failed',
        description:
          err instanceof ApiError ? err.message : 'Please try again',
      });
    } finally {
      setSuggesting(false);
    }
  }, [session, boardId, suggesting]);

  const addSuggestionAsNode = useCallback(
    (card: SuggestionCard, index: number) => {
      const maxX = nodes.reduce((m, n) => Math.max(m, n.position.x), 0);
      const node = addIdeaNode({
        x: maxX + 120 + index * 40,
        y: 120 + index * 220,
      });
      if (node) {
        setNodes((cur) =>
          cur.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    title: card.title,
                    content: card.content,
                    kind: 'ai' as const,
                    authorEmail: 'Mistral AI',
                  },
                }
              : n
          )
        );
      }
      setSuggestions((prev) =>
        prev ? prev.filter((s) => s !== card) : prev
      );
    },
    [nodes, addIdeaNode, setNodes]
  );

  const selectedNode = nodes.find((n) => n.selected) ?? null;
  const activeTopic =
    HELP_TOPICS.find((t) => t.id === activeTopicId) ?? null;

  if (authLoading || !user || !loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/70 glass px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BrainCircuit className="text-white w-4 h-4" />
          </div>
          <h1 className="truncate text-sm font-semibold">{boardName}</h1>
          {isViewer && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Eye size={10} /> View only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator state={saveState} />
          <button
            onClick={() => {
              setHelpOpen((o) => !o);
              setActiveTopicId(null);
            }}
            title={coachEnabled ? 'Coach me' : 'Coach me (off)'}
            aria-label="Coach me"
            className={cn(
              'rounded-full border p-2 transition-colors ring-focus',
              coachEnabled
                ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
                : 'border-border bg-secondary/60 text-muted-foreground hover:bg-secondary'
            )}
          >
            <HelpCircle size={16} />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary ring-focus"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative h-full flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            colorMode="dark"
            fitView
            minZoom={0.2}
            maxZoom={2}
            nodesDraggable={editable}
            nodesConnectable={editable}
            deleteKeyCode={editable ? ['Backspace', 'Delete'] : null}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={26}
              size={1.6}
              color="#292345"
            />
            <Controls
              position="bottom-right"
              className="!rounded-xl !border !border-border !bg-card/90 !backdrop-blur"
            />
            {editable && (
              <Panel position="top-left">
                <button
                  onClick={() => {
                    const center = screenToFlowPosition({
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                    });
                    addIdeaNode({ x: center.x - 128, y: center.y - 40 });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 ring-focus"
                >
                  <Plus size={14} /> Add idea
                </button>
              </Panel>
            )}
          </ReactFlow>

          {loaded && nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-center">
              <Sparkles size={28} className="text-primary/60" />
              <p className="text-sm font-medium">Your canvas is empty</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Double-click anywhere or press “Add idea” to drop your first
                thought onto the board.
              </p>
            </div>
          )}

          {/* Coach me — interactive help */}
          <AnimatePresence>
            {helpOpen && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className="absolute bottom-6 left-6 z-30 w-80 overflow-hidden rounded-2xl border border-border glass shadow-2xl shadow-black/40"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <HelpCircle size={14} className="text-primary" /> Coach me
                  </span>
                  <div className="flex items-center gap-2">
                    <CoachToggle
                      checked={coachEnabled}
                      onChange={setCoachEnabled}
                    />
                    <button
                      onClick={() => setHelpOpen(false)}
                      aria-label="Close coach"
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {!coachEnabled ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-medium">Coaching is turned off</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      Flip the switch above whenever you want guidance or AI
                      suggestions again.
                    </p>
                  </div>
                ) : activeTopic ? (
                  <div className="p-4">
                    <button
                      onClick={() => setActiveTopicId(null)}
                      className="mb-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ring-focus"
                    >
                      <ChevronRight size={11} className="rotate-180" /> All
                      features
                    </button>
                    <p className="text-sm font-semibold">{activeTopic.title}</p>
                    <ol className="mt-2 space-y-1.5">
                      {activeTopic.steps.map((step, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[9px] font-bold text-primary">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto scrollbar-slim p-3">
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      What do you want to learn?
                    </p>
                    <div className="space-y-1.5">
                      {HELP_TOPICS.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setActiveTopicId(topic.id)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/80 p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/60 ring-focus"
                        >
                          <span>
                            <span className="block text-xs font-semibold">
                              {topic.title}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {topic.summary}
                            </span>
                          </span>
                          <ChevronRight
                            size={13}
                            className="shrink-0 text-muted-foreground"
                          />
                        </button>
                      ))}
                    </div>
                    {editable && (
                      <button
                        onClick={() => void runSuggest()}
                        disabled={suggesting}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50 ring-focus"
                      >
                        {suggesting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Wand2 size={13} />
                        )}
                        Suggest improvements
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI suggestions floating panel */}
          <AnimatePresence>
            {suggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className="absolute bottom-6 left-6 z-30 w-80 overflow-hidden rounded-2xl border border-border glass shadow-2xl shadow-black/40"
              >
                <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Wand2 size={14} className="text-primary" /> Coach
                    suggestions
                  </span>
                  <button
                    onClick={() => setSuggestions(null)}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto scrollbar-slim p-3">
                  {suggestions.map((s, i) => (
                    <div
                      key={`${s.title}-${i}`}
                      className="rounded-xl border border-border/70 bg-card/80 p-3"
                    >
                      <p className="mb-1 text-xs font-semibold">{s.title}</p>
                      <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                        {s.content}
                      </p>
                      {editable && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => addSuggestionAsNode(s, i)}
                            className="rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-colors"
                          >
                            Add to board
                          </button>
                          <button
                            onClick={() =>
                              setSuggestions((prev) =>
                                prev ? prev.filter((x) => x !== s) : prev
                              )
                            }
                            className="rounded-md px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Inspector */}
        <AnimatePresence>
          {selectedNode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="z-30 h-full shrink-0 overflow-hidden border-l border-border/70 glass"
            >
              <div className="flex h-full w-[340px] flex-col">
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Inspector
                  </h2>
                  <button
                    onClick={() =>
                      setNodes((cur) =>
                        cur.map((n) => ({ ...n, selected: false }))
                      )
                    }
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="scrollbar-slim flex-1 space-y-5 overflow-y-auto p-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Title
                    </label>
                    <input
                      value={selectedNode.data.title}
                      readOnly={isViewer}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          title: e.target.value,
                        })
                      }
                      placeholder="Name this idea…"
                      className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary/60 read-only:text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Content
                    </label>
                    <textarea
                      value={selectedNode.data.content}
                      readOnly={isViewer}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, {
                          content: e.target.value,
                        })
                      }
                      placeholder="Describe the idea in more detail…"
                      className="min-h-[140px] w-full resize-none rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus:border-primary/60 read-only:text-muted-foreground placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {editable && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => void forgeFrom(selectedNode)}
                        disabled={selectedNode.data.status === 'forging'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-accent px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-50"
                      >
                        {selectedNode.data.status === 'forging' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Sparkles size={13} />
                        )}
                        Forge branches
                      </button>
                      <button
                        onClick={() => void research(selectedNode)}
                        disabled={selectedNode.data.status === 'researching'}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-400/20 disabled:opacity-50"
                      >
                        {selectedNode.data.status === 'researching' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <FileSearch size={13} />
                        )}
                        Research
                      </button>
                    </div>
                  )}

                  {selectedNode.data.research && (
                    <ResearchBlock research={selectedNode.data.research} />
                  )}

                  {editable && (
                    <button
                      onClick={deleteSelected}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/25 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 size={13} /> Delete node
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <ShareModal
        boardId={boardId}
        session={session!}
        isOwner={role === 'owner'}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}

function CoachToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label="Turn coaching on or off"
      title={checked ? 'Coaching on' : 'Coaching off'}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors ring-focus',
        checked ? 'bg-primary' : 'bg-secondary border border-border'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-4 w-4 rounded-full shadow transition-all',
          checked
            ? 'left-[18px] bg-primary-foreground'
            : 'left-0.5 bg-muted-foreground'
        )}
      />
    </button>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saved') return null;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {state === 'pending' && (
        <>
          <UploadCloud size={12} /> Unsaved changes
        </>
      )}
      {state === 'saving' && (
        <>
          <Loader2 size={12} className="animate-spin" /> Saving…
        </>
      )}
      {state === 'error' && (
        <>
          <AlertCircle size={12} className="text-destructive" /> Save failed
        </>
      )}
    </span>
  );
}

function ResearchBlock({ research }: { research: ResearchResult }) {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
      <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
        <FileSearch size={12} /> Research
      </p>
      <p className="mb-3 text-xs leading-relaxed text-foreground/85">
        {research.summary}
      </p>
      {research.keyPoints.length > 0 && (
        <Section title="Key points" items={research.keyPoints} tone="cyan" />
      )}
      {research.openQuestions.length > 0 && (
        <Section title="Open questions" items={research.openQuestions} tone="amber" />
      )}
      {research.risks.length > 0 && (
        <Section title="Risks" items={research.risks} tone="rose" />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'cyan' | 'amber' | 'rose';
}) {
  const dot =
    tone === 'cyan'
      ? 'bg-cyan-400'
      : tone === 'amber'
        ? 'bg-amber-400'
        : 'bg-rose-400';
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <span className={cn('mt-1 h-1 w-1 shrink-0 rounded-full', dot)} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
