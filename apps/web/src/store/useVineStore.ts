import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
} from '@xyflow/react';
import { VineNode, VineNodeData } from 'packages/types/src/index';

export type VineCanvasState = {
  nodes: VineNode[];
  edges: any[]; // You might want to type this more strictly
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, data: Partial<VineNodeData>) => void;
  forgeNode: (nodeId: string) => void;
};

const useVineStore = create<VineCanvasState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'text',
      position: { x: 250, y: 200 },
      data: {
        title: 'Welcome to Vineforge!',
        content: 'This is your first node. Drag me or add more!',
        status: 'idle',
        vectorId: 'v0',
      },
    },
  ],
  edges: [],
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
    });
  },
  forgeNode: (nodeId) => {
    // Placeholder for AI interaction
    console.log(`Forging node: ${nodeId}`);
    // Here you would:
    // 1. Get the node's context (title, content).
    // 2. Call the AI bridge API endpoint.
    // 3. Receive new nodes and add them to the store.
  },
}));

export default useVineStore;
