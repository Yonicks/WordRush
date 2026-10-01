import { strict as assert } from "node:assert";
import { test } from "node:test";
import seed from "../src/data/words.json";
import {
  createDraft,
  dailyActivity,
  recordActivity,
  skipDiscoveryWord,
  newWordBudget,
} from "../src/engine/session";
import {
  initialState,
  parseState,
  submitSessionAnswer,
  advanceSession,
  completeSession,
} from "../src/state/model";
import { selectWords, updateProgress, dayKey } from "../src/engine/learning";
import type { AppState, Answer } from "../src/engine/types";
const now = new Date(2026, 9, 1, 12).getTime();
const base: AppState = {
  ...initialState,
  activeChildId: "a",
  children: [
    { id: "a", name: "A", avatar: 0, xp: 0, progress: {}, knownWordIds: [] },
  ],
};
function started() {
  const draft = createDraft(base, seed, "s", now);
  draft.discoveryIndex = draft.newWordIds.length;
  return { ...base, activeSession: draft };
}
const reload = (s: AppState) => parseState(JSON.stringify(s));
test("reload preserves submitted answer, options and retry queue; double submissions do not count", () => {
  let state = started();
  const q = state.activeSession!.queue[0];
  const wrong = q.optionIds.find((id) => id !== q.wordId)!;
  state = submitSessionAnswer(state, wrong, 2500, now) as typeof state;
  const saved = reload(state);
  assert.deepEqual(saved, state);
  assert.equal(saved.activeSession!.queue.at(-1)!.retry, true);
  assert.equal(saved.activeSession!.chosenId, wrong);
  assert.deepEqual(submitSessionAnswer(saved, q.wordId, 1000, now), saved);
  assert.equal(saved.children[0].progress[q.wordId].seen, 1);
});
test("all-wrong session has a finite queue and resumes during retries", () => {
  let state: AppState = started();
  const original = state.activeSession!.queue.length;
  let count = 0;
  while (
    state.activeSession!.questionIndex < state.activeSession!.queue.length
  ) {
    const q = state.activeSession!.queue[state.activeSession!.questionIndex];
    state = submitSessionAnswer(
      state,
      q.optionIds.find((id) => id !== q.wordId)!,
      2000,
      now + count,
    );
    state = reload(state);
    state = advanceSession(state);
    state = reload(state);
    count++;
    assert.ok(count <= original * 2);
  }
  assert.equal(count, original * 2);
});
test("legacy retry drafts migrate without losing cursor or feedback", () => {
  const selected = seed.slice(0, 2);
  const qids = selected.map((w) => w.id);
  const answers: Answer[] = [
    {
      wordId: qids[0],
      skill: "recognition",
      chosenId: seed[20].id,
      correct: false,
      responseMs: 1,
      at: now,
    },
    {
      wordId: qids[1],
      skill: "recognition",
      chosenId: qids[1],
      correct: true,
      responseMs: 1,
      at: now,
    },
    {
      wordId: qids[0],
      skill: "recall",
      chosenId: qids[0],
      correct: true,
      responseMs: 1,
      at: now,
    },
    {
      wordId: qids[1],
      skill: "recall",
      chosenId: qids[1],
      correct: true,
      responseMs: 1,
      at: now,
    },
    {
      wordId: qids[0],
      skill: "recognition",
      chosenId: qids[0],
      correct: true,
      responseMs: 1,
      at: now,
    },
  ];
  const raw = {
    ...base,
    activeSession: {
      id: "old",
      childId: "a",
      startedAt: now,
      selectedWordIds: qids,
      newWordIds: qids,
      discoveryIndex: 2,
      questionIndex: 4,
      answers,
    },
  };
  const saved = parseState(JSON.stringify(raw));
  assert.equal(saved.activeSession!.queue.length, 5);
  assert.equal(saved.activeSession!.chosenId, qids[0]);
  assert.equal(saved.activeSession!.queue[4].retry, true);
  assert.deepEqual(reload(saved), saved);
});
test("malformed saved queues and cursors are rejected", () => {
  const state = started();
  for (const change of [
    { questionIndex: 999 },
    { queue: null },
    { chosenId: seed[0].id },
    { activityByDay: { bad: -5 } },
    { answers: [null] },
  ])
    assert.throws(() =>
      parseState(
        JSON.stringify({
          ...state,
          activeSession: { ...state.activeSession, ...change },
        }),
      ),
    );
});
test("hints do not increase mastery or successful learning days", () => {
  const a: Answer = {
    wordId: seed[0].id,
    skill: "recognition",
    correct: true,
    chosenId: seed[0].id,
    responseMs: 1000,
    at: now,
    assisted: true,
  };
  const p = updateProgress(undefined, a);
  assert.equal(p.recognition, 0);
  assert.equal(p.successDays.length, 0);
  assert.equal(p.nextReviewAt, now + 30000);
});
test("early finish saves earned XP without completion bonus and rewards only once", () => {
  let state: AppState = started();
  const q = state.activeSession!.queue[0];
  state = submitSessionAnswer(state, q.wordId, 5000, now);
  const draft = state.activeSession!;
  const session = {
    id: draft.id,
    childId: "a",
    startedAt: now,
    completedAt: now + 1000,
    answers: draft.answers,
    endedEarly: true,
    activityByDay: { [dayKey(now)]: 1000 },
  };
  state = completeSession(state, session);
  assert.equal(state.children[0].xp, 5);
  assert.equal(state.activeSession, null);
  assert.deepEqual(completeSession(state, session), state);
});
test("daily words deduplicate across sessions and draft and respect profile and local date", () => {
  const a: Answer = {
    wordId: seed[0].id,
    skill: "recognition",
    correct: true,
    chosenId: seed[0].id,
    responseMs: 1000,
    at: now,
  };
  const state: AppState = {
    ...started(),
    sessions: [
      {
        id: "past",
        childId: "a",
        startedAt: now,
        completedAt: now,
        answers: [a, a, { ...a, wordId: seed[1].id, at: now - 86400000 }],
        xp: 10,
      },
    ],
  };
  state.activeSession!.answers = [a, { ...a, wordId: seed[2].id }];
  assert.deepEqual(dailyActivity(state, "a", now).wordIds, [
    seed[0].id,
    seed[2].id,
  ]);
  assert.equal(dailyActivity(state, "b", now).wordIds.length, 0);
});
test("active time splits at midnight instead of counting closed-app time", () => {
  const midnight = new Date(2026, 9, 2).getTime();
  const d = recordActivity(
    started().activeSession!,
    midnight - 1000,
    midnight + 2000,
  );
  assert.equal(d.activityByDay["2026-10-01"], 1000);
  assert.equal(d.activityByDay["2026-10-02"], 2000);
});
test("marking a discovery word known removes it from this round too; all-known is safe", () => {
  let draft = started().activeSession!;
  draft.discoveryIndex = 0;
  const first = draft.newWordIds[0];
  draft = skipDiscoveryWord(draft);
  assert.ok(draft.queue.every((q) => q.wordId !== first));
  assert.equal(draft.discoveryIndex, 0);
  const state = {
    ...base,
    children: [{ ...base.children[0], knownWordIds: seed.map((w) => w.id) }],
  };
  assert.equal(createDraft(state, seed, "empty", now).queue.length, 0);
});
test("overdue reviews fill before new words; daily practiced and known words stay excluded", () => {
  const progress = Object.fromEntries(
    seed.slice(10, 30).map((w) => [
      w.id,
      updateProgress(undefined, {
        wordId: w.id,
        skill: "recognition",
        correct: false,
        chosenId: seed[0].id,
        responseMs: 1000,
        at: now - 60000,
      }),
    ]),
  );
  const selected = selectWords(seed, progress, now, 10, [], 10);
  assert.equal(selected.length, 10);
  assert.ok(selected.every((w) => progress[w.id]));
  assert.ok(
    selectWords(seed, progress, now, 10, [seed[10].id], 10, [
      seed[11].id,
    ]).every((w) => ![seed[10].id, seed[11].id].includes(w.id)),
  );
  assert.equal(newWordBudget(base.children[0]), 5);
  assert.equal(newWordBudget({ ...base.children[0], progress }), 2);
});
test("review date follows updated dimension instead of staying stuck on its old date", () => {
  const answer: Answer = {
    wordId: seed[0].id,
    skill: "recognition",
    correct: true,
    chosenId: seed[0].id,
    responseMs: 1000,
    at: now,
  };
  const first = updateProgress(undefined, answer);
  const next = updateProgress(first, { ...answer, at: now + 600000 });
  assert.equal(next.nextReviewAt, next.nextReviewAtRecognition);
  assert.ok(next.nextReviewAt > first.nextReviewAt);
});

test("new learners see picture and listening recognition plus separate reverse recall", () => {
  const draft = createDraft(base, seed, "mixed", now);
  assert.ok(draft.queue.some((q) => q.mode === "picture"));
  assert.ok(draft.queue.some((q) => q.mode === "listening"));
  assert.equal(draft.queue.filter((q) => q.skill === "recall").length, 5);
  assert.ok(
    draft.queue
      .filter((q) => q.skill === "recall")
      .every((q) => q.mode === "text"),
  );
});
test("non-object active session values do not pass storage validation", () => {
  for (const activeSession of [false, 0, ""])
    assert.throws(() => parseState(JSON.stringify({ ...base, activeSession })));
});

test("legacy repeated misses with different choices retain historical options", () => {
  const target = seed[0].id;
  const answers: Answer[] = [
    {
      wordId: target,
      skill: "recognition",
      chosenId: seed[10].id,
      correct: false,
      responseMs: 1000,
      at: now,
    },
    {
      wordId: target,
      skill: "recall",
      chosenId: target,
      correct: true,
      responseMs: 1000,
      at: now,
    },
    {
      wordId: target,
      skill: "recognition",
      chosenId: seed[20].id,
      correct: false,
      responseMs: 1000,
      at: now,
    },
    {
      wordId: target,
      skill: "recognition",
      chosenId: seed[30].id,
      correct: false,
      responseMs: 1000,
      at: now,
    },
  ];
  const state = parseState(
    JSON.stringify({
      ...base,
      activeSession: {
        id: "legacy",
        childId: "a",
        startedAt: now,
        selectedWordIds: [target],
        newWordIds: [target],
        discoveryIndex: 1,
        questionIndex: 3,
        answers,
      },
    }),
  );
  assert.equal(state.activeSession!.queue.length, 5);
  assert.deepEqual(reload(state), state);
});
