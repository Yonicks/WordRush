export type Skill = "recognition" | "recall";
export interface Word {
  id: string;
  english: string;
  hebrew: string;
  category: string;
  example: string;
  difficulty: number;
}
export interface Progress {
  wordId: string;
  recognition: number;
  recall: number;
  seen: number;
  correct: number;
  streak: number;
  successDays: string[];
  lastSeenAt: number;
  nextReviewAt: number;
  nextReviewAtRecognition: number;
  nextReviewAtRecall: number;
}
export interface Child {
  id: string;
  name: string;
  avatar: number;
  xp: number;
  progress: Record<string, Progress>;
}
export interface Answer {
  wordId: string;
  skill: Skill;
  correct: boolean;
  responseMs: number;
  chosenId: string;
  at: number;
}
export interface Session {
  id: string;
  childId: string;
  startedAt: number;
  completedAt: number;
  answers: Answer[];
  xp: number;
}
export interface SessionDraft {
  id: string;
  childId: string;
  startedAt: number;
  selectedWordIds: string[];
  newWordIds: string[];
  questionIndex: number;
  discoveryIndex: number;
  answers: Answer[];
}
export interface AppState {
  version: 1;
  children: Child[];
  activeChildId: string | null;
  sessions: Session[];
  activeSession: SessionDraft | null;
}
