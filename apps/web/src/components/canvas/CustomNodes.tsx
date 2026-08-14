import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Workflow, BookOpen, Puzzle, MousePointer2, Calculator, MoreVertical } from 'lucide-react';
import { cn } from '@/shared/utils';

export const TriggerNode = memo(({ data }: NodeProps) => {
    return (
        <div className="px-4 py-2 rounded-lg bg-[#EBF3FF] border border-[#D0E4FF] text-[#1E4D91] flex items-center gap-2 shadow-sm min-w-[180px]">
            <div className="w-5 h-5 flex items-center justify-center">
                <Workflow size={16} className="text-[#3B82F6]" />
            </div>
            <span className="text-sm font-medium">{data.label as string}</span>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#3B82F6] !border-none" />
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
            "bg-white rounded-xl border border-slate-200 shadow-sm w-64 overflow-hidden relative transition-all",
            selected && "ring-2 ring-primary border-transparent"
        )}>
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-300 !border-none" />

            <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0", colorClass)}>
                        <Icon size={22} />
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical size={16} />
                    </button>
                </div>

                <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{data.title as string}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {data.description as string}
                    </p>
                </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <BookOpen size={14} />
                    <span className="text-[10px] font-bold">1</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Puzzle size={14} />
                    <span className="text-[10px] font-bold">2</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-300 !border-none" />
        </div>
    );
});

TriggerNode.displayName = 'TriggerNode';
ActionNode.displayName = 'ActionNode';
