"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "./lib/useSession";

export default function LandingPage() {
  const { user, loading } = useSession();
  const homeHref = user ? "/dashboard" : "/login";
  const homeLabel = loading ? "..." : user ? "Back to dashboard" : "Log in";

  return (
    <div className="landing-page">
      <header className="landing-header">
        <span className="landing-header__brand" data-dockline-logo-target>
          <Image src="/trast-mark.png" alt="" width={34} height={34} />
          Trast Dockline
        </span>
        <Link href={homeHref} className="bouton">
          {homeLabel}
        </Link>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-hero__eyebrow">Case C04 &middot; synthetic exercise data</p>
          <h1>The delivery arrived. The invoice tells a different story.</h1>
          <p className="landing-hero__lede">
            At the loading bay, a dealership parts team records what actually
            arrived. Later, someone tries to reconcile the invoice against it
            and can&apos;t tell whether a difference is a shortage, a damaged
            item, a duplicate scan, or a second delivery. This prototype is a
            narrow, working slice of that workflow: a system that classifies
            and reconciles automatically, but never writes anything without a
            human confirming it first.
          </p>
          <Link href={homeHref} className="bouton landing-hero__cta">
            {user ? "Back to dashboard" : "Log in to try it"}
          </Link>
          <div className="landing-hero__image">
            <Image
              src="/landing-hero.png"
              alt="Illustration of a dealership loading bay: a delivery truck at the dock, with crates flagged for review or confirmed as accepted"
              width={1024}
              height={572}
              priority
            />
          </div>
        </section>

        <section className="landing-grid">
          <div className="carte">
            <h2 className="font-semibold mb-1">1. Receiving</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              A delivery-note scan arrives (simulated). The system checks it
              against open purchase orders and proposes new vs. duplicate vs.
              ambiguous, computed fresh from live state every time, never a
              scripted answer. A human clerk confirms or corrects it. Nothing
              is written until they do.
            </p>
          </div>
          <div className="carte">
            <h2 className="font-semibold mb-1">2. Invoice reconciliation</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              An invoice arrives (simulated). The system sums the accepted
              quantity, not received, across every delivery note tied to that
              order, and shows a line-by-line evidence trail for any gap. A
              human approver signs off before a discrepancy notice is
              generated, and that notice is simulated: displayed, never sent.
            </p>
          </div>
        </section>

        <section className="carte space-y-3">
          <h2 className="font-semibold mb-2">About this prototype</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Real: new-vs-duplicate classification, computed from live state every time, never a scripted answer.</li>
            <li>Real: invoice reconciliation math — sums accepted (not received) quantity across every delivery note tied to the PO, with a line-by-line evidence trail for any gap.</li>
            <li>Real: nothing is written to state without an explicit human confirm/approve click.</li>
            <li>Real: login and session — a signed cookie checked against seeded demo users, with parts-receiving-lead/reconciliation-lead route gating. See <code>docs/01-system-design.md</code> &sect;10.</li>
            <li>Real: the inventory ledger — received-to-date by part, summed live from receipts, never a maintained counter. Not a live warehouse stock count (no putaway/pick/consumption events). &quot;Add new stock&quot; is a real write, but only to this app&apos;s own tables — never to a real supplier or inventory-of-record system.</li>
            <li>Simulated: the incoming delivery-note scan and incoming invoice events (buttons, not a real scanner/EDI feed).</li>
            <li>Simulated: the discrepancy notice — generated and displayed, never actually sent to a supplier or posted to accounting.</li>
          </ul>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Demo credentials (seeded by <code>resetState()</code>):{" "}
            <code>priya_lead</code> / <code>@Passw0rd1</code> (parts
            receiving lead) or <code>sam_lead</code> / <code>@Passw0rd2</code>{" "}
            (reconciliation lead). Only session enforcement is real here — no
            password policy, recovery, or OAuth/SSO.
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Full design rationale, open questions, and the build log live
            in <code>docs/</code> and <code>dev-docs/</code> in the
            repository.
          </p>
        </section>
      </main>
    </div>
  );
}
