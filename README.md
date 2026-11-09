# CLICQUE: real app project

Everything here is ready to run, but **I could not build or test the native apps or the live server from my side**
(no network, no Xcode/Android tooling). What *was* tested: the game logic (400 simulated games in 6 languages, no rule errors)
and the Supabase layer against a mock (`npm test`).

## Folder map
- `www/index.html`: the game (same code as the Claude page + install and connection tags)
- `www/manifest.webmanifest`, `www/sw.js`, `www/icon-*.png`: make the web app installable on a phone
- `www/platform.js`: makes the game talk to Supabase instead of the Claude page runtime
- `www/config.js`: put your Supabase URL and anon key here
- `supabase/schema.sql`: database table, realtime and security rules
- `supabase/functions/chat-ai/index.ts`: server function that writes the AI characters' chat with Claude
- `supabase/functions/refresh-playbook/index.ts`: weekly job that lets Claude search the web for fresh strategy tips for the AI characters
- `capacitor.config.json`, `package.json`: wraps the game as an iOS and Android app
- `docs/ai-players.js`: readable copy of the autonomous AI players code (already built into the game)
- `legal/`: privacy policy and terms templates (have a lawyer check them)
- `store/listing.md`: store texts, keywords, age and privacy guidance
- `assets/icon.png`, `assets/icon.svg`: app icon (1024×1024)
- `tests/shim.test.js`: tests for the Supabase layer

## Setup in order
1. **Supabase:** create a project at supabase.com and enable **Anonymous sign-ins**. The checked-in `supabase/schema.sql` is an early development schema, not a production-ready multiplayer setup. Read [PWA launch checklist](docs/PWA-LAUNCH-CHECKLIST.md) before applying it to a live project.
2. **Keys:** *Project Settings > API*: copy the Project URL and the `anon` key into `www/config.js`.
3. **AI chat server:** install the Supabase CLI, then in this folder:
   ```
   supabase login
   supabase link --project-ref YOUR-PROJECT-REF
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...      # key from console.anthropic.com
   supabase functions deploy chat-ai
   ```
   Optional "learn from the internet" job (the game page itself cannot browse; this server job can):
   ```
   supabase secrets set CRON_SECRET=pick-a-long-random-string
   supabase functions deploy refresh-playbook --no-verify-jwt
   curl -X POST -H "x-cron-secret: pick-a-long-random-string" https://YOUR-PROJECT-REF.supabase.co/functions/v1/refresh-playbook
   ```
   Then schedule it weekly (Supabase Dashboard > Integrations > Cron, call the same URL with the same header).
   The game reads the tips from the row `meta/playbook` and falls back to a built-in playbook if it is missing.
4. **Prepare the browser build:**
   ```
   npm install
   npm test
   npm run vendor
   npx serve www        # open the printed address to check the local web build
   ```
5. **Make the native apps:**
   ```
   npx cap add ios        # needs a Mac with Xcode
   npx cap add android    # needs Android Studio
   npm run ios            # or: npm run android
   ```
   Change `appId` in `capacitor.config.json` to your own (for example `com.yourname.clicque`) *before* `cap add`.
6. Generate icons and splash screens: `npx @capacitor/assets generate --iconBackgroundColor '#6a4cf0'` (uses `assets/icon.png`).
7. Follow the launch checklist document for accounts, store forms, testing and legal.

## Put the web app on a phone without the app stores (about 15 minutes)
1. Upload the whole `www` folder to any static host: Netlify Drop (drop.netlify.com), Cloudflare Pages, or GitHub Pages.
2. Open the https address on the phone. iPhone: Safari, Share, **Add to Home Screen**. Android: Chrome menu, **Install app**.
3. Solo play works right away. Online rooms and Claude-written chat need the Supabase setup above.

### GitHub Pages for this repository
The site files live in `www/`, so the repository must use a GitHub Actions Pages deployment rather than publishing the repository root. The workflow in `.github/workflows/pages.yml` uploads only `www/`.
After adding the workflow to the `main` branch, open **Settings > Pages**, change **Build and deployment > Source** to **GitHub Actions**, then run the **Deploy GitHub Pages** workflow from **Actions** (or push another commit to `main`).

## Developer settings: choose the AI agent and change its key (only you)
The AI players can be written by Claude (Anthropic) or by an NVIDIA-hosted model. The choice and the API key live on the server in a private table players cannot read; the key is never in the game files.
1. Run `supabase/schema.sql` (it creates the private table `dev_config`).
2. Pick a long private passcode: `supabase secrets set DEV_PASSCODE=your-long-passcode`
3. Deploy both functions: `supabase functions deploy chat-ai` and `supabase functions deploy admin-config`
4. Put your NVIDIA key in for the first time, either way:
   - paste `supabase/private/seed-dev-config.sql` in the Supabase SQL editor and run it (it already contains your key; keep that file private), or
   - open the game address followed by `#dev`, go to Settings > Developer, enter the passcode, choose NVIDIA, the model name and the key, press Save, then Test.
5. Change or remove the key any time from the same Developer screen. Only the passcode unlocks it. To remove the Developer screen from the game, set `DEV_ENABLED=false` in `www/index.html`.
Notes: model names on build.nvidia.com change over time, so check the current list; the Claude page link cannot call outside services, so this works in the Netlify and app versions only.

## Netlify (friends can play and test)
See `NETLIFY.md`: configure Supabase, paste the two keys into `www/config.js`, then drag the `www` folder onto https://app.netlify.com/drop.

## What the AI characters learn
- **From you:** your style, words and tactics are remembered on your phone between games (Settings: on/off, and a Forget button).
- **From games:** they learn which behaviors get players voted out (silence, piling up accusations) and adjust, and they keep this between games.
- **From the internet:** only through the optional weekly server job above, never live from the game page.

## Known limits of this first version
- The web client calls `clicque_room_join`, `clicque_room_heartbeat`, `clicque_room_leave`, and `clicque_room_start`, but their SQL definitions are not present in the maintained `supabase/` source. Online rooms need those procedures deployed; otherwise they will fail.
- The current `docs` read policy allows every signed-in player to read every document, including private-room documents. The insert policy also permits broad writes under room paths. Replace these development rules with tested, least-privilege room policies before enabling online play for people outside a trusted pilot.
- Rules are lenient (any signed-in player can create rooms). Tighten them before a big launch.
- The room's host runs the game. If the host closes the app, the game ends.
- No accounts, friends list, purchases or ads yet.
- Chat filter is a short word list, and report/block is basic. Improve both before launch.
