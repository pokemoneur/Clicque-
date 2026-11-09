// Shared, dependency-free logic for the AI agent provider (tested with node, used by the Edge Functions).
export const PROVIDERS = ["anthropic", "nvidia", "custom"];
export const DEFAULTS = { anthropic: "claude-haiku-5-5", nvidia: "meta/llama-3.1-70b-instruct", custom: "" };
const OPENAI_STYLE = (p) => p === "nvidia" || p === "custom";
const SYSTEM = "You write short chat messages for a social elimination game. Follow the format requested in the user message exactly and reply with ONLY that format.";

export function buildRequest(cfg, prompt, max = 700) {
  const provider = PROVIDERS.includes(cfg.provider) ? cfg.provider : "anthropic";
  const model = cfg.model || DEFAULTS[provider];
  if (OPENAI_STYLE(provider)) {
    const base = (provider === "nvidia" ? cfg.base || "https://integrate.api.nvidia.com/v1" : cfg.base || "").replace(/\/+$/, "");
    if (!base) throw new Error("Base URL required");
    return {
      url: base + "/chat/completions",
      headers: { Authorization: "Bearer " + cfg.key, "Content-Type": "application/json", Accept: "application/json" },
      body: { model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }], max_tokens: max, temperature: 0.9, top_p: 0.95, stream: false },
    };
  }
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: { "x-api-key": cfg.key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: { model, max_tokens: max, messages: [{ role: "user", content: prompt }] },
  };
}

export function parseResponse(provider, j) {
  if (OPENAI_STYLE(provider)) {
    const m = j && j.choices && j.choices[0] && j.choices[0].message;
    return m && typeof m.content === "string" ? m.content : "";
  }
  return ((j && j.content) || []).map((b) => b.text || "").join("");
}

export const keyTail = (k) => (k ? String(k).slice(-4) : "");
export const status = (cfg) => ({ provider: cfg.provider || "anthropic", model: cfg.model || "", base: cfg.base || "", hasKey: !!cfg.key, keyTail: keyTail(cfg.key) });

export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

// Validates what the developer typed and merges it with the stored config. An empty key keeps the current key.
export function mergeConfig(old, inp) {
  old = old || {}; inp = inp || {};
  const provider = inp.provider || old.provider || "anthropic";
  if (!PROVIDERS.includes(provider)) return { ok: false, error: "Unknown provider" };
  const model = String(inp.model || "").trim();
  if (model && !/^[A-Za-z0-9._\/:-]{1,80}$/.test(model)) return { ok: false, error: "Model name has invalid characters" };
  const k = String(inp.apiKey || "").trim();
  if (k && !/^[A-Za-z0-9._-]{20,300}$/.test(k)) return { ok: false, error: "That does not look like an API key" };
  let base = String(inp.base || "").trim();
  if (base) {
    const m = /^https:\/\/([A-Za-z0-9.-]+)(:\d{2,5})?(\/[A-Za-z0-9._~\/-]*)?$/.exec(base);
    if (!m || base.length > 200) return { ok: false, error: "Base URL must start with https:// and contain no spaces" };
    const h = m[1].toLowerCase();
    if (h === "localhost" || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || h.endsWith(".internal") || h.endsWith(".local")) return { ok: false, error: "That address is not allowed" };
  } else if (provider === "custom") base = old.base || "";
  if (provider === "custom" && !base) return { ok: false, error: "Base URL is required for Other providers" };
  return { ok: true, data: { provider, model: model || "", key: k || old.key || "", base: provider === "anthropic" ? "" : base } };
}
