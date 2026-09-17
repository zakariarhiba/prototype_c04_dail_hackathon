"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export default function LoadingIntro() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("c04_intro_shown")) return;
    setVisible(true);
    const fadeTimer = setTimeout(() => setFading(true), 1400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("c04_intro_shown", "1");
    }, 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${fading ? "intro-overlay--fade" : ""}`}>
      <div className="intro-scene">
        <div className="intro-cube">
          <div className="intro-cube__face intro-cube__face--front">
            <Logo size={40} />
          </div>
          <div className="intro-cube__face intro-cube__face--back">
            <Logo size={40} />
          </div>
          <div className="intro-cube__face intro-cube__face--right" />
          <div className="intro-cube__face intro-cube__face--left" />
          <div className="intro-cube__face intro-cube__face--top" />
          <div className="intro-cube__face intro-cube__face--bottom" />
        </div>
        <p className="intro-scene__label">Loading Dockline…</p>
      </div>
    </div>
  );
}
