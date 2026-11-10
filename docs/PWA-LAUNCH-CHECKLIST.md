# Clique PWA launch checklist

Status reviewed against the repository on 9 November 2026. “In repository” means the project contains the relevant scaffold or code; it does not mean it has been verified on a live phone or account.

## What is already in the repository

- [x] Product identity draft aligned: CLIQUE: Social Elimination, short listing copy, promise, and solo-first release scope.
- [x] Supplied glossy Q icon installed as the 1024px master and PWA launcher icon set.
- [x] Replaced placeholder Capacitor app ID with `com.clicque.game`; replace with an owned-domain ID if desired before creating native projects.
- [ ] Choose a support email and a domain you control before store submission.
- [x] Web game, responsive layout, web manifest, service worker, and app icons.
- [x] Capacitor configuration and iOS/Android dependencies for a later native wrapper.
- [x] GitHub Actions workflow that publishes the www/ folder to GitHub Pages.
- [x] Supabase client adapter and server-side AI function scaffolds.
- [x] Earlier requested dialogue improvements: more responsive AI conversation and a warmer end-of-game exchange.
- [x] Added a clearer, staged round reveal, a short pause before elimination names appear, and concise round-specific dialogue guidance.
- [x] Fixed missing Killcard title/description translations and prevented the forced Killcard from returning later in the same game.
- [x] Added a single-player Ready button for eliminated spectators and gated developer controls behind the existing server passcode.
- [x] Corrected the animated intro and online room headings to spell CLIQUE consistently.
- [x] Added online Ready controls for every real participant, including eliminated spectators; AI seats follow once every real player is ready.
- [ ] Live PWA installation and update behavior verified on current iOS Safari and Android Chrome devices.
- [ ] Online multiplayer verified against the currently deployed Supabase project.

## I can complete in the project

- [x] Inspect the existing PWA, hosting workflow, Supabase integration, and repository notes.
- [x] Document multiplayer backend gaps and correct setup guidance so the existing SQL is not presented as launch-ready.
- [ ] Implement and review the missing room procedures and access policies after confirming expected behavior against the actual deployed Supabase project.
- [ ] Improve room recovery, abuse prevention, reporting/blocking, privacy disclosures, and accessibility in code and project documentation.
- [ ] Prepare store listing drafts, privacy/terms drafts, icon assets, and Capacitor project changes.
- [ ] Help diagnose failures from build logs, store review feedback, or a user-provided test report.

## You need to do or provide

- [ ] Confirm which Supabase project is the real one and whether it already contains deployed room procedures or policies not checked into this repository.
- [ ] Create/manage hosting, Supabase, Apple Developer, and Google Play accounts; keep account passwords and private keys out of chat and the repository.
- [ ] Rotate any provider credential that has ever been committed or shared, then store the replacement only in the provider's secret manager. Do not reuse a leaked credential.
- [ ] Add the public Supabase project URL and anon client key to the correct web configuration. These client values are visible to users; protect data with server rules.
- [ ] Supply and approve real business identity, support contact, privacy/retention decisions, legal text, age rating, and monetization choices.
- [ ] Test installation, offline behavior, invites, and complete games on real iPhone and Android devices and different network conditions.
- [ ] For native builds, provide access to a Mac with Xcode for iOS and a computer with Android Studio for Android. Sign, upload, complete store forms, and respond to review through your own developer accounts.
- [ ] Review and approve public changes before release, especially database policies, account/payment behavior, and legal claims.

## Stop before public multiplayer

- [ ] Add SQL definitions for clicque_room_join, clicque_room_heartbeat, clicque_room_leave, and clicque_room_start. The client invokes these names, but maintained supabase/ source does not define them.
- [ ] Replace broad docs row-level security policies. The current select policy exposes every document to every signed-in user, and the insert policy allows broad room-path writes. Enforce membership, private-room checks, host permissions, and safe field validation on the server.
- [ ] Verify private room codes and contents cannot be read by non-members, room state cannot be forged by participants, and rate limits prevent spam and cost abuse.
- [ ] Check any existing Supabase deployment before changing its schema. Keep a backup and apply reviewed migrations in a staging project first.
- [ ] Decide what happens when a host disconnects. The current game host runs the game; closing the host app ends the session.
- [ ] Add usable player reporting, blocking, moderation response, and retention/deletion behavior before inviting the public.

## Release sequence

1. Secure and complete the backend in a staging Supabase project.
2. Run a private pilot with invited groups; record failures, room completion, return play, reports, and AI/backend cost per game.
3. Publish the PWA from GitHub Pages or another host; confirm the live URL, install steps, and service-worker updates.
4. Add one optional, fair revenue experiment only after players return. Keep the core game playable for free and account for payment fees, taxes, refunds, AI costs, and support.
5. Package the proven experience with Capacitor, test on physical devices, prepare store materials and billing, then submit from your own Apple and Google developer accounts.

## Completion evidence to collect

- Live PWA URL and successful install screenshots from iOS and Android.
- Supabase migration/version record and confirmation that room procedures and restrictive policies are deployed.
- Results from two-device multiplayer sessions, including disconnect/rejoin and private-room access checks.
- Store build identifiers, signing/upload status, privacy disclosures, support URL, and review outcome for each store.
- A simple dashboard for player return rates, completed games, room failures, reports, AI spend, and revenue after variable costs.
