// Lightweight pre-check the client calls before starting a recording or
// submitting typed text, so a free-tier user who's out of reflections never
// wastes a Whisper/Claude call. This is a UX optimization only — analyze-entry
// re-runs the same check (see ../_shared/entitlement.ts) as the real,
// authoritative enforcement point.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getEntitlement } from "../_shared/entitlement.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
  const user = await userRes.json();

  const entitlement = await getEntitlement(SUPABASE_URL, SERVICE_ROLE_KEY, user.id);

  return new Response(JSON.stringify(entitlement), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
