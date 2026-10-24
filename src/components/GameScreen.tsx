import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { TriviaQuestion } from '../types/game'
import { MZANSI_BOARD_GRAPH } from '../engine/boardGraph'
import { type GameState, invCount } from '../engine/gameRules'
import { useGame, TOLL_COST } from '../hooks/useGame'
import { GRACE_PERIOD_MS, type LobbyPlayer } from '../hooks/useOnlineRoom'
import BoardMapRenderer from './board/BoardMapRenderer'
import PlayerDashboardTray from './dashboard/PlayerDashboardTray'
import TriviaChallengeModal from './modals/TriviaChallengeModal'
import TollPlazaSprint from './modals/TollPlazaSprint'
import SpazaShopModal from './modals/SpazaShopModal'
import EventCardDrawerModal from './modals/EventCardDrawerModal'
import type { AppSettings } from '../types/game'

export interface OnlineSession {
  roomCode: string
  roster: LobbyPlayer[]
  remoteState: GameState | null
  sendState: (s: GameState) => void
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
          <button onClick={onOpenSettings} aria-label="Settings" className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700">⚙️</button>
          <button onClick={onExit} className="px-3 h-8 rounded-lg bg-stone-800 hover:bg-red-900/60 border border-stone-700 text-xs">Leave</button>
        </div>
      </header>

      <main className="flex-1 min-h-0 px-3 pt-2 pb-36 md:pb-28">
        <BoardMapRenderer graph={MZANSI_BOARD_GRAPH} players={state.players} activePlayerId={active.id} reachable={state.reachable} canInteract={isMyTurn && state.phase === 'choose'} onSelectDestination={game.chooseDestination} />
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

      {winner && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4">
          <div className="max-w-md w-full text-center bg-stone-900 border-2 border-amber-500 rounded-3xl p-8 shadow-2xl">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-black text-amber-400 mb-1">{winner.name} wins!</h2>
            <p className="text-sm text-stone-300 mb-5">Collected all {winner.souvenirs.length} souvenirs and reached the finish. Lekker!</p>
            <button onClick={onExit} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-sm active:scale-95">Back to menu</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameScreen
