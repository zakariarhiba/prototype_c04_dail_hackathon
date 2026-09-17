import Link from "next/link";
import ResetButton from "./components/ResetButton";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Delivery / Invoice Reconciliation — Prototype</h1>
      <p className="text-neutral-600">
        Case C04. The client&apos;s pain: at the loading bay they record what
        arrived; later someone reconciles the invoice and cannot tell whether
        a difference is a shortage, a damaged item, a duplicate scan, or a
        second delivery. This prototype demonstrates a narrow slice of that
        workflow end-to-end, with a human confirming every write.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/receiving"
          className="block border border-neutral-200 rounded-lg p-5 bg-white hover:border-blue-400"
        >
          <h2 className="font-semibold mb-1">1. Receiving</h2>
          <p className="text-sm text-neutral-600">
            Simulate an incoming delivery-note scan, see the system&apos;s
            new-vs-duplicate flag with its reasoning, then confirm or correct
            it as the receiving clerk.
          </p>
        </Link>
        <Link
          href="/invoices"
          className="block border border-neutral-200 rounded-lg p-5 bg-white hover:border-blue-400"
        >
          <h2 className="font-semibold mb-1">2. Invoice reconciliation</h2>
          <p className="text-sm text-neutral-600">
            Simulate an incoming invoice, reconcile it against the sum of
            accepted quantities across linked delivery notes, review the
            evidence, and approve (or not) a simulated discrepancy notice.
          </p>
        </Link>
      </div>

      <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-900 space-y-2">
        <p className="font-medium">What&apos;s real vs. simulated in this prototype</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Real: new-vs-duplicate classification, computed from live state each time.</li>
          <li>Real: invoice reconciliation math (sum of accepted, not received) and evidence trail.</li>
          <li>Real: nothing is written to state without an explicit human confirmation/approval click.</li>
          <li>Simulated: the incoming scan and incoming invoice events themselves (buttons, not a real scanner/EDI feed).</li>
          <li>Simulated: the discrepancy notice — generated and displayed, never actually sent anywhere.</li>
        </ul>
      </div>

      <div>
        <ResetButton />
      </div>
    </div>
  );
}
