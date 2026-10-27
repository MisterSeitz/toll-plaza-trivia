# Mzansi Trivia Road Trip (Toll Plaza) — Implementation Roadmap

This roadmap tracks the phased development status of the **Mzansi Trivia Road Trip** digital board game.

---

## Roadmap Overview & Status

```
Phase 1: Foundation & Project Scaffolding        ── [COMPLETED]
    │
    ▼
Phase 2: Board Graph & SVG Map Engine           ── [COMPLETED]
    │
    ▼
Phase 3: Supabase Backend & Database RPCs       ── [COMPLETED]
    │
    ▼
Phase 4: Realtime Multiplayer Synchronization   ── [COMPLETED]
    │
    ▼
Phase 5: Gameplay Modals & Interactive Loops    ── [COMPLETED]
    │
    ▼
Phase 6: Web Audio Engine & Sensory Feedback    ── [COMPLETED]
    │
    ▼
Phase 7: AI Integrations (Gemini & Fal.ai)      ── [COMPLETED]
    │
    ▼
Phase 8: Polish, Stress Testing & Build Check   ── [COMPLETED]
```

---

## Phase 1: Foundation & Project Scaffolding

- [x] **1.1 Web Application Setup**
  - Scaffolded Vite 8 + React 19 with TypeScript in the root workspace.
  - Configured Tailwind CSS 3.4 with custom Mzansi color tokens:
    - `mzansi-sand`: Warm Karoo earth palette (`#1c1917`, `#292524`, `#44403c`).
    - `mzansi-gold`: Acacia gold & yellow lingo accent (`#f59e0b`, `#facc15`).
    - `mzansi-ocean`: Coastal KZN & Cape Town deep cyan/blue (`#0f766e`, `#1d4ed8`).
    - `mzansi-flag`: National flag tones for celebratory highlights (`#047857`, `#fb923c`, `#be123c`).
  - Configured Google Fonts (`Outfit` + `JetBrains Mono`).

- [x] **1.2 Directory & Module Structure**
  ```
  src/
  ├── components/
  │   ├── board/           # BoardMapRenderer.tsx
  │   ├── dashboard/       # PlayerDashboardTray.tsx
  │   ├── modals/          # TriviaChallengeModal, TollPlazaSprint, SpazaShopModal, EventCardDrawerModal
  │   ├── ui/              # AudioSettingsTray.tsx
  │   ├── lobby/           # Lobby.tsx (MainMenu, WaitingRoom)
  │   └── GameScreen.tsx   # Master game arena
  ├── engine/
  │   ├── boardGraph.ts    # Graph vertices, edges, highway labels, node coordinates
  │   ├── movementEngine.ts# BFS pathfinding, chokepoints, stepwise animator
  │   └── gameRules.ts     # Rules, win conditions, inventory, auto-move
  ├── hooks/
  │   ├── useGame.ts       # Core game controller hook
  │   └── useOnlineRoom.ts # Supabase Realtime channel broadcast & presence hook
  ├── services/
  │   ├── supabaseClient.ts# Sanitized client from env
  │   ├── geminiTrivia.ts  # Gemini API dynamic question & banter generator
  │   └── falPostcards.ts  # Fal.ai visual generation for event cards
  ├── types/
  │   └── game.ts          # Complete domain & realtime contracts
  ├── data/
  │   ├── questions.ts     # 30 curated static SA trivia questions
  │   ├── tollQuestions.ts # 15 rapid-fire True/False toll sprint prompts
  │   └── gameData.ts      # Categories, souvenirs, Spaza catalog, Lekker/Eish cards
  └── utils/
      └── soundEffects.ts  # Web Audio API procedural synthesizer
  ```

- [x] **1.3 Environment & Secrets Verification**
  - `.gemini/.env.local` contains active credentials for:
    - `SUPABASE_URL`
    - `SUPABASE_PUBLISHABLE_KEY`
    - `SUPABASE_SECRET_KEY`
    - `GEMINI_API_KEY`
    - `FAL_API_KEY`
  - Vite dev server config securely proxies `/api/gemini` and `/api/fal` with server-side keys without exposing private keys to browser client bundles.

---

## Phase 2: Board Graph & SVG Map Engine

- [x] **2.1 Highway Topology Definition (`boardGraph.ts`)**
  - Defined nodes across SA provinces (Gauteng, Mpumalanga, Free State, KwaZulu-Natal, Eastern Cape, Northern Cape, Western Cape).
  - Encoded edge attributes: road surface (`tar`, `gravel`, `shortcut`), highway labels (`N1`, `N2`, `N3`, `N4`, `R56`), and movement costs.

- [x] **2.2 Pathfinding & Movement Engine (`movementEngine.ts`)**
  - Implemented `getReachablePaths`:
    - Handles branching routes (e.g., Tar N3 vs. Gravel R56 Karoo dirt detour).
    - Halts player movement at chokepoints (`isChokepoint: true`) like Toll Plazas.
    - Prevents illegal 180-degree immediate backtracking.
  - Implemented `executeStepwiseMovement` with cancellation support for step-by-step vehicle token animations.

- [x] **2.3 Responsive SVG Board Map Renderer (`BoardMapRenderer.tsx`)**
  - Crisp 800x620 SVG viewport with `preserveAspectRatio="xMidYMid meet"`.
  - Dual-layer highway tracks (casing + surface with dashed patterns for gravel).
  - Category nodes with glow filters, category icons, and pulsing green indicator rings for reachable landing spots.
  - Animated player vehicle tokens (`🚕`, `🛻`, `🚗`) with glowing color tags and names.

---

## Phase 3: Supabase Backend & Database RPCs

- [x] **3.1 Postgres Schema & Enums**
  - Authored `supabase/migrations/0001_game_schema.sql`:
    - `game_status_enum`, `vehicle_type_enum`, `trivia_category_enum`.
    - `game_rooms` (match configuration, host, active player, turn pause lock).
    - `game_players` (coordinates, wallet points, souvenirs array, JSONB inventory, connection status, heartbeat).
    - `question_history` (anti-cheat verification log).
    - `UUID-OSSP` extension.

- [x] **3.2 Row Level Security (RLS) & Replication**
  - Created `is_player_in_room(p_room_id)` helper function.
  - Applied hardened RLS policies on `game_rooms`, `game_players`, and `question_history` with explicit `search_path = public`.
  - Added tables to `supabase_realtime` publication for real-time Postgres CDC.

- [x] **3.3 Atomic Stored Procedures (RPCs)**
  - `commit_player_turn`: Validates active player, updates coordinates, awards points/souvenirs, and cycles to next player.
  - `clear_toll_and_advance`: Atomically validates toll clearance (points payment, rapid-fire sprint pass, or taxi pass consumption).
  - `migrate_room_host`: Promotes lowest `turn_order` connected player when host leaves.
  - `force_skip_disconnected_turn`: Advances turn when a player drops during their active round.

---

## Phase 4: Realtime Multiplayer Synchronization

- [x] **4.1 Realtime Channel Management (`useOnlineRoom.ts`)**
  - Initialized scoped channel: `game_room:${roomCode}` with `broadcast` and `presence`.
  - Broadcasts authoritative game state snapshots with monotonically increasing revision numbers (`rev`).
  - Seamless state synchronization across peers without write latency bottlenecks.

- [x] **4.2 Presence, Grace Periods & Disconnect Resilience**
  - Disconnect detection with 45-second grace countdown timer (`GRACE_PERIOD_MS`).
  - Automatic turn skipping if an active player disconnects permanently.
  - Mid-game rejoin capability: rehydrates state via `state:request` broadcast on page reload.

---

## Phase 5: Gameplay Modals & Interactive Loops

- [x] **5.1 Persistent Player Dashboard Tray (`PlayerDashboardTray.tsx`)**
  - Fixed sticky bottom HUD bar with Karoo amber border.
  - Player avatar, vehicle badge, Padstal Points counter, and active status indicators.
  - Souvenir showcase (6 circular emblem slots displaying collected cultural badges).
  - Roadside Kit inventory chips with item counts.
  - Large Roll Dice / Waiting action button with pulse animation.

- [x] **5.2 Trivia Challenge Modal (`TriviaChallengeModal.tsx`)**
  - Retro travel-card modal overlay with translucent backdrop blur.
  - Deadline-based countdown progress bar (green -> amber -> flashing red) with ticking sound.
  - 4-choice interactive button grid with sound feedback and outcome explanations.
  - Power-up integrations:
    - `50/50 Pass`: Eliminates 2 wrong options.
    - `+10s Boost`: Adds 10 seconds to clock.
  - Spectator mode: Non-active players see prompt and timer while choices remain blurred until locked in.
  - Load Shedding mode: Options blurred for extra challenge.

- [x] **5.3 Toll Plaza Sprint Mini-Game (`TollPlazaSprint.tsx`)**
  - Chokepoint modal with striped hazard boom gate animation.
  - 10-second rapid-fire True/False blitz sprint with 3-streak target.
  - Alternative clearance options: Pay 100 Padstal Points or consume a Taxi Fare Hooter pass.
  - Animated boom gate lift on success and siren trip on failure.

- [x] **5.4 Corner Spaza Shop Modal (`SpazaShopModal.tsx`)**
  - Roadside marketplace modal with tab filters (`All`, `Boost`, `Utility`, `Defense`).
  - Item catalog cards showing point price, inventory capacity, and functional descriptions.
  - Instant wallet deduction and inventory synchronization.

- [x] **5.5 Lekker & Eish! Postcard Drawer Modal (`EventCardDrawerModal.tsx`)**
  - 3D perspective flip-card animation revealing fate postcard.
  - Lekker cards: Celebratory emerald & gold styling with speed/point benefits.
  - Eish! cards: Hazard diagonal stripe styling with breakdown/point penalties.
  - Supports automatic token movements and consequences.

---

## Phase 6: Web Audio Engine & Sensory Feedback

- [x] **6.1 Procedural Sound Synthesizer (`soundEffects.ts`)**
  - Zero external MP3 asset dependencies — pure Web Audio API synthesis:
    - Clock tick (dual-pitch cadence).
    - Toll siren (two-tone sawtooth warning whoop).
    - Success chime (ascending C-Major arpeggio).
    - Streak confirmation beep (crisp D6 sine wave).
    - Dice rattle (modulated white noise transients).
    - Tire blowout screech (bandpass-filtered friction noise).
    - Padstal shop bell (brass harmonic ping).
    - Fanfare, coins, card flips, and movement clicks.

- [x] **6.2 Audio & Feedback Settings Tray (`AudioSettingsTray.tsx`)**
  - Global mute toggle switch.
  - Master volume slider.
  - SFX volume slider.
  - Mobile haptic vibration feedback toggle (`navigator.vibrate`).
  - "Test Chime" preview trigger.
  - Persisted in `localStorage`.

---

## Phase 7: AI Integrations (Gemini & Fal.ai)

- [x] **7.1 Gemini Dynamic Trivia Engine (`geminiTrivia.ts`)**
  - Seed question bank of 30 curated static questions across all 6 categories.
  - Integrated Gemini API (`gemini-2.5-flash`):
    - Dynamically generates fresh multiple-choice questions for any category.
    - Generates one-line South African slang commentary banter (*"Sharp, sharp!"*, *"Hawu, missed that one!"*).
    - Toggleable in settings tray.

- [x] **7.2 Fal.ai Postcard & Visual Generation (`falPostcards.ts`)**
  - Integrated Fal.ai (`fal-ai/flux/schnell`):
    - Dynamically generates vintage South African illustrated travel postcards on event cards.
    - Toggleable in settings tray.

---

## Phase 8: Polish, Stress Testing & Build Check

- [x] **8.1 Multi-Mode Playability**
  - **Same Screen (Pass & Play):** 2 to 6 local players on one device.
  - **Online Room:** Realtime room code lobby (`MZANSI-XX`) with auto-reconnect and host arbitration.
- [x] **8.2 Accessibility & Mobile Optimization**
  - Touch-friendly tap targets across mobile devices.
  - Responsive SVG map auto-fitting desktop and mobile screens.
  - High-contrast color tokens and dark mode styling.
- [x] **8.3 Quality Assurance & Production Verification**
  - Static type checking: `tsc -b` passes with **0 errors**.
  - Oxlint: `oxlint` passes with **0 errors and 0 warnings**.
  - Production build: `vite build` bundles `dist/` cleanly.
  - Secrets safety: `.env.local` and `.gemini/.env.local` secured via `.gitignore` and proxy architecture.

---

## Phase 9: Post-Launch Expansion & Mzansi Immersion

```
Phase 9.1: Solo Game Mode & AI Bot Drivers          ── [COMPLETED]
    │
    ▼
Phase 9.2: Distinctive Mzansi Gameplay Mechanics     ── [PLANNED]
    │
    ▼
Phase 9.3: Authentic Mzansi Audio & Atmosphere       ── [PLANNED]
    │
    ▼
Phase 9.4: Multiplayer Social & Quality of Life (QoL)── [PLANNED]
    │
    ▼
Phase 9.5: Board Map Spacing, Zooms & Landmarks   ── [COMPLETED]
```

### 9.1 Solo Game Mode with AI Bot Drivers (Instant Single-Player Playability)
- [x] **AI Persona Engine & Archetypes (`aiDriverEngine.ts`)**
  - **Bra Dan (Quantum Taxi)**: High-speed, shortcut gambler, aggressive at toll gates, quick trivia answers with streetwise confidence.
  - **Oom Piet (Hilux Cruiser)**: Methodical and cautious, sticks to tar highways, avoids potholes, stockpiles spare tyres and biltong at spaza shops, high accuracy in History, Braai Chow, and Scenic Route.
  - **Sipho (Citi Golf Speedster)**: Trivia savant (high accuracy in Beats & Screen, Slang, Diski Bokke), lightning-fast reflex times.
- [x] **AI Autonomous Turn Controller (`useGame.ts`)**
  - Automated state transitions with human-like paced delays (900ms–1500ms):
    - `roll`: Automatic roll trigger with dice rattle audio.
    - `choose`: Heuristic path evaluation prioritizing missing provincial souvenirs, avoiding potholes without spare tyres, and favoring persona-aligned road surfaces.
    - `trivia`: Timed answer simulations based on category affinity and persona accuracy profiles.
    - `toll`: Intelligent decision matrix (spend points, consume taxi pass, or attempt blitz sprint).
    - `spaza`: Persona-tailored purchasing logic.
    - `event`: Smooth card flip and resolution.
- [x] **Lobby Solo Mode Integration (`Lobby.tsx`)**
  - Dedicated **"🤖 Solo vs AI"** game setup mode in the main menu.
  - Instant 1-click quick-start against 1 to 3 AI bot drivers with customizable persona toggles.
  - Option to toggle any player slot between Human and AI in local pass-and-play.

### 9.2 Distinctive Mzansi Gameplay Mechanics
- [x] **Braai Stand Head-to-Head Wager / Duel (PvP) (`BraaiWagerModal.tsx`)**
  - Land on `braai_chow` spaces to trigger a Braai Stand modal with options for Solo trivia (+100 pts) or High-Stakes Braaimaster Wager (25, 50, or 100 pts) against another player or AI bot.
  - Timed 10-second buzzer with head-to-head showdown scoring and procedural sizzling coals audio.
  - Full AI challenger simulation taking into account persona trivia skill and reaction times.
- [x] **Minibus Taxi Rank "Hitch a Ride" (Warp Route) (`TaxiRankWarpModal.tsx`)**
  - Major transit hubs (Bree Taxi Rank JHB, Warwick Junction Durban, Cape Town Station) offer cross-country express routes.
  - Pay points (R50–R100) or redeem a Taxi Pass to warp directly across provincial hubs.
  - 25% risk of roadblock or puncture with audio cues and 1-turn delay.
- [x] **Traffic Circle / Roundabout Lock Mechanic (`RoundaboutLockModal.tsx`)**
  - Karoo Circle node (`node_n1_colesberg`) with `isRoundabout: true` locking vehicles until cleared.
  - 3 escape options: Roll an Even number on the die, Answer a South African highway trivia challenge, or Pay a petrol attendant for directions.
  - Failure incurs another lap around the circle (skip next turn).
- [x] **Full-Screen Load Shedding Stage Blackout Event (`LoadSheddingModal.tsx`)**
  - Dramatic Eskom blackout with pitch-black screen overlay, siren warning, and power transformer sound.
  - 5-second emergency diesel generator pull-cord mini-game (3 quick pulls required to start).
  - Generator success provides 15s bright lights; failure forces candlelight trivia with reduced 7s timer and halved points.

### 9.3 Authentic Mzansi Audio & Atmosphere
- [x] **Vuvuzela Stadium Blast (`🎺`) (`soundManager.playVuvuzela`)**
  - Procedural Web Audio brass synthesis on Bb3 (233.08 Hz) with 2nd/3rd harmonics, 5.5 Hz breath-flutter vibrato, and bandpass plastic horn cone resonance.
  - Plays on collecting souvenirs and celebratory multi-horn stadium fanfare with crowd roar when winning the match.
  - Interactive "🎺 Blow Vuvuzela!" victory button and soundboard tester.
- [x] **Minibus Taxi Two-Tone Hooter ("Ga-te-way! / Bree!") (`soundManager.playTaxiHooter`, `playOvertake`)**
  - Iconic dual-pulse electric hooter on F5 (698.46 Hz) and A5 (880 Hz).
  - Triggers on taxi rank / transit hub arrivals, taxi boarding warp, and playful Doppler overtake honks when passing other players on the highway.
- [x] **Campfire Braai Crackle & Kettle Whistle (`soundManager.playBraaiCrackle`, `playKettleWhistle`)**
  - Warm Karoo camelthorn coals audio with sub-bass resonance, sizzling white/pink noise, and randomized sharp ember pop impulses on braai spaces.
  - Whistling enamel padstal kettle with dual harmonic sweep (2180 Hz to 2680 Hz), 6.5 Hz thermal flutter, and steam hiss on padstal visits.
- [x] **Karoo Night & Roadside Ambience Engine (`soundManager.startKarooAmbience`)**
  - Procedural looping soundscape: gentle open-road wind breeze and periodic night cricket chirps.
  - Toggleable in Settings (`AudioSettingsTray.tsx`) with an interactive 🇿🇦 Mzansi Soundboard tester.

### 9.4 Multiplayer Social & Quality of Life (QoL)
- [x] **WhatsApp & Direct URL Invite Deep-Links**: Support `?room=MZANSI-XX` query parameters to auto-fill room codes and jump directly into the lobby for 1-tap WhatsApp invites.
- [x] **Online Player Lobbies & Matchmaking ("Challenge Random Driver Online")**:
  - Live public lobby presence tracking using Supabase Realtime channel (`mzansi:public_lobbies`).
  - 1-click `⚡ Challenge Random Online Driver` matchmaking that instantly matches into an open road trip or sets up a public host room.
  - Interactive table of open road trips with host avatar, name, player count (`1/6`), ping, and 1-tap "Join Trip".
  - Host toggle for "Public Road Trip (Open to challengers online)" vs Private room.
- [x] **In-Game Floating Emote Reaction Wheel**: Realtime floating emoji banter (🇿🇦, 🎺, 🥩, 🚕, 🕳️, 🕯️, 🤣, 😱) rendered over vehicles on the board canvas, paired with procedural audio hooters and autonomous AI bot banter reactions.
- [x] **Post-Match Awards & Analytics Podium**: End-of-trip celebration modal (`PostMatchPodiumModal.tsx`) with 1st/2nd/3rd pedestals, celebratory Vuvuzela blast, WhatsApp scorecard sharing, and honorary badges:
  - 🕳️ *Pothole Magnet* (Most potholes hit)
  - ⚡ *Toll Sprint Demon* (Fastest toll clearance)
  - 🛒 *Spaza VIP* (Most rands spent)
  - 🧠 *Mzansi Professor* (Highest trivia accuracy)

### 9.5 Board Map Visual Spacing, Zoom Controls & Landmarks
- [x] **Spacious 1260x900 Coordinate Geometry (`boardGraph.ts`)**
  - Expanded map coordinate space from 800x620 to 1260x900 (over 2.5x more area).
  - Increased minimum node distance to 80–170px, eliminating label, road, and vehicle collisions.
  - Realistic geographical alignment connecting Limpopo, Gauteng, Mpumalanga, Free State, KZN, Eastern Cape, Karoo, and Western Cape.
- [x] **Multi-Level Zoom & Pan Engine (`BoardMapRenderer.tsx`)**
  - Interactive on-screen toolbar: `+` (Zoom In), `−` (Zoom Out), `1x` (Full Mzansi), `1.5x` (Regional), `2x` (Detail).
  - Mouse drag-to-pan, touch drag, and pinch-to-zoom support.
  - Smooth mouse wheel zoom support.
  - `📍 Focus` button to center camera on active player vehicle.
  - `⛶ Fit` button to reset camera to 1x view.
- [x] **High-Contrast Node Milestones & Souvenir Indicators**
  - Translucent high-contrast name pill badges (`#09090b` border `#3f3f46`) with crisp typography.
  - Category and point reward sub-badges (`+25 PTS & CARD`, `TOLL R100`, `SPAZA SHOP`, `SOUVENIRS`).
  - Animated pulsing green destination indicators (`TAP TO DRIVE`) with rotation rings for reachable nodes.
- [x] **Stylized SVG Landmarks & Regional Watermarks**
  - Table Mountain & Cableway (Cape Town)
  - Moses Mabhida Stadium Arch (Durban)
  - Soweto Cooling Towers (Johannesburg)
  - Drakensberg Peaks (Van Reenen’s Pass)
  - Kruger Elephant & Lowveld (Nelspruit / N4)
  - Province background labels: Limpopo, Gauteng, Mpumalanga, Free State, KwaZulu-Natal, Great Karoo, Eastern Cape, Western Cape.


