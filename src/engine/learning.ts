import type { Answer, Progress, Skill, Word } from "./types";
export const dayKey = (time: number) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const mastery = (p?: Progress) =>
  p ? Math.round((p.recognition + p.recall) / 2) : 0;
export const effectiveMastery = (p: Progress, now: number) =>
  Math.max(
    0,
    mastery(p) - Math.floor(Math.max(0, now - p.nextReviewAt) / 86400000) * 2,
  );
export const nextReviewFor = (p: Progress, skill: Skill) =>
  skill === "recognition" ? p.nextReviewAtRecognition : p.nextReviewAtRecall;
export function updateProgress(
  previous: Progress | undefined,
  answer: Answer,
): Progress {
  const p: Progress = previous ?? {
    wordId: answer.wordId,
    recognition: 0,
    recall: 0,
    seen: 0,
    correct: 0,
    streak: 0,
    successDays: [],
    lastSeenAt: 0,
    nextReviewAt: 0,
    nextReviewAtRecognition: 0,
    nextReviewAtRecall: 0,
  };
  const days = answer.correct
    ? [...new Set([...p.successDays, dayKey(answer.at)])]
    : p.successDays;
  const delta = answer.correct
    ? answer.responseMs < 1500
      ? 8
      : answer.responseMs < 3000
        ? 6
        : answer.responseMs < 6000
          ? 4
          : 2
    : -5;
  const cap =
    days.length < 2 ? 55 : days.length < 3 ? 79 : days.length < 5 ? 94 : 100;
  const next = {
    ...p,
    [answer.skill]: Math.max(0, Math.min(cap, p[answer.skill] + delta)),
    seen: p.seen + 1,
    correct: p.correct + Number(answer.correct),
    streak: answer.correct ? p.streak + 1 : 0,
    successDays: days,
    lastSeenAt: answer.at,
  };
  const score = mastery(next);
  const interval = !answer.correct
    ? 30000
    : score < 20
      ? 300000
      : score < 40
        ? 86400000
        : score < 60
          ? 3 * 86400000
          : score < 80
            ? 7 * 86400000
            : score < 95
              ? 30 * 86400000
              : 60 * 86400000;
  const reviewAt = answer.at + interval;
  return {
    ...next,
    nextReviewAt: Math.min(
      next.nextReviewAtRecognition || Infinity,
      next.nextReviewAtRecall || Infinity,
      reviewAt,
    ),
    [answer.skill === "recognition"
      ? "nextReviewAtRecognition"
      : "nextReviewAtRecall"]: reviewAt,
  };
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function selectWords(
  words: Word[],
  progress: Record<string, Progress>,
  now: number,
  limit = 15,
): Word[] {
  const due = words
    .filter(
      (w) =>
        progress[w.id] &&
        Math.min(
          progress[w.id].nextReviewAtRecognition,
          progress[w.id].nextReviewAtRecall,
        ) <= now,
    )
    .sort(
      (a, b) =>
        Math.min(
          progress[a.id].nextReviewAtRecognition,
          progress[a.id].nextReviewAtRecall,
        ) -
        Math.min(
          progress[b.id].nextReviewAtRecognition,
          progress[b.id].nextReviewAtRecall,
        ),
    );
  const weak = words
    .filter((w) => progress[w.id] && effectiveMastery(progress[w.id], now) < 60)
    .sort(
      (a, b) =>
        effectiveMastery(progress[a.id], now) -
        effectiveMastery(progress[b.id], now),
    );
  const fresh = words
    .filter((w) => !progress[w.id])
    .sort((a, b) => a.difficulty - b.difficulty);
  const known = words
    .filter((w) => progress[w.id])
    .sort((a, b) => progress[a.id].lastSeenAt - progress[b.id].lastSeenAt);
  const result: Word[] = [];
  const add = (pool: Word[], count: number) => {
    let n = 0;
    for (const w of pool)
      if (
        result.length < limit &&
        !result.some((x) => x.id === w.id) &&
        n < count
      ) {
        result.push(w);
        n++;
      }
  };
  add(due, Math.ceil(limit * 0.4));
  add(weak, Math.ceil(limit * 0.25));
  add(fresh, Math.min(5, Math.ceil(limit * 0.2)));
  add(known, limit);
  add(fresh, 5 - result.filter((w) => !progress[w.id]).length);
  return result;
}
export function optionsFor(
  word: Word,
  words: Word[],
  random = Math.random,
): Word[] {
  const eligible = words
    .filter(
      (w) =>
        w.id !== word.id &&
        w.hebrew !== word.hebrew &&
        w.english !== word.english,
    )
    .filter((w, i, all) => all.findIndex((x) => x.hebrew === w.hebrew) === i);
  const same = shuffle(
    eligible.filter((w) => w.category === word.category),
    random,
  );
  const rest = shuffle(
    eligible.filter((w) => w.category !== word.category),
    random,
  );
  return shuffle([word, ...same.concat(rest).slice(0, 3)], random);
}
export const answerXp = (a: Answer) =>
  a.correct ? 5 + (a.responseMs < 3000 ? 2 : 0) : 0;
export function questionSequence(
  words: Word[],
): { word: Word; skill: Skill }[] {
  return (["recognition", "recall"] as const).flatMap((skill) =>
    words.map((word) => ({ word, skill })),
  );
}
