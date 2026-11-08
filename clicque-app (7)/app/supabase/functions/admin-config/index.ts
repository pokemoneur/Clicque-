// Developer-only function: lets the developer choose the AI agent (Claude or NVIDIA), the model and the API key
// from the game's hidden Developer screen. The key is stored in the private table dev_config and is never sent to players.
// Deploy:  supabase functions deploy admin-config
// Secret:  supabase secrets set DEV_PASSCODE=choose-a-long-private-passcode
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildRequest, parseResponse, mergeConfig, status, safeEqual } from "../_shared/provider.mjs";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const PASS = Deno.env.get("DEV_PASSCODE") || "";
const tries = new Map<string, number[]>();

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!PASS) return json({ ok: false, error: "DEV_PASSCODE is not set on the server" }, 500);
  const who = req.headers.get("x-forwarded-for") || "x", now = Date.now();
  const recent = (tries.get(who) || []).filter((t) => now - t < 600_000);
  if (recent.length >= 8) return json({ ok: false, error: "Too many tries" }, 429);
  tries.set(who, [...recent, now]);

  const b = await req.json().catch(() => ({}));
  if (!safeEqual(b.passcode || "", PASS)) { await sleep(500); return json({ ok: false, error: "Wrong passcode" }, 403); }
  tries.delete(who);

  const { data } = await sb.from("dev_config").select("data").eq("id", "ai").maybeSingle();
  const old = (data && data.data) || {};

  if (b.action === "status") return json({ ok: true, status: status(old) });
  if (b.action === "clear") {
    await sb.from("dev_config").upsert({ id: "ai", data: { ...old, key: "" }, updated_at: new Date().toISOString() });
    return json({ ok: true, msg: "Key removed.", status: status({ ...old, key: "" }) });
  }
  if (b.action === "set" || b.action === "test") {
    const m = mergeConfig(old, b);
    if (!m.ok) return json({ ok: false, error: m.error }, 400);
    if (b.action === "set") {
      await sb.from("dev_config").upsert({ id: "ai", data: m.data, updated_at: new Date().toISOString() });
      return json({ ok: true, msg: "Saved.", status: status(m.data) });
    }
    if (!m.data.key) return json({ ok: false, error: "No key stored yet" }, 400);
    try {
      const rq = buildRequest(m.data, "Reply with exactly this JSON and nothing else: [{\"ok\":true}]", 40);
      const r = await fetch(rq.url, { method: "POST", headers: rq.headers, body: JSON.stringify(rq.body) });
      if (!r.ok) return json({ ok: false, error: "Provider answered " + r.status }, 502);
      const text = parseResponse(m.data.provider, await r.json());
      return json({ ok: true, msg: "Test OK: " + text.slice(0, 60), status: status(m.data) });
    } catch (e) { return json({ ok: false, error: "Provider unreachable" }, 502); }
  }
  return json({ ok: false, error: "Unknown action" }, 400);
});
