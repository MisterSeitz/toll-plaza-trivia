import { useCallback, useEffect, useRef, useState } from 'react'
import type { ItemId, MovementPathOption, Player, TriviaQuestion, CategoryKey, EventCardData } from '../types/game'
import { MZANSI_BOARD_GRAPH } from '../engine/boardGraph'
import { executeStepwiseMovement, getReachablePaths } from '../engine/movementEngine'
import {
  type GameState,
  adjustItem,
  applyEventEffect,
  autoMove,
  hasWon,
  invCount,
  purchaseItem,
  TARGET_SOUVENIRS,
} from '../engine/gameRules'
import { CATEGORY_META, EISH_CARDS, LEKKER_CARDS, SHOP_BY_ID, SOUVENIRS, SPAZA_CATALOG, pickRandom } from '../data/gameData'
import { pickQuestion } from '../data/questions'
import { soundManager } from '../utils/soundEffects'
import { generateBanter } from '../services/geminiTrivia'
import {
  AI_PERSONAS,
  decideBestPath,
  decideSpazaPurchase,
  decideTollStrategy,
  decideTriviaAnswer,
} from '../engine/aiDriverEngine'

const G = MZANSI_BOARD_GRAPH
export const TOLL_COST = 100
const CATEGORY_KEYS = Object.keys(CATEGORY_META) as CategoryKey[]

interface Options {
  initial: GameState
  /** Player id of the local user in online mode; null = hot-seat/solo (controls human players). */
  myId: string | null
  onlineHostId?: string | null
  onCommit?: (s: GameState) => void
  extraQuestions: TriviaQuestion[]
  aiBanter: boolean
}

export function useGame({ initial, myId, onlineHostId, onCommit, extraQuestions, aiBanter }: Options) {
  const [state, setState] = useState<GameState>(initial)
  const ref = useRef<GameState>(initial)
  const cancelMove = useRef<(() => void) | null>(null)
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [banter, setBanter] = useState<string | null>(null)
  const extraRef = useRef(extraQuestions)
  const commitCb = useRef(onCommit)
  useEffect(() => {
    extraRef.current = extraQuestions
    commitCb.current = onCommit
  })

  const commit = useCallback((fn: (s: GameState) => GameState) => {
    const next = { ...fn(ref.current), rev: ref.current.rev + 1 }
    ref.current = next
    setState(next)
    commitCb.current?.(next)
  }, [])

  /** Apply a snapshot from another client (never re-broadcast). */
  const receive = useCallback((s: GameState) => {
    if (s.rev <= ref.current.rev) return
    ref.current = s
    setState(s)
  }, [])

  useEffect(() => () => {
    cancelMove.current?.()
    if (aiTimer.current) clearTimeout(aiTimer.current)
  }, [])

  const active: Player = state.players[state.activeIndex]
  const isMyTurn = (myId === null ? !active?.isAi : active?.id === myId) && !active?.isAi
  const canDriveAi = myId === null || (onlineHostId != null && myId === onlineHostId)

  // ---------- helpers (operate on state passed in) ----------
  const patch = (s: GameState, id: string, fn: (p: Player) => Player): GameState => ({
    ...s,
    players: s.players.map((p) => (p.id === id ? fn(p) : p)),
  })

  const advanceTurn = (s: GameState): GameState => {
    const n = s.players.length
    let idx = s.activeIndex
    let round = s.round
    let players = s.players
    let log = s.log
    for (let i = 0; i < n; i++) {
      idx = (idx + 1) % n
      if (idx === 0) round++
      const p = players[idx]
      if (!p.connected) continue
      if (p.skipNextTurn) {
        players = players.map((q) => (q.id === p.id ? { ...q, skipNextTurn: false } : q))
        log = `${p.name} sits this turn out.`
        continue
      }
      log = `${p.name}'s turn — roll the dice!`
      break
    }
    return { ...s, players, activeIndex: idx, round, phase: 'roll', dice: null, reachable: [], pending: null, log }
  }

  const endTurn = () => commit((s) => advanceTurn(s))

  const startTrivia = (s: GameState, playerId: string, category: CategoryKey, forceBlur: boolean): GameState => {
    const player = s.players.find((p) => p.id === playerId)!
    const question = pickQuestion(category, new Set(s.usedQuestionIds), extraRef.current)
    const bonus = player.timerBonusQuestions > 0
    const s2 = patch(s, playerId, (p) => ({ ...p, timerBonusQuestions: Math.max(0, p.timerBonusQuestions - 1), blurNext: false }))
    return {
      ...s2,
      phase: 'busy',
      usedQuestionIds: [...s.usedQuestionIds, question.id],
      pending: { kind: 'trivia', question, blurred: forceBlur || player.blurNext, seconds: 15 + (bonus ? 15 : 0), remaining: 0 },
      log: `${player.name} faces a ${CATEGORY_META[category].name} question!`,
    }
  }

  const openEvent = (s: GameState, card: EventCardData): GameState => ({
    ...s,
    phase: 'busy',
    pending: { kind: 'event', card },
    log: card.type === 'lekker' ? `Lekker! ${s.players[s.activeIndex].name} drew a card.` : `Eish! ${s.players[s.activeIndex].name} drew a hazard card.`,
  })

  // ---------- landing on a tile ----------
  const handleLanding = (nodeId: string, remaining: number) => {
    const node = G[nodeId]
    const s = ref.current
    const player = s.players[s.activeIndex]

    if (hasWon(player, nodeId)) {
      soundManager.playVuvuzela(true)
      commit((st) => ({ ...st, phase: 'over', winnerId: player.id, pending: null, reachable: [], log: `${player.name} wins the road trip!` }))
      return
    }

    if (node.isRoundabout) {
      commit((st) => ({
        ...st,
        phase: 'busy',
        pending: { kind: 'roundabout', nodeId },
        log: `${player.name} is navigating the ${node.name} traffic circle!`,
      }))
      return
    }

    switch (node.category) {
      case 'toll_gate': {
        if (player.freeToll) {
          commit((st) => patch(st, player.id, (p) => ({ ...p, freeToll: false })))
          continueAfterToll(nodeId, remaining, `${player.name} cruises through ${node.name} for free!`)
        } else {
          soundManager.playTollSiren()
          commit((st) => ({ ...st, phase: 'busy', pending: { kind: 'toll', nodeId, remaining, nextNodeCandidates: [] }, log: `${player.name} hits ${node.name}!` }))
        }
        return
      }
      case 'spaza':
        soundManager.playPadstalBell()
        commit((st) => ({ ...st, phase: 'busy', pending: { kind: 'spaza' }, log: `${player.name} pulls into ${node.name}.` }))
        return
      case 'pothole': {
        soundManager.playTireScreech()
        commit((st) => ({
          ...st,
          stats: {
            ...st.stats,
            potholesHit: {
              ...st.stats.potholesHit,
              [player.id]: (st.stats.potholesHit[player.id] || 0) + 1,
            },
          },
        }))
        if (invCount(player.inventory, 'spare_tyre') > 0) {
          commit((st) => patch(st, player.id, (p) => ({ ...p, inventory: adjustItem(p.inventory, 'spare_tyre', -1) })))
          commit((st) => ({ ...st, log: `${player.name} swaps in a Spare Tyre — disaster averted!` }))
        } else {
          commit((st) => ({ ...patch(st, player.id, (p) => ({ ...p, skipNextTurn: true })), log: `Eish! ${player.name} blows a tyre at ${node.name} and loses next turn.` }))
        }
        endTurnKeepingLog()
        return
      }
      case 'padstal': {
        soundManager.playPadstalBell()
        soundManager.playKettleWhistle()
        commit((st) => openEvent(patch(st, player.id, (p) => ({ ...p, points: p.points + 25 })), pickRandom(LEKKER_CARDS)))
        return
      }
      case 'hub': {
        soundManager.playTaxiHooter()
        commit((st) => ({
          ...st,
          phase: 'busy',
          pending: { kind: 'taxi_warp', currentHubId: nodeId },
          log: `${player.name} arrived at ${node.name} hub & taxi rank.`,
        }))
        return
      }
      case 'braai_chow': {
        soundManager.playBraaiCrackle()
        const question = pickQuestion('braai_chow', new Set(s.usedQuestionIds), extraRef.current)
        commit((st) => ({
          ...st,
          phase: 'busy',
          usedQuestionIds: [...st.usedQuestionIds, question.id],
          pending: { kind: 'braai_wager', question },
          log: `${player.name} pulled up to the Braai Stand at ${node.name}!`,
        }))
        return
      }
      case 'load_shedding': {
        const cat = pickRandom(CATEGORY_KEYS)
        const question = pickQuestion(cat, new Set(s.usedQuestionIds), extraRef.current)
        commit((st) => ({
          ...st,
          phase: 'busy',
          usedQuestionIds: [...st.usedQuestionIds, question.id],
          pending: { kind: 'load_shedding', question, restored: false },
          log: `⚡ Stage 6 Load Shedding hit ${player.name} at ${node.name}!`,
        }))
        return
      }
      default:
        commit((st) => startTrivia(st, player.id, node.category as CategoryKey, false))
    }
  }


  /** End turn but keep the explanatory log line for a moment. */
  const endTurnKeepingLog = () => {
    setTimeout(() => commit((s) => (s.phase === 'over' ? s : advanceTurn(s))), 1100)
  }

  const continueAfterToll = (nodeId: string, remaining: number, logLine: string) => {
    if (remaining <= 0) {
      commit((s) => ({ ...s, log: logLine, pending: null }))
      endTurnKeepingLog()
      return
    }
    const opts = getReachablePaths(G, nodeId, remaining, { ignoreChokepoints: false })
    if (!opts.length) {
      commit((s) => ({ ...s, log: logLine, pending: null }))
      endTurnKeepingLog()
      return
    }
    commit((s) => ({ ...s, phase: 'choose', pending: null, reachable: opts, log: `${logLine} ${remaining} steps left — pick a route.` }))
  }

  // ---------- movement ----------
  const animate = (playerId: string, path: string[], done: (final: string) => void, stepMs = 320) => {
    commit((s) => ({ ...s, phase: 'busy', reachable: [] }))
    cancelMove.current = executeStepwiseMovement(
      path,
      (nodeId) => {
        const othersHere = ref.current.players.some((pl) => pl.id !== playerId && pl.currentNodeId === nodeId)
        if (othersHere) {
          soundManager.playOvertake()
        } else {
          soundManager.playMove()
        }
        commit((s) => patch(s, playerId, (p) => ({ ...p, currentNodeId: nodeId })))
      },
      (final) => done(final),
      stepMs,
    )
  }

  // ---------- public actions ----------
  const rollDice = () => {
    const s = ref.current
    if (s.phase !== 'roll') return
    const p = s.players[s.activeIndex]
    soundManager.playDiceRattle()
    const roll = Math.floor(Math.random() * 6) + 1 + p.bonusRoll
    const opts = getReachablePaths(G, p.currentNodeId, roll, { ignoreChokepoints: false })
    commit((st) => ({
      ...patch(st, p.id, (pl) => ({ ...pl, bonusRoll: 0 })),
      dice: roll,
      reachable: opts,
      phase: opts.length ? 'choose' : 'roll',
      log: opts.length ? `${p.name} rolled a ${roll}! Pick a highlighted destination.` : `${p.name} rolled ${roll} but is stuck!`,
    }))
    if (!opts.length) endTurnKeepingLog()
  }

  const chooseDestination = (option: MovementPathOption) => {
    const s = ref.current
    if (s.phase !== 'choose') return
    const playerId = s.players[s.activeIndex].id
    animate(playerId, option.path, (final) => handleLanding(final, option.remainingSteps))
  }

  const resolveTrivia = (correct: boolean, secondsLeft: number, timedOut = false) => {
    const s = ref.current
    if (s.pending?.kind !== 'trivia') return
    const q = s.pending.question
    const player = s.players[s.activeIndex]
    const souvenir = SOUVENIRS.find((x) => x.category === q.category)
    let line = ''
    let next = s

    if (correct) {
      const gotSouvenir = souvenir && !player.souvenirs.includes(souvenir.id)
      if (gotSouvenir) {
        soundManager.playVuvuzela(false)
      }
      const pts = 100 + Math.max(0, secondsLeft) * 2
      next = patch(s, player.id, (p) => ({
        ...p,
        points: p.points + pts,
        souvenirs: gotSouvenir ? [...p.souvenirs, souvenir.id] : p.souvenirs,
      }))
      line = gotSouvenir
        ? `Sharp! ${player.name} wins ${souvenir.icon} ${souvenir.name} (+${pts} pts) — ${player.souvenirs.length + 1}/${TARGET_SOUVENIRS}!`
        : `Sharp! ${player.name} scores +${pts} pts.`
    } else {
      line = timedOut ? `Time's up for ${player.name}!` : `Eish! ${player.name} missed that one.`
    }

    const prevTrivia = s.stats?.triviaAnswers?.[player.id] || { correct: 0, total: 0 }
    next = {
      ...next,
      stats: {
        ...next.stats,
        triviaAnswers: {
          ...next.stats?.triviaAnswers,
          [player.id]: {
            correct: prevTrivia.correct + (correct ? 1 : 0),
            total: prevTrivia.total + 1,
          },
        },
      },
    }

    if (aiBanter) {
      generateBanter(player.name, correct, CATEGORY_META[q.category].name).then(setBanter).catch(() => undefined)
    } else {
      setBanter(null)
    }

    const roll = Math.random()
    if (!correct && roll < 0.35) {
      commit(() => openEvent({ ...next, log: line }, pickRandom(EISH_CARDS)))
    } else if (correct && roll < 0.2) {
      commit(() => openEvent({ ...next, log: line }, pickRandom(LEKKER_CARDS)))
    } else {
      commit(() => ({ ...next, pending: null, log: line }))
      endTurnKeepingLog()
    }
  }

  const consumeItem = (id: ItemId) => {
    const pid = ref.current.players[ref.current.activeIndex].id
    commit((s) => patch(s, pid, (p) => ({ ...p, inventory: adjustItem(p.inventory, id, -1) })))
  }

  const resolveToll = (method: 'sprint' | 'pay' | 'pass' | 'fail') => {
    const s = ref.current
    if (s.pending?.kind !== 'toll') return
    const { nodeId, remaining } = s.pending
    const player = s.players[s.activeIndex]
    if (method === 'fail') {
      soundManager.playTollSiren()
      commit((st) => ({ ...st, pending: null, log: `${player.name} is stuck at the barrier!` }))
      endTurnKeepingLog()
      return
    }
    if (method === 'pay') {
      if (player.points < TOLL_COST) return
      commit((st) => patch(st, player.id, (p) => ({ ...p, points: p.points - TOLL_COST })))
    }
    if (method === 'pass') {
      if (invCount(player.inventory, 'taxi_pass') < 1) return
      commit((st) => patch(st, player.id, (p) => ({ ...p, inventory: adjustItem(p.inventory, 'taxi_pass', -1) })))
    }
    if (method === 'sprint') {
      commit((st) => ({
        ...st,
        stats: {
          ...st.stats,
          tollSprintsCleared: {
            ...st.stats.tollSprintsCleared,
            [player.id]: (st.stats.tollSprintsCleared[player.id] || 0) + 1,
          },
        },
      }))
    }
    soundManager.playSuccessChime()
    const label = method === 'sprint' ? 'aced the sprint' : method === 'pay' ? `paid ${TOLL_COST} pts` : 'used a Taxi Fare Hooter'
    continueAfterToll(nodeId, remaining, `${player.name} ${label} and the boom gate lifts!`)
  }

  const resolveEvent = () => {
    const s = ref.current
    if (s.pending?.kind !== 'event') return
    const card = s.pending.card
    const player = s.players[s.activeIndex]
    const res = applyEventEffect(player, card)
    commit((st) => ({ ...patch(st, player.id, () => res.player), pending: null, log: res.log }))
    if (res.moveSteps) {
      const move = autoMove(G, res.player.currentNodeId, res.moveSteps, false)
      if (move) {
        animate(player.id, move.path, () => endTurnKeepingLog(), 300)
        return
      }
    }
    endTurnKeepingLog()
  }

  const buyItem = (itemId: ItemId): string | null => {
    const s = ref.current
    const player = s.players[s.activeIndex]
    const res = purchaseItem(player, itemId)
    if (res.error) return res.error
    soundManager.playCoin()
    const item = SHOP_BY_ID[itemId]
    commit((st) => ({
      ...patch(st, player.id, () => res.player),
      stats: {
        ...st.stats,
        spazaSpent: {
          ...st.stats.spazaSpent,
          [player.id]: (st.stats.spazaSpent[player.id] || 0) + (item?.price || 0),
        },
      },
    }))
    return null
  }

  const closeSpaza = () => {
    commit((s) => ({ ...s, pending: null }))
    endTurn()
  }

  const resolveBraaiWager = (res: {
    won: boolean
    wagerAmount: number
    challengedPlayerId?: string
    gotSouvenir: boolean
  }) => {
    const s = ref.current
    if (s.pending?.kind !== 'braai_wager') return
    const player = s.players[s.activeIndex]
    const souvenir = SOUVENIRS.find((x) => x.category === 'braai_chow')
    let next = s

    if (res.won) {
      const hasSouv = souvenir && !player.souvenirs.includes(souvenir.id)
      if (hasSouv) {
        soundManager.playVuvuzela(false)
      } else {
        soundManager.playSuccessChime()
      }
      const ptsGained = res.wagerAmount > 0 ? res.wagerAmount * 2 : 100
      next = patch(next, player.id, (p) => ({
        ...p,
        points: p.points + ptsGained,
        souvenirs: hasSouv && souvenir ? [...p.souvenirs, souvenir.id] : p.souvenirs,
      }))
      if (res.challengedPlayerId) {
        next = patch(next, res.challengedPlayerId, (opp) => ({
          ...opp,
          points: Math.max(0, opp.points - res.wagerAmount),
        }))
      }
      commit(() => ({
        ...next,
        pending: null,
        log: `${player.name} won the Braai Stand showdown (+${ptsGained} pts)!`,
      }))
    } else {
      if (res.wagerAmount > 0 && res.challengedPlayerId) {
        next = patch(next, player.id, (p) => ({
          ...p,
          points: Math.max(0, p.points - res.wagerAmount),
        }))
        next = patch(next, res.challengedPlayerId, (opp) => ({
          ...opp,
          points: opp.points + res.wagerAmount,
        }))
      }
      commit(() => ({
        ...next,
        pending: null,
        log: `Eish! ${player.name} lost the Braai showdown.`,
      }))
    }
    endTurnKeepingLog()
  }

  const resolveTaxiWarp = (res: {
    tookTaxi: boolean
    destinationNodeId?: string
    usedPass: boolean
    farePoints: number
    hadRoadblock: boolean
  }) => {
    const s = ref.current
    if (s.pending?.kind !== 'taxi_warp') return
    const player = s.players[s.activeIndex]

    if (!res.tookTaxi || !res.destinationNodeId) {
      commit((st) => ({
        ...patch(st, player.id, (p) => ({ ...p, points: p.points + 20 })),
        pending: null,
        log: `${player.name} rested at the hub (+20 pts).`,
      }))
      endTurnKeepingLog()
      return
    }

    let next = s
    if (res.usedPass) {
      next = patch(next, player.id, (p) => ({ ...p, inventory: adjustItem(p.inventory, 'taxi_pass', -1) }))
    } else if (res.farePoints > 0) {
      next = patch(next, player.id, (p) => ({ ...p, points: Math.max(0, p.points - res.farePoints) }))
    }

    animate(player.id, [player.currentNodeId, res.destinationNodeId], (final) => {
      const destNode = G[final]
      commit((st) => ({
        ...st,
        pending: null,
        log: res.hadRoadblock
          ? `Roadblock delayed the trip! ${player.name} arrived at ${destNode?.name || 'hub'}.`
          : `Sharp sharp! ${player.name} hitched an express taxi to ${destNode?.name || 'hub'}!`,
      }))
      endTurnKeepingLog()
    })
  }

  const resolveRoundabout = (res: {
    unlocked: boolean
    paidDirections: boolean
    cost: number
  }) => {
    const s = ref.current
    if (s.pending?.kind !== 'roundabout') return
    const player = s.players[s.activeIndex]
    let next = s

    if (res.paidDirections && res.cost > 0) {
      next = patch(next, player.id, (p) => ({ ...p, points: Math.max(0, p.points - res.cost) }))
    }

    if (res.unlocked) {
      commit(() => ({
        ...next,
        pending: null,
        log: `${player.name} successfully navigated the traffic circle!`,
      }))
    } else {
      commit(() => ({
        ...patch(next, player.id, (p) => ({ ...p, skipNextTurn: true })),
        pending: null,
        log: `Eish! ${player.name} missed the roundabout exit and does another lap (loses next turn).`,
      }))
    }
    endTurnKeepingLog()
  }

  const resolveLoadShedding = (res: {
    correct: boolean
    generatorStarted: boolean
    secondsLeft: number
  }) => {
    const s = ref.current
    if (s.pending?.kind !== 'load_shedding') return
    const player = s.players[s.activeIndex]

    if (res.correct) {
      const pts = 100 + (res.generatorStarted ? 20 : 50)
      commit((st) => ({
        ...patch(st, player.id, (p) => ({ ...p, points: p.points + pts })),
        pending: null,
        log: res.generatorStarted
          ? `Lekker! Generator powered ${player.name} to victory (+${pts} pts)!`
          : `Mzansi Legend! ${player.name} aced the blackout challenge by candlelight (+${pts} pts)!`,
      }))
    } else {
      commit((st) => ({
        ...st,
        pending: null,
        log: `Eish! Load Shedding defeated ${player.name} in the dark.`,
      }))
    }
    endTurnKeepingLog()
  }

  const useItem = (id: ItemId) => {
    const s = ref.current
    if (s.phase !== 'roll') return
    const p = s.players[s.activeIndex]
    if (invCount(p.inventory, id) < 1) return
    if (id === 'stoney_revival') {
      commit((st) => ({ ...patch(st, p.id, (pl) => ({ ...pl, shield: pl.shield + 2, inventory: adjustItem(pl.inventory, id, -1) })), log: `${p.name} cracks a Stoney — shielded against 2 Eish! cards.` }))
    } else if (id === 'padstal_braai_salt') {
      commit((st) => ({ ...patch(st, p.id, (pl) => ({ ...pl, bonusRoll: pl.bonusRoll + 1, inventory: adjustItem(pl.inventory, id, -1) })), log: `${p.name} sprinkles Marina Braai Salt: +1 on the next roll.` }))
    } else {
      commit((st) => ({ ...st, log: 'That item activates automatically when needed.' }))
    }
  }

  /** Host/arbiter action when a player disconnects mid-turn. */
  const forceSkipActive = () => {
    cancelMove.current?.()
    commit((s) => (s.phase === 'over' ? s : advanceTurn(s)))
  }

  const setConnected = (playerId: string, connected: boolean) => {
    commit((s) => patch(s, playerId, (p) => ({ ...p, connected })))
  }

  // ---------- AI autonomous turn controller ----------
  useEffect(() => {
    if (state.phase === 'over') return
    const activePlayer = state.players[state.activeIndex]
    if (!activePlayer?.isAi) return
    if (!canDriveAi) return

    const persona = AI_PERSONAS[activePlayer.aiPersona || 'bra_dan'] || AI_PERSONAS.bra_dan
    if (aiTimer.current) clearTimeout(aiTimer.current)

    if (state.phase === 'roll') {
      aiTimer.current = setTimeout(() => {
        rollDice()
      }, 1000)
    } else if (state.phase === 'choose' && state.reachable.length > 0) {
      aiTimer.current = setTimeout(() => {
        const bestOpt = decideBestPath(persona, activePlayer, state.reachable, G)
        chooseDestination(bestOpt)
      }, 1200)
    } else if (state.pending?.kind === 'trivia') {
      const q = state.pending.question
      const { correct, thinkingMs } = decideTriviaAnswer(persona, q.category)
      aiTimer.current = setTimeout(() => {
        resolveTrivia(correct, Math.max(1, 15 - Math.floor(thinkingMs / 1000)))
      }, Math.min(thinkingMs, 3200))
    } else if (state.pending?.kind === 'toll') {
      aiTimer.current = setTimeout(() => {
        const strategy = decideTollStrategy(persona, activePlayer, TOLL_COST)
        if (strategy.action === 'pass') {
          resolveToll('pass')
        } else if (strategy.action === 'points') {
          resolveToll('pay')
        } else {
          resolveToll(strategy.success ? 'sprint' : 'fail')
        }
      }, 1400)
    } else if (state.pending?.kind === 'spaza') {
      aiTimer.current = setTimeout(() => {
        const itemToBuy = decideSpazaPurchase(persona, activePlayer, SPAZA_CATALOG)
        if (itemToBuy) {
          buyItem(itemToBuy)
        }
        setTimeout(() => closeSpaza(), 600)
      }, 1300)
    } else if (state.pending?.kind === 'event') {
      aiTimer.current = setTimeout(() => {
        resolveEvent()
      }, 1600)
    }

    return () => {
      if (aiTimer.current) clearTimeout(aiTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.activeIndex,
    state.phase,
    state.pending,
    state.reachable.length,
    canDriveAi,
  ])

  return {
    state,
    active,
    isMyTurn,
    banter,
    receive,
    rollDice,
    chooseDestination,
    resolveTrivia,
    consumeItem,
    resolveToll,
    resolveEvent,
    buyItem,
    closeSpaza,
    resolveBraaiWager,
    resolveTaxiWarp,
    resolveRoundabout,
    resolveLoadShedding,
    useItem,
    forceSkipActive,
    setConnected,
  }
}

