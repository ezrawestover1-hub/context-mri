import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const FPS = 30;
const AUDIO_DURATIONS = [15.7, 15.7, 18.55, 17.7, 15.525, 18.9, 18.275];
const SCENE_FRAMES = AUDIO_DURATIONS.map((seconds) => Math.ceil((seconds + 1.2) * FPS));
const SCENE_STARTS = SCENE_FRAMES.map((_, index) =>
  SCENE_FRAMES.slice(0, index).reduce((sum, duration) => sum + duration, 0),
);
const TOTAL_FRAMES = SCENE_FRAMES.reduce((sum, duration) => sum + duration, 0);

const CAPTION_TEXT = [
  [
    "Most AI agent failures are not model failures.",
    "One stale file can quietly override a correct schema.",
    "Context MRI finds the file—and proves the diagnosis.",
  ],
  [
    "Give it the task, the context files, and a fixed definition of success.",
    "It removes one file at a time and repeats every condition three times.",
    "Every answer is scored with the same rubric.",
  ],
  [
    "A current Responses API schema conflicts with an archived guide.",
    "The full context bundle averages 43 out of 100.",
    "Without legacy-api.md, the mean jumps to 92 in all three repeats.",
    "The verified pack also uses 44% fewer context tokens.",
  ],
  [
    "Every score opens into inspectable evidence.",
    "Run ID, prompt hash, latency, tokens, output, and exact rubric.",
    "Eighteen discovery traces plus three independent pack checks.",
    "Twenty-one evidence records—not one lucky answer.",
  ],
  [
    "The diagnosis becomes a concrete action plan.",
    "Remove or rewrite, apply the smaller pack, then run again.",
    "Even a suggested rewrite stays untrusted until it survives another test.",
  ],
  [
    "The hosted demo is clearly labeled deterministic fixture replay.",
    "It never presents simulated evidence as a fresh model call.",
    "Live mode uses GPT-5.6 Sol through the Responses API.",
    "Medium reasoning and strict structured outputs keep the test controlled.",
  ],
  [
    "Codex helped select the idea and research the official requirements.",
    "It helped design, build, test, and refine the complete experiment.",
    "Browser QA caught usability and mathematical inconsistencies.",
    "Context MRI turns prompt debugging from intuition into evidence.",
  ],
];

const buildCaptions = (): Caption[] =>
  CAPTION_TEXT.flatMap((texts, sceneIndex) => {
    const startMs = (SCENE_STARTS[sceneIndex] / FPS + 0.4) * 1000;
    const chunkMs = (AUDIO_DURATIONS[sceneIndex] * 1000) / texts.length;
    return texts.map((text, index) => ({
      text,
      startMs: startMs + index * chunkMs,
      endMs: startMs + (index + 1) * chunkMs,
      timestampMs: null,
      confidence: null,
    }));
  });

const CAPTIONS = buildCaptions();

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const Brand = ({ light = false }: { light?: boolean }) => (
  <div className={`brand-lockup ${light ? "light" : ""}`}>
    <div className="brand-orbit"><span>✦</span></div>
    <div><strong>CONTEXT MRI</strong><small>EVIDENCE-FIRST CONTEXT PROFILING</small></div>
  </div>
);

const Kicker = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <div className={`kicker ${light ? "light" : ""}`}>{children}</div>
);

const Screenshot = ({ src, position = "center" }: { src: string; position?: string }) => {
  const frame = useCurrentFrame();
  return <div className="screen-frame">
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: position,
        scale: interpolate(frame, [0, 240], [1.015, 1.045], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.25, 1) }),
      }}
    />
    <div className="screen-sheen" />
  </div>;
};

const SceneShell = ({ index, children }: { index: number; children: React.ReactNode }) => {
  const frame = useCurrentFrame();
  const duration = SCENE_FRAMES[index];
  const opacity = interpolate(frame, [0, 12, duration - 10, duration], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{ opacity }}>
    {children}
    <Sequence from={12} layout="none">
      <Audio src={staticFile(`voice-${String(index + 1).padStart(2, "0")}.wav`)} volume={0.95} />
    </Sequence>
  </AbsoluteFill>;
};

const TitleScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene title-scene">
    <div className="paper-grain" />
    <div className="title-rule" style={{ width: interpolate(frame, [8, 36], [0, 650], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) }) }} />
    <div className="title-content" style={{ opacity: interpolate(frame, [10, 34], [0, 1], clamp), translate: `0 ${interpolate(frame, [10, 34], [32, 0], clamp)}px` }}>
      <Brand light />
      <h1>One stale file can break an entire agent.</h1>
      <p>Find the context that hurts performance.<br />Prove it with controlled experiments.</p>
      <div className="title-proof"><span>BASELINE</span><b>43</b><i>→</i><span>VERIFIED PACK</span><b>92</b></div>
    </div>
    <div className="botanical-arc one" /><div className="botanical-arc two" />
  </AbsoluteFill>;
};

const MethodScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene cream-scene split-scene">
    <div className="copy-column" style={{ opacity: interpolate(frame, [6, 26], [0, 1], clamp), translate: `${interpolate(frame, [6, 26], [-40, 0], clamp)}px 0` }}>
      <Kicker>01 · THE METHOD</Kicker>
      <h2>Input. Test. Action.</h2>
      <p className="lead">A controlled experiment for the context your agent reads.</p>
      <div className="method-list">
        <div><b>1</b><span><strong>Define the task</strong><small>What must the agent do?</small></span></div>
        <div><b>2</b><span><strong>Remove one file</strong><small>Hold everything else constant.</small></span></div>
        <div><b>3</b><span><strong>Verify the pack</strong><small>Re-run before trusting the change.</small></span></div>
      </div>
    </div>
    <div className="visual-column"><Screenshot src="hero.png" position="61% top" /></div>
  </AbsoluteFill>;
};

const RevealScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene pine-scene split-scene reveal-scene">
    <div className="metric-column">
      <Kicker light>02 · THE FINDING</Kicker>
      <h2><em>legacy-api.md</em><br />is making the agent worse.</h2>
      <div className="score-jump" style={{ opacity: interpolate(frame, [12, 30], [0, 1], clamp), scale: interpolate(frame, [12, 30], [0.92, 1], clamp) }}>
        <div><small>BASELINE</small><b className="bad-score">43</b></div><span>→</span><div><small>WITHOUT LEGACY</small><b>92</b></div>
      </div>
      <div className="proof-row"><span><b>+49</b> points</span><span><b>3/3</b> repeats</span><span><b>−44%</b> tokens</span></div>
    </div>
    <div className="visual-column"><Screenshot src="result.png" position="center 8%" /></div>
  </AbsoluteFill>;
};

const EvidenceScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene cream-scene evidence-scene">
    <div className="scene-header">
      <div><Kicker>03 · INSPECTABLE EVIDENCE</Kicker><h2>Twenty-one traces. Every score opens.</h2></div>
      <div className="trace-count" style={{ scale: interpolate(frame, [10, 28], [0.8, 1], clamp), opacity: interpolate(frame, [10, 28], [0, 1], clamp) }}><b>21</b><span>evidence<br />records</span></div>
    </div>
    <div className="evidence-screen"><Screenshot src="workspace.png" position="center top" /></div>
    <div className="evidence-pills"><span>RUN ID</span><span>PROMPT HASH</span><span>RUBRIC</span><span>MODEL OUTPUT</span><span>TOKENS + LATENCY</span></div>
  </AbsoluteFill>;
};

const ActionScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene cream-scene action-scene">
    <div className="scene-header compact"><div><Kicker>04 · WHAT TO DO NEXT</Kicker><h2>The result changes the context.</h2></div><Brand /></div>
    <div className="action-screen"><Screenshot src="action.png" position="center 58%" /></div>
    <div className="action-rail">
      {["REMOVE OR REWRITE", "APPLY THE PACK", "RUN AGAIN"].map((label, index) => <div key={label} style={{ opacity: interpolate(frame, [12 + index * 10, 28 + index * 10], [0, 1], clamp), translate: `${interpolate(frame, [12 + index * 10, 28 + index * 10], [-24, 0], clamp)}px 0` }}><b>{index + 1}</b><span>{label}</span></div>)}
    </div>
    <p className="trust-line">A rewrite is not trusted until the score recovers.</p>
  </AbsoluteFill>;
};

const ModeScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene pine-scene mode-scene">
    <Kicker light>05 · HONEST PROVENANCE</Kicker>
    <h2>Replay for judging.<br />GPT‑5.6 for fresh evidence.</h2>
    <div className="mode-grid">
      <div className="mode-card replay" style={{ opacity: interpolate(frame, [10, 30], [0, 1], clamp), translate: `${interpolate(frame, [10, 30], [-40, 0], clamp)}px 0` }}>
        <span>PUBLIC JUDGE DEMO</span><h3>Deterministic fixture replay</h3><p>Same complete workflow for every judge. Clearly labeled. Never presented as a fresh model call.</p><b>NO ACCOUNT · NO KEY · NO SETUP</b>
      </div>
      <div className="mode-card live" style={{ opacity: interpolate(frame, [20, 40], [0, 1], clamp), translate: `${interpolate(frame, [20, 40], [40, 0], clamp)}px 0` }}>
        <span>LIVE RUNNER</span><h3>GPT‑5.6 Sol</h3><p>Responses API, medium reasoning, strict Structured Outputs, run IDs, prompt hashes, and measured token use.</p><b>FRESH CLAIMS REQUIRE LIVE TRACES</b>
      </div>
    </div>
  </AbsoluteFill>;
};

const FinalScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene final-scene">
    <div className="paper-grain" />
    <Brand light />
    <div className="final-grid">
      <div><Kicker light>BUILT FOR OPENAI BUILD WEEK</Kicker><h2>Prompt debugging,<br /><em>with evidence.</em></h2><p>Context MRI finds the instruction that quietly breaks an agent—and verifies the repair.</p></div>
      <div className="built-with" style={{ opacity: interpolate(frame, [14, 36], [0, 1], clamp), translate: `${interpolate(frame, [14, 36], [30, 0], clamp)}px 0` }}>
        <span>BUILT WITH</span><b>CODEX</b><i>+</i><b>GPT‑5.6</b>
        <ul><li>Experiment architecture</li><li>Evaluator + tests</li><li>Interface + browser QA</li><li>Mathematical consistency</li></ul>
      </div>
    </div>
    <div className="final-url">context-mri.ezra-westover1.chatgpt.site</div>
  </AbsoluteFill>;
};

const CaptionOverlay = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const caption = CAPTIONS.find((item) => nowMs >= item.startMs && nowMs < item.endMs);
  if (!caption) return null;
  const opacity = interpolate(nowMs, [caption.startMs, caption.startMs + 140, caption.endMs - 140, caption.endMs], [0, 1, 1, 0], clamp);
  return <div className="caption-safe"><div className="caption" style={{ opacity }}>{caption.text}</div></div>;
};

const Progress = () => {
  const frame = useCurrentFrame();
  return <div className="progress-track"><div style={{ width: `${interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 100], clamp)}%` }} /></div>;
};

const ContextMRIVideo = () => {
  const scenes = [<TitleScene />, <MethodScene />, <RevealScene />, <EvidenceScene />, <ActionScene />, <ModeScene />, <FinalScene />];
  return <AbsoluteFill className="video-root">
    {scenes.map((scene, index) => <Sequence key={index} from={SCENE_STARTS[index]} durationInFrames={SCENE_FRAMES[index]}><SceneShell index={index}>{scene}</SceneShell></Sequence>)}
    <CaptionOverlay />
    <Progress />
  </AbsoluteFill>;
};

export const MyComposition = () => <Composition
  id="ContextMRI"
  component={ContextMRIVideo}
  durationInFrames={TOTAL_FRAMES}
  fps={FPS}
  width={1920}
  height={1080}
/>;
