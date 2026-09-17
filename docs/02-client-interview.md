# Client Interview — Questions and Assumptions

There is no live client in this exercise (see `context/brief.md`). This doc
is where we'd log real answers if we had them, and where we state the
assumption we're using instead. Update this file the moment any of these
gets a real answer.

| # | Question | Why it matters | Assumption we're building against (until answered) |
|---|---|---|---|
| 1 | Who reconciles the invoice against the PO today — receiving or accounting? | Determines who the "invoice approver" actor really is and what access they need. | Receiving lead, same person/team who logs receipts. |
| 2 | What happens after a discrepancy notice is raised? | Determines whether the prototype needs a "resolved" state at all. | Notice is the end of this slice; resolution workflow is out of scope. |
| 3 | How urgent is a flagged mismatch? | Affects whether we'd design for same-day alerting vs. batch review. | Same-day, no alerting mechanism modeled. |
| 4 | What does a clerk actually look at to tell a duplicate scan from a genuine second delivery? | Our heuristic (exact-quantity + PO-coverage) is a guess at this signal. | No better signal available in `initial.json`; heuristic stands until tested against real scan logs. |
| 5 | Are multi-part delivery notes and partial invoices common? | Determines if the single-part-per-DN model is a fair simplification. | Assumed rare enough to exclude from this slice; flagged as a known limitation. |
| 6 | Who is allowed to approve a discrepancy notice? | Determines whether "approver" needs to be a distinct role from "clerk." | Assumed distinct role, no real auth enforcing it. |

## What we'd change immediately if we got a real answer

- Q1 answered "accounting, not receiving" → the approver's evidence view
  needs PO/supplier context the receiving clerk doesn't currently see; add
  that to the design before building it.
- Q4 answered with a concrete signal (e.g. supplier always splits by a fixed
  ratio, or delivery notes carry a truck/run ID) → replace the heuristic in
  `01-system-design.md` §4 rather than layering a special case on top of it.
