"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import TransitionOverlay from "../components/TransitionOverlay";
import PageTransition from "../components/PageTransition";
import ThemeToggle from "../components/ThemeToggle";
import { useSession } from "../lib/useSession";
import { useLanguage } from "../lib/i18n";
import { BellIcon, BoxIcon, HomeIcon, InboxIcon, InfoIcon, LogOutIcon, QrIcon, ReceiptIcon, RouteIcon } from "../components/icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const { locale, t, toggle: toggleLanguage } = useLanguage();

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
          <Image src="/trast-mark.png" alt="" width={30} height={30} />
          Trast Dockline
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
            <Image src="/trast-mark.png" alt="" width={34} height={34} />
            Trast Dockline
          </span>
          <span>{t.brandTagline}</span>
        </Link>
        <nav className="app-nav">
          <Link href="/dashboard">
            <HomeIcon className="app-nav__icone" />
            {t.navHome}
          </Link>
          <Link href="/receiving">
            <InboxIcon className="app-nav__icone" />
            {t.navReceiving}
          </Link>
          <Link href="/invoices">
            <ReceiptIcon className="app-nav__icone" />
            {t.navInvoices}
          </Link>
          <Link href="/inventory">
            <BoxIcon className="app-nav__icone" />
            {t.navInventory}
          </Link>
          <Link href="/parts">
            <QrIcon className="app-nav__icone" />
            {t.navParts}
          </Link>
          <Link href="/po">
            <RouteIcon className="app-nav__icone" />
            {t.navPo}
          </Link>
        </nav>
        <div className="app-sidebar__footer">
          <Link href="/" className="app-sidebar__aide">
            <InfoIcon className="app-nav__icone" />
            {t.aboutTrast}
          </Link>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-userbar">
          <ThemeToggle />
          <button className="app-userbar__icon" type="button" title="Notifications (not wired up)">
            <BellIcon />
          </button>
          <button
            className="app-userbar__icon app-userbar__icon--lang"
            type="button"
            onClick={toggleLanguage}
            title={t.languageToggle}
            aria-label={t.languageToggle}
          >
            {locale === "en" ? "EN" : "DE"}
          </button>
          <div className="app-userbar__divider" />
          <span className="app-userbar__avatar">{name?.[0]?.toUpperCase() ?? "?"}</span>
          <span className="app-userbar__name">{name}</span>
          <button
            className="lien-secondaire"
            type="button"
            onClick={logout}
            disabled={loggingOut}
            title={t.logOut}
          >
            <LogOutIcon />
          </button>
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </>
  );
}
