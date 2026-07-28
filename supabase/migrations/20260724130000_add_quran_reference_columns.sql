-- Supports matching against the full Quran (all 114 surahs) rather than only
-- the small hand-curated verse set: analyze-entry can now have Claude pick
-- ANY surah:ayah reference, then fetch the actual verified Arabic/translation
-- text live from a trusted external Quran API (never from the model's own
-- rendering of the text) and store a snapshot of it here. content_item_id
-- stays a strict FK for hadith/dua, which remain matched only against our
-- own pre-verified content_items table — this column pair is for the
-- verse case specifically, since a live-fetched verse has no row to point a
-- foreign key at.
alter table journal_entries
  add column quran_arabic_text text,
  add column quran_translation text,
  add column quran_source text;

-- New columns get no privileges on `authenticated` by default (the table
-- already had `revoke all` applied), so just re-grant read access — same
-- lockdown as content_item_id/reflection/etc: service role writes, clients
-- only ever read.
grant select (quran_arabic_text, quran_translation, quran_source)
  on journal_entries to authenticated;
