export type CategoryKey =
  | 'beats_screen'
  | 'diski_bokke'
  | 'braai_chow'
  | 'history_icons'
  | 'slang_lingo'
  | 'scenic_route'

export type TileCategory =
  | CategoryKey
  | 'toll_gate'
  | 'padstal'
  | 'spaza'
  | 'pothole'
  | 'hub'
  | 'load_shedding'

export type RouteType = 'tar' | 'gravel' | 'shortcut'
export type VehicleType = 'taxi' | 'bakkie' | 'citi_golf'

export interface BoardEdge {
  targetNodeId: string
  routeType: RouteType
  highwayLabel: 'N1' | 'N2' | 'N3' | 'N4' | 'R56' | 'Local'
  cost: number
}

export interface BoardNode {
  id: string
  name: string
  region: string
  category: TileCategory
  isChokepoint?: boolean
  isRoundabout?: boolean
  edges: BoardEdge[]
}


export type BoardGraph = Record<string, BoardNode>

export interface MovementPathOption {
  targetNodeId: string
  path: string[]
  remainingSteps: number
  stoppedEarlyByChokepoint: boolean
  routeTypesUsed: RouteType[]
}

export interface TriviaQuestion {
  id: string
  category: CategoryKey
  prompt: string
  options: { key: 'A' | 'B' | 'C' | 'D'; label: string }[]
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

export interface TollQuestion {
  id: string
  prompt: string
  isTrue: boolean
  explanation: string
}

export type EventCardType = 'lekker' | 'eish'

export type EventEffect =
  | { kind: 'points'; amount: number }
  | { kind: 'advance'; steps: number }
  | { kind: 'skip_turn' }
  | { kind: 'back'; steps: number }
  | { kind: 'lose_souvenir' }
  | { kind: 'shield'; charges: number }
  | { kind: 'free_toll' }
  | { kind: 'timer_bonus'; questions: number }
  | { kind: 'blur_next' }

export interface EventCardData {
  id: string
  type: EventCardType
  title: string
  locationTag?: string
  flavorText: string
  effectDescription: string
  statBadge?: string
  icon: string
  effect: EventEffect
}

export interface Souvenir {
  id: string
  name: string
  icon: string
  category: CategoryKey
}

export type ItemId =
  | 'chappies_timer'
  | 'spare_tyre'
  | 'taxi_pass'
  | 'braai_tongs_lifeline'
  | 'stoney_revival'
  | 'padstal_braai_salt'

export interface SpazaShopItem {
  id: ItemId
  name: string
  category: 'boost' | 'utility' | 'defense'
  price: number
  icon: string
  description: string
  maxPerInventory: number
}

export type Inventory = Partial<Record<ItemId, number>>

export interface Player {
  id: string
  name: string
  vehicle: VehicleType
  color: string
  currentNodeId: string
  points: number
  souvenirs: string[]
  inventory: Inventory
  skipNextTurn: boolean
  shield: number
  freeToll: boolean
  timerBonusQuestions: number
  blurNext: boolean
  bonusRoll: number
  connected: boolean
  isAi?: boolean
  aiPersona?: AiPersonaKey
}

export type AiPersonaKey = 'bra_dan' | 'oom_piet' | 'sipho'

export interface AiPersona {
  id: AiPersonaKey
  name: string
  vehicle: VehicleType
  avatar: string
  tagline: string
  preferredRoute: 'shortcut' | 'tar' | 'balanced'
  triviaAccuracy: Record<CategoryKey, number>
  tollSprintAccuracy: number
  spazaPriorities: ItemId[]
}

export interface AppSettings {
  muted: boolean
  master: number
  sfx: number
  haptics: boolean
  aiTrivia: boolean
  aiVisuals: boolean
  ambience: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  muted: false,
  master: 80,
  sfx: 90,
  haptics: true,
  aiTrivia: true,
  aiVisuals: false,
  ambience: false,
}
