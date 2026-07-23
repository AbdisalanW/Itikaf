// Analyzes a journal transcript: classifies crisis risk, extracts theme tags,
// retrieves a matching dua/verse/hadith + istighfar from our own vetted content
// table (never AI-generated scripture), and drafts a short reflection.
//
// theme_tags/crisis_flag are derived here and written with the service role key —
// the client is never granted UPDATE on those columns (see migrations), so a
// compromised client can't spoof a "safe" classification.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const THEME_TAXONOMY = [
  "anxiety", "grief", "marriage", "workplace", "faith-doubt",
  "gratitude", "immigration-family", "financial-stress", "loneliness", "anger",
];

const SYSTEM_PROMPT = `You are a careful classifier and reflection-writer for a Muslim voice-journaling app.
You NEVER quote, paraphrase, or invent Quran verses or hadith text yourself — the app supplies verified
content separately. Your only jobs, given a journal transcript, are:
1. Decide if this entry indicates possible crisis (self-harm, suicidal ideation, abuse, or immediate danger).
2. Pick 1-3 theme tags that best fit, ONLY from this fixed list: ${THEME_TAXONOMY.join(", ")}.
3. Write a short (2-3 sentence), warm, non-preachy reflection acknowledging what the person shared.
   Do not give religious rulings or claim authority you don't have. Do not mention Quran/hadith text directly.
Respond ONLY with JSON: {"crisis_flag": boolean, "theme_tags": string[], "reflection": string}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  if (!ANTHROPIC_KEY) {
    return new Response(JSON.stringify({ error: "Analysis is not configured yet." }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Resolve the caller's user id from their access token.
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  const user = await userRes.json();

  const { transcript, language } = await req.json();
  if (!transcript || typeof transcript !== "string") {
    return new Response(JSON.stringify({ error: "Missing transcript" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // Plaintext transcript is used only transiently here (in memory, this call) —
  // it is never logged or persisted; the client encrypts it before storage.
  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error("Claude analysis failed:", errText);
    return new Response(JSON.stringify({ error: "Could not analyze entry" }), {
      status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const claudeData = await claudeRes.json();
  let parsed: { crisis_flag: boolean; theme_tags: string[]; reflection: string };
  try {
    parsed = JSON.parse(claudeData.content[0].text);
  } catch {
    parsed = { crisis_flag: false, theme_tags: [], reflection: "" };
  }
  const themeTags = (parsed.theme_tags || []).filter((t) => THEME_TAXONOMY.includes(t));

  let content = null;
  let istighfar = null;

  if (!parsed.crisis_flag) {
    if (themeTags.length > 0) {
      const tagFilter = `{${themeTags.join(",")}}`;
      const contentRes = await fetch(
        `${SUPABASE_URL}/rest/v1/content_items?type=in.(verse,hadith,dua)&theme_tags=ov.${encodeURIComponent(tagFilter)}&limit=1`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
      );
      const contentRows = await contentRes.json();
      content = Array.isArray(contentRows) && contentRows[0] ? contentRows[0] : null;
    }
    const istighfarRes = await fetch(
      `${SUPABASE_URL}/rest/v1/content_items?type=eq.istighfar&limit=1&order=random()`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    );
    const istighfarRows = await istighfarRes.json();
    istighfar = Array.isArray(istighfarRows) && istighfarRows[0] ? istighfarRows[0] : null;
  }

  // Insert the row now (service role) with the AI-derived fields locked in;
  // the client will PATCH in only the encrypted_transcript afterward.
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: user.id,
      language_detected: language || null,
      theme_tags: themeTags,
      crisis_flag: !!parsed.crisis_flag,
    }),
  });
  const inserted = await insertRes.json();
  const entryId = Array.isArray(inserted) ? inserted[0]?.id : null;

  return new Response(
    JSON.stringify({
      entry_id: entryId,
      crisis_flag: !!parsed.crisis_flag,
      reflection: parsed.reflection || "",
      content,
      istighfar,
    }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});
