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

  // Use the client's actual declared content-type rather than assuming webm —
  // iOS Safari/WKWebView has no WebM support at all and really records in
  // whatever format MediaRecorder.mimeType reports (typically audio/mp4).
  // Whisper picks its decoder from the filename extension, so mismatching
  // this with the real bytes risks silently wrong/degraded transcription.
  const contentType = req.headers.get("content-type") || "audio/webm";
  const extension = contentType.includes("mp4") ? "mp4"
    : contentType.includes("mpeg") ? "mp3"
    : contentType.includes("wav") ? "wav"
    : contentType.includes("ogg") ? "ogg"
    : "webm";

  const form = new FormData();
  form.append("file", new Blob([audioBuffer], { type: contentType }), `entry.${extension}`);
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
