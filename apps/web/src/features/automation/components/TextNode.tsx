import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { WorkflowNode } from '../types/workflow.types';

const TextNode: React.FC<NodeProps<WorkflowNode>> = ({ data }) => {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 shadow p-4 min-w-[260px]">
      <div className="text-slate-100 text-xl leading-none mb-2">⚡</div>
      <div className="font-semibold text-base mb-1 text-slate-100">{data.title}</div>
      <div className="text-slate-400 text-sm whitespace-pre-line border-b border-slate-700 pb-3 mb-3">
        {data.content}
      </div>
      <button className="px-3 py-1.5 rounded border border-slate-500 text-slate-100 text-sm">Add step</button>
      <Handle type="target" position={Position.Left} className="!bg-slate-300" />
      <Handle type="source" position={Position.Right} className="!bg-slate-300" />
    </div>
  );
};

export default TextNode;
