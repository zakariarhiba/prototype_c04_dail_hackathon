"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TransitionOverlay from "../components/TransitionOverlay";
import PageTransition from "../components/PageTransition";
import ThemeToggle from "../components/ThemeToggle";
import { useSession } from "../lib/useSession";
import { BellIcon, BoxIcon, ChatIcon, HomeIcon, InboxIcon, InfoIcon, LogOutIcon, ReceiptIcon } from "../components/icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  function logout() {
    setLoggingOut(true);
  }

  async function completeLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading || !user) return null;
  const name = user.name;

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
          <Image src="/trast-mark.png" alt="" width={22} height={22} />
          trast
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
            <Image src="/trast-mark.png" alt="" width={26} height={26} />
            trast
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
          <Link href="/inventory">
            <BoxIcon className="app-nav__icone" />
            Inventory
          </Link>
        </nav>
        <div className="app-sidebar__footer">
          <Link href="/" className="app-sidebar__aide">
            <InfoIcon className="app-nav__icone" />
            About trast
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
