# Mzansi Trivia Road Trip (Toll Plaza) — Project Documentation

> An interactive, multiplayer South African trivia board game built with Next.js / React, Tailwind CSS, Web Audio API, and Supabase Realtime. Players navigate iconic national highways (N1, N2, N3, N4, R56), conquer provincial toll chokepoints, collect regional cultural souvenirs, survive potholes and load shedding, and battle in high-stakes trivia duels.

---

## 1. Project Overview & Core Concept

**Mzansi Trivia Road Trip** (working title: *Toll Plaza*) marries physical board game ergonomics with authentic South African road trip lore, local culture, multilingual banter, and highway navigation.

### High Concept
- **Setting:** A stylized, interactive digital map of South Africa crisscrossed by major national routes (N1, N2, N3, N4, R56).
- **Players:** 2 to 6 players in private room lobbies (e.g., room code `MZANSI-42`).
- **Vehicle Tokens:** Minibus Taxi (`🚕`), Karoo Bakkie (`🛻`), Old-School Citi Golf (`🚗`).
- **Currency:** **Padstal Points** (earned through trivia, banked at farm stalls, spent at Spaza Shops or toll booths).
- **Primary Objective:** Be the first player to collect **6 regional cultural souvenirs** and navigate to the final destination hub (e.g., Table Mountain or Moses Mabhida Stadium).

---

## 2. Gameplay Mechanics & Board Design

### 2.1 The Highway Network Graph
The game board is modeled as a connected graph of nodes (waypoints) connected by edges representing national highways and rural shortcuts:
- **Tar Roads:** Standard national highways (N1, N2, N3, N4) with standard 1-movement-point cost.
- **Gravel / Dirt Shortcuts (e.g., R56):** Shorter routes between regional hubs, but high probability of drawing **Eish!** cards or hitting **Potholes**.
- **Chokepoints:** Fixed barrier nodes (Toll Plazas and treacherous mountain passes like *Van Reenen's Pass*) that stop vehicles regardless of remaining dice steps until cleared.

### 2.2 Tile & Space Categories
| Tile Category | Icon | Description & Rules |
|---|:---:|---|
| **Hub / Major City** | `★` / `🏙️` | Starting points and major destinations (Johannesburg, Durban, Cape Town, Bloemfontein, Polokwane, Nelspruit). Safe refuge. |
| **Trivia Category Tiles** | `🎵`/`🏉`/`🥩`/`🏛️`/`🗣️`/`🗺️` | Standard tiles mapped to one of the 6 color-coded trivia decks. Landing triggers a 15s timed question. |
| **Toll Plaza Gate** | `🛑` | Chokepoints between provinces. Player must either: (1) Pay 100 Padstal Points, (2) Pass the 10-second True/False Sprint mini-game (3 streak), or (3) Use a Taxi Fare Hooter pass from inventory. |
| **Padstal (Farm Stall)** | `☕` | Safe landing zones (e.g., Peregrine, Ronnie’s Sex Shop, Harrismith). Players bank points against theft, swap duplicate souvenirs, or draw a **Lekker** card. |
| **Corner Spaza Shop** | `🛒` | Marketplace tile to purchase consumable roadside survival perks using Padstal Points. |
| **Pothole Crater** | `⚠️` | Blowout or rim damage! Player loses next turn or must use a *Spare Tyre* from inventory. |
| **Load Shedding Tile** | `⚡` | Sudden stage 6 outage! Multiple-choice options are blurred; players must answer solely from memory/prompt. |

### 2.3 The Six Trivia Decks
1. **Mzansi Beats & Screen (Blue - `#1d4ed8`):** Kwaito, Amapiano, bubblegum pop, soapies (*Generations*, *Isidingo*, *Uzalo*), SA cinema (*Tsotsi*), and iconic TV commercials.
2. **Diski, Bokke & Oval (Green - `#047857`):** 1995/2007/2019/2023 Rugby World Cups, Bafana Bafana 1996 AFCON, PSL history, Comrades Marathon, Olympic track legends, and Proteas cricket lore.
3. **Braai & Chow (Orange - `#c2410c`):** Biltong, droëwors, Durban bunny chow, Cape Malay bobotie, chakalaka, skilpadjies, shisanyama culture, milk tart, and street food.
4. **History & Icons (Purple - `#6b21a8`):** Liberation heroes, pre-colonial civilizations (Mapungubwe), Nobel laureates (Mandela, Tutu, Luthuli), scientific innovations (heart transplant), and heritage sites.
5. **Mzansi Slang & Lingo (Yellow - `#a16207`):** Slang idioms, 11 official language terms, urban vernacular (tsotsitaal), township car culture (*Gusheshe*), and everyday South African phrases (*now-now*, *kwaai*, *hawu!*, *robot*).
6. **The Scenic Route (Teal - `#0e7490`):** Biomes (Succulent Karoo, Fynbos), Drakensberg mountain passes (Sani Pass), Kruger National Park, Blyde River Canyon, Addo elephants, and natural phenomena (Table Mountain tablecloth).

### 2.4 Cultural Souvenirs (6 Slots)
Players must gather all 6 unique regional souvenir badges to qualify for the final win:
- 🌸 **King Protea Pin** (National floral emblem)
- 🥩 **Golden Braai Tongs** (Culinary mastery)
- 🚐 **Mini Minibus Taxi** (Urban transport icon)
- 🎺 **Golden Vuvuzela** (Diski & stadium spirit)
- 📿 **Zulu Beaded Flag** (Craft & cultural heritage)
- 🏉 **Springbok Horns** (Sporting glory)

### 2.5 Event Cards: Lekker vs. Eish!
- **Lekker Cards (Positive Momentum):**
  - *Short Left:* Bypass highway gridlock, advance 3 spaces immediately.
  - *Fresh Roosterkoek at the Padstal:* Collect 50 Padstal Points and roll again.
  - *Front Passenger Taxi Math:* Correctly calculated Quantum fare change; skip next toll fee.
  - *Braai Master’s Blessing:* Steal a question token from any opponent within 4 spaces.
  - *Siya’s Team Talk:* Trivia timer doubled to 30s for next 3 questions.
  - *Cooler Box Loaded:* Packed Stoney & ice; immune to next 2 hazard cards.
- **Eish! Cards (Obstacles & Setbacks):**
  - *Van Reenen’s Pass Snowfall:* Jackknifed trucks; lose next turn or answer hard geography prompt.
  - *Monkeys at the Rest Stop:* Baboons raided car boot; lose 1 souvenir token.
  - *Pothole Rim Disaster:* Unmarked crater outside Standerton; immobilised until rolling an even number.
  - *Load Shedding Stage 6:* Traffic lights out; blurred question options for next round.
  - *Forgot ID at Home:* Roadblock stop; move back 4 spaces.
  - *Overheated Radiator on the N1:* Midday Beaufort West heat; miss one turn to cool down.

### 2.6 Spaza Shop Catalog & Roadside Inventory
| Item Name | Price | Category | In-Game Effect | Kit Limit |
|---|:---:|:---:|---|:---:|
| **Chappies Chew** | 50 pts | Boost | "Did You Know?" gum adds +5s to trivia timer | Max 3 |
| **Spare Tyre (Pothole Kit)** | 100 pts | Defense | Instantly nullifies a pothole blowout penalty | Max 2 |
| **Taxi Fare Hooter** | 150 pts | Utility | Blasts through any Toll Plaza without fees or sprint | Max 2 |
| **50/50 Braai Tongs** | 200 pts | Boost | Removes 2 incorrect answers in trivia modal | Max 2 |
| **Stoney Ginger Beer** | 120 pts | Defense | Immunity against next 2 negative Eish! cards | Max 2 |
| **Marina Braai Salt** | 80 pts | Utility | Roll with +1 movement bonus on next turn | Max 4 |

---

## 3. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS / REACT FRONTEND                        │
│  ┌───────────────────────┐  ┌──────────────────────────────────────┐   │
│  │   Interactive SVG     │  │     Player Dashboard Tray (HUD)      │   │
│  │   Highway Board Map   │  │  - Souvenir Slots  - Roadside Kit    │   │
│  │   (Pathfinding)       │  │  - Padstal Points  - Dice Action     │   │
│  └───────────┬───────────┘  └──────────────────┬───────────────────┘   │
│              │                                 │                       │
│  ┌───────────┴───────────┐  ┌──────────────────┴───────────────────┐   │
│  │  Web Audio Engine     │  │        Interactive Modals            │   │
│  │  (Procedural Synth)   │  │  - Trivia Challenge  - Spaza Shop    │   │
│  │  - Clocks, Sirens     │  │  - Toll Plaza Sprint - Event Postcard│   │
│  └───────────────────────┘  └──────────────────────────────────────┘   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ WebSocket / HTTPS
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE BACKEND                              │
│  ┌──────────────────────────────┐  ┌────────────────────────────────┐  │
│  │      Realtime Broadcast      │  │        Realtime Presence       │  │
│  │  - dice:rolled, player:moved │  │  - Online roster, heartbeats   │  │
│  │  - card:drawn, turn:passed   │  │  - 45s Disconnect grace period │  │
│  └──────────────┬───────────────┘  └────────────────┬───────────────┘  │
│                 │                                   │                  │
│  ┌──────────────┴───────────────────────────────────┴───────────────┐  │
│  │                     PostgreSQL Database & RPC                    │  │
│  │  - Tables: game_rooms, game_players, question_history            │  │
│  │  - RLS Security Policies (Player room isolation)                 │  │
│  │  - Stored Procedures: commit_player_turn, clear_toll_and_advance │  │
│  │  - Deterministic Host Migration (Next turn_order)                │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Technology Choices
- **UI Framework:** Next.js (App Router) / React 19 + TypeScript.
- **Styling:** Tailwind CSS with warm South African earth tones (Karoo sand, acacia gold, ocean navy, emerald green, fiery amber).
- **Map Renderer:** Responsive SVG with custom coordinate math, animated dash arrays for gravel, and glow filters.
- **Audio:** Custom Web Audio API synthesizer (`SoundManager`) generating procedural clocks, sirens, chimes, and dice rattles without external MP3 asset dependencies.
- **Multiplayer & State Synchronization:** Supabase Realtime (Broadcast for ephemeral peer moves; Presence for lobby lifecycle; Postgres RPC for authoritative checkpoints).
- **AI Integrations (Configured in `.env.local`):**
  - **Google Gemini API (`GEMINI_API_KEY`):** Dynamic question generation, dialect/slang variations, local banter commentaries, and adaptive difficulty.
  - **Fal.ai (`FAL_API_KEY`):** Procedural generation of personalized vehicle avatars, souvenir badges, and postcard visuals.

---

## 4. Database Schema & Stored Procedures

### 4.1 Enums & Tables
```sql
CREATE TYPE game_status_enum AS ENUM ('lobby', 'in_progress', 'completed', 'abandoned');
CREATE TYPE vehicle_type_enum AS ENUM ('taxi', 'bakkie', 'citi_golf');
CREATE TYPE trivia_category_enum AS ENUM (
  'beats_screen', 'diski_bokke', 'braai_chow', 
  'history_icons', 'slang_lingo', 'scenic_route'
);

-- game_rooms: Lobby configuration & authoritative match state
CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status game_status_enum NOT NULL DEFAULT 'lobby',
  active_player_id UUID NULL,
  current_round INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL DEFAULT 6 CHECK (max_players >= 2 AND max_players <= 8),
  winner_id UUID NULL,
  is_turn_paused BOOLEAN NOT NULL DEFAULT false,
  pause_reason TEXT NULL,
  settings JSONB NOT NULL DEFAULT '{"turn_timeout_seconds": 30, "target_souvenirs": 6}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- game_players: Per-player state, inventory, coordinates, points
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(32) NOT NULL,
  vehicle vehicle_type_enum NOT NULL DEFAULT 'taxi',
  turn_order INT NOT NULL DEFAULT 0,
  current_node_id VARCHAR(64) NOT NULL DEFAULT 'node_jhb_central',
  points INT NOT NULL DEFAULT 200 CHECK (points >= 0),
  souvenirs TEXT[] NOT NULL DEFAULT '{}',
  inventory JSONB NOT NULL DEFAULT '{"chappies_timer": 1, "spare_tyre": 0, "taxi_pass": 0, "braai_tongs_lifeline": 0}'::jsonb,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected', 'abandoned')),
  disconnected_at TIMESTAMPTZ NULL,
  reconnect_grace_until TIMESTAMPTZ NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (room_id, user_id),
  UNIQUE (room_id, turn_order)
);

-- question_history: Anti-cheat log of all answered trivia questions
CREATE TABLE public.question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  category trivia_category_enum NOT NULL,
  was_correct BOOLEAN NOT NULL,
  time_taken_seconds NUMERIC(4, 1) NOT NULL CHECK (time_taken_seconds >= 0),
  points_awarded INT NOT NULL DEFAULT 0,
  power_ups_used TEXT[] NOT NULL DEFAULT '{}',
  selected_option VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
```

### 4.2 Authoritative RPC Functions
1. **`commit_player_turn(p_room_id, p_player_id, p_target_node_id, p_points_delta, p_souvenir_id)`**:
   - Locks room row `FOR UPDATE`, verifies player turn.
   - Updates player position, applies point diffs, records souvenirs.
   - Rotates `active_player_id` to next connected player based on `turn_order`.
2. **`clear_toll_and_advance(p_room_id, p_player_id, p_toll_node_id, p_target_node_id, p_clearance_method, p_toll_cost)`**:
   - Validates that player is currently halted at the toll barrier.
   - Deducts points or consumes Taxi Pass item if paid/used.
   - Advances vehicle past the gate and broadcasts `toll:cleared` event.
3. **`migrate_room_host(p_room_id, p_departed_host_id)`**:
   - When host disconnects permanently, deterministically promotes the connected player with lowest `turn_order`.
   - If no players remain, marks room `abandoned`.

---

## 5. Realtime Communication Protocol

### 5.1 Supabase Realtime Channels
Channel format: `game_room:${room_code}`
- **Presence:** Tracks active connections, user metadata, and disconnect timers.
- **Broadcast Events:**
  - `dice:rolled`: `{ playerId, value, timestamp }`
  - `player:moved`: `{ playerId, path: string[], targetNodeId }`
  - `card:drawn`: `{ playerId, cardId, type: 'lekker' | 'eish', title, effectDescription }`
  - `trivia:started`: `{ playerId, questionId, category, timeoutAt }`
  - `toll:cleared`: `{ playerId, tollNodeId, targetNodeId, clearanceMethod }`
  - `turn:passed`: `{ nextPlayerId, round }`
  - `host:migrated`: `{ newHostId, newHostName }`

### 5.2 Disconnection & Grace Period Lifecycle
1. **Presence Leave Detected:** When a client drops WebSocket connection, a 45-second grace window begins.
2. **Turn Pausing:** If the missing player is active, the turn timer pauses with a visual flashing warning.
3. **Reconnection:** If player returns within 45s, state is rehydrated from Postgres without lost progress.
4. **Auto-Pass / Forfeit:** If 45s timer lapses, server/host triggers `force_skip_disconnected_turn`. After 2 full missing rounds, player enters ghost mode.

---

## 6. Procedural Web Audio Engine

The procedural sound manager (`SoundManager` in `soundEffects.ts`) utilizes pure Web Audio API synthesis:
- **Clock Tick:** Low-to-high alternating woodblock cadence (880Hz / 700Hz with exponential decays).
- **Toll Warning Siren:** Rapid two-tone whoop (620Hz to 940Hz sawtooth wave) for barrier alarms or wrong answers.
- **Success Chime:** Ascending C-Major arpeggio (C5, E5, G5, C6) triangle wave for boom gate openings or souvenir rewards.
- **Streak Beep:** Crisp high D6 (1174Hz) sine pulse for true/false streak confirmations.
- **Dice Rattle:** Modulated white noise bursts with randomized frequency transients mimicking dice shaken in a cup.
- **Tire Screech:** Bandpass-filtered high-friction noise burst for pothole strikes.
- **Padstal Bell:** 1800Hz dual harmonic ping simulating an old brass shop bell.

---

## 7. Environment Configuration Reference

The following credentials are configured in `.gemini/.env.local`:
```bash
# Supabase Backend & Realtime
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_anon_key
SUPABASE_SECRET_KEY=your_supabase_secret_service_role_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
FAL_API_KEY=your_fal_api_key
```
*(Keep secret keys strictly on backend serverless routes / RPC contexts).*
