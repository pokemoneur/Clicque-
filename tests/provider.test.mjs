import assert from "node:assert";
import { buildRequest, parseResponse, mergeConfig, status, safeEqual, DEFAULTS } from "../supabase/functions/_shared/provider.mjs";

const nv = buildRequest({ provider: "nvidia", key: "nvapi-TESTKEY", model: "" }, "hello prompt long enough");
assert.strictEqual(nv.url, "https://integrate.api.nvidia.com/v1/chat/completions");
assert.strictEqual(nv.headers.Authorization, "Bearer nvapi-TESTKEY");
assert.strictEqual(nv.body.model, DEFAULTS.nvidia);
assert.strictEqual(nv.body.messages[1].content, "hello prompt long enough");
assert.strictEqual(nv.body.stream, false);
const an = buildRequest({ provider: "anthropic", key: "sk-ant-X", model: "claude-haiku-5-5" }, "hi there prompt");
assert.strictEqual(an.url, "https://api.anthropic.com/v1/messages");
assert.strictEqual(an.headers["x-api-key"], "sk-ant-X");
assert.strictEqual(parseResponse("nvidia", { choices: [{ message: { content: "[{\"a\":1}]" } }] }), "[{\"a\":1}]");
assert.strictEqual(parseResponse("nvidia", {}), "");
assert.strictEqual(parseResponse("anthropic", { content: [{ type: "text", text: "ab" }, { type: "text", text: "cd" }] }), "abcd");

// config merging and validation
let m = mergeConfig({}, { provider: "nvidia", model: "meta/llama-3.1-70b-instruct", apiKey: "nvapi-" + "A".repeat(40) });
assert(m.ok && m.data.provider === "nvidia" && m.data.key.startsWith("nvapi-"));
const kept = mergeConfig(m.data, { provider: "nvidia", model: "other/model", apiKey: "" });
assert(kept.ok && kept.data.key === m.data.key && kept.data.model === "other/model");
assert(!mergeConfig({}, { provider: "evil" }).ok);
assert(!mergeConfig({}, { provider: "nvidia", model: "bad model!" }).ok);
assert(!mergeConfig({}, { provider: "nvidia", apiKey: "short" }).ok);
assert(!mergeConfig({}, { provider: "nvidia", apiKey: "nvapi-has space " + "A".repeat(30) }).ok);

// status never exposes the key
const s = status(m.data);
assert(s.hasKey && s.keyTail.length === 4 && !JSON.stringify(s).includes("nvapi-"));
// constant-time compare
assert(safeEqual("abc", "abc") && !safeEqual("abc", "abd") && !safeEqual("abc", "abcd") && !safeEqual("", "x"));
// other OpenAI-compatible providers (Groq, OpenRouter, Gemini...)
const cu = buildRequest({ provider: "custom", key: "gsk_" + "x".repeat(30), model: "llama-3.3-70b-versatile", base: "https://api.groq.com/openai/v1/" }, "prompt long enough here");
assert.strictEqual(cu.url, "https://api.groq.com/openai/v1/chat/completions");
assert.strictEqual(cu.body.model, "llama-3.3-70b-versatile");
assert.throws(() => buildRequest({ provider: "custom", key: "k", model: "m" }, "prompt long enough here"), /Base URL/);
assert.strictEqual(parseResponse("custom", { choices: [{ message: { content: "hi" } }] }), "hi");
const cm = mergeConfig({}, { provider: "custom", model: "m1", base: "https://openrouter.ai/api/v1", apiKey: "sk-or-" + "A".repeat(30) });
assert(cm.ok && cm.data.base === "https://openrouter.ai/api/v1" && cm.data.provider === "custom");
assert(!mergeConfig({}, { provider: "custom", apiKey: "sk-or-" + "A".repeat(30) }).ok);
for (const bad of ["http://insecure.example.com", "https://localhost/v1", "https://127.0.0.1/v1", "https://192.168.1.5/x", "https://10.0.0.1", "https://169.254.169.254/latest", "https://a b.com", "https://x.internal/v1"]) assert(!mergeConfig({}, { provider: "custom", base: bad, apiKey: "sk-" + "A".repeat(30) }).ok, bad);
assert.strictEqual(status(cm.data).base, "https://openrouter.ai/api/v1");
console.log("provider tests passed");
