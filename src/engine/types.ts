export type Skill = "recognition" | "recall";
export type Gender = "boy" | "girl";
export interface Word {
  id: string;
  english: string;
  hebrew: string;
  category: string;
  example: string;
  difficulty: number;
  imageId?: string;
  contentStatus?: string;
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
  gender?: Gender;
  xp: number;
  progress: Record<string, Progress>;
  knownWordIds?: string[];
}
export interface Answer {
  wordId: string;
  skill: Skill;
  correct: boolean;
  responseMs: number;
  chosenId: string;
  at: number;
  assisted?: boolean;
  mode?: "text" | "picture" | "listening";
}
export interface Session {
  id: string;
  childId: string;
  startedAt: number;
  completedAt: number;
  endedEarly?: boolean;
  activityByDay?: Record<string, number>;
  answers: Answer[];
  xp: number;
}
export interface Question {
  wordId: string;
  skill: Skill;
  mode: "text" | "picture" | "listening";
  retry: boolean;
  optionIds: string[];
}
export interface SessionDraft {
  id: string;
  childId: string;
  startedAt: number;
  selectedWordIds: string[];
  newWordIds: string[];
  questionIndex: number;
  discoveryIndex: number;
  queue: Question[];
  chosenId: string | null;
  hintUsed: boolean;
  activityByDay: Record<string, number>;
  answers: Answer[];
}
export interface AppState {
  version: 1;
  children: Child[];
  activeChildId: string | null;
  sessions: Session[];
  activeSession: SessionDraft | null;
}
