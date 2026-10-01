# First playable implementation — 2026-10-01

Baseline: `3d62ebd`, imported from the existing `/home/jonathan/Git/WordRush` repository into this previously empty workspace. Changes live on `codex/first-playable`.

## Delivered

Phase 0 app shell, navigation, design tokens, local images and child profile models; Phase 1 progress, initial mastery/scheduler and word selection; Phase 2 discover/recognition/reverse-recall/results loop. A limited parent summary and XP make the flow inspectable. Local persistence supports returning to progress after closing the app.

The authoritative local schema is `src/engine/types.ts`; transitions are pure functions in `src/state/model.ts`. Storage version 1 is serialized under `wordrush.state.v1`. No server has been provisioned and no data leaves the device through an application backend.

The seed file contains 100 draft words, not 100 reviewed image/audio learning packs. Words and artwork retain separate identities; no numbered image is assumed to mean a particular word.

## Newly requested product direction

The next product milestone is now a 500-word child-controlled learning library. A child or parent must be able to open **All words**, search/filter by category and level, mark a word as **I already know this**, undo that decision, and review the resulting **Known / Skip list**. Known words remain in the profile for reporting and optional maintenance reviews, but they are removed from new-word teaching until the child asks to practise them again.

The daily target is a gentle 10-minute loop that aims for 10 meaningful words: due reviews first, then a capped number of new words, with a visible progress ring and a safe early finish when the child is tired. The product roadmap also adds a child-first game layer: short animated rounds, music and sound themes, celebratory effects, unlockable worlds and a cosmetic shop gated by a parent.

## Next implementation slice

1. Expand the reviewed seed from 100 to 500 stable word records, each with Hebrew translation, example, category, level, image ID and audio IDs.
2. Add the vocabulary library screen, search/filtering, known-word toggle, skip-list review and undo flow.
3. Change selection to the 10-minute daily contract: due reviews, up to 10 new words, missed-word recovery and explicit known-word exclusions.
4. Replace device speech with recorded normal/slow pronunciation, preloading and verified offline playback.
5. Add frustration control, listening/picture modes, animations, music/SFX and child usability calibration.
6. Expand the parent view, parent gate, session history, daily streak and 10-word outcome metrics.
7. Choose backend/auth, implement migration-ready database schema and explicit sync/conflict rules before cross-device use.

## Validation record

- TypeScript strict checking and 14 engine/state tests pass.
- Android/iOS/web exports pass; all 194 PNG files and runtime image references validate.
- Browser smoke test passes: profile creation, five discover cards, ten questions in both directions, results, full reload with XP/progress retained, and parent summary. No browser runtime errors were recorded.
- The supplied mascot atlas crops were cleaned into compact transparent replacements; the remaining numbered vocabulary artwork still needs semantic review before it is attached to words.
- RTL navigation and Hebrew page direction are configured for Expo, React Navigation, Android, and web. English words/examples remain explicitly left-to-right. New sessions retry missed questions, persist an active draft, resume after reload, and schedule recognition and recall independently. Device speech now has a normal/slow toggle.
- Native device interaction, voice playback, accessibility and child usability still need physical-device checks.
