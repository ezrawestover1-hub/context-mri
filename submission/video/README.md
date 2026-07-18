# Context MRI demo video

Programmatic 1080p judge video for OpenAI Build Week. It uses the real deployed interface, a scene-by-scene narration, burned-in captions, and explicit fixture/live provenance.

```bash
npm install
npm run lint
npm run dev
npx remotion render ContextMRI out/context-mri-demo.mp4
```

The final composition is approximately 1 minute 54 seconds and remains under the three-minute submission limit.

## Record a human voice-over

Start the local recording booth:

```bash
npm run record
```

Then open `http://127.0.0.1:4173`, enable the microphone, and record one continuous take. The recorder includes the seven-scene script, pronunciation notes, clean-edit pauses, playback, and a download button.
