"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("c04_theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("c04_theme", next ? "dark" : "light");
  }

  return (
    <button
      className="app-userbar__icon"
      onClick={toggle}
      type="button"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
