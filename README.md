# WordRush

An offline-first Expo / React Native vocabulary game for Hebrew-speaking children.

## Run

Requires Node 24 and npm.

```sh
npm ci
npm start
```

For a browser preview: `npm run web -- --port 8094`. No backend credentials are required. Use a compatible Expo Go release or development build for Android/iOS; iOS simulator builds require macOS.

## GitHub Pages

The repository includes a Pages workflow at `.github/workflows/deploy-pages.yml`. After pushing `main`, enable **Settings → Pages → Source → GitHub Actions** in the repository. The workflow then publishes the static web export at:

`https://yonicks.github.io/WordRush/`

The Expo base path is applied only for the Pages build; local browser previews continue to use `http://localhost:8094/`.

## Implemented

- Hebrew interface, separate local child profiles, avatars and XP.
- 500 stable bilingual vocabulary records with categories, three difficulty levels and examples.
- Searchable library with category/level/status filters, known-word exclusions, undo, picture/example/pronunciation previews, and incremental loading.
- Discover → varied recognition (text, picture or listening) → reverse recall → encouraging results.
- 46 visually inspected picture mappings; 1,000 bundled synthetic pronunciation clips covering all words at normal and slow speed.
- Saved question queues, answer choices, feedback, hints, discovery position and retry rounds. Reloads retain submitted answers without counting them again. Older session drafts migrate on load.
- One retry per question, on-demand hints, written alternatives to media questions and “Finish for now.” Early finishes retain progress and answer XP without granting the full-round bonus.
- Gentle daily ten-word / approximately ten-minute target; due reviews first, adaptive intake of 2–10 new words (five for a new learner), daily distinct-word progress rings and foreground practice time.
- Independent recognition/recall scores, multi-day mastery caps and adaptive review dates. Known words are excluded from selection; words already practised today do not crowd out the remaining daily words.
- Progress saved after every answer and foreground timer tick, serialized local writes, load/save retry UI, and rejection of damaged or unknown-version data.
- Parent summary, daily activity, self-reported known-word count and weak words.

## Validation

```sh
npm run check
npm run validate:assets
npx expo install --check
npx expo export --platform all
```

Tests cover selection, session recovery and legacy migration, capped retries, hints, early finishes, duplicate rewards, date boundaries, daily deduplication, profile isolation, mastery and quiz ambiguity. Exports verify bundles, not native device interaction.

## Boundaries

Vocabulary has received an agent editorial pass and is explicitly marked `editorial-draft`; it still needs independent educator review. Pronunciation is synthetic and needs listening review on physical devices. See [content and audio provenance](docs/content-and-audio.md).

Native builds bundle pronunciation assets for offline playback. Web requires its host for a cold launch; there is no service worker. Daily time measures foreground session time, not attention, and the ten-minute target is a gentle stopping suggestion rather than a hard deadline or a calibrated learning outcome.

Progress remains in one versioned AsyncStorage document on this device. One session draft is active at a time; starting a session for another child closes the previous draft as an early finish, retaining its answers and earned XP. Cloud sync, parent gate, animated worlds, music and a shop remain separate roadmap work.
