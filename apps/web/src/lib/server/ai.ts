import { Mistral } from '@mistralai/mistralai';
import type { ResearchResult, SuggestionCard } from '@/types/board';

export type VineBranch = { title: string; content: string };

const MODEL = 'mistral-small-latest';
const BRANCH_COUNT = 3;

function getClient(): Mistral | null {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  return new Mistral({ apiKey });
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: unknown) =>
        typeof part === 'string' ? part : ((part as { text?: string })?.text ?? '')
      )
      .join('');
  }
  return '';
}

async function chatJson(system: string, user: string): Promise<Record<string, unknown>> {
  const client = getClient();
  if (!client) throw new Error('MISTRAL_API_KEY is not set');

  const response = await client.chat.complete({
    model: MODEL,
    responseFormat: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  const text = extractText(response.choices?.[0]?.message?.content);
  if (!text) throw new Error('Empty AI response');
  return JSON.parse(text) as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/* ------------------------------------------------------------------ */
/* Forge: expand one idea into distinct sub-ideas                      */
/* ------------------------------------------------------------------ */

export async function generateBranches(parentContent: string): Promise<VineBranch[]> {
  try {
    const parsed = await chatJson(
      'You are an AI brainstorming assistant for an infinite canvas tool. ' +
        'Given a parent idea, you propose three distinct, concise sub-ideas. ' +
        'Always respond in strict JSON matching the schema: ' +
        '{"branches":[{"title":"...","content":"..."}]}',
      `Parent idea text:\n${parentContent}\n\n` +
        `Generate exactly ${BRANCH_COUNT} distinct next-step ideas that expand this thought.`
    );
    const branches = parsed.branches;
    if (!Array.isArray(branches)) return [];
    return branches
      .filter(
        (b): b is VineBranch =>
          !!b &&
          typeof b === 'object' &&
          typeof (b as VineBranch).title === 'string' &&
          typeof (b as VineBranch).content === 'string'
      )
      .slice(0, BRANCH_COUNT);
  } catch (error) {
    console.error('AI forge error:', error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Research: structured analysis of a single idea                      */
/* ------------------------------------------------------------------ */

function fallbackResearch(content: string): ResearchResult {
  const topic = content.trim().slice(0, 80) || 'this idea';
  return {
    summary: `Manual research scaffold for "${topic}". Configure MISTRAL_API_KEY to enable AI-generated research.`,
    keyPoints: [
      'Define who benefits most from this idea',
      'Identify the closest existing alternative',
      'List what must be true for this to succeed',
    ],
    openQuestions: [
      'What is the biggest unknown?',
      'Who has tried something similar before?',
    ],
    risks: ['Unclear target audience', 'Unvalidated demand'],
  };
}

export async function researchIdea(content: string): Promise<ResearchResult> {
  try {
    const parsed = await chatJson(
      'You are a research assistant embedded in a brainstorming tool. ' +
        'Analyze the given idea and respond in strict JSON matching the schema: ' +
        '{"summary":"one paragraph","keyPoints":["..."],"openQuestions":["..."],"risks":["..."]}. ' +
        'keyPoints, openQuestions and risks must each contain 2-4 short strings.',
      `Idea to research:\n${content}`
    );
    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary
        : fallbackResearch(content).summary;
    return {
      summary,
      keyPoints: asStringArray(parsed.keyPoints),
      openQuestions: asStringArray(parsed.openQuestions),
      risks: asStringArray(parsed.risks),
    };
  } catch (error) {
    console.error('AI research error:', error);
    return fallbackResearch(content);
  }
}

/* ------------------------------------------------------------------ */
/* Suggest: whole-board suggestions                                    */
/* ------------------------------------------------------------------ */

export type BoardContextNode = { id: string; title: string; content: string };

function fallbackSuggestions(nodes: BoardContextNode[]): SuggestionCard[] {
  const first = nodes[0];
  const baseTitle = first?.title ?? 'Untitled board';
  return [
    {
      title: `Group ideas around a theme`,
      content:
        'Cluster related nodes into themes so the team can evaluate directions side by side.',
    },
    {
      title: `Stress-test "${baseTitle}"`,
      content:
        'Assign a devil\u2019s advocate to challenge the strongest assumption behind this idea.',
    },
    {
      title: 'Define a next experiment',
      content:
        'Pick one node and design the smallest test that would validate or kill it this week.',
    },
  ];
}

export async function suggestForBoard(
  nodes: BoardContextNode[]
): Promise<SuggestionCard[]> {
  if (nodes.length === 0) return [];

  const outline = nodes
    .slice(0, 40)
    .map((n) => `- (${n.id}) ${n.title}: ${n.content.slice(0, 200)}`)
    .join('\n');

  try {
    const parsed = await chatJson(
      'You are a brainstorming coach looking at all ideas on a team board. ' +
        'Respond in strict JSON matching the schema: ' +
        '{"suggestions":[{"title":"...","content":"..."}]}. ' +
        'Give exactly 3 concrete, actionable suggestions that build on, connect, or challenge the existing ideas.',
      `Board ideas:\n${outline}`
    );
    const suggestions = parsed.suggestions;
    if (!Array.isArray(suggestions)) return fallbackSuggestions(nodes);
    const cleaned = suggestions
      .filter(
        (s): s is SuggestionCard =>
          !!s &&
          typeof s === 'object' &&
          typeof (s as SuggestionCard).title === 'string' &&
          typeof (s as SuggestionCard).content === 'string'
      )
      .slice(0, 3);
    return cleaned.length > 0 ? cleaned : fallbackSuggestions(nodes);
  } catch (error) {
    console.error('AI suggest error:', error);
    return fallbackSuggestions(nodes);
  }
}
