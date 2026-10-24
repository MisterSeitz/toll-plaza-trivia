import { useState } from 'react'
import type { ItemId, Player } from '../../types/game'
import { SHOP_CATALOG } from '../../data/gameData'
import { invCount } from '../../engine/gameRules'

interface Props {
  player: Player
  onBuy: (id: ItemId) => string | null
  onClose: () => void
}

export function SpazaShopModal({ player, onBuy, onClose }: Props) {
  const [tab, setTab] = useState<'all' | 'boost' | 'utility' | 'defense'>('all')
  const [fb, setFb] = useState<{ msg: string; ok: boolean } | null>(null)

  const buy = (id: ItemId, name: string) => {
    const err = onBuy(id)
    setFb(err ? { msg: err, ok: false } : { msg: `Bought ${name}!`, ok: true })
    setTimeout(() => setFb(null), 2200)
  }

  const items = SHOP_CATALOG.filter((i) => tab === 'all' || i.category === tab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">🛒</div>
            <div>
              <h2 className="text-base font-bold">Corner Spaza Shop</h2>
              <p className="text-xs text-stone-400">Stock up on road trip lifelines</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold block">Your wallet</span>
            <span className="font-mono text-base font-bold text-amber-400">🪙 {player.points} pts</span>
          </div>
        </div>

        <div className="px-6 pt-3 pb-2 border-b border-stone-800/60 flex items-center justify-between gap-2 min-h-[3rem]">
          <div className="flex gap-1.5">
            {(['all', 'boost', 'utility', 'defense'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-amber-500 text-stone-950' : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'}`}>{t === 'all' ? 'All items' : t}</button>
            ))}
          </div>
          {fb && <div className={`text-xs px-2.5 py-1 rounded border font-medium animate-fade-in ${fb.ok ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-red-950/60 text-red-300 border-red-500/40'}`}>{fb.msg}</div>}
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.map((it) => {
            const owned = invCount(player.inventory, it.id)
            const maxed = owned >= it.maxPerInventory
            const afford = player.points >= it.price
            return (
              <div key={it.id} className="p-4 rounded-xl bg-stone-950/50 border border-stone-800 hover:border-stone-700 flex items-center justify-between gap-4 transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-2xl shrink-0">{it.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{it.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/50">{it.category}</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 max-w-sm">{it.description}</p>
                    <div className="text-[11px] font-mono text-stone-500 mt-1">In kit: <span className="text-stone-300 font-semibold">{owned}</span> / {it.maxPerInventory}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="font-mono text-xs font-bold text-amber-400">🪙 {it.price} pts</div>
                  <button onClick={() => buy(it.id, it.name)} disabled={!afford || maxed}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${maxed ? 'bg-stone-800 text-stone-600 cursor-not-allowed' : afford ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950' : 'bg-stone-800 text-stone-500 border border-stone-700/60 cursor-not-allowed'}`}>
                    {maxed ? 'Full' : afford ? 'Buy' : 'Short pts'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 bg-stone-950/70 border-t border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-500 italic">Items stay in your kit until needed.</span>
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold uppercase border border-stone-700/80 active:scale-95">Hit the road</button>
        </div>
      </div>
    </div>
  )
}

export default SpazaShopModal
