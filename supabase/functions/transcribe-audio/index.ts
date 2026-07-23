// Transcribes a voice journal entry via OpenAI Whisper (multilingual).
// Privacy commitment: the audio blob is never written to storage — it is
// forwarded to Whisper and discarded as soon as this function returns.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: "Transcription is not configured yet." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const audioBuffer = await req.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return new Response(JSON.stringify({ error: "No audio received" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const form = new FormData();
  form.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "entry.webm");
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });

  // Nothing above persisted the audio anywhere — it lived only in memory for this request.
  if (!whisperRes.ok) {
    const errText = await whisperRes.text();
    console.error("Whisper transcription failed:", errText);
    return new Response(JSON.stringify({ error: "Could not transcribe audio" }), {
      status: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const result = await whisperRes.json();
  return new Response(
    JSON.stringify({ transcript: result.text, language: result.language }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});
