// Receives RevenueCat's subscription lifecycle webhook and upserts our own
// subscribers table — the authoritative source analyze-entry/check-entitlement
// read from. RevenueCat's app_user_id must equal our Supabase user_id: the
// client calls Purchases.logIn({ appUserID: session.user.id }) on sign-in to
// guarantee this link.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

const PREMIUM_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"]);
const REVOKE_EVENTS = new Set(["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const authHeader = req.headers.get("Authorization") || "";
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const body = await req.json();
  const event = body?.event;
  const userId = event?.app_user_id;
  const eventType = event?.type;

  if (!userId || !eventType) {
    return new Response(JSON.stringify({ error: "Malformed webhook payload" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let isPremium: boolean | null = null;
  if (PREMIUM_EVENTS.has(eventType)) isPremium = true;
  else if (REVOKE_EVENTS.has(eventType)) isPremium = false;

  if (isPremium === null) {
    // Event type we don't act on (TRANSFER, SUBSCRIPTION_PAUSED preview, etc.) — acknowledge, no-op.
    return new Response(JSON.stringify({ ok: true, ignored: eventType }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const expiresAtMs = event?.expiration_at_ms;
  await fetch(`${SUPABASE_URL}/rest/v1/subscribers`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      is_premium: isPremium,
      premium_expires_at: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
      updated_at: new Date().toISOString(),
    }),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
