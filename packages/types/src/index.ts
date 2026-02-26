import type { Node } from '@xyflow/react';

export interface VineNodeData {
  title: string;
  content: string;
  status: 'idle' | 'forging';
  vectorId: string;
}

export type VineNode = Node<VineNodeData>;
