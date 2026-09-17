"use client";

import { useEffect, useRef, useState } from "react";

type TransitionOverlayProps = {
  active: boolean;
  label: string;
  durationMs?: number;
  onDone?: () => void;
};

// Shared full-screen 3D loading moment: a spinning cube plus a counting
// percentage, used for the first-ever-visit intro, the post-login handoff,
// and the post-logout handoff. `active` is owned by the caller; this
// component only counts up and calls onDone once when it reaches 100%.
export default function TransitionOverlay({
  active,
  label,
  durationMs = 1100,
  onDone,
}: TransitionOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting to sync with the `active` prop going false
      setProgress(0);
      setFading(false);
      return;
    }
    const start = Date.now();
    const tick = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / durationMs) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setFading(true);
        setTimeout(() => onDoneRef.current?.(), 220);
      }
    }, 30);
    return () => clearInterval(tick);
  }, [active, durationMs]);

  if (!active) return null;

  return (
    <div className={`intro-overlay ${fading ? "intro-overlay--fade" : ""}`}>
      <div className="intro-scene">
        <div className="intro-cube">
          <div className="intro-cube__face intro-cube__face--front">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size overlay art, next/image adds nothing here */}
            <img src="/trast-mark.png" width={48} height={48} alt="" />
          </div>
          <div className="intro-cube__face intro-cube__face--back">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size overlay art, next/image adds nothing here */}
            <img src="/trast-mark.png" width={48} height={48} alt="" />
          </div>
          <div className="intro-cube__face intro-cube__face--right" />
          <div className="intro-cube__face intro-cube__face--left" />
          <div className="intro-cube__face intro-cube__face--top" />
          <div className="intro-cube__face intro-cube__face--bottom" />
        </div>
        <p className="intro-scene__label">
          {label}&hellip; <span className="intro-scene__pct">{progress}%</span>
        </p>
      </div>
    </div>
  );
}
