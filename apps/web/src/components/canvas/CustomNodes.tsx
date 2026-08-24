'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Sparkles, FileSearch, Loader2 } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { cn } from '@/shared/utils';
import type { IdeaNodeData } from '@/types/board';

export type IdeaFlowNode = Node<IdeaNodeData, 'idea'>;

function IdeaNodeComponent({ data, selected }: NodeProps<IdeaFlowNode>) {
  const isAi = data.kind === 'ai';
  const busy = data.status === 'forging' || data.status === 'researching';

  return (
    <div
      className={cn(
        'group w-64 rounded-xl border bg-card/95 backdrop-blur-sm shadow-lg shadow-black/30 transition-all duration-200',
        selected
          ? 'border-primary/70 glow-primary'
          : 'border-border hover:border-primary/40'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-muted-foreground/60 !border-none"
      />

      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          {isAi && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Sparkles size={10} /> AI
            </span>
          )}
          {!isAi && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Idea
            </span>
          )}
          {data.research && (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
              <FileSearch size={10} /> Researched
            </span>
          )}
          {busy && <Loader2 size={12} className="ml-auto animate-spin text-primary" />}
        </div>

        <h4 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 mb-1">
          {data.title || 'Untitled idea'}
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {data.content || 'No content yet — select this node to edit.'}
        </p>
      </div>

      {(data.authorEmail || data.research) && (
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/70 bg-secondary/50 rounded-b-xl">
          {data.authorEmail ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
              {data.authorEmail}
            </span>
          ) : (
            <span />
          )}
          {data.research && (
            <span className="text-[10px] text-cyan-300/80">
              {data.research.keyPoints.length} key points
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-primary/80 !border-none"
      />
    </div>
  );
}

export const IdeaNode = memo(IdeaNodeComponent);
IdeaNode.displayName = 'IdeaNode';

export const nodeTypes = { idea: IdeaNode };
