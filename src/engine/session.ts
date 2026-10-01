import type {
  Answer,
  AppState,
  Child,
  Question,
  SessionDraft,
  Word,
} from "./types";
import { dayKey, optionsFor, selectWords } from "./learning";

export const DAILY_WORD_TARGET = 10;
export const DAILY_TIME_MS = 10 * 60 * 1000;
export function dailyActivity(state: AppState, childId: string, now: number) {
  const today = dayKey(now);
  const sessions = state.sessions.filter((s) => s.childId === childId);
  const draft =
    state.activeSession?.childId === childId ? state.activeSession : null;
  const answers = [
    ...sessions.flatMap((s) => s.answers),
    ...(draft?.answers ?? []),
  ];
  const wordIds = [
    ...new Set(
      answers.filter((a) => dayKey(a.at) === today).map((a) => a.wordId),
    ),
  ];
  const activeMs =
    sessions.reduce((n, s) => n + (s.activityByDay?.[today] ?? 0), 0) +
    (draft?.activityByDay[today] ?? 0);
  return {
    wordIds,
    activeMs,
    complete: wordIds.length >= DAILY_WORD_TARGET || activeMs >= DAILY_TIME_MS,
  };
}
export function newWordBudget(child: Child) {
  const recent = Object.values(child.progress)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, 10);
  if (!recent.length) return 5;
  const attempts = recent.reduce((n, p) => n + p.seen, 0);
  const accuracy =
    recent.reduce((n, p) => n + p.correct, 0) / Math.max(1, attempts);
  return accuracy < 0.6 ? 2 : accuracy < 0.85 ? 5 : 10;
}
export function createDraft(
  state: AppState,
  words: Word[],
  id: string,
  now: number,
): SessionDraft {
  const child = state.children.find((c) => c.id === state.activeChildId)!;
  const today = dailyActivity(state, child.id, now);
  const selected = selectWords(
    words,
    child.progress,
    now,
    Math.max(1, DAILY_WORD_TARGET - today.wordIds.length),
    child.knownWordIds,
    newWordBudget(child),
    today.wordIds,
  );
  const queue: Question[] = [];
  // Recognition varies its presentation; recall remains a separate learning dimension.
  for (const skill of ["recognition", "recall"] as const)
    selected.forEach((word, i) => {
      const mode =
        skill === "recall"
          ? "text"
          : i % 3 === 1
            ? "listening"
            : word.imageId
              ? "picture"
              : "text";
      queue.push({
        wordId: word.id,
        skill,
        mode,
        retry: false,
        optionIds: optionsFor(word, words).map((w) => w.id),
      });
    });
  return {
    id,
    childId: child.id,
    startedAt: now,
    selectedWordIds: selected.map((w) => w.id),
    newWordIds: selected.filter((w) => !child.progress[w.id]).map((w) => w.id),
    questionIndex: 0,
    discoveryIndex: 0,
    answers: [],
    queue,
    chosenId: null,
    activityByDay: {},
    hintUsed: false,
  };
}
export function answerDraft(
  draft: SessionDraft,
  chosenId: string,
  responseMs: number,
  now: number,
): { draft: SessionDraft; answer: Answer } | null {
  const q = draft.queue[draft.questionIndex];
  if (
    !q ||
    draft.chosenId !== null ||
    draft.discoveryIndex < draft.newWordIds.length ||
    !q.optionIds.includes(chosenId)
  )
    return null;
  const answer: Answer = {
    wordId: q.wordId,
    skill: q.skill,
    correct: chosenId === q.wordId,
    responseMs,
    chosenId,
    at: now,
    assisted: draft.hintUsed,
    mode: q.mode,
  };
  const queue = [...draft.queue];
  if (!answer.correct && !q.retry) queue.push({ ...q, retry: true });
  return {
    answer,
    draft: { ...draft, queue, chosenId, answers: [...draft.answers, answer] },
  };
}
export function advanceDraft(draft: SessionDraft): SessionDraft {
  if (draft.chosenId === null) return draft;
  return {
    ...draft,
    questionIndex: draft.questionIndex + 1,
    chosenId: null,
    hintUsed: false,
  };
}
export function skipDiscoveryWord(draft: SessionDraft): SessionDraft {
  const wordId = draft.newWordIds[draft.discoveryIndex];
  return {
    ...draft,
    newWordIds: draft.newWordIds.filter((id) => id !== wordId),
    selectedWordIds: draft.selectedWordIds.filter((id) => id !== wordId),
    queue: draft.queue.filter((q) => q.wordId !== wordId),
  };
}
export function recordActivity(
  draft: SessionDraft,
  from: number,
  to: number,
): SessionDraft {
  if (to <= from) return draft;
  const activityByDay = { ...draft.activityByDay };
  // Split at local midnight so a late-night round counts toward the correct days.
  let cursor = from;
  while (cursor < to) {
    const date = new Date(cursor);
    date.setHours(24, 0, 0, 0);
    const end = Math.min(to, date.getTime());
    const key = dayKey(cursor);
    activityByDay[key] = (activityByDay[key] ?? 0) + end - cursor;
    cursor = end;
  }
  return { ...draft, activityByDay };
}
