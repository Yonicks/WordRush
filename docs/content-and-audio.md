# Vocabulary and media

The library contains 1,000 stable records across 15 categories and four difficulty levels. The original 500 IDs and English headwords remain unchanged. The additional 500 records include short examples and bundled offline pronunciation clips.

All records remain `editorial-draft`: agent editorial checks are not independent review by a Hebrew-speaking language educator. Masculine forms are dictionary forms, not learner gender settings. Before a learning release, an educator should check age suitability, alternative translations and examples, and listen to the pronunciation set. Difficulty levels are editorial estimates, not validated placement scores.

## Pictures

46 records have explicit image IDs in `src/data/words.json`, backed by static imports in `src/data/pictures.ts`. Mappings were visually inspected against the existing vocabulary artwork; unambiguous objects were selected. Duplicate icons and ambiguous UI-like art remain unused. Picture questions show an image and English answer choices. Screen-reader users can switch to the written version without the image label leaking the answer.

## Bundled speech

`assets/audio` contains 1,000 generated MP3 files: a normal and separately synthesized slow clip for each word. These are synthetic pronunciation clips, not human recordings. Generation uses Piper and the U.S. English LJSpeech medium model. Slow clips use length scale 1.4, preserving pitch instead of simply reducing playback speed.

Sources:

- [Piper LJSpeech model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD), identifying its training dataset as public domain.
- [LJ Speech dataset](https://keithito.com/LJ-Speech-Dataset/).
- [Piper synthesis runtime](https://github.com/OHF-Voice/piper1-gpl). Runtime and model are build-time tools, not shipped in the app.
- [Expo Audio](https://docs.expo.dev/versions/latest/sdk/audio/) for playback.

The model card is also saved in `assets/audio/MODEL_CARD.md`. Regenerate with Python packages `piper-tts` and `imageio-ffmpeg`, then run:

```sh
python scripts/generate-audio.py /path/to/en_US-ljspeech-medium.onnx
```

Generation skips existing clips; remove a word's two clips before regenerating a changed pronunciation. The model's adjacent `.onnx.json` configuration file is required. Commit both the clips and generated `src/data/audio.ts` imports.

Native builds bundle audio and need no runtime speech service, API key or installed device voice. Playback preloads the current clip, offers normal/slow selection, stops on blur/background, and provides a written-question fallback. Web loads clips from its local/static host; an offline cold web launch is not supported because this app does not install a service worker. The app does not request microphone access.

Listening and picture exercises currently contribute to the existing recognition dimension; they are not reported as independently measured skills. Hinted answers earn encouragement XP but do not increase mastery or add a successful learning day.
