
import React from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import useVineStore from '../store/useVineStore';
import { nodeTypes } from './nodeTypes';
import '@xyflow/react/dist/style.css';

const VineCanvas: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useVineStore();

  return (
    <div className="w-full h-full min-h-screen">
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
        <Background />
        <MiniMap />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default VineCanvas;
