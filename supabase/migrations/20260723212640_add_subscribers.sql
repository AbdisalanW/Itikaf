-- Tracks freemium subscription status. Only ever written by the
-- revenuecat-webhook edge function (service role) — a client has no
-- insert/update grant on this table at all, only select on their own row.

create table subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table subscribers enable row level security;

create policy subscribers_select_own on subscribers
  for select to authenticated using (auth.uid() = user_id);

revoke all on subscribers from authenticated;
grant select on subscribers to authenticated;
