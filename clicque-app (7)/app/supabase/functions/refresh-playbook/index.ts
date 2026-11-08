// Weekly job: asks Claude (with web search) for current social-deduction strategy tips and stores them,
// so the AI characters in the game can use fresh tactics. The game reads the row `meta/playbook`.
// Deploy:   supabase functions deploy refresh-playbook --no-verify-jwt
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-... CRON_SECRET=pick-a-long-random-string
// Schedule: see README (weekly is plenty). NOT TESTED against the live services.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("CRON_SECRET") || "";

serve(async (req) => {
  if (!SECRET || req.headers.get("x-cron-secret") !== SECRET) return new Response("forbidden", { status: 403 });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-5-5",
      max_tokens: 1800,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
      messages: [{
        role: "user",
        content: "Search the web for current, widely recommended strategies and tactics for social-deduction and elimination games (Werewolf, Mafia, Among Us, Survivor, Big Brother). " +
          "Then reply with ONLY a JSON array of 12 short tactic tips, each under 160 characters, written in your own words (no quotes from sources).",
      }],
    }),
  });
  if (!r.ok) return new Response("upstream " + r.status, { status: 502 });
  const d = await r.json();
  const text = (d.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  const m = text.match(/\[[\s\S]*\]/);
  let tips: string[] = [];
  try { tips = JSON.parse(m ? m[0] : "[]").filter((x: unknown) => typeof x === "string" && x.length < 200).slice(0, 14); } catch (_) {}
  if (tips.length < 5) return new Response("no tips", { status: 502 });
  const sb = createClient(URL, SRK);
  const { error } = await sb.from("docs").upsert({ path: "meta/playbook", parent: "meta", id: "playbook", data: { tips, ts: Date.now() } });
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify({ ok: true, tips: tips.length }), { headers: { "content-type": "application/json" } });
});
