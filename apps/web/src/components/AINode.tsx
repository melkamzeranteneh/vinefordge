import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { VineNodeData } from 'packages/types/src/index';

const AINode: React.FC<NodeProps<VineNodeData>> = ({ data }) => {
  return (
    <div className="rounded-lg border-2 border-blue-400 bg-blue-50 shadow p-4 min-w-[200px]">
      <div className="font-semibold text-lg mb-1 text-blue-700 flex items-center gap-2">
        <span>🤖</span> {data.title}
      </div>
      <div className="text-blue-900 text-sm whitespace-pre-line">{data.content}</div>
      <div className="mt-2 text-xs text-blue-500">Status: {data.status}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default AINode;
