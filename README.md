# WordRush

An offline-first Expo / React Native vocabulary game for Hebrew-speaking children. This is the first implementation slice of the [product plan](wordrush-full-product-technical-plan-v2.md).

## Run

Requires Node 24 and npm.

```sh
npm ci
npm start
```

Open with a compatible Expo Go release or development build on Android/iOS. For a browser preview, run `npm run web -- --port 8094`. An iOS simulator requires macOS. No backend credentials are required.

## Implemented

- Expo SDK 57, TypeScript, React Navigation and a Hebrew-facing interface.
- Local child profiles with separate progress and avatars from the supplied PNG pack.
- 100 seed words with stable IDs, Hebrew translations, categories and example sentences.
- Discover → English/Hebrew recognition → Hebrew/English recall → results.
- Up to 15 selected words with a maximum of five new words; cold starts deliberately use five words instead of overwhelming a new learner.
- Independent recognition/recall scores, multi-day mastery caps, due/weak word selection and adaptive review intervals.
- Four unambiguous answer choices, feedback, haptics, XP and duplicate reward protection.
- Local saves after every answer; explicit retry for failed saves and failed loading. Corrupt or unknown-version storage is not overwritten.
- Basic parent summary and weak-word list.
- Device speech on discover cards, without requiring an online API key.

## Validation

```sh
npm run check
npm run validate:assets
npx expo install --check
npx expo export --platform all
```

Tests cover selection, mastery caps, review scheduling, quiz ambiguity, profile isolation, save serialization and duplicate rewards. Exports verify JavaScript/asset bundling for Android, iOS and web; they are not native device tests.

## Current boundaries

This is a development milestone, not a production learning release. Seed translations/examples still need educational review. The numbered vocabulary PNGs are intentionally not mapped to words until each image's meaning is reviewed. Existing mascot, avatar and world artwork is used directly.

Device speech is a temporary pronunciation fallback; voice availability and offline behavior depend on the device. Recorded normal/slow audio, picture/listening exercises, five-minute session calibration, in-session mistake retries, frustration control and additional mastery dimensions remain future work.

Progress is stored only on this device, in one versioned AsyncStorage document. Individual answers survive leaving the session; an interrupted session does not resume its exact screen and does not grant a completion bonus. Parent metrics count completed sessions. Cloud auth, backend schema, sync queue, parent gate, advanced rewards and full world navigation are not implemented. AsyncStorage is suitable for this 100-word milestone; move to a database with migrations before large-scale histories.

See [implementation status](docs/implementation-status.md) for the next slice.
