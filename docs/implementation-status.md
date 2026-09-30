# First playable implementation — 2026-10-01

Baseline: `3d62ebd`, imported from the existing `/home/jonathan/Git/WordRush` repository into this previously empty workspace. Changes live on `codex/first-playable`.

## Delivered

Phase 0 app shell, navigation, design tokens, local images and child profile models; Phase 1 progress, initial mastery/scheduler and word selection; Phase 2 discover/recognition/reverse-recall/results loop. A limited parent summary and XP make the flow inspectable. Local persistence supports returning to progress after closing the app.

The authoritative local schema is `src/engine/types.ts`; transitions are pure functions in `src/state/model.ts`. Storage version 1 is serialized under `wordrush.state.v1`. No server has been provisioned and no data leaves the device through an application backend.

The seed file contains 100 draft words, not 100 reviewed image/audio learning packs. Words and artwork retain separate identities; no numbered image is assumed to mean a particular word.

## Next implementation slice

1. Review seed translations/examples with a Hebrew-speaking educator and map approved vocabulary images to stable word IDs.
2. Replace device speech with recorded normal/slow pronunciation, preloading and verified offline playback.
3. Add frustration control, listening/picture modes and calibrate session duration with children.
4. Expand the parent view, parent gate and session history.
5. Choose backend/auth, implement migration-ready database schema and explicit sync/conflict rules before cross-device use.

## Validation record

- TypeScript strict checking and 14 engine/state tests pass.
- Android/iOS/web exports pass; all 194 PNG files and runtime image references validate.
- Browser smoke test passes: profile creation, five discover cards, ten questions in both directions, results, full reload with XP/progress retained, and parent summary. No browser runtime errors were recorded.
- The supplied mascot atlas crops were cleaned into compact transparent replacements; the remaining numbered vocabulary artwork still needs semantic review before it is attached to words.
- RTL navigation and Hebrew page direction are configured for Expo, React Navigation, Android, and web. English words/examples remain explicitly left-to-right. New sessions retry missed questions, persist an active draft, resume after reload, and schedule recognition and recall independently. Device speech now has a normal/slow toggle.
- Native device interaction, voice playback, accessibility and child usability still need physical-device checks.
