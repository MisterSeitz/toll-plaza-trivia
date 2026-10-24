# Mzansi Trivia Road Trip (Toll Plaza) 🇿🇦

> An interactive, multiplayer South African trivia board game built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, pure **Web Audio API**, and **Supabase Realtime**.

Navigate iconic national highways (N1, N2, N3, N4, R56), conquer provincial toll chokepoints, collect regional cultural souvenirs, survive potholes and load shedding, and battle in high-stakes trivia duels!

---

## 🚗 Core Concept & Gameplay

**Mzansi Trivia Road Trip** (working title: *Toll Plaza*) marries physical board game ergonomics with authentic South African road trip lore, local culture, multilingual banter, and highway navigation.

- **Vehicle Tokens:** Minibus Taxi (`🚕`), Karoo Bakkie (`🛻`), and Old-School Citi Golf (`🚗`).
- **Currency:** **Padstal Points** (earned via trivia, banked at farm stalls, spent at Spaza Shops or toll booths).
- **Primary Objective:** Be the first player to collect all **6 regional cultural souvenirs** and navigate to the final destination hub.
- **Game Modes:**
  - **Pass-and-Play (Local):** 2–6 players sharing a single screen.
  - **Online Multiplayer:** Private room lobbies with room codes (powered by Supabase Realtime & Presence).

---

## 🎲 Board Features & Mechanics

### 1. The Highway Network Graph
- **Tar Roads:** Standard national routes (N1, N2, N3, N4) with standard 1-movement-point cost.
- **Gravel / Dirt Shortcuts (e.g., R56):** Shorter routes between hubs, but carrying a higher risk of **Eish!** cards or tyre-busting **Potholes**.
- **Chokepoints:** Fixed barrier nodes (Toll Plazas and treacherous mountain passes like *Van Reenen's Pass*) that stop vehicles until cleared.

### 2. Tile Categories
| Tile Category | Icon | Description & Rules |
|---|:---:|---|
| **Hub / Major City** | `★` / `🏙️` | Starting points and major destinations (Johannesburg, Durban, Cape Town, Bloemfontein, Polokwane, Nelspruit). Safe refuge. |
| **Trivia Category Tiles** | `🎵`/`🏉`/`🥩`/`🏛️`/`🗣️`/`🗺️` | Standard tiles mapped to one of the 6 color-coded trivia decks with timed questions. |
| **Toll Plaza Gate** | `🛑` | Chokepoints between provinces. Pay 100 Padstal Points, pass a 10s True/False sprint streak, or use a Taxi Fare Hooter. |
| **Padstal (Farm Stall)** | `☕` | Safe landing zones (e.g., Peregrine, Ronnie’s Sex Shop, Harrismith) to bank points or draw a **Lekker** card. |
| **Corner Spaza Shop** | `🛒` | Marketplace tile to purchase roadside survival perks using Padstal Points. |
| **Pothole Crater** | `⚠️` | Blowout or rim damage! Player loses next turn unless using a *Spare Tyre*. |
| **Load Shedding Tile** | `⚡` | Sudden stage 6 outage! Multiple-choice options are blurred; players must answer solely from memory. |

### 3. The Six Trivia Categories
1. **Mzansi Beats & Screen (Blue):** Kwaito, Amapiano, bubblegum pop, soapies (*Generations*, *Isidingo*, *Uzalo*), SA cinema (*Tsotsi*), and iconic TV commercials.
2. **Diski, Bokke & Oval (Green):** Rugby World Cup victories, Bafana Bafana 1996 AFCON, PSL history, Comrades Marathon, Olympic track legends, and Proteas cricket lore.
3. **Braai & Chow (Orange):** Biltong, droëwors, Durban bunny chow, Cape Malay bobotie, chakalaka, skilpadjies, shisanyama culture, milk tart, and street food.
4. **History & Icons (Purple):** Liberation heroes, pre-colonial civilizations (Mapungubwe), Nobel laureates, scientific innovations, and heritage sites.
5. **Mzansi Slang & Lingo (Yellow):** Slang idioms, 11 official language terms, urban tsotsitaal, township car culture (*Gusheshe*), and everyday South African phrases (*now-now*, *kwaai*, *hawu!*, *robot*).
6. **The Scenic Route (Teal):** Biomes (Succulent Karoo, Fynbos), Drakensberg mountain passes (Sani Pass), Kruger National Park, Blyde River Canyon, and natural wonders.

### 4. Cultural Souvenirs (6 Slots)
Players must gather all 6 unique regional souvenir badges to qualify for victory:
- 🌸 **King Protea Pin** (National floral emblem)
- 🥩 **Golden Braai Tongs** (Culinary mastery)
- 🚐 **Mini Minibus Taxi** (Urban transport icon)
- 🎺 **Golden Vuvuzela** (Diski & stadium spirit)
- 📿 **Zulu Beaded Flag** (Craft & cultural heritage)
- 🏉 **Springbok Horns** (Sporting glory)

### 5. Event Cards & Roadside Spaza Shop
- **Lekker Cards:** Positive perks like *Short Left* (advance 3 spaces), *Fresh Roosterkoek* (+50 points & roll again), and *Siya’s Team Talk* (double trivia timer).
- **Eish! Cards:** Road hazards such as *Van Reenen’s Snowfall*, *Baboons at Rest Stop*, *Pothole Rim Disaster*, and *Load Shedding Stage 6*.
- **Spaza Shop Items:** *Chappies Chew* (+5s timer), *Spare Tyre* (nullifies pothole blowouts), *Taxi Fare Hooter* (bypass toll fees), *50/50 Braai Tongs* (removes 2 wrong choices), and *Stoney Ginger Beer* (hazard immunity).

---

## 🛠️ Technology Stack

- **Frontend & Framework:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with South African color palettes (Karoo sand, acacia gold, ocean navy, emerald green, fiery amber)
- **Map Visuals:** Custom responsive SVG board pathfinding & node renderer
- **Audio:** Pure [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) synthesizer generating procedural clocks, sirens, chimes, and dice rattles without heavy asset files
- **Multiplayer / Realtime:** [Supabase](https://supabase.com/) Realtime Broadcast & Presence
- **AI Integrations:**
  - **Google Gemini API:** Dynamic question generation, dialect/slang variations, local banter commentaries, and adaptive difficulty.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/MisterSeitz/toll-plaza-trivia.git
cd toll-plaza-trivia

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env.local` file in the root directory (or use `.gemini/.env.local`):
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Google Gemini API for AI Trivia & Banter
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Running Locally
```bash
# Start development server
npm run dev

# Run Oxlint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
toll-plaza/
├── public/              # Static assets and icons
├── src/
│   ├── assets/          # Project assets and graphics
│   ├── components/      # React UI components
│   │   ├── board/       # Board map, SVG waypoints, tokens
│   │   ├── cards/       # Lekker & Eish! card overlays
│   │   ├── hud/         # Player dashboard, inventory tray, dice
│   │   ├── lobby/       # Main menu, matchmaking & waiting room
│   │   ├── modals/      # Trivia challenge, Spaza shop, Toll sprint
│   │   └── ui/          # Audio settings, buttons, badges
│   ├── data/            # Nodes, edges, trivia decks, cards & shop catalog
│   ├── engine/          # Game rules, movement state machine & pathfinding
│   ├── hooks/           # useOnlineRoom, Realtime hooks
│   ├── services/        # Supabase client & Gemini AI trivia service
│   ├── types/           # TypeScript interfaces and game state models
│   ├── utils/           # Procedural Web Audio SoundManager & helpers
│   ├── App.tsx          # Root game coordinator
│   └── main.tsx         # Application entry point
├── supabase/            # Database schemas & RPC migrations
├── .gemini/             # Project guidelines and reference documentation
├── tailwind.config.js   # Custom theme tokens & color palette
├── vite.config.ts       # Vite configuration
└── package.json         # Project metadata and dependencies
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
