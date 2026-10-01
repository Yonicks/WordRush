# Daily learning implementation — 2026-10-01

The requested improvements are implemented: durable sessions, comfortably finishable rounds, daily progress, picture/listening practice and a 1,000-word library.

## Session behavior

Pure draft transitions live in `src/engine/session.ts`; state mutations and validation are in `src/state/model.ts`. Drafts persist their complete queue, option order, submitted choice, hint state, discovery cursor, answers and practice time per local day. The existing `wordrush.state.v1` storage key is retained, with additive migration for older drafts. Legacy retry queues are reconstructed by replaying their answer history; invalid cursors or inconsistent answers are rejected without overwriting storage.

New questions allow one retry. Hints reveal the translation and suppress mastery gains; early finish saves answer XP and gives a positive summary without the 30 XP completion bonus. Marking a discover word as known removes its questions immediately. An all-known library has a safe empty-session summary. Duplicate answer submissions and completion rewards are guarded in state transitions.

## Daily contract

The home, session, results and parent views show today's activity. Distinct words are deduplicated across completed/early-ended sessions and the active draft, per child and local date. Active practice time is split across midnight and pauses when the app is backgrounded or the play screen loses focus. Ten words or ten foreground minutes produces a gentle finish suggestion; continuation is optional. New learners begin with five new words. Recent aggregate performance sets later new-word budgets to two, five or ten, after due and weak reviews. This is a heuristic pending child usability calibration.

## Library and media

1,000 stable records; category, difficulty and learning-state filters; bilingual search; known list and undo; incremental display of 30 rows; expandable example, picture and pronunciation previews. 46 picture mappings were visually inspected. All 1,000 words have bundled normal and slow synthetic speech. Listening and pictures vary recognition practice; reverse recall retains its separate score. See `content-and-audio.md` for provenance and review limitations.

## Validation

Validation results for this change are recorded after the final checks. Native device testing, independent educator review and human listening review remain required before a production learning release.
