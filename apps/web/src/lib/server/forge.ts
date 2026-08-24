import { generateBranches } from './ai';

export type ForgeRequest = {
  nodeId: string;
  content: string;
  parentPosition?: { x: number; y: number };
};

export type ForgeNode = {
  id: string;
  type: 'ai';
  position: { x: number; y: number };
  data: {
    title: string;
    content: string;
    status: 'idle' | 'forging';
    vectorId: string;
  };
};

const BRANCH_COUNT = 3;

function fanOutPositioning(
  parentX: number,
  parentY: number,
  count = BRANCH_COUNT,
  horizontalSpacing = 300,
  verticalSpacing = 150
): { x: number; y: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    x: parentX + horizontalSpacing,
    y: parentY + (i - (count - 1) / 2) * verticalSpacing,
  }));
}

function fallbackFanOut(input: ForgeRequest): ForgeNode[] {
  const baseX = input.parentPosition?.x ?? 0;
  const baseY = input.parentPosition?.y ?? 0;

  return Array.from({ length: BRANCH_COUNT }, (_, i) => ({
    id: `forge-${input.nodeId}-${i + 1}`,
    type: 'ai' as const,
    data: { title: `Idea ${i + 1}`, content: input.content, status: 'idle', vectorId: '' },
    position: { x: baseX + 300, y: baseY + (i - 1) * 150 },
  }));
}

export async function forgeFromNode(input: ForgeRequest): Promise<ForgeNode[]> {
  const branches = await generateBranches(input.content);
  if (branches.length === 0) {
    return fallbackFanOut(input);
  }

  const baseX = input.parentPosition?.x ?? 0;
  const baseY = input.parentPosition?.y ?? 0;
  const positions = fanOutPositioning(baseX, baseY, branches.length);

  return branches.map((branch, idx) => ({
    id: `${input.nodeId}-branch-${idx + 1}`,
    type: 'ai' as const,
    position: positions[idx],
    data: {
      title: branch.title,
      content: branch.content,
      status: 'idle',
      vectorId: '',
    },
  }));
}
