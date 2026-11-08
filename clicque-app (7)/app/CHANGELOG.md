# Changelog

## 0.11.0
- New bonus round: Swap Round. An eliminated player comes back and an active player must leave. Who comes back and who leaves are decided by any combination of the players, the eliminated players and the AI (each side can have a different combination). It counts as one of the game's revival rounds.
- Solo: choose the chat length (or no chat) on the start screen, with the estimated game length updating live.
- `docs/CLICQUE-guides.pdf`: detailed checklists for making online mode work and for turning the web game into a phone app and rebuilding it after updates.

## 0.10.0
- Revival rounds are random: at least one per game, never two in a row, at most 2 for games under 7 players; 7 or more players can have more than 2 (up to 4).
- 44-second end-of-game chat after the winner is revealed: winner, finalists and eliminated players react, congratulate, roast and confess their real votes.
- Chat can be switched off (Settings and room creation: "No chat (votes only)"). The social simulation keeps running in the background.
- Estimated game length for each player count, with the time per round, in Solo and in Create room.
- Dialogue: a drama grammar that builds lines from real game facts (votes, rescues, voting pairs) plus a verdict and a challenge, and rebuttals that quote the accusation they answer, so lines are not recycled. The AI prompt now asks for cutthroat, dramatic, consistent characters that never repeat a line.
- "Check connection" on the Online screen tests the whole multiplayer chain and explains each failure.
- Developer screen: any OpenAI-compatible provider (Groq, OpenRouter, Gemini...) with a base URL, in addition to Claude and NVIDIA.

## 0.9.0
- AI contestants upgraded to the second specification (gameplay and games unchanged):
  - 18 emotions (happiness, excitement, anger, frustration, jealousy, sadness, disappointment, nervousness, anxiety, confidence, fear, suspicion, embarrassment, pride, relief, boredom, betrayal) driven by real events, with their own lines in six languages.
  - Each contestant has a goal that changes decisions (win, reach the final three, protect a friend, take revenge, stay under the radar, prove doubters wrong, follow impulse). Betrayals and eliminated friends create revenge goals.
  - New relationship score: alliance appeal. Resentment fades slowly between rounds; embarrassment is remembered.
  - Game event system: round start, theme reveal, nominations, votes, eliminations, comebacks and the final each update emotions and memory. Only contestants with a reason react, with 1 to 3 short lines under the theme reveal, eliminations, comebacks and the final.
  - Characters approach the player (compliment, tease, voice suspicion, ask an opinion) and answer what the player typed in context (retort, warm reply, snap).
  - Quick slang reactions (2 to 10 words) matched to each character's slang level, ALL CAPS for hot tempers, talk about threats and chances of winning.
  - Ages are now 18 to 38.
  - Claude-written chat gets goals, shorter length rules and the new behaviours.

## 0.8.0
- The AI players can use an NVIDIA-hosted model (or Claude) as their agent. The provider, model name and API key are set from a hidden Developer screen (open the game address with #dev, then Settings > Developer), protected by a server-side passcode.
- The key is stored in a private database table that only the server functions can read. It is not in the game files, the web folder or the standalone HTML.
- New functions: `admin-config` (developer settings) and an updated `chat-ai` that follows the chosen provider. Shared provider logic is tested.
- Your key is pre-entered in `supabase/private/seed-dev-config.sql` (private file, ignored by git). Run it once in the Supabase SQL editor.

## 0.7.0
- Online rooms: search rooms by name or by their 5-letter code; room code shown in the lobby and in the invite text.
- Resume: refresh the page mid-game and Online shows "Resume your game".
- Host-offline notice for players (real app / Netlify: the host sends a heartbeat every 15 seconds).
- The Claude-written chat now gets a "story so far" (eliminations, betrayals, public confrontations, comebacks, who was accused most) so storylines carry into the next rounds. The chat memory is longer too.
- Netlify ready: `netlify.toml`, `NETLIFY.md`, and a pinned CDN fallback for the Supabase library so drag-and-drop deploys work.

## 0.6.1
- Fixed "[object Object]" showing instead of avatars: the mood state of the AI players overwrote their emoji. Moods are stored separately now, and avatars saved by earlier versions are repaired automatically.
- Tab icons in the bottom dock are bigger and colored, with a stronger highlight for the open tab. The six tabs themselves are unchanged.
- The test run now scans every screen, chat line and tab, in all six languages, for stray "[object Object]", "undefined" and "NaN".
- Added `docs/ai-players.js`: a readable copy of the AI players code.

## 0.6.0
- Built-in dialogue (used when Claude-written chat is not available) is much richer, in all six languages:
  - each of the nine personalities has its own signature lines about the game;
  - mood lines (angry, anxious, proud, jealous, hurt, suspicious, confident);
  - lines that depend on the relationship (friend, enemy, rival, secret ally);
  - two-part arguments that combine the two strongest reasons;
  - longer back-and-forth threads: accusation, defence, "why them?", denial, pressure, concession, tease, reassurance.

## 0.5.0
- The stat monitor ("The Show") is now a bottom dock like a game HUD: a slim bar of tabs with a slide-up sheet, sized for phones. The contestant display is more compact on small screens.
- Locks (see `LOCK` at the top of the cast code in `www/index.html`): Messages tab locked, Alliances tab locked, contestant location hidden (profiles and AI dialogue), whole monitor can be locked with `monitor: true`.
- Profiles: ages kept, job removed, location locked. Your own profile card has a customizable title (also editable on the avatar screen). The AI can react to it.
- Your real avatar (photo or emoji) now shows everywhere in the monitor.
- Dialogue is shorter by default (long lines only when a character has a real point) and paced slower so it is easier to read.

## 0.4.0
- Autonomous cast: every AI contestant has a full personality profile (11 traits, humor, slang level, strengths and weaknesses), their own mood, and private memory.
- Pairwise relationships (trust, friendship, respect, rivalry, suspicion, resentment) that change from real events; voting history persists across rounds and between games.
- Alliances, betrayals, rumours, grudges, confrontations, apologies and celebrations happen on their own during the game, not only when the player speaks.
- Information boundaries: private messages, secret alliances and rumours are only known to those involved. Votes cited by the AI are checked against the real vote history.
- "The Show" panel (collapsed by default): Feed, private Messages with the AI players, Relations, Votes, Alliances, Profiles.
- Returning cast: the same contestants and their memories carry over to the next game (Settings switch).
- Web app can be installed on a phone (manifest and offline cache).

## 0.3.0
- Contestant display redesigned as an electronic concert screen: light beams, LED grid, live ticker, spotlight and equalizer on whoever is talking.
- Dialogue never repeats within a game; characters answer what was just said (they quote your words and each other's), with new openers and endings for variety.
- Characters learn: from your play (on-device memory, switch and Forget button in Settings), from game outcomes (they adapt tactics), and, in the real app, from a weekly web-researched playbook.
- Bandwagon tactic added for followers; characters can bring up what you did in past games.

## 0.2.0
- Save chain: the AI saves the first player; everyone acts once.
- Small-vote and runoff rules fixed; nomination ties decided by the AI with reasons.
- Real online rooms, Supabase layer, chat filter, report and block.

## 0.1.0
- First playable prototype.
