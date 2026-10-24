import type { Inventory, ItemId, Player } from '../../types/game'
import { SHOP_BY_ID, SOUVENIRS } from '../../data/gameData'

const VEHICLE: Record<string, string> = { taxi: '🚕', bakkie: '🛻', citi_golf: '🚗' }

interface Props {
  player: Player
  canAct: boolean
  canRoll: boolean
  diceValue: number | null
  status: string
  onRollDice: () => void
  onUseItem: (id: ItemId) => void
}

export function PlayerDashboardTray({ player, canAct, canRoll, diceValue, status, onRollDice, onUseItem }: Props) {
  const items = (Object.entries(player.inventory as Inventory) as [ItemId, number][]).filter(([, n]) => n > 0)
  const collected = player.souvenirs.length

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur border-t-4 border-amber-500 shadow-2xl text-stone-100 select-none">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-stone-800 border-2 flex items-center justify-center text-2xl" style={{ borderColor: player.color }}>
              {VEHICLE[player.vehicle]}
            </div>
            {canAct && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{player.isAi ? '🤖 ' : ''}{player.name}</span>
              {canAct && <span className="text-[10px] bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono uppercase">Your turn</span>}
              {player.shield > 0 && <span title="Shield vs Eish! cards" className="text-xs">🛡️×{player.shield}</span>}
              {player.freeToll && <span title="Next toll free" className="text-xs">🎫</span>}
            </div>
            <div className="text-amber-400 text-xs font-semibold mt-0.5">🪙 {player.points} Padstal Pts</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
            Souvenirs <span className="font-mono text-stone-300">({collected}/{SOUVENIRS.length})</span>
          </div>
          <div className="flex gap-1.5">
            {SOUVENIRS.map((s) => {
              const has = player.souvenirs.includes(s.id)
              return (
                <div key={s.id} title={s.name} className={`w-9 h-9 rounded-lg border flex items-center justify-center text-base transition-all ${has ? 'bg-stone-800 border-amber-400 shadow-sm shadow-amber-500/20' : 'bg-stone-950/70 border-stone-800 opacity-40 grayscale scale-95'}`}>
                  {s.icon}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start gap-1 min-w-[8rem]">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">Roadside Kit</span>
          <div className="flex flex-wrap gap-1.5">
            {items.length === 0 ? (
              <span className="text-xs text-stone-500 italic py-1">Spaza bag empty</span>
            ) : (
              items.map(([id, n]) => {
                const def = SHOP_BY_ID[id]
                const usable = canAct && canRoll && (id === 'stoney_revival' || id === 'padstal_braai_salt')
                return (
                  <button key={id} disabled={!usable} onClick={() => onUseItem(id)} title={`${def.name}: ${def.description}`}
                    className={`px-2 py-1 rounded border text-xs flex items-center gap-1 transition-all ${usable ? 'bg-stone-800 border-stone-700 hover:border-amber-400 active:scale-95' : 'bg-stone-900 border-stone-800 text-stone-400 cursor-default'}`}>
                    <span>{def.icon}</span>
                    <span className="px-1 bg-stone-700 rounded text-[10px] font-mono">×{n}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-1">
          <button onClick={onRollDice} disabled={!canAct || !canRoll}
            className={`md:w-40 py-2.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${canAct && canRoll ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 animate-pulse' : 'bg-stone-800 text-stone-500 border border-stone-700/50 cursor-not-allowed'}`}>
            <span className="text-lg">🎲</span>
            <span>{canAct && canRoll ? 'Roll Dice' : diceValue ? `Rolled ${diceValue}` : 'Waiting…'}</span>
          </button>
          <span className="text-[10px] text-stone-500 font-mono text-right hidden md:block">{status}</span>
        </div>
      </div>
    </footer>
  )
}

export default PlayerDashboardTray
