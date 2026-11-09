// Supabase Edge Function: writes the AI characters' chat. The provider (Claude or NVIDIA) and its key come from
// the private table dev_config (set from the game's Developer screen) or from function secrets.
// Deploy:  supabase functions deploy chat-ai
// Optional secrets:  ANTHROPIC_API_KEY, NVIDIA_API_KEY (used when no key is stored in dev_config)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { buildRequest, parseResponse } from "../_shared/provider.mjs";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const hits = new Map<string, number[]>();      // simple per-user rate limit (per function instance)
let cache: { at: number; cfg: Record<string, string> } | null = null;

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function config() {
  if (cache && Date.now() - cache.at < 30_000) return cache.cfg;
  const { data } = await sb.from("dev_config").select("data").eq("id", "ai").maybeSingle();
  const c = (data && data.data) || {};
  const provider = c.provider === "nvidia" || c.provider === "custom" ? c.provider : "anthropic";
  const key = c.key || (provider === "nvidia" ? Deno.env.get("NVIDIA_API_KEY") : Deno.env.get("ANTHROPIC_API_KEY")) || "";
  const cfg = { provider, model: c.model || "", key, base: c.base || "" };
  cache = { at: Date.now(), cfg };
  return cfg;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let uid = "anon";
  try { uid = JSON.parse(atob((req.headers.get("authorization") || "").split(".")[1] || "")).sub || "anon"; } catch (_) {}
  const now = Date.now(), recent = (hits.get(uid) || []).filter((t) => now - t < 60_000);
  if (recent.length >= 20) return json({ error: "rate limited" }, 429);
  hits.set(uid, [...recent, now]);

  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  if (typeof prompt !== "string" || prompt.length < 20 || prompt.length > 14000) return json({ error: "bad prompt" }, 400);

  const cfg = await config();
  if (!cfg.key) return json({ error: "server not configured" }, 500);
  const rq = buildRequest(cfg, prompt);
  const r = await fetch(rq.url, { method: "POST", headers: rq.headers, body: JSON.stringify(rq.body) });
  if (!r.ok) return json({ error: "upstream " + r.status }, r.status === 429 ? 429 : 502);
  const text = parseResponse(cfg.provider, await r.json());
  return json({ text });
});
