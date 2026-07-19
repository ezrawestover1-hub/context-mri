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
} from "remotion";
import { CaptionOverlay } from "./CaptionOverlay";

const FPS = 30;
const PROOF_PREVIEW_FRAMES = 26 * FPS;
// Scene eight is the mastered human pickup, measured after trimming only
// leading and trailing room tone (natural pauses remain intact).
const AUDIO_DURATIONS = [12.83, 14.64, 16.28, 13.64, 14.05, 18.65, 17.24, 22.49];
const SCENE_FRAMES = AUDIO_DURATIONS.map((seconds) => Math.ceil((seconds + 0.9) * FPS));
const SCENE_STARTS = SCENE_FRAMES.map((_, index) =>
  SCENE_FRAMES.slice(0, index).reduce((sum, duration) => sum + duration, 0),
);
const TOTAL_FRAMES = SCENE_FRAMES.reduce((sum, duration) => sum + duration, 0);

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
      <Audio src={staticFile(`narration/scene-${String(index + 1).padStart(2, "0")}.wav`)} volume={1} />
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
      <p>Most evals stop at a score.<br />Context MRI finds the file, verifies the repair, and guards it in CI.</p>
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
      <h2>Diagnose. Repair. Prevent.</h2>
      <p className="lead">A controlled experiment for the context your agent reads.</p>
      <div className="method-list">
        <div><b>1</b><span><strong>Measure the baseline</strong><small>Fix the task and success rubric.</small></span></div>
        <div><b>2</b><span><strong>Remove one file</strong><small>Hold everything else constant.</small></span></div>
        <div><b>3</b><span><strong>Verify + guard</strong><small>Re-run, then block the regression in CI.</small></span></div>
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
      <div className="scenario-strip" style={{ opacity: interpolate(frame, [260, 292], [0, 1], clamp), translate: `${interpolate(frame, [260, 292], [-24, 0], clamp)}px 0` }}><b>ONE ENGINE · THREE CONTRACTS</b><span>Support API</span><span>Billing API</span><span>Release security</span></div>
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
    <div className="guard-proof" style={{
      opacity: interpolate(frame, [74, 96], [0, 1], clamp),
      translate: `0 ${interpolate(frame, [74, 96], [24, 0], clamp)}px`,
    }}>
      <div><span>LOCK IN THE FIX</span><strong>Context Guard</strong><small>Block the stale instruction before it returns.</small></div>
      <div className="guard-proof-score"><b>43 blocked</b><i>→</i><strong>92 passed</strong></div>
    </div>
  </AbsoluteFill>;
};

const ModeScene = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill className="scene pine-scene mode-scene">
    <Kicker light>05 · HONEST PROVENANCE</Kicker>
    <h2>Complete free judge path.<br />Optional fresh-model runner.</h2>
    <div className="mode-grid">
      <div className="mode-card replay" style={{ opacity: interpolate(frame, [10, 30], [0, 1], clamp), translate: `${interpolate(frame, [10, 30], [-40, 0], clamp)}px 0` }}>
        <span>RECOMMENDED PUBLIC DEMO</span><h3>Full deterministic product loop</h3><p>Diagnosis, 21 inspectable traces, repaired-pack verification, and Context Guard—clearly labeled as replay evidence.</p><b>NO ACCOUNT · NO KEY · NO PAYMENT · NO SETUP</b>
      </div>
      <div className="mode-card live" style={{ opacity: interpolate(frame, [20, 40], [0, 1], clamp), translate: `${interpolate(frame, [20, 40], [40, 0], clamp)}px 0` }}>
        <span>OPTIONAL LOCAL RUNNER</span><h3>Fresh GPT‑5.6 Sol</h3><p>Responses API, strict Structured Outputs, run IDs, prompt hashes, and measured token use.</p><b>NEVER SUBSTITUTES A FIXTURE</b>
      </div>
    </div>
  </AbsoluteFill>;
};

const ProofBrowser = ({ src, position = "center", fit = "cover" }: { src: string; position?: string; fit?: "cover" | "contain" }) => {
  const frame = useCurrentFrame();
  return <div className="proof-browser">
    <div className="proof-browser-bar"><i /><i /><i /><span>PUBLIC, INSPECTABLE EVIDENCE</span></div>
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "calc(100% - 42px)",
        display: "block",
        objectFit: fit,
        objectPosition: position,
        scale: interpolate(frame, [0, PROOF_PREVIEW_FRAMES], [1.006, 1.025], { ...clamp, easing: Easing.bezier(0.2, 0.75, 0.25, 1) }),
      }}
    />
  </div>;
};

const WinnerProofScene = () => {
  const frame = useCurrentFrame();
  const securityOpacity = interpolate(frame, [0, 18, 194, 224], [0, 1, 1, 0], clamp);
  const evaluatorOpacity = interpolate(frame, [194, 224, 430, 460], [0, 1, 1, 0], clamp);
  const publicOpacity = interpolate(frame, [430, 462, PROOF_PREVIEW_FRAMES - 20, PROOF_PREVIEW_FRAMES], [0, 1, 1, 0], clamp);
  return <AbsoluteFill className="scene cream-scene winner-proof-scene">
    <div className="winner-proof-heading">
      <div><Kicker>06 · GENERALIZATION + PUBLIC PROOF</Kicker><h2>Evidence judges can inspect.</h2></div>
      <Brand />
    </div>

    <div className="proof-phase security-phase" style={{ opacity: securityOpacity, translate: `${interpolate(frame, [0, 24], [30, 0], clamp)}px 0` }}>
      <div className="proof-phase-copy">
        <span>SECURITY RELEASE DIAGNOSTIC</span>
        <h3>Different failure.<br />Same engine.</h3>
        <p>A legacy runbook tells an agent to expose a production token. Context MRI isolates that unsafe context under a separate task and rubric.</p>
        <div className="security-score"><small>FULL PACK</small><b>53</b><i>→</i><small>REPAIRED</small><strong>100</strong></div>
      </div>
      <ProofBrowser src="security-diagnostic.png" position="center top" />
    </div>

    <div className="proof-phase evaluator-phase" style={{ opacity: evaluatorOpacity, translate: `0 ${interpolate(frame, [194, 232], [26, 0], clamp)}px` }}>
      <ProofBrowser src="security-evaluator.png" position="center top" />
      <div className="evaluator-copy">
        <span>INSPECTABLE CONTRACT</span>
        <h3>Five criteria.<br />One hundred points.</h3>
        <ul>
          <li><b>50</b> Credential safety</li>
          <li><b>20</b> Source authority</li>
          <li><b>15</b> Unsafe-action refusal</li>
          <li><b>10</b> Risk explanation</li>
          <li><b>5</b> Structured output</li>
        </ul>
        <p>“Harmful” means harmful for this task under this evaluator—not universally bad.</p>
      </div>
    </div>

    <div className="proof-phase public-phase" style={{ opacity: publicOpacity, translate: `${interpolate(frame, [430, 470], [-28, 0], clamp)}px 0` }}>
      <ProofBrowser src="public-ci-proof.png" position="center" fit="contain" />
      <div className="public-proof-copy">
        <span>PUBLIC GITHUB CI · SUCCESS</span>
        <h3>Anyone can verify the guard.</h3>
        <div className="proof-stat-grid">
          <div><b>26</b><small>automated tests</small></div>
          <div><b>0</b><small>stored API keys</small></div>
          <div><b>2</b><small>self-audit fixes</small></div>
        </div>
        <div className="proof-band-crop"><Img src={staticFile("public-proof-band.png")} /></div>
        <p>Original bundle blocked · repaired pack passed · limitations disclosed.</p>
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
      <div><Kicker light>BUILT FOR OPENAI BUILD WEEK</Kicker><h2>Find the bad file.<br /><em>Keep it from returning.</em></h2><p>One evidence-first loop from diagnosis to verified repair and CI prevention.</p></div>
      <div className="built-with" style={{ opacity: interpolate(frame, [14, 36], [0, 1], clamp), translate: `${interpolate(frame, [14, 36], [30, 0], clamp)}px 0` }}>
        <span>BUILT WITH</span><b>CODEX</b><i>+</i><b>GPT‑5.6</b>
        <ul><li>Experiment architecture</li><li>Evaluator + tests</li><li>Interface + browser QA</li><li>Mathematical consistency</li></ul>
      </div>
    </div>
    <div className="final-url">context-mri.ezra-westover1.chatgpt.site</div>
  </AbsoluteFill>;
};

const CodexScene = () => {
  const frame = useCurrentFrame();
  const steps = [
    ["01", "IDEA + RULES", "Selected the concept and checked the official requirements."],
    ["02", "EXPERIMENT", "Designed the ablation method and trust boundaries."],
    ["03", "BUILD + TEST", "Implemented the engine, evaluator, and automated checks."],
    ["04", "GPT-5.6 TERRA AUDIT", "Stress-tested the evaluator, fixture claims, and final judge flow."],
  ];
  return <AbsoluteFill className="scene cream-scene codex-scene">
    <div className="codex-heading">
      <div><Kicker>06 · HOW CODEX + GPT-5.6 WERE USED</Kicker><h2>From idea to tested evidence.</h2></div>
      <Brand />
    </div>
    <div className="codex-steps">
      {steps.map(([number, title, copy], index) => <div key={number} style={{
        opacity: interpolate(frame, [10 + index * 8, 26 + index * 8], [0, 1], clamp),
        translate: `0 ${interpolate(frame, [10 + index * 8, 26 + index * 8], [28, 0], clamp)}px`,
      }}>
        <b>{number}</b><span><strong>{title}</strong><small>{copy}</small></span>
      </div>)}
    </div>
    <p className="codex-close"><strong>34 automated tests</strong> · native Codex workflow · SHA-256 provenance · Context Guard CI</p>
  </AbsoluteFill>;
};

const Progress = () => {
  const frame = useCurrentFrame();
  return <div className="progress-track"><div style={{ width: `${interpolate(frame, [0, TOTAL_FRAMES - 1], [0, 100], clamp)}%` }} /></div>;
};

const ContextMRIVideo = () => {
  const scenes = [<TitleScene />, <MethodScene />, <RevealScene />, <EvidenceScene />, <ActionScene />, <ModeScene />, <FinalScene />, <CodexScene />];
  return <AbsoluteFill className="video-root">
    {scenes.map((scene, index) => <Sequence key={index} from={SCENE_STARTS[index]} durationInFrames={SCENE_FRAMES[index]}><SceneShell index={index}>{scene}</SceneShell></Sequence>)}
    <CaptionOverlay />
    <Progress />
  </AbsoluteFill>;
};

export const MyComposition = () => <>
  <Composition
    id="ContextMRI"
    component={ContextMRIVideo}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
  <Composition
    id="WinnerProofPreview"
    component={WinnerProofScene}
    durationInFrames={PROOF_PREVIEW_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
</>;
