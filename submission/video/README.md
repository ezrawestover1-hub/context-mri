# Context MRI demo video

Programmatic 1080p judge video for OpenAI Build Week. It uses the real deployed interface, a scene-by-scene narration, burned-in captions, and explicit fixture/live provenance.

```bash
npm install
npm run lint
npm run dev
npx remotion render ContextMRI out/context-mri-demo.mp4
```

The final composition is approximately 1 minute 54 seconds and remains under the three-minute submission limit. The approved human narration is mastered scene-by-scene in `public/narration`, and the matching caption timeline is stored in `public/captions.json`.

## Record a human voice-over

Start the local recording booth:

```bash
npm run record
```

Then open `http://127.0.0.1:4173`, enable the microphone, and record each scene separately. Saved scenes turn green, any scene can be redone without losing the others, and the finished scene files can be downloaded together.
