# Put CLICQUE on Netlify so friends can play and test

1. Supabase (free): create a project, run `supabase/schema.sql` in the SQL editor, turn on **Anonymous sign-ins** (Authentication, Providers).
2. Open `www/config.js` and paste your Supabase **Project URL** and **anon key** (Project Settings, API).
3. Optional but recommended, the Claude-written conversations: deploy the `chat-ai` function (see README, step 3). Without it the game uses the built-in dialogue.
4. Go to https://app.netlify.com/drop and drag the whole `www` folder onto the page. Netlify gives you an https address.
   (Or connect a GitHub repo: Netlify reads `netlify.toml` and publishes `www`.)
5. Open the address on two phones. Create a room on one. On the other, open Online, Join, and search the room name or its 5-letter code.
6. Updating later: drag the new `www` folder onto the same site in Netlify (Deploys tab).

Notes
- Netlify only hosts the files. The rooms live in Supabase and the Claude-written chat runs in the Supabase function.
- The Supabase library loads from the `vendor` folder if you ran `npm run vendor`, otherwise from a pinned CDN copy, so drag-and-drop works without installing anything.
- If a player refreshes the page during a game, Online shows "Resume your game".
- If the host closes the app, other players see a notice after about a minute and can leave. Moving the whole game engine to the server (so the game survives that) is the next big step.

Choosing the AI agent (Claude or NVIDIA) and changing its key: see README, "Developer settings". Run `supabase secrets set DEV_PASSCODE=...`, deploy `chat-ai` and `admin-config`, then open your Netlify address followed by `#dev`.

## If online rooms do not work: use "Check connection"
Open the game, tap Online, then **Check connection**. It tests, one by one: your config.js values, the Supabase library, anonymous sign-in, writing, reading and deleting a test document, live updates (realtime), and whether the two functions are deployed. Every red cross comes with the exact fix. The four usual causes:
1. `www/config.js` still has the placeholder values (paste your Project URL and anon key, upload `www` again).
2. Anonymous sign-ins is off (Supabase, Authentication, Providers).
3. `supabase/schema.sql` was not run, or its realtime line failed (run `alter publication supabase_realtime add table public.docs;`).
4. Players are opening an old copy of the game instead of your Netlify address.

## Other AI providers (Groq, OpenRouter, Gemini...)
In the Developer screen choose **Other (OpenAI-compatible)**, paste the provider's base URL (it must start with https://), the model name and the key. Anything that speaks the OpenAI chat format works.
