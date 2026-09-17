"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TransitionOverlay from "../components/TransitionOverlay";
import PageTransition from "../components/PageTransition";
import ThemeToggle from "../components/ThemeToggle";
import { Logo } from "../components/Logo";
import { BellIcon, ChatIcon, HomeIcon, InboxIcon, InfoIcon, LogOutIcon, ReceiptIcon } from "../components/icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("c04_user_name");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setName(stored);
    setReady(true);
  }, [router]);

  function logout() {
    setLoggingOut(true);
  }

  function completeLogout() {
    localStorage.removeItem("c04_user_name");
    router.replace("/login");
  }

  if (!ready) return null;

  return (
    <>
      <TransitionOverlay
        active={loggingOut}
        label="Signing out"
        durationMs={900}
        onDone={completeLogout}
      />
      <input type="checkbox" id="menu-toggle" className="menu-toggle-input" />

      <div className="app-topbar">
        <Link href="/dashboard" className="app-topbar__brand" data-dockline-logo-target>
          <Logo size={22} />
          Dockline
        </Link>
        <label htmlFor="menu-toggle" className="app-topbar__burger" aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </label>
      </div>

      <label htmlFor="menu-toggle" className="app-overlay" />

      <aside className="app-sidebar">
        <Link href="/dashboard" className="app-sidebar__brand">
          <span className="app-sidebar__brand-row">
            <Logo size={26} />
            Dockline
          </span>
          <span>Case C04 &middot; delivery vs. invoice reconciliation &middot; SYNTHETIC DATA</span>
        </Link>
        <nav className="app-nav">
          <Link href="/dashboard">
            <HomeIcon className="app-nav__icone" />
            Home
          </Link>
          <Link href="/receiving">
            <InboxIcon className="app-nav__icone" />
            Receiving
          </Link>
          <Link href="/invoices">
            <ReceiptIcon className="app-nav__icone" />
            Invoice reconciliation
          </Link>
        </nav>
        <div className="app-sidebar__footer">
          <Link href="/" className="app-sidebar__aide">
            <InfoIcon className="app-nav__icone" />
            About Dockline
          </Link>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-userbar">
          <ThemeToggle />
          <button className="app-userbar__icon" type="button" title="Notifications (not wired up)">
            <BellIcon />
          </button>
          <button className="app-userbar__icon" type="button" title="Chat (not wired up)">
            <ChatIcon />
          </button>
          <div className="app-userbar__divider" />
          <span className="app-userbar__avatar">{name?.[0]?.toUpperCase() ?? "?"}</span>
          <span className="app-userbar__name">{name}</span>
          <button
            className="lien-secondaire"
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title="Log out"
          >
            <LogOutIcon />
          </button>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
