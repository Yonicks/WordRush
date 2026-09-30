import { strict as assert } from "node:assert";
import { test } from "node:test";
import seed from "../src/data/words.json";
import {
  dayKey,
  mastery,
  optionsFor,
  questionSequence,
  selectWords,
  updateProgress,
} from "../src/engine/learning";
import {
  completeSession,
  initialState,
  parseState,
  recordAnswer,
} from "../src/state/model";
import type { Answer, AppState, Progress } from "../src/engine/types";
const now = new Date(2026, 9, 1, 12).getTime();
const answer: Answer = {
  wordId: seed[0].id,
  skill: "recognition",
  correct: true,
  responseMs: 1000,
  chosenId: seed[0].id,
  at: now,
};
test("seed has 100 stable, unique bilingual words and sentences", () => {
  assert.equal(seed.length, 100);
  assert.equal(new Set(seed.map((w) => w.id)).size, 100);
  assert.equal(new Set(seed.map((w) => w.english)).size, 100);
  for (const w of seed) {
    assert.match(w.id, /^w-\d{6}$/);
    assert.ok(w.english && w.hebrew && w.example && w.category);
  }
});
test("new learner receives no more than five new words", () => {
  const chosen = selectWords(seed, {}, now);
  assert.equal(chosen.length, 5);
  assert.equal(new Set(chosen.map((w) => w.id)).size, 5);
});
test("due reviews outrank unseen content and selection fills 15 without duplicates", () => {
  const progress: Record<string, Progress> = {};
  for (const [i, w] of seed.slice(10, 30).entries())
    progress[w.id] = {
      ...updateProgress(undefined, { ...answer, wordId: w.id }),
      nextReviewAt: now - i * 1000,
    };
  const chosen = selectWords(seed, progress, now);
  assert.equal(chosen.length, 15);
  assert.equal(new Set(chosen.map((w) => w.id)).size, 15);
  assert.ok(chosen.slice(0, 6).every((w) => progress[w.id]));
  assert.ok(chosen.filter((w) => !progress[w.id]).length <= 5);
});
test("recognition does not change recall", () => {
  const p = updateProgress(undefined, answer);
  assert.equal(p.recognition, 8);
  assert.equal(p.recall, 0);
  assert.equal(p.nextReviewAt, now + 300000);
});
test("one day cannot produce mastery and repeated correct answers stay capped", () => {
  let p: Progress | undefined;
  for (let i = 0; i < 100; i++)
    p = updateProgress(p, {
      ...answer,
      skill: i % 2 ? "recall" : "recognition",
    });
  assert.equal(mastery(p), 55);
  assert.equal(p!.successDays.length, 1);
});
test("multiple successful dates unlock long-term mastery", () => {
  let p: Progress | undefined;
  for (let d = 0; d < 6; d++)
    for (let i = 0; i < 40; i++)
      p = updateProgress(p, {
        ...answer,
        at: now + d * 86400000,
        skill: i % 2 ? "recall" : "recognition",
      });
  assert.equal(mastery(p), 100);
  assert.equal(p!.nextReviewAt, p!.lastSeenAt + 60 * 86400000);
});
test("wrong answers schedule a near review and never yield negative scores", () => {
  const p = updateProgress(undefined, { ...answer, correct: false });
  assert.equal(p.recognition, 0);
  assert.equal(p.nextReviewAt, now + 30000);
  assert.equal(p.streak, 0);
  assert.equal(p.successDays.length, 0);
});
test("choices include exactly one correct bilingual answer, including walk/go", () => {
  for (const word of seed) {
    const options = optionsFor(word, seed);
    assert.equal(options.length, 4);
    assert.equal(options.filter((w) => w.id === word.id).length, 1);
    assert.equal(new Set(options.map((w) => w.hebrew)).size, 4);
    assert.equal(new Set(options.map((w) => w.english)).size, 4);
  }
});
test("both retrieval directions are interleaved by round", () => {
  const sequence = questionSequence(seed.slice(0, 5));
  assert.equal(sequence.length, 10);
  assert.deepEqual(
    sequence.map((q) => q.skill),
    [...Array(5).fill("recognition"), ...Array(5).fill("recall")],
  );
});
const state: AppState = {
  ...initialState,
  activeChildId: "a",
  children: ["a", "b"].map((id) => ({
    id,
    name: id,
    avatar: 0,
    xp: 0,
    progress: {},
  })),
};
test("answers persist independently for each child through serialization", () => {
  const next = parseState(JSON.stringify(recordAnswer(state, "a", answer)));
  assert.equal(next.children[0].progress[answer.wordId].seen, 1);
  assert.deepEqual(next.children[1].progress, {});
  assert.deepEqual(state.children[0].progress, {});
});
test("session completion awards XP once", () => {
  const session = {
    id: "s1",
    childId: "a",
    startedAt: now,
    completedAt: now + 1000,
    answers: [answer],
  };
  const next = completeSession(state, session);
  assert.equal(next.children[0].xp, 37);
  assert.equal(next.children[1].xp, 0);
  assert.equal(completeSession(next, session).children[0].xp, 37);
  assert.equal(next.sessions.length, 1);
});
test("bad or future-version saves fail instead of overwriting user data", () => {
  assert.throws(() => parseState("{"));
  assert.throws(() => parseState('{"version":2}'));
  assert.deepEqual(parseState(null), initialState);
});
test("day keys follow the local calendar", () => {
  assert.equal(dayKey(new Date(2026, 9, 1, 0, 1).getTime()), "2026-10-01");
});

test("malformed nested data and dangling profiles are rejected", () => {
  assert.throws(() =>
    parseState(JSON.stringify({ ...state, sessions: [null] })),
  );
  assert.throws(() =>
    parseState(JSON.stringify({ ...state, activeChildId: "missing" })),
  );
  assert.throws(() =>
    parseState(
      JSON.stringify({
        ...state,
        children: [{ ...state.children[0], avatar: 99 }],
      }),
    ),
  );
});
