-- Itikaf initial schema.
-- Security model mirrors Ummah Rise's pattern: revoke blanket grants, re-grant
-- only the specific columns each role should touch, so AI-derived fields
-- (theme_tags, crisis_flag) can only ever be written by the service role,
-- never spoofed by a client.

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('verse', 'hadith', 'dua', 'istighfar')),
  arabic_text text not null,
  translation text not null,
  source text not null,
  theme_tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_transcript jsonb,
  language_detected text,
  theme_tags text[] not null default '{}',
  crisis_flag boolean not null default false,
  created_at timestamptz not null default now()
);

alter table content_items enable row level security;
alter table journal_entries enable row level security;

-- content_items: readable by any signed-in user, writable only via service role (seeding/admin).
create policy content_items_select on content_items
  for select to authenticated using (true);

-- journal_entries: users only ever see/insert/patch their own rows.
create policy journal_entries_select_own on journal_entries
  for select to authenticated using (auth.uid() = user_id);

create policy journal_entries_update_own on journal_entries
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Column-level lockdown: revoke everything, then re-grant only what each role should touch.
revoke all on journal_entries from authenticated;
grant select (id, user_id, encrypted_transcript, language_detected, theme_tags, crisis_flag, created_at)
  on journal_entries to authenticated;
-- Clients may only ever fill in their own encrypted transcript — never theme_tags/crisis_flag.
grant update (encrypted_transcript) on journal_entries to authenticated;

revoke all on content_items from authenticated;
grant select on content_items to authenticated;
