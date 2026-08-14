import { Mistral } from '@mistralai/mistralai';

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

type VineBranch = { title: string; content: string };

const MODEL = 'mistral-small-latest';
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

function extractText(
  content: unknown
): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : (part?.text ?? '')))
      .join('');
  }
  return '';
}

async function generateBranches(parentContent: string): Promise<VineBranch[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not set');
  }

  const client = new Mistral({ apiKey });

  const response = await client.chat.complete({
    model: MODEL,
    responseFormat: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are an AI brainstorming assistant for an infinite canvas tool. ' +
          'Given a parent idea, you propose three distinct, concise sub-ideas. ' +
          'Always respond in strict JSON matching the schema: ' +
          '{"branches":[{"title":"...","content":"..."}]}',
      },
      {
        role: 'user',
        content:
          `Parent idea text:\n${parentContent}\n\n` +
          'Generate exactly 3 distinct next-step ideas that expand this thought.',
      },
    ],
  });

  const text = extractText(response.choices?.[0]?.message?.content);
  if (!text) {
    throw new Error('Empty AI response');
  }

  const parsed = JSON.parse(text) as { branches?: VineBranch[] };
  return Array.isArray(parsed.branches) ? parsed.branches : [];
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
  try {
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
  } catch (error) {
    console.error('AI forge error:', error);
    return fallbackFanOut(input);
  }
}
