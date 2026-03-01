import type { Edge, Node } from '@xyflow/react';

export interface WorkflowNodeData extends Record<string, unknown> {
	title: string;
	content: string;
	status: 'idle' | 'forging';
	vectorId: string;
}

export type WorkflowNode = Node<WorkflowNodeData, 'text' | 'ai'>;
export type WorkflowEdge = Edge;
