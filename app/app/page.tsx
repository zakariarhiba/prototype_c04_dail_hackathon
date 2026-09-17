import Link from "next/link";
import { Logo } from "./components/Logo";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <span className="landing-header__brand">
          <Logo size={26} />
          Dockline
        </span>
        <Link href="/login" className="bouton">
          Log in
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
            item, a duplicate scan, or a second delivery. Dockline is a
            narrow, working slice of that workflow: a system that classifies
            and reconciles automatically, but never writes anything without a
            human confirming it first.
          </p>
          <Link href="/login" className="bouton landing-hero__cta">
            Log in to try it
          </Link>
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
              An invoice arrives (simulated). Dockline sums the accepted
              quantity, not received, across every delivery note tied to that
              order, and shows a line-by-line evidence trail for any gap. A
              human approver signs off before a discrepancy notice is
              generated, and that notice is simulated: displayed, never sent.
            </p>
          </div>
        </section>

        <section className="carte">
          <h2 className="font-semibold mb-2">About this prototype</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Real: classification and reconciliation, computed live from current state.</li>
            <li>Real: the confirm/approve gate, nothing is written without it.</li>
            <li>Simulated: the incoming scan/invoice events, the discrepancy notice&apos;s delivery, and this login screen (no real authentication).</li>
            <li>
              Full design rationale, open questions, and the build log live
              in <code>docs/</code> and <code>dev-docs/</code> in the
              repository.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
