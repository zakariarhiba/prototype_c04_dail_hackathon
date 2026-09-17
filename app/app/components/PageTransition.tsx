"use client";

import { usePathname } from "next/navigation";

// Keying on pathname restarts the CSS fade-in animation on every route
// change, which is all the transition this prototype needs — no animation
// library required.
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
