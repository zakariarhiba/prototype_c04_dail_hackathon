"use client";

import { useEffect, useState } from "react";
import Splash from "./Splash";

// Plays once per browser session, on whichever page is entered first
// (landing, login, or a direct link straight into the app) — mounted at
// the root layout so every entry point is covered, not just /dashboard.
export default function LoadingIntro() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("c04_intro_shown")) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading sessionStorage, an external system, on mount
    setActive(true);
  }, []);

  function handleDone() {
    sessionStorage.setItem("c04_intro_shown", "1");
    setActive(false);
  }

  if (!active) return null;

  return <Splash targetSelector="[data-dockline-logo-target]" onDone={handleDone} />;
}
