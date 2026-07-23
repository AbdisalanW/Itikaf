// Analyzes a journal transcript: classifies crisis risk, extracts theme tags,
// retrieves a matching dua/verse/hadith + istighfar from our own vetted content
// table (never AI-generated scripture), and drafts a short reflection.
//
// theme_tags/crisis_flag are derived here and written with the service role key —
// the client is never granted UPDATE on those columns (see migrations), so a
// compromised client can't spoof a "safe" classification.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getEntitlement } from "../_shared/entitlement.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const THEME_TAXONOMY = [
  "anxiety", "grief", "marriage", "workplace", "faith-doubt",
  "gratitude", "immigration-family", "financial-stress", "loneliness", "anger",
];

// Deterministic safety net, checked BEFORE Claude's classification. Testing
// showed Claude's crisis classification is not perfectly consistent across
// calls even on clearly suicidal input — a single probabilistic call is not
// reliable enough as the only line of defense here. Any of these phrases
// forces crisis_flag=true regardless of what the model would have said.
// English-only for now; non-English or non-matching crisis language still
// falls through to Claude's classification below.
const CRISIS_KEYWORDS = [
  /kill(ing)? myself/i, /end(ing)? my life/i, /suicid(e|al)/i,
  /want(ing)? to die/i, /no (reason|point) (to|in) (liv(e|ing)|going on)/i,
  /(hurt|harm)(ing)? myself/i, /self[- ]harm/i, /better off dead/i,
  /don'?t want to (be here|exist) anymore/i,
];
function matchesCrisisKeywords(text: string): boolean {
  return CRISIS_KEYWORDS.some((re) => re.test(text));
}

const SYSTEM_PROMPT = `You are a careful classifier and reflection-writer for a Muslim voice-journaling app.
You NEVER quote, paraphrase, or invent Quran verses or hadith text yourself — the app supplies verified
content separately. Your only jobs, given a journal transcript, are:

1. Decide if this entry is a crisis: crisis_flag is true ONLY for explicit or strongly implied suicidal
   ideation, self-harm intent, ongoing abuse, or immediate physical danger.
   crisis_flag is FALSE for ordinary stress, anxiety, sadness, anger, guilt, or frustration about everyday
   life — exams, work, deadlines, marriage friction, money worries, grief, loneliness — even when the person
   expresses strong or intense emotion about it. Emotional intensity alone is never sufficient; you need a
   concrete signal of intent to harm someone (including themselves) or an active dangerous situation.
   Examples that are FALSE: "I'm so anxious about this exam I can't focus", "I'm furious at my coworker",
   "I feel like such a failure", "I'm devastated about my divorce".
   Examples that are TRUE: "I've been thinking about ending my life", "he hits me and I'm scared to go home",
   "I don't want to be alive anymore".
   When genuinely unsure between an intense-but-ordinary feeling and a real crisis signal, prefer FALSE —
   a separate deterministic keyword check already catches the clearest crisis language before this
   classification ever runs, so your job here is to catch subtler true crises without over-flagging.
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

  const { transcript, language, entry_type } = await req.json();
  const entryType = entry_type === "text" ? "text" : "voice";
  if (!transcript || typeof transcript !== "string") {
    return new Response(JSON.stringify({ error: "Missing transcript" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let parsed: { crisis_flag: boolean; theme_tags: string[]; reflection: string };

  if (matchesCrisisKeywords(transcript)) {
    // Deterministic match — skip the model call entirely. The crisis screen
    // doesn't use theme_tags/reflection, and there's no reason to give a
    // probabilistic classifier a chance to talk this back down.
    parsed = { crisis_flag: true, theme_tags: [], reflection: "" };
  } else {
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
        // Structured outputs guarantee schema-conforming JSON — more reliable
        // than a "respond only with JSON" instruction, which can occasionally
        // get wrapped in preamble text or omit a field.
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                crisis_flag: { type: "boolean" },
                theme_tags: { type: "array", items: { type: "string", enum: THEME_TAXONOMY } },
                reflection: { type: "string" },
              },
              required: ["crisis_flag", "theme_tags", "reflection"],
              additionalProperties: false,
            },
          },
        },
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
    try {
      parsed = JSON.parse(claudeData.content[0].text);
    } catch {
      // Fail closed: if we can't parse the model's classification, treat it
      // as a possible crisis rather than silently defaulting to "safe".
      parsed = { crisis_flag: true, theme_tags: [], reflection: "" };
    }
  }
  const themeTags = (parsed.theme_tags || []).filter((t) => THEME_TAXONOMY.includes(t));

  // Authoritative enforcement point for the freemium limit — checked AFTER
  // crisis classification, and only enforced when this is NOT a crisis.
  // Blocking a genuine crisis behind a paywall would be actively harmful, so
  // the cost of classifying an over-limit user's entry is accepted as the
  // price of never doing that. (check-entitlement is the client-side
  // pre-check that saves this cost in the common, non-crisis case.)
  if (!parsed.crisis_flag) {
    const entitlement = await getEntitlement(SUPABASE_URL, SERVICE_ROLE_KEY, user.id);
    if (!entitlement.allowed) {
      return new Response(JSON.stringify({ limit_reached: true, ...entitlement }), {
        status: 402, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  }

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
    // PostgREST's order= param only accepts column names, not function calls
    // like random() — fetch the small istighfar set and pick one client-side.
    const istighfarRes = await fetch(
      `${SUPABASE_URL}/rest/v1/content_items?type=eq.istighfar`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    );
    const istighfarRows = await istighfarRes.json();
    istighfar = Array.isArray(istighfarRows) && istighfarRows.length > 0
      ? istighfarRows[Math.floor(Math.random() * istighfarRows.length)]
      : null;
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
      reflection: parsed.reflection || "",
      content_item_id: content?.id ?? null,
      istighfar_item_id: istighfar?.id ?? null,
      entry_type: entryType,
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
