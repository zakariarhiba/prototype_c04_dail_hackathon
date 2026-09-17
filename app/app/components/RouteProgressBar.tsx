"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A small top-of-viewport progress bar that flashes on every route change,
// site-wide. Skips the very first render (that moment is already covered
// by LoadingIntro / TransitionOverlay) and just gives ordinary in-app
// navigation a light "something happened" cue.
export default function RouteProgressBar() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return <div key={pathname} className="route-progress" aria-hidden="true" />;
}
