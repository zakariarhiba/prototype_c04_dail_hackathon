-- C04 prototype schema. Plain Postgres now; deliberately nothing here is
-- Supabase-specific (no RLS, no auth.*, no extensions beyond core Postgres),
-- so switching later is just pointing DATABASE_URL at a Supabase project
-- and re-running this file. See docs/01-system-design.md §9.

-- v2: real auth/session (docs/01-system-design.md §10). Seed credentials
-- are demo values, not secret; see README. `username` is the login
-- identifier (e.g. "priya_lead"); `name` is the display name shown in the
-- UI (e.g. "Priya, Parts Receiving Lead") — kept separate so the login
-- field can be short/professional while the UI still reads naturally.
create table if not exists users (
  id text primary key,
  username text not null unique,
  name text not null,
  role text not null check (role in ('clerk', 'approver')),
  password_hash text not null
);

-- Idempotent add for a database created before `username` existed.
alter table if exists users add column if not exists username text;
update users set username = lower(replace(split_part(name, ',', 1), ' ', '_')) where username is null;

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
  accepted int not null,
  created_at timestamptz not null default now()
);

-- v2: inventory ledger (docs/01-system-design.md §11) needs a per-receipt
-- timestamp to derive last_movement_at. Idempotent add for databases created
-- before this column existed; new databases get it from the create above.
alter table if exists receipts add column if not exists created_at timestamptz not null default now();

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
