import type { VineNode } from '../../../../packages/types/src/index';

export type ForgeRequest = {
  nodeId: string;
  content: string;
  parentPosition?: { x: number; y: number };
};

export async function forgeFromNode(input: ForgeRequest): Promise<Partial<VineNode>[]> {
  const mcpUrl = process.env.MCP_URL;
  if (!mcpUrl) {
    return fallbackFanOut(input);
  }

  try {
    const response = await fetch(`${mcpUrl}/forge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return fallbackFanOut(input);
    }

    const data = (await response.json()) as { nodes: Partial<VineNode>[] };
    return data.nodes ?? fallbackFanOut(input);
  } catch (error) {
    console.error('MCP forge error:', error);
    return fallbackFanOut(input);
  }
}

function fallbackFanOut(input: ForgeRequest): Partial<VineNode>[] {
  const baseX = input.parentPosition?.x ?? 0;
  const baseY = input.parentPosition?.y ?? 0;

  return [
    {
      id: `forge-${input.nodeId}-1`,
      type: 'ai',
      data: { title: 'Idea 1', content: input.content, status: 'idle', vectorId: '' },
      position: { x: baseX + 300, y: baseY - 150 },
    },
    {
      id: `forge-${input.nodeId}-2`,
      type: 'ai',
      data: { title: 'Idea 2', content: input.content, status: 'idle', vectorId: '' },
      position: { x: baseX + 300, y: baseY },
    },
    {
      id: `forge-${input.nodeId}-3`,
      type: 'ai',
      data: { title: 'Idea 3', content: input.content, status: 'idle', vectorId: '' },
      position: { x: baseX + 300, y: baseY + 150 },
    },
  ];
}
