import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Workflow, BookOpen, Puzzle, MousePointer2, Calculator, MoreVertical } from 'lucide-react';
import { cn } from '@/shared/utils';

export const TriggerNode = memo(({ data }: NodeProps) => {
    return (
        <div className="px-4 py-2 rounded-lg bg-[#EDE4FF] border border-[#D8B4FE] text-[#6D28D9] flex items-center gap-2 shadow-sm min-w-[180px]">
            <div className="w-5 h-5 flex items-center justify-center">
                <Workflow size={16} className="text-[#7C3AED]" />
            </div>
            <span className="text-sm font-medium">{data.label as string}</span>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#7C3AED] !border-none" />
        </div>
    );
});

export const ActionNode = memo(({ data, selected }: NodeProps) => {
    const iconMap: Record<string, any> = {
        workflow: Workflow,
        book: BookOpen,
        puzzle: Puzzle,
        mouse: MousePointer2,
        calc: Calculator,
    };

    const Icon = iconMap[data.icon as string] || Workflow;
    const colorClass = (data.color as string) || 'bg-rose-500';

    return (
        <div className={cn(
            "bg-card rounded-xl border border-border shadow-sm w-64 overflow-hidden relative transition-all",
            selected && "ring-2 ring-primary border-transparent"
        )}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-muted-foreground !border-none" />

            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0", colorClass)}>
                        <Icon size={22} />
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                        <MoreVertical size={16} />
                    </button>
                </div>

                <div>
                    <h4 className="font-bold text-foreground text-sm leading-tight mb-1">{data.title as string}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {data.description as string}
                    </p>
                </div>
            </div>

            <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen size={14} />
                    <span className="text-[10px] font-bold">1</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Puzzle size={14} />
                    <span className="text-[10px] font-bold">2</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-muted-foreground !border-none" />
        </div>
    );
});

TriggerNode.displayName = 'TriggerNode';
ActionNode.displayName = 'ActionNode';
