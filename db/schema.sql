-- C04 prototype schema. Plain Postgres now; deliberately nothing here is
-- Supabase-specific (no RLS, no auth.*, no extensions beyond core Postgres),
-- so switching later is just pointing DATABASE_URL at a Supabase project
-- and re-running this file. See docs/01-system-design.md §9.

create table if not exists orders (
  id text primary key,
  part text not null,
  quantity int not null
);

create table if not exists delivery_notes (
  id text primary key,
  order_id text not null references orders(id),
  part text not null,
  listed_quantity int not null,
  logged_via text not null
);

create table if not exists receipts (
  id text primary key,
  delivery_note text not null references delivery_notes(id),
  received int not null,
  damaged int not null,
  accepted int not null
);

create table if not exists discarded_duplicates (
  scan_id text primary key,
  order_id text not null,
  part text not null,
  listed_quantity int not null,
  matched_delivery_note text,
  confirmed_by_clerk_at timestamptz not null
);

create table if not exists discrepancy_notices (
  id text primary key,
  invoice_id text not null,
  order_id text not null,
  part text not null,
  invoiced_quantity int not null,
  accepted_total int not null,
  discrepancy int not null,
  evidence jsonb not null,
  approved_by text not null,
  approved_at timestamptz not null,
  simulated boolean not null default true
);

-- Atomic id generation (DN-3, RC-7, ...) that survives a server restart,
-- unlike an in-memory counter would once the rest of the state is in a real
-- database.
create table if not exists counters (
  key text primary key,
  value int not null
);
