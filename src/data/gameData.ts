import type { CategoryKey, EventCardData, SpazaShopItem, Souvenir } from '../types/game'

export const CATEGORY_META: Record<CategoryKey, { name: string; icon: string; badge: string; fill: string; stroke: string }> = {
  beats_screen: { name: 'Mzansi Beats & Screen', icon: '🎵', badge: 'bg-blue-600/20 text-blue-400 border-blue-500/30', fill: '#1d4ed8', stroke: '#60a5fa' },
  diski_bokke: { name: 'Diski, Bokke & Oval', icon: '🏉', badge: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', fill: '#047857', stroke: '#34d399' },
  braai_chow: { name: 'Braai & Chow', icon: '🥩', badge: 'bg-amber-600/20 text-amber-400 border-amber-500/30', fill: '#c2410c', stroke: '#fb923c' },
  history_icons: { name: 'History & Icons', icon: '🏛️', badge: 'bg-purple-600/20 text-purple-400 border-purple-500/30', fill: '#6b21a8', stroke: '#c084fc' },
  slang_lingo: { name: 'Mzansi Slang & Lingo', icon: '🗣️', badge: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30', fill: '#a16207', stroke: '#facc15' },
  scenic_route: { name: 'The Scenic Route', icon: '🗺️', badge: 'bg-teal-600/20 text-teal-400 border-teal-500/30', fill: '#0e7490', stroke: '#38bdf8' },
}

/** Each category awards one souvenir the first time a question is answered correctly. */
export const SOUVENIRS: Souvenir[] = [
  { id: 'beads', name: 'Zulu Beaded Flag', icon: '📿', category: 'beats_screen' },
  { id: 'bokke', name: 'Springbok Horns', icon: '🏉', category: 'diski_bokke' },
  { id: 'braai', name: 'Golden Braai Tongs', icon: '🥩', category: 'braai_chow' },
  { id: 'taxi', name: 'Mini Taxi', icon: '🚐', category: 'history_icons' },
  { id: 'vuvuzela', name: 'Golden Vuvuzela', icon: '🎺', category: 'slang_lingo' },
  { id: 'protea', name: 'King Protea Pin', icon: '🌸', category: 'scenic_route' },
]

export const SHOP_CATALOG: SpazaShopItem[] = [
  { id: 'chappies_timer', name: 'Chappies Chew', category: 'boost', price: 50, icon: '🍬', description: 'Adds +10 seconds to your trivia timer.', maxPerInventory: 3 },
  { id: 'spare_tyre', name: 'Spare Tyre (Pothole Kit)', category: 'defense', price: 100, icon: '🛞', description: 'Nullifies a pothole blowout penalty.', maxPerInventory: 2 },
  { id: 'taxi_pass', name: 'Taxi Fare Hooter', category: 'utility', price: 150, icon: '🚐', description: 'Blasts through a Toll Plaza for free.', maxPerInventory: 2 },
  { id: 'braai_tongs_lifeline', name: '50/50 Braai Tongs', category: 'boost', price: 200, icon: '✂️', description: 'Removes 2 incorrect options on a trivia question.', maxPerInventory: 2 },
  { id: 'stoney_revival', name: 'Stoney Ginger Beer', category: 'defense', price: 120, icon: '🥤', description: 'Immune to the next 2 Eish! cards.', maxPerInventory: 2 },
  { id: 'padstal_braai_salt', name: 'Marina Braai Salt', category: 'utility', price: 80, icon: '🧂', description: '+1 movement on your next roll.', maxPerInventory: 4 },
]

export const SPAZA_CATALOG = SHOP_CATALOG
export const SHOP_BY_ID = Object.fromEntries(SHOP_CATALOG.map((i) => [i.id, i])) as Record<string, SpazaShopItem>

export const LEKKER_CARDS: EventCardData[] = [
  { id: 'lek-01', type: 'lekker', title: 'Short Left', locationTag: 'Township back route', flavorText: 'Your navigator knows a back route that bypasses all the highway gridlock.', effectDescription: 'Advance 3 spaces immediately.', statBadge: '+3 SPACES', icon: '🗺️', effect: { kind: 'advance', steps: 3 } },
  { id: 'lek-02', type: 'lekker', title: 'Fresh Roosterkoek', locationTag: 'Karoo Padstal', flavorText: 'Piping hot roosterkoek and coffee in the Karoo.', effectDescription: 'Collect 50 Padstal Points.', statBadge: '+50 PTS', icon: '🥖', effect: { kind: 'points', amount: 50 } },
  { id: 'lek-03', type: 'lekker', title: 'Taxi Math Genius', locationTag: 'Front passenger seat', flavorText: 'You calculated everyone\'s change in the Quantum with zero mistakes.', effectDescription: 'Your next toll gate is free.', statBadge: 'FREE TOLL', icon: '🚐', effect: { kind: 'free_toll' } },
  { id: 'lek-04', type: 'lekker', title: "Braai Master's Blessing", locationTag: 'Roadside braai', flavorText: 'The coals are white and the chops perfectly charred.', effectDescription: 'Gain 80 Padstal Points.', statBadge: '+80 PTS', icon: '🔥', effect: { kind: 'points', amount: 80 } },
  { id: 'lek-05', type: 'lekker', title: "Siya's Team Talk", locationTag: 'Team bus', flavorText: 'Pure inspiration from the captain.', effectDescription: 'Timers get +15s for your next 3 questions.', statBadge: '+15s x3', icon: '🏆', effect: { kind: 'timer_bonus', questions: 3 } },
  { id: 'lek-06', type: 'lekker', title: 'Cooler Box Loaded', locationTag: 'Boot of the car', flavorText: 'Ice, Stoney and dry lemon. Sorted.', effectDescription: 'Immune to the next 2 Eish! cards.', statBadge: 'SHIELD x2', icon: '🧊', effect: { kind: 'shield', charges: 2 } },
  { id: 'lek-07', type: 'lekker', title: 'Amapiano Groove', locationTag: 'Night drive', flavorText: 'The bassline carries your road trip through the night.', effectDescription: 'Advance 2 spaces and +30 points.', statBadge: '+2 SPACES', icon: '🎶', effect: { kind: 'advance', steps: 2 } },
  { id: 'lek-08', type: 'lekker', title: "Grandma's Secret Chutney", locationTag: 'Home-cooked stop', flavorText: 'A warm home-cooked meal restores the whole crew.', effectDescription: 'Bank 100 Padstal Points.', statBadge: '+100 PTS', icon: '🍲', effect: { kind: 'points', amount: 100 } },
]

export const EISH_CARDS: EventCardData[] = [
  { id: 'eish-01', type: 'eish', title: "Van Reenen's Snowfall", locationTag: 'N3, Drakensberg', flavorText: 'Trucks are jackknifed and the pass is closed.', effectDescription: 'Lose your next turn.', statBadge: 'SKIP TURN', icon: '❄️', effect: { kind: 'skip_turn' } },
  { id: 'eish-02', type: 'eish', title: 'Monkeys at the Rest Stop', locationTag: 'Roadside picnic site', flavorText: 'Baboons raided your boot and ran off with a souvenir.', effectDescription: 'Lose one collected souvenir.', statBadge: '-1 SOUVENIR', icon: '🐒', effect: { kind: 'lose_souvenir' } },
  { id: 'eish-03', type: 'eish', title: 'Pothole Rim Disaster', locationTag: 'Outside Standerton', flavorText: 'An unmarked crater has cracked an alloy.', effectDescription: 'Lose 60 Padstal Points on repairs.', statBadge: '-60 PTS', icon: '🕳️', effect: { kind: 'points', amount: -60 } },
  { id: 'eish-04', type: 'eish', title: 'Load Shedding Stage 6', locationTag: 'Traffic lights down', flavorText: 'The substation tripped and the robots are dead.', effectDescription: 'Next question has hidden options.', statBadge: 'BLURRED', icon: '⚡', effect: { kind: 'blur_next' } },
  { id: 'eish-05', type: 'eish', title: 'Forgot Your ID', locationTag: 'Roadblock', flavorText: 'Stopped at a roadblock without documentation.', effectDescription: 'Move back 3 spaces.', statBadge: '-3 SPACES', icon: '🪪', effect: { kind: 'back', steps: 3 } },
  { id: 'eish-06', type: 'eish', title: 'Overheated Radiator', locationTag: 'N1, Beaufort West', flavorText: 'Midday heat with the AC blasting.', effectDescription: 'Miss one turn while the engine cools.', statBadge: 'SKIP TURN', icon: '🌡️', effect: { kind: 'skip_turn' } },
  { id: 'eish-07', type: 'eish', title: 'Cold Campsite Shower', locationTag: 'Donkey boiler out of wood', flavorText: 'You\'re shivering and distracted.', effectDescription: 'Lose 40 Padstal Points.', statBadge: '-40 PTS', icon: '🚿', effect: { kind: 'points', amount: -40 } },
]

export const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
