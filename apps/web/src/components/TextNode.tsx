import React from 'react';
import { Handle, NodeProps, Position } from '@xyflow/react';
import { VineNodeData } from 'packages/types/src/index';

const TextNode: React.FC<NodeProps<VineNodeData>> = ({ data }) => {
  return (
    <div className="rounded-lg border bg-white shadow p-4 min-w-[180px]">
      <div className="font-semibold text-lg mb-1">{data.title}</div>
      <div className="text-gray-700 text-sm whitespace-pre-line">{data.content}</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default TextNode;
