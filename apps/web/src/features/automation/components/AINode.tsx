import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { WorkflowNode } from '../types/workflow.types';

const AINode: React.FC<NodeProps<WorkflowNode>> = ({ data }) => {
  return (
    <div className="rounded-xl border border-blue-500 bg-slate-800 shadow p-4 min-w-[260px]">
      <div className="font-semibold text-base mb-1 text-blue-300">{data.title}</div>
      <div className="text-slate-300 text-sm whitespace-pre-line">{data.content}</div>
      <Handle type="target" position={Position.Left} className="!bg-slate-300" />
      <Handle type="source" position={Position.Right} className="!bg-slate-300" />
    </div>
  );
};

export default AINode;
