"use client";

import { useEffect, useRef, useState } from "react";

type SplashProps = {
  /** CSS selector for the real header logo to fly into, if one is on the page. */
  targetSelector?: string;
  onDone: () => void;
};

// Timeline (see dev-docs/phase-06 for the full writeup):
//   0.00s  icon starts "drawing" in (clip-path wipe)
//   0.85s  icon fully drawn
//   0.90s  icon starts fading out (0.45s)
//   0.92s  radial glow flashes behind it (0.7s)
//   0.95s  full wordmark assembles in with a small overshoot (0.55s)
//   ~1.50s if a real header logo is present on the page: measure it and fly
//          the wordmark there (0.6s transform transition), then unmount.
//          if not: hold briefly, fade the whole splash out, then unmount.
const WORD_APPEAR_DELAY = 950;
const WORD_APPEAR_MS = 550;
const AUTO_FADE_HOLD_MS = 650;
const FLY_SAFETY_MS = 1500;

export default function Splash({ targetSelector, onDone }: SplashProps) {
  const [stage, setStage] = useState<"enter" | "word" | "fly" | "fade">("enter");
  const wordRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      doneRef.current();
      return;
    }
    const t = setTimeout(() => setStage("word"), WORD_APPEAR_DELAY);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (stage !== "word") return;
    const t = setTimeout(() => {
      const target = targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null;
      const wordEl = wordRef.current;

      if (!target || !wordEl) {
        setStage("fade");
        const fadeOut = setTimeout(() => doneRef.current(), AUTO_FADE_HOLD_MS);
        return () => clearTimeout(fadeOut);
      }

      const from = wordEl.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const scale = to.width / from.width;
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      wordEl.style.setProperty("--fly-x", `${dx}px`);
      wordEl.style.setProperty("--fly-y", `${dy}px`);
      wordEl.style.setProperty("--fly-scale", `${scale}`);

      setStage("fly");
      const safety = setTimeout(() => doneRef.current(), FLY_SAFETY_MS);
      const handleEnd = (e: TransitionEvent) => {
        if (e.propertyName !== "transform") return;
        wordEl.removeEventListener("transitionend", handleEnd);
        clearTimeout(safety);
        doneRef.current();
      };
      wordEl.addEventListener("transitionend", handleEnd);
    }, WORD_APPEAR_MS);
    return () => clearTimeout(t);
  }, [stage, targetSelector]);

  return (
    <div className={`splash ${stage === "fade" ? "splash--fade" : ""}`}>
      <div className={`splash-icon ${stage !== "enter" ? "splash-icon--exit" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size overlay art */}
        <img src="/dockline-mark.png" width={96} height={96} alt="" />
      </div>
      <div className="splash-glow" />
      {stage !== "enter" && (
        <div ref={wordRef} className={`splash-word ${stage === "fly" ? "splash-word--fly" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size overlay art */}
          <img src="/dockline-mark.png" width={40} height={40} alt="" />
          <span>Dockline</span>
        </div>
      )}
    </div>
  );
}
