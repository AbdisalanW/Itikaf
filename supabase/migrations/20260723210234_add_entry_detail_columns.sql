-- Adds the fields needed to reconstruct a past entry's full result (reflection
-- + matched dua/verse + istighfar) instead of only the raw transcript, plus
-- entry_type to distinguish voice vs typed entries. All four are derived by
-- analyze-entry (service role) — never client-writable, same pattern as
-- theme_tags/crisis_flag.

alter table journal_entries
  add column content_item_id uuid references content_items(id),
  add column istighfar_item_id uuid references content_items(id),
  add column reflection text,
  add column entry_type text check (entry_type in ('voice', 'text'));

revoke all on journal_entries from authenticated;
grant select (
  id, user_id, encrypted_transcript, language_detected, theme_tags, crisis_flag,
  content_item_id, istighfar_item_id, reflection, entry_type, created_at
) on journal_entries to authenticated;
grant update (encrypted_transcript) on journal_entries to authenticated;
