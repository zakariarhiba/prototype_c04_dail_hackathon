# Presentation Script

Target: live demo + short roadmap pitch to trast. Two parts below:
**Part A** — the live walkthrough, in baby steps (exact pages, clicks, and
what to say), using data already seeded so nothing is typed live except
where explicitly noted. **Part B** — the "what's next" roadmap to talk to,
not build now.

No memorization required: every scenario below is driven by the app's own
fixed demo-data rotation (`app/app/lib/store.ts`), so the numbers you'll
see on screen match this doc exactly, every time, right after "Reset to
seed state."

---

## Part A — Live walkthrough (baby steps)

### Step 0 — before you open the laptop

Run `npm run dev` in `app/`. The login form now comes pre-filled with
`priya_lead` / `@Passw0rd1` (there's a "Demo credentials pre-filled"
note on the form itself) — just click **Log in**, no typing. Then on the
dashboard click **Reset to seed state** once. This guarantees the exact
numbers below.

### Step 1 — Dashboard (`/dashboard`)

Say: *"trast's pain, in their own words: at the loading bay someone
records what arrived. Later, someone else reconciles the invoice and
can't tell whether a gap is a shortage, a damaged item, a duplicate scan,
or a second delivery. This is a narrow, working slice of that, end to
end — and a human confirms every write, nothing happens automatically."*

Point at the 5 stat tiles (delivery notes, pending scan, pending invoice,
notices, discarded duplicates) — say these are computed live from the
database, not hardcoded counters.

### Step 2 — Receiving, ordinary path (`/receiving`)

1. Click **Simulate incoming delivery note**. The seeded rotation gives
   you: `PO-2 / BRAKE-PAD-Y / qty 5`, flagged **NEW** with high
   confidence, reasoning shown on screen ("no delivery note logged yet
   against PO-2").
2. Say: *"The system already decided — it's not asking you to guess."*
3. Click **New delivery** (already pre-selected), leave Received/
   Damaged/Accepted at their auto-filled defaults (5/0/5), click
   **Confirm**.
4. Point at the new row in the "Delivery notes logged" table — say this
   is the only place data got written, and only because you clicked
   Confirm.

### Step 3 — Receiving, duplicate path

1. Click **Simulate incoming delivery note** again. This time: `PO-1 /
   FILTER-X / qty 8` — flagged **DUPLICATE**, reasoning: "DN-1 already
   logged for the same quantity, and PO-1's full ordered quantity is
   already covered."
2. Say: *"Same document re-scanned at the dock — happens constantly.
   The system catches it instead of double-counting stock."*
3. Click **Duplicate scan (discard)**, then **Confirm**. Point out no new
   delivery note or receipt was created — only an audit-log row appeared
   under "Discarded duplicate scans."

### Step 4 — Receiving, the one that matters: ambiguous / uncertain

1. Click **Simulate incoming delivery note** a third time: `PO-1 /
   FILTER-X / qty 3` — flagged **AMBIGUOUS**, low confidence. Reasoning
   on screen explains PO-1 already shows more logged than ordered, so
   this could be a mis-scan, a correction, or a genuine extra delivery.
2. **This is the sales moment.** Say: *"This is the part I actually want
   you to see. The system does not guess here. No pre-selected answer —
   you, the parts receiving lead, have to actively pick New or
   Duplicate. That's not a limitation, that's the point: nothing gets
   written into inventory or invoicing off an uncertain automatic call."*
3. Pick either option live (either is fine — the point is the
   forced-choice, not the outcome) and confirm.

### Step 5 — Invoice reconciliation, the discrepancy case (`/invoices`)

1. Click **Simulate incoming invoice**. Seeded scenario: invoice bills
   `PO-1 / FILTER-X` for **10** units. The evidence table shows DN-1
   (received 8, damaged 1, accepted 7) and DN-2 (received 2, damaged 0,
   accepted 2) — sum accepted = **9**. System flags a **1-unit
   discrepancy**, and explains it: *"1 unit damaged and rejected on
   DN-1, not credited on the invoice."*
2. Say: *"This is the reconciliation math done right — it sums what was
   actually accepted, not what was received, per delivery note, with a
   line-by-line evidence trail. No black box."*
3. Click **Approve discrepancy notice (simulated)**. Point at the
   "SIMULATED — displayed only" label — say plainly: nothing is sent to
   a supplier or posted to accounting from this prototype, by design.

### Step 6 — Invoice reconciliation, the clean case

1. Click **Simulate incoming invoice** again. Seeded scenario: same
   PO-1/FILTER-X, this time billed for **9** — matches accepted total
   exactly. Message: "Reconciles cleanly — no discrepancy."
2. Click **Acknowledge, no notice needed**. Say: *"Most invoices should
   look like this — the tool doesn't manufacture problems that aren't
   there."*

### Step 7 — Inventory ledger (`/inventory`)

Point at the "Received-to-date by part" table — FILTER-X should show
**9** (7+2 accepted from Step 5/6's evidence), BRAKE-PAD-Y should show
**5** (from Step 2). Say: *"Not a live warehouse stock count — this is
cumulative accepted quantity, summed live from receipts, never a
separately maintained counter that can drift out of sync."*

(Optional, one real write to prove it's not just a report: type `FILTER-X`
and `1` into "Add new stock," submit, point out the ledger updates — and
that this never reaches a real supplier or inventory system.)

### Step 8 — PO tracker (`/po`)

Point at PO-1 (status should read **in process** — not fully resolved
yet) and PO-2 (status reflects the delivery from Step 2). Click into
PO-1's row for `/po/PO-1` — walk the timeline. Say: *"Status here is
computed, not stored — it's derived fresh from delivery notes, receipts,
and approved notices every time, so it can never silently drift out of
sync with reality."*

### Step 9 — Parts & QR (`/parts`)

Right after a reset this now shows 3 seeded parts with real QR codes
(FILTER-X, BRAKE-PAD-Y, WIPER-Z) — nothing to type live. Point at one
and say: *"Every part gets a generated QR identifier here, and that
same QR can be scanned against an open PO to kick off exactly the same
classify/confirm flow you just saw in Receiving."* Only type into the
"Add new part" form if you want to show that write happening live —
optional, not required for the story.

### Step 10 — Close: the workflow diagram, real vs. simulated, and client fit

Go to the landing page (`/`) → **"How a PO moves through the system,
start to end"** section. This is the picture, not the list — scroll the
8-node row left to right and point at each stage as you retrace exactly
what you just clicked through in Steps 2-8. Call out the color coding:
blue = real, orange = simulated, green = a human decision point. Say:
*"Every box here is something you just watched happen, not a slide I
made up."*

Then scroll to **About this prototype** below it and read the
real/simulated list plainly — this is the trust-building close:
*"I'm not going to tell you this is more finished than it is. Here's
exactly what's real, what's a working simulation standing in for a
future integration, and why."*

Finally, click the **EN/DE** toggle in the top-right userbar. Say:
*"And since trast is a German team, the whole shell — navigation, forms,
tables — works in German too."* Toggle back to EN to close.

---

## Part B — Roadmap: what's next (talk to it, don't build it now)

Frame this as: *"Here's what a real pilot with trast would add next,
in priority order, and why."*

### 1. Real-time notifications
- **In-app real-time triggers** — an ambiguous scan, a discrepancy, a
  PO going stale, pushed live to the right person instead of requiring
  someone to check the dashboard.
- **Email notifications** — same triggers, for people not staring at the
  app (e.g. a reconciliation lead who only needs to know when something
  needs their approval).
- **In-app real-time messaging** between users, and between trast staff
  and their clients — a thread attached to a PO or a discrepancy notice,
  not a separate tool.

### 2. PO tracking code ("Suivi")
- Each PO gets its own tracking/reference code so anyone (internal or
  client-facing) can look up "what's the status of this PO" without
  digging through the app — a public-ish status page keyed by that code,
  building directly on the PO tracker's already-computed status (§15 of
  the design doc).

### 3. Exports
- PDF and Excel export — discrepancy notices, the inventory ledger, PO
  timelines. Needed the moment this leaves demo territory: finance and
  ops teams live in spreadsheets and need paper trails for suppliers.

### 4. Smarter inventory management
- Configurable per-part alarm thresholds (already designed, not yet
  user-facing — see design doc §12), reorder suggestions, and eventually
  demand trending — turning the ledger from a passive record into
  something that flags "you're about to run out" before it happens.

### 5. Additional items worth raising (not in the original ask, flagged for completeness)

- **Real scanner/camera integration** — replace the "Simulate incoming
  scan" button with an actual barcode/QR reader, mobile or handheld.
- **Real supplier/accounting/EDI integration** — the discrepancy notice
  and stock write are simulated today; this is the step that makes them
  real.
- **Role separation + accounts management + audit trail** — the
  clerk/approver split already exists in the design and database (§10)
  but is shelved for this single-account demo; re-enabling it plus a
  real user-management screen is the natural next step for a multi-
  person team.
- **AI-assisted review** — there's already a paused Python/LangGraph +
  Gemini service (`narrative-service/`) built for exactly this: a
  natural-language summary or anomaly flag on top of the reconciliation
  logic, not replacing the human decision, assisting it.
- **Multi-user concurrency & multi-part deliveries** — today's model
  assumes one delivery note = one part; real deliveries mix parts, and
  multiple clerks work the same dock at once.
- **Security hardening** — password reset, SSO, rate limiting; today's
  auth is real session enforcement but no policy layer.
- **KPI history/trending** — the current KPIs (§13) are point-in-time;
  a pilot would want trend lines (discrepancy rate over time, etc.).

Close with: *"None of this is required to prove the core idea works —
that's what you just saw. This is the path from prototype to something
you'd actually run your dock on."*
