import type {
  BoardGraph,
  EventCardData,
  Inventory,
  ItemId,
  MovementPathOption,
  Player,
  TriviaQuestion,
  VehicleType,
} from '../types/game'
import { SHOP_BY_ID, SOUVENIRS } from '../data/gameData'
import { FINISH_NODE_IDS, START_NODE_ID } from './boardGraph'
import { getReachablePaths } from './movementEngine'

export const PLAYER_COLORS = ['#f59e0b', '#10b981', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185']
export const TARGET_SOUVENIRS = SOUVENIRS.length

export type Pending =
  | { kind: 'trivia'; question: TriviaQuestion; blurred: boolean; seconds: number; remaining: number }
  | { kind: 'toll'; nodeId: string; remaining: number; nextNodeCandidates: string[] }
  | { kind: 'event'; card: EventCardData }
  | { kind: 'spaza' }

export interface GameState {
  players: Player[]
  activeIndex: number
  round: number
  phase: 'roll' | 'choose' | 'busy' | 'over'
  dice: number | null
  reachable: MovementPathOption[]
  pending: Pending | null
  log: string
  usedQuestionIds: string[]
  winnerId: string | null
  rev: number
}

export function createPlayer(
  id: string,
  name: string,
  vehicle: VehicleType,
  color: string,
  isAi = false,
  aiPersona?: import('../types/game').AiPersonaKey,
): Player {
  return {
    id,
    name,
    vehicle,
    color,
    currentNodeId: START_NODE_ID,
    points: 200,
    souvenirs: [],
    inventory: { chappies_timer: 1 },
    skipNextTurn: false,
    shield: 0,
    freeToll: false,
    timerBonusQuestions: 0,
    blurNext: false,
    bonusRoll: 0,
    connected: true,
    isAi,
    aiPersona,
  }
}


export function createGame(players: Player[]): GameState {
  return {
    players,
    activeIndex: 0,
    round: 1,
    phase: 'roll',
    dice: null,
    reachable: [],
    pending: null,
    log: `Game on! ${players[0]?.name ?? 'Player 1'} starts at Johannesburg.`,
    usedQuestionIds: [],
    winnerId: null,
    rev: 0,
  }
}

export const invCount = (inv: Inventory, id: ItemId) => inv[id] ?? 0

export function adjustItem(inv: Inventory, id: ItemId, delta: number): Inventory {
  return { ...inv, [id]: Math.max(0, invCount(inv, id) + delta) }
}

export function purchaseItem(player: Player, itemId: ItemId): { player: Player; error?: string } {
  const item = SHOP_BY_ID[itemId]
  if (!item) return { player, error: 'Unknown item' }
  if (invCount(player.inventory, itemId) >= item.maxPerInventory) return { player, error: `Max limit reached for ${item.name}!` }
  if (player.points < item.price) return { player, error: 'Eish! Not enough Padstal points.' }
  return {
    player: { ...player, points: player.points - item.price, inventory: adjustItem(player.inventory, itemId, 1) },
  }
}

/** Shortest-hop distance from every node to the nearest of `targets`. */
export function distancesTo(graph: BoardGraph, targets: string[]): Record<string, number> {
  const dist: Record<string, number> = {}
  const queue = [...targets]
  targets.forEach((t) => (dist[t] = 0))
  while (queue.length) {
    const cur = queue.shift()!
    for (const e of graph[cur].edges) {
      if (dist[e.targetNodeId] === undefined) {
        dist[e.targetNodeId] = dist[cur] + 1
        queue.push(e.targetNodeId)
      }
    }
  }
  return dist
}

/** Auto-move used by event cards. Positive steps head toward the nearest goal; negative head away. */
export function autoMove(graph: BoardGraph, from: string, steps: number, souvenirsComplete: boolean): MovementPathOption | null {
  const options = getReachablePaths(graph, from, Math.abs(steps), { ignoreChokepoints: true, allowUturns: steps < 0 })
  if (!options.length) return null
  const targets = souvenirsComplete ? FINISH_NODE_IDS : FINISH_NODE_IDS
  const dist = distancesTo(graph, targets)
  const sorted = [...options].sort((a, b) => (dist[a.targetNodeId] ?? 99) - (dist[b.targetNodeId] ?? 99))
  return steps > 0 ? sorted[0] : sorted[sorted.length - 1]
}

export function hasWon(player: Player, nodeId: string): boolean {
  return player.souvenirs.length >= TARGET_SOUVENIRS && FINISH_NODE_IDS.includes(nodeId)
}

export interface EffectResult {
  player: Player
  log: string
  moveSteps?: number
  shielded?: boolean
}

/** Applies a Lekker/Eish effect to a player. Movement is returned for the caller to animate. */
export function applyEventEffect(player: Player, card: EventCardData): EffectResult {
  if (card.type === 'eish' && player.shield > 0) {
    return {
      player: { ...player, shield: player.shield - 1 },
      log: `${player.name}'s Cooler Box saved them from "${card.title}"!`,
      shielded: true,
    }
  }
  const e = card.effect
  switch (e.kind) {
    case 'points':
      return {
        player: { ...player, points: Math.max(0, player.points + e.amount) },
        log: `${player.name}: ${card.title} (${e.amount >= 0 ? '+' : ''}${e.amount} pts)`,
      }
    case 'advance':
      return { player, log: `${player.name}: ${card.title} — advancing ${e.steps}!`, moveSteps: e.steps }
    case 'back':
      return { player, log: `${player.name}: ${card.title} — back ${e.steps}.`, moveSteps: -e.steps }
    case 'skip_turn':
      return { player: { ...player, skipNextTurn: true }, log: `${player.name}: ${card.title} — loses next turn.` }
    case 'lose_souvenir': {
      const lost = player.souvenirs[player.souvenirs.length - 1]
      return {
        player: { ...player, souvenirs: player.souvenirs.slice(0, -1) },
        log: lost ? `${player.name} lost a souvenir to the baboons!` : `${player.name} had nothing for the baboons to steal.`,
      }
    }
    case 'shield':
      return { player: { ...player, shield: player.shield + e.charges }, log: `${player.name} is shielded vs ${e.charges} Eish! cards.` }
    case 'free_toll':
      return { player: { ...player, freeToll: true }, log: `${player.name}'s next toll is free.` }
    case 'timer_bonus':
      return { player: { ...player, timerBonusQuestions: player.timerBonusQuestions + e.questions }, log: `${player.name} gets extra time for ${e.questions} questions.` }
    case 'blur_next':
      return { player: { ...player, blurNext: true }, log: `${player.name}'s next question is blurred!` }
  }
}
