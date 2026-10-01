import type {
  Answer,
  AppState,
  Session,
  SessionDraft,
  Question,
} from "../engine/types";
import seed from "../data/words.json";
import { answerDraft, advanceDraft } from "../engine/session";
import {
  answerXp,
  optionsFor,
  questionSequence,
  updateProgress,
} from "../engine/learning";
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
  const xp =
    session.answers.reduce((sum, a) => sum + answerXp(a), 0) +
    (session.endedEarly || !session.answers.length ? 0 : 30);
  return {
    ...state,
    sessions: [...state.sessions, { ...session, xp }],
    children: state.children.map((c) =>
      c.id === session.childId ? { ...c, xp: c.xp + xp } : c,
    ),
    activeSession: null,
  };
}
export function setWordKnown(
  state: AppState,
  childId: string,
  wordId: string,
  known: boolean,
): AppState {
  return {
    ...state,
    children: state.children.map((child) => {
      if (child.id !== childId) return child;
      const knownIds = new Set(child.knownWordIds ?? []);
      if (known) knownIds.add(wordId);
      else knownIds.delete(wordId);
      return { ...child, knownWordIds: [...knownIds] };
    }),
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
    nonnegative(a.at) &&
    (a.assisted === undefined || typeof a.assisted === "boolean") &&
    (a.mode === undefined ||
      ["text", "picture", "listening"].includes(a.mode as string))
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
      (c.gender === undefined || c.gender === "boy" || c.gender === "girl") &&
      isObject(c.progress) &&
      (c.knownWordIds === undefined ||
        (Array.isArray(c.knownWordIds) &&
          c.knownWordIds.every((wordId) => typeof wordId === "string"))) &&
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
        (s.endedEarly === undefined || typeof s.endedEarly === "boolean") &&
        (s.activityByDay === undefined || validActivity(s.activityByDay)) &&
        Array.isArray(s.answers) &&
        s.answers.every(validAnswer),
    )
  )
    return fail();
  const migrated = value as unknown as AppState;
  migrated.activeSession = migrated.activeSession ?? null;
  if (migrated.activeSession !== null)
    migrated.activeSession = migrateDraft(migrated.activeSession, ids);
  for (const child of migrated.children) {
    child.knownWordIds ??= [];
  }
  for (const child of migrated.children)
    for (const p of Object.values(child.progress)) {
      p.nextReviewAtRecognition ??= p.nextReviewAt;
      p.nextReviewAtRecall ??= p.nextReviewAt;
    }
  return migrated;
}

const wordIds = new Set(seed.map((w) => w.id));
const validIds = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.every((id) => typeof id === "string" && wordIds.has(id));
const indexValue = (value: unknown): value is number =>
  nonnegative(value) && Number.isInteger(value);
function validActivity(value: unknown): value is Record<string, number> {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([key, ms]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && nonnegative(ms),
    )
  );
}
function migrateDraft(raw: unknown, childIds: string[]): SessionDraft {
  const fail = (): never => {
    throw new Error("Unsupported or damaged saved session");
  };
  if (
    !isObject(raw) ||
    typeof raw.id !== "string" ||
    !childIds.includes(raw.childId as string) ||
    !nonnegative(raw.startedAt) ||
    !validIds(raw.selectedWordIds) ||
    !Array.isArray(raw.answers) ||
    !raw.answers.every(validAnswer) ||
    !indexValue(raw.questionIndex) ||
    !indexValue(raw.discoveryIndex)
  )
    return fail();
  if (raw.newWordIds === undefined) {
    raw.newWordIds = [];
    raw.discoveryIndex = 0;
  }
  if (
    !validIds(raw.newWordIds) ||
    !raw.newWordIds.every((id) =>
      (raw.selectedWordIds as string[]).includes(id),
    ) ||
    !indexValue(raw.discoveryIndex) ||
    raw.discoveryIndex > raw.newWordIds.length
  )
    return fail();
  if (raw.queue === undefined) {
    // Replay the old append-on-mistake policy to recover the exact legacy cursor.
    const selected = (raw.selectedWordIds as string[]).map((id) =>
      seed.find((w) => w.id === id)!,
    );
    const queue: Question[] = questionSequence(selected).map((q) => ({
      wordId: q.word.id,
      skill: q.skill,
      mode: "text",
      retry: false,
      optionIds: optionsFor(q.word, seed).map((w) => w.id),
    }));
    for (const [i, answer] of (raw.answers as Answer[]).entries()) {
      const q = queue[i];
      if (!q || q.wordId !== answer.wordId || q.skill !== answer.skill)
        return fail();
      if (!q.optionIds.includes(answer.chosenId))
        q.optionIds[0 === q.optionIds.indexOf(q.wordId) ? 1 : 0] =
          answer.chosenId;
      if (!answer.correct)
        queue.push({ ...q, optionIds: [...q.optionIds], retry: true });
    }
    raw.queue = queue;
    raw.chosenId =
      raw.answers.length === raw.questionIndex + 1
        ? (raw.answers[raw.questionIndex] as Answer).chosenId
        : null;
    raw.hintUsed = false;
    raw.activityByDay = {};
  }
  if (
    !Array.isArray(raw.queue) ||
    !raw.queue.every(
      (q) =>
        isObject(q) &&
        wordIds.has(q.wordId as string) &&
        (raw.selectedWordIds as string[]).includes(q.wordId as string) &&
        ["recognition", "recall"].includes(q.skill as string) &&
        ["text", "picture", "listening"].includes(q.mode as string) &&
        typeof q.retry === "boolean" &&
        validIds(q.optionIds) &&
        q.optionIds.length === 4 &&
        new Set(q.optionIds).size === 4 &&
        q.optionIds.includes(q.wordId as string),
    )
  )
    return fail();
  if (
    raw.questionIndex > raw.queue.length ||
    typeof raw.hintUsed !== "boolean" ||
    !validActivity(raw.activityByDay) ||
    (raw.chosenId !== null && typeof raw.chosenId !== "string")
  )
    return fail();
  const draft = raw as unknown as SessionDraft;
  if (
    draft.answers.length !==
    draft.questionIndex + (draft.chosenId === null ? 0 : 1)
  )
    return fail();
  if (
    draft.answers.some(
      (answer, i) =>
        !draft.queue[i] ||
        answer.wordId !== draft.queue[i].wordId ||
        answer.skill !== draft.queue[i].skill ||
        !draft.queue[i].optionIds.includes(answer.chosenId) ||
        answer.correct !== (answer.wordId === answer.chosenId),
    )
  )
    return fail();
  if (
    draft.chosenId !== null &&
    draft.answers.at(-1)?.chosenId !== draft.chosenId
  )
    return fail();
  return draft;
}
export function submitSessionAnswer(
  state: AppState,
  chosenId: string,
  responseMs: number,
  now: number,
): AppState {
  if (!state.activeSession) return state;
  const result = answerDraft(state.activeSession, chosenId, responseMs, now);
  if (!result) return state;
  return {
    ...recordAnswer(state, result.draft.childId, result.answer),
    activeSession: result.draft,
  };
}
export function advanceSession(state: AppState): AppState {
  return state.activeSession
    ? { ...state, activeSession: advanceDraft(state.activeSession) }
    : state;
}
