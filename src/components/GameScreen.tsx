import { useEffect, useRef, useState, useMemo } from 'react'
import confetti from 'canvas-confetti'
import type { TriviaQuestion } from '../types/game'
import { MZANSI_BOARD_GRAPH, NODE_COORDINATES } from '../engine/boardGraph'
import { type GameState, invCount } from '../engine/gameRules'
import { useGame, TOLL_COST } from '../hooks/useGame'
import { GRACE_PERIOD_MS, type LobbyPlayer, type OnlineEmotePayload } from '../hooks/useOnlineRoom'
import BoardMapRenderer from './board/BoardMapRenderer'
import PlayerDashboardTray from './dashboard/PlayerDashboardTray'
import TriviaChallengeModal from './modals/TriviaChallengeModal'
import TollPlazaSprint from './modals/TollPlazaSprint'
import SpazaShopModal from './modals/SpazaShopModal'
import EventCardDrawerModal from './modals/EventCardDrawerModal'
import BraaiWagerModal from './modals/BraaiWagerModal'
import TaxiRankWarpModal from './modals/TaxiRankWarpModal'
import RoundaboutLockModal from './modals/RoundaboutLockModal'
import LoadSheddingModal from './modals/LoadSheddingModal'
import { PostMatchPodiumModal } from './modals/PostMatchPodiumModal'
import { EmoteReactionWheel, FloatingEmoteOverlay, type ActiveEmote } from './social/EmoteReactionWheel'
import type { AppSettings } from '../types/game'

export interface OnlineSession {
  roomCode: string
  roster: LobbyPlayer[]
  remoteState: GameState | null
  sendState: (s: GameState) => void
  sendEmote?: (emoji: string) => void
  activeEmotes?: OnlineEmotePayload[]
  stateRef: { current: GameState | null }
}

interface Props {
  initial: GameState
  myId: string | null
  session?: OnlineSession
  settings: AppSettings
  extraQuestions: TriviaQuestion[]
  onOpenSettings: () => void
  onExit: () => void
}

const VEHICLE: Record<string, string> = { taxi: '🚕', bakkie: '🛻', citi_golf: '🚗' }

export function GameScreen({ initial, myId, session, settings, extraQuestions, onOpenSettings, onExit }: Props) {
  const game = useGame({
    initial,
    myId,
    onlineHostId: session?.roster[0]?.id,
    onCommit: session?.sendState,
    extraQuestions,
    aiBanter: settings.aiTrivia,
  })
  const { state, active, isMyTurn } = game
  const pending = state.pending
  const graceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Online: keep state reachable for late joiners, apply remote snapshots.
  useEffect(() => { if (session) session.stateRef.current = state }, [session, state])
  useEffect(() => { if (session?.remoteState) game.receive(session.remoteState) }, [session?.remoteState]) // eslint-disable-line react-hooks/exhaustive-deps

  // Online: disconnect grace periods, arbitrated by the first present player.
  useEffect(() => {
    if (!session) return
    const present = new Set(session.roster.map((r) => r.id))
    const arbiter = state.players.find((p) => present.has(p.id))
    const iAmArbiter = arbiter?.id === myId
    const timers = graceTimers.current

    state.players.forEach((p) => {
      if (present.has(p.id)) {
        if (timers[p.id]) { clearTimeout(timers[p.id]); delete timers[p.id] }
        if (!p.connected && iAmArbiter) game.setConnected(p.id, true)
      } else if (p.connected && !timers[p.id]) {
        timers[p.id] = setTimeout(() => {
          delete timers[p.id]
          if (!iAmArbiter) return
          game.setConnected(p.id, false)
          if (state.players[state.activeIndex]?.id === p.id) game.forceSkipActive()
        }, GRACE_PERIOD_MS)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.roster, state.players.length, state.activeIndex])
  useEffect(() => () => Object.values(graceTimers.current).forEach(clearTimeout), [])

  useEffect(() => {
    if (!state.winnerId) return
    const end = Date.now() + 2500
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: ['#f59e0b', '#10b981', '#be123c', '#1d4ed8'] })
      confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: ['#f59e0b', '#10b981', '#be123c', '#1d4ed8'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [state.winnerId])

  const [localEmotes, setLocalEmotes] = useState<ActiveEmote[]>([])

  const playerPositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    for (const p of state.players) {
      const coord = NODE_COORDINATES[p.currentNodeId]
      if (coord) map[p.id] = coord
    }
    return map
  }, [state.players])

  const allEmotes = useMemo(() => {
    const list = [...localEmotes, ...(session?.activeEmotes || [])]
    return list.sort((a, b) => a.timestamp - b.timestamp)
  }, [localEmotes, session?.activeEmotes])

  const handleSendEmote = (emoji: string) => {
    const sender = myId ? state.players.find((p) => p.id === myId) || active : active
    if (session?.sendEmote) {
      session.sendEmote(emoji)
    } else {
      const newEmote: ActiveEmote = {
        id: crypto.randomUUID(),
        playerId: sender.id,
        playerName: sender.name,
        emoji,
        timestamp: Date.now(),
      }
      setLocalEmotes((prev: ActiveEmote[]) => [...prev.slice(-10), newEmote])
    }
  }

  // Autonomous AI bot witty emoji reactions
  useEffect(() => {
    if (!state.log) return
    const aiBots = state.players.filter((p) => p.isAi)
    if (!aiBots.length) return

    if (Math.random() < 0.45) {
      const randomBot = aiBots[Math.floor(Math.random() * aiBots.length)]
      let reaction = '🇿🇦'
      if (state.log.includes('pothole') || state.log.includes('missed') || state.log.includes('barrier') || state.log.includes('blows a tyre')) {
        reaction = Math.random() < 0.5 ? '🤣' : '🕳️'
      } else if (state.log.includes('Load Shedding') || state.log.includes('Eish')) {
        reaction = Math.random() < 0.5 ? '🕯️' : '😱'
      } else if (state.log.includes('wins') || state.log.includes('Braai') || state.log.includes('Sharp')) {
        reaction = Math.random() < 0.5 ? '🎺' : '🥩'
      } else if (state.log.includes('Taxi') || state.log.includes('hub')) {
        reaction = '🚕'
      }
      const timer = setTimeout(() => {
        setLocalEmotes((prev: ActiveEmote[]) => [
          ...prev.slice(-10),
          {
            id: crypto.randomUUID(),
            playerId: randomBot.id,
            playerName: randomBot.name,
            emoji: reaction,
            timestamp: Date.now(),
          },
        ])
      }, 750)
      return () => clearTimeout(timer)
    }
  }, [state.log, state.players])

  const winner = state.players.find((p) => p.id === state.winnerId)
  const me = myId ? state.players.find((p) => p.id === myId) ?? active : active
  const dashPlayer = myId ? me : active
  const canAct = isMyTurn && !state.pending && state.phase !== 'over'
  const statusText = state.phase === 'choose' ? 'Choose a highlighted tile' : isMyTurn ? 'Your move' : active.isAi ? `🤖 ${active.name}'s move…` : `Waiting for ${active.name}`

  const tollNode = pending?.kind === 'toll' ? MZANSI_BOARD_GRAPH[pending.nodeId] : null

  return (
    <div className="relative w-full h-full bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none">
      <header className="z-30 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-stone-950/90 backdrop-blur border-b border-stone-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">🇿🇦</span>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-wider uppercase flex items-center gap-2">
              Mzansi Trivia Road Trip
              {session && <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">Room {session.roomCode}</span>}
              <span className="text-[10px] text-stone-500 font-mono">Round {state.round}</span>
            </h1>
            <p aria-live="polite" className="text-xs text-amber-400/90 font-mono truncate">{state.log}</p>
            {game.banter && <p className="text-xs text-emerald-300 italic truncate">🎙️ {game.banter}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {state.players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all ${i === state.activeIndex ? 'bg-stone-800 border-amber-500 text-amber-300' : 'bg-stone-900/80 border-stone-800 text-stone-400'} ${p.connected ? '' : 'opacity-40'}`}>
              <span>{VEHICLE[p.vehicle]}</span><span>{p.isAi ? '🤖 ' : ''}{p.name}</span>
              <span className="font-mono text-stone-300">{p.points}</span>
              <span className="font-mono text-amber-400">🎁{p.souvenirs.length}</span>
            </div>
          ))}
          <EmoteReactionWheel onSendEmote={handleSendEmote} />
          <button onClick={onOpenSettings} aria-label="Settings" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700">⚙️</button>
          <button onClick={onExit} className="px-3 h-8 rounded-lg bg-stone-800 hover:bg-red-900/60 border border-stone-700 text-xs">Leave</button>
        </div>
      </header>

      <main className="relative flex-1 min-h-0 px-3 pt-2 pb-36 md:pb-28">
        <BoardMapRenderer graph={MZANSI_BOARD_GRAPH} players={state.players} activePlayerId={active.id} reachable={state.reachable} canInteract={isMyTurn && state.phase === 'choose'} onSelectDestination={game.chooseDestination} />
        <FloatingEmoteOverlay emotes={allEmotes} playerPositions={playerPositions} />
      </main>

      <PlayerDashboardTray player={dashPlayer} canAct={canAct || (isMyTurn && state.phase === 'choose')} canRoll={canAct && state.phase === 'roll'} diceValue={state.dice} status={statusText} onRollDice={game.rollDice} onUseItem={game.useItem} />

      {pending?.kind === 'trivia' && (
        <TriviaChallengeModal key={pending.question.id} question={pending.question} seconds={pending.seconds} blurred={pending.blurred} points={active.points} playerName={active.name} interactive={isMyTurn} isAiPlayer={active.isAi}
          hasFiftyFifty={invCount(active.inventory, 'braai_tongs_lifeline') > 0} hasTimerBoost={invCount(active.inventory, 'chappies_timer') > 0}
          onUseFiftyFifty={() => game.consumeItem('braai_tongs_lifeline')} onUseTimerBoost={() => game.consumeItem('chappies_timer')} onResolve={game.resolveTrivia} />
      )}

      {pending?.kind === 'toll' && tollNode && (
        <TollPlazaSprint key={pending.nodeId} tollName={tollNode.name} interactive={isMyTurn} playerName={active.name} canPay={active.points >= TOLL_COST} canUsePass={invCount(active.inventory, 'taxi_pass') > 0} tollCost={TOLL_COST} onResolve={game.resolveToll} />
      )}

      {pending?.kind === 'spaza' && isMyTurn && <SpazaShopModal player={active} onBuy={game.buyItem} onClose={game.closeSpaza} />}
      {pending?.kind === 'spaza' && !isMyTurn && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-stone-900 border border-amber-500/40 text-xs text-amber-200">🛒 {active.isAi ? '🤖 ' : ''}{active.name} is shopping at the Spaza…</div>
      )}

      {pending?.kind === 'event' && (
        <EventCardDrawerModal key={pending.card.id} card={pending.card} interactive={isMyTurn} playerName={active.name} aiVisuals={settings.aiVisuals} onApply={game.resolveEvent} />
      )}

      {pending?.kind === 'braai_wager' && (
        <BraaiWagerModal
          key={pending.question.id}
          question={pending.question}
          activePlayer={active}
          allPlayers={state.players}
          interactive={isMyTurn}
          isAiPlayer={active.isAi}
          onResolve={game.resolveBraaiWager}
        />
      )}

      {pending?.kind === 'taxi_warp' && (
        <TaxiRankWarpModal
          key={pending.currentHubId}
          currentHubId={pending.currentHubId}
          activePlayer={active}
          interactive={isMyTurn}
          isAiPlayer={active.isAi}
          onResolve={game.resolveTaxiWarp}
        />
      )}

      {pending?.kind === 'roundabout' && (
        <RoundaboutLockModal
          key={pending.nodeId}
          nodeId={pending.nodeId}
          activePlayer={active}
          interactive={isMyTurn}
          isAiPlayer={active.isAi}
          onResolve={game.resolveRoundabout}
        />
      )}

      {pending?.kind === 'load_shedding' && (
        <LoadSheddingModal
          key={pending.question.id}
          question={pending.question}
          activePlayer={active}
          interactive={isMyTurn}
          isAiPlayer={active.isAi}
          onResolve={game.resolveLoadShedding}
        />
      )}


      {winner && (
        <PostMatchPodiumModal
          players={state.players}
          winnerId={state.winnerId}
          stats={state.stats}
          onExit={onExit}
        />
      )}
    </div>
  )
}

export default GameScreen
