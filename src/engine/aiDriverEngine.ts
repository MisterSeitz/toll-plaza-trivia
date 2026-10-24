import type {
  AiPersona,
  AiPersonaKey,
  BoardGraph,
  CategoryKey,
  ItemId,
  MovementPathOption,
  Player,
  SpazaShopItem,
} from '../types/game'
import { SOUVENIRS } from '../data/gameData'
import { invCount } from './gameRules'

export const AI_PERSONAS: Record<AiPersonaKey, AiPersona> = {
  bra_dan: {
    id: 'bra_dan',
    name: 'Bra Dan',
    vehicle: 'taxi',
    avatar: '🚕💨',
    tagline: 'No time to waste — hoot and pass!',
    preferredRoute: 'shortcut',
    triviaAccuracy: {
      beats_screen: 0.85,
      diski_bokke: 0.85,
      slang_lingo: 0.9,
      braai_chow: 0.75,
      history_icons: 0.65,
      scenic_route: 0.6,
    },
    tollSprintAccuracy: 0.7,
    spazaPriorities: ['taxi_pass', 'chappies_timer', 'spare_tyre'],
  },
  oom_piet: {
    id: 'oom_piet',
    name: 'Oom Piet',
    vehicle: 'bakkie',
    avatar: '🛻🥩',
    tagline: 'Slow, steady, and lots of biltong.',
    preferredRoute: 'tar',
    triviaAccuracy: {
      braai_chow: 0.95,
      scenic_route: 0.9,
      history_icons: 0.85,
      diski_bokke: 0.7,
      beats_screen: 0.6,
      slang_lingo: 0.65,
    },
    tollSprintAccuracy: 0.55,
    spazaPriorities: ['spare_tyre', 'padstal_braai_salt', 'stoney_revival'],
  },
  sipho: {
    id: 'sipho',
    name: 'Sipho',
    vehicle: 'citi_golf',
    avatar: '🚗⚡',
    tagline: 'Spinning past the tolls with pure knowledge.',
    preferredRoute: 'balanced',
    triviaAccuracy: {
      beats_screen: 0.95,
      slang_lingo: 0.92,
      diski_bokke: 0.9,
      history_icons: 0.8,
      braai_chow: 0.75,
      scenic_route: 0.75,
    },
    tollSprintAccuracy: 0.85,
    spazaPriorities: ['braai_tongs_lifeline', 'chappies_timer', 'taxi_pass'],
  },
}

/**
 * Score and pick the best path option for an AI driver based on its persona preferences,
 * current collected souvenirs, and road hazards.
 */
export function decideBestPath(
  persona: AiPersona,
  player: Player,
  options: MovementPathOption[],
  graph: BoardGraph,
): MovementPathOption {
  if (options.length === 1) return options[0]

  let bestOption = options[0]
  let bestScore = -Infinity

  for (const opt of options) {
    const targetNode = graph[opt.targetNodeId]
    if (!targetNode) continue

    let score = 10 // Baseline

    // Check if landing node offers a missing souvenir
    const souvenir = SOUVENIRS.find((s) => s.category === targetNode.category)
    if (souvenir && !player.souvenirs.includes(souvenir.id)) {
      score += 60 // High priority to collect missing souvenirs
    }

    // Finishing hub nodes when player has collected enough souvenirs
    if (['node_n1_cpt_waterfront', 'node_n3_durban_beach'].includes(opt.targetNodeId)) {
      if (player.souvenirs.length >= 6) {
        score += 200 // Instant winning move
      } else {
        score += 5
      }
    }

    // Potholes: avoid if no spare tyre
    if (targetNode.category === 'pothole') {
      const hasTyre = invCount(player.inventory, 'spare_tyre') > 0
      score -= hasTyre ? 15 : 70
    }

    // Padstals & Spaza shops
    if (targetNode.category === 'padstal') {
      score += 25
    }
    if (targetNode.category === 'spaza') {
      score += player.points >= 50 ? 20 : 5
    }

    // Route type preferences
    const usedShortcut = opt.routeTypesUsed.includes('shortcut')
    const usedGravel = opt.routeTypesUsed.includes('gravel')

    if (persona.preferredRoute === 'shortcut') {
      if (usedShortcut) score += 25
      if (usedGravel) score += 10
    } else if (persona.preferredRoute === 'tar') {
      if (usedGravel) score -= 20
      if (usedShortcut) score -= 10
    }

    // Chokepoints (Toll Gates)
    if (opt.stoppedEarlyByChokepoint) {
      if (player.freeToll || invCount(player.inventory, 'taxi_pass') > 0 || player.points >= 100) {
        score += 5
      } else {
        score -= 20
      }
    }

    // Slight randomization for natural feel
    score += Math.random() * 8

    if (score > bestScore) {
      bestScore = score
      bestOption = opt
    }
  }

  return bestOption
}

/**
 * Determine if the AI gets a trivia question correct, and simulate realistic human/bot response time.
 */
export function decideTriviaAnswer(
  persona: AiPersona,
  category: CategoryKey,
): { correct: boolean; thinkingMs: number } {
  const baseRate = persona.triviaAccuracy[category] ?? 0.75
  const roll = Math.random()
  const correct = roll <= baseRate

  // Realistic thinking time: 1.8s to 3.8s
  const thinkingMs = Math.floor(1800 + Math.random() * 2000)

  return { correct, thinkingMs }
}

/**
 * Decide how the AI resolves a Toll Gate.
 */
export function decideTollStrategy(
  persona: AiPersona,
  player: Player,
  tollCost: number,
): { action: 'pass' | 'points' | 'sprint'; success: boolean } {
  if (invCount(player.inventory, 'taxi_pass') > 0) {
    return { action: 'pass', success: true }
  }

  // Cautious personality with enough points prefers paying
  if (persona.id === 'oom_piet' && player.points >= tollCost) {
    return { action: 'points', success: true }
  }

  // If plenty of points, pay
  if (player.points >= tollCost * 2) {
    return { action: 'points', success: true }
  }

  // Otherwise, attempt the sprint challenge
  const roll = Math.random()
  const success = roll <= persona.tollSprintAccuracy
  return { action: 'sprint', success }
}

/**
 * Decide which Spaza Shop item the AI should purchase if it can afford it.
 */
export function decideSpazaPurchase(
  persona: AiPersona,
  player: Player,
  catalog: SpazaShopItem[],
): ItemId | null {
  for (const itemId of persona.spazaPriorities) {
    const item = catalog.find((c) => c.id === itemId)
    if (!item) continue
    const currentQty = invCount(player.inventory, itemId)
    if (currentQty >= item.maxPerInventory) continue
    if (player.points >= item.price) {
      return itemId
    }
  }
  return null
}
