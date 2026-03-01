import { create } from 'zustand';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from '@xyflow/react';
import { WorkflowEdge, WorkflowNode, WorkflowNodeData } from '../types/workflow.types';

type WorkflowState = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange<WorkflowEdge>;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  forgeNode: (nodeId: string) => void;
};

const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'text',
      position: { x: 250, y: 140 },
      data: {
        title: 'From Submission',
        content: 'Trigger when a form is submitted',
        status: 'idle',
        vectorId: 'v0',
      },
    },
    {
      id: '2',
      type: 'text',
      position: { x: 410, y: 360 },
      data: {
        title: 'From Submission',
        content: 'Trigger when a form is submitted',
        status: 'idle',
        vectorId: 'v1',
      },
    },
  ],
  edges: [{ id: 'e1-2', source: '1', target: '2', type: 'smoothstep' }],
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges<WorkflowNode>(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },
  forgeNode: (nodeId) => {
    console.log(`Forging workflow node: ${nodeId}`);
  },
}));

export default useWorkflowStore;
