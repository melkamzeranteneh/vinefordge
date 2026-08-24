export type BoardRole = 'owner' | 'editor' | 'viewer';

export type BoardSummary = {
  id: string;
  name: string;
  role: BoardRole;
  ownerEmail?: string;
  updatedAt: string;
  createdAt: string;
};

export type BoardMember = {
  user_id: string;
  email: string;
  role: BoardRole;
};

export type ResearchResult = {
  summary: string;
  keyPoints: string[];
  openQuestions: string[];
  risks: string[];
};

export type SuggestionCard = {
  title: string;
  content: string;
};

export type IdeaNodeData = {
  title: string;
  content: string;
  kind: 'user' | 'ai';
  status: 'idle' | 'forging' | 'researching';
  authorEmail?: string;
  research?: ResearchResult | null;
  [key: string]: unknown;
};

export type ForgeNodePayload = {
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
