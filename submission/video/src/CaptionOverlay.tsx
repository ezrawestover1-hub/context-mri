import type { Caption } from "@remotion/captions";
import { useCallback, useEffect, useState } from "react";
import {
  interpolate,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const CaptionOverlay = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender("Loading Context MRI captions"));

  const loadCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile("captions.json"));
      if (!response.ok) throw new Error(`Caption request failed with ${response.status}`);
      setCaptions((await response.json()) as Caption[]);
      continueRender(handle);
    } catch (error) {
      cancelRender(error);
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    loadCaptions();
  }, [loadCaptions]);

  if (!captions) return null;

  const nowMs = (frame / fps) * 1000;
  const caption = captions.find((item) => nowMs >= item.startMs && nowMs < item.endMs);
  if (!caption) return null;

  const opacity = interpolate(
    nowMs,
    [caption.startMs, caption.startMs + 140, caption.endMs - 140, caption.endMs],
    [0, 1, 1, 0],
    clamp,
  );

  return <div className="caption-safe"><div className="caption" style={{ opacity }}>{caption.text}</div></div>;
};
