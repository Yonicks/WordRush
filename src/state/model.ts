import type { Answer, AppState, Session } from "../engine/types";
import { answerXp, updateProgress } from "../engine/learning";
export const initialState: AppState = {
  version: 1,
  children: [],
  activeChildId: null,
  sessions: [],
  activeSession: null,
};
export function recordAnswer(
  state: AppState,
  childId: string,
  answer: Answer,
): AppState {
  return {
    ...state,
    children: state.children.map((c) =>
      c.id === childId
        ? {
            ...c,
            progress: {
              ...c.progress,
              [answer.wordId]: updateProgress(
                c.progress[answer.wordId],
                answer,
              ),
            },
          }
        : c,
    ),
  };
}
export function completeSession(
  state: AppState,
  session: Omit<Session, "xp">,
): AppState {
  if (state.sessions.some((s) => s.id === session.id)) return state;
  const xp = session.answers.reduce((sum, a) => sum + answerXp(a), 0) + 30;
  return {
    ...state,
    sessions: [...state.sessions, { ...session, xp }],
    children: state.children.map((c) =>
      c.id === session.childId ? { ...c, xp: c.xp + xp } : c,
    ),
    activeSession: null,
  };
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const nonnegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const score = (value: unknown) => nonnegative(value) && value <= 100;
function validAnswer(a: unknown): boolean {
  return (
    isObject(a) &&
    typeof a.wordId === "string" &&
    (a.skill === "recognition" || a.skill === "recall") &&
    typeof a.correct === "boolean" &&
    typeof a.chosenId === "string" &&
    nonnegative(a.responseMs) &&
    nonnegative(a.at)
  );
}
export function parseState(raw: string | null): AppState {
  if (!raw) return initialState;
  const value: unknown = JSON.parse(raw);
  const fail = () => {
    throw new Error("Unsupported or damaged saved data");
  };
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Array.isArray(value.children) ||
    !Array.isArray(value.sessions)
  )
    return fail();
  const validChildren = value.children.every(
    (c) =>
      isObject(c) &&
      typeof c.id === "string" &&
      typeof c.name === "string" &&
      !!c.name.trim() &&
      nonnegative(c.xp) &&
      Number.isInteger(c.avatar) &&
      nonnegative(c.avatar) &&
      c.avatar < 3 &&
      isObject(c.progress) &&
      Object.entries(c.progress).every(
        ([key, p]) =>
          isObject(p) &&
          p.wordId === key &&
          score(p.recognition) &&
          score(p.recall) &&
          (p.nextReviewAtRecognition === undefined ||
            nonnegative(p.nextReviewAtRecognition)) &&
          (p.nextReviewAtRecall === undefined ||
            nonnegative(p.nextReviewAtRecall)) &&
          [p.seen, p.correct, p.streak, p.lastSeenAt, p.nextReviewAt].every(
            nonnegative,
          ) &&
          Array.isArray(p.successDays) &&
          p.successDays.every((d) => typeof d === "string"),
      ),
  );
  if (!validChildren) return fail();
  const ids = value.children.map((c) => c.id);
  if (
    new Set(ids).size !== ids.length ||
    (value.activeChildId !== null && !ids.includes(value.activeChildId))
  )
    return fail();
  if (
    !value.sessions.every(
      (s) =>
        isObject(s) &&
        typeof s.id === "string" &&
        ids.includes(s.childId) &&
        nonnegative(s.startedAt) &&
        nonnegative(s.completedAt) &&
        nonnegative(s.xp) &&
        Array.isArray(s.answers) &&
        s.answers.every(validAnswer),
    )
  )
    return fail();
  const migrated = value as unknown as AppState;
  migrated.activeSession = migrated.activeSession ?? null;
  if (
    migrated.activeSession &&
    !Array.isArray(migrated.activeSession.newWordIds)
  ) {
    migrated.activeSession.newWordIds = [];
  }
  for (const child of migrated.children)
    for (const p of Object.values(child.progress)) {
      p.nextReviewAtRecognition ??= p.nextReviewAt;
      p.nextReviewAtRecall ??= p.nextReviewAt;
    }
  return migrated;
}
