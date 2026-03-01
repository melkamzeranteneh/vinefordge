import React from 'react';
import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodeTypes';
import useWorkflowStore from '../state/workflow.store';

const WorkflowCanvas: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

  return (
    <div className="w-full h-full min-h-[520px] rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        style={{ width: '100%', height: '100%' }}
      >
        <Background color="#334155" gap={20} size={1} />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;
