import { useEffect, useState } from 'react'
import type { EventCardData } from '../../types/game'
import { generatePostcard } from '../../services/falPostcards'
import { soundManager } from '../../utils/soundEffects'

interface Props {
  card: EventCardData
  interactive: boolean
  playerName: string
  aiVisuals: boolean
  onApply: () => void
}

export function EventCardDrawerModal({ card, interactive, playerName, aiVisuals, onApply }: Props) {
  const [flipped, setFlipped] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const lekker = card.type === 'lekker'

  useEffect(() => {
    const t = setTimeout(() => {
      setFlipped(true)
      soundManager.playCardFlip()
      if (lekker) soundManager.playSuccessChime()
      else soundManager.playTireScreech()
    }, 500)
    return () => clearTimeout(t)
  }, [lekker])

  useEffect(() => {
    if (!aiVisuals) return
    let live = true
    generatePostcard(card.title, card.flavorText).then((u) => live && setImage(u))
    return () => { live = false }
  }, [card.id, card.title, card.flavorText, aiVisuals])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none" style={{ perspective: 1200 }}>
      <div className="w-full max-w-md flex flex-col items-center">
        <div onClick={() => setFlipped((f) => !f)} className="relative w-full aspect-[4/5] rounded-3xl cursor-pointer shadow-2xl transition-transform duration-700 ease-out preserve-3d" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div className={`absolute inset-0 rounded-3xl p-6 flex flex-col items-center justify-between border-4 backface-hidden ${lekker ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-amber-400' : 'bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 border-amber-500/70'}`} style={{ backfaceVisibility: 'hidden' }}>
            <div className="w-full flex justify-between text-xs font-mono font-bold tracking-widest text-amber-200 uppercase opacity-75"><span>★ Mzansi deck ★</span><span>N1–N4</span></div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl ${lekker ? 'bg-amber-500/30 border-amber-300' : 'bg-stone-800/80 border-amber-500/50'}`}>{lekker ? '🇿🇦' : '⚠️'}</div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-amber-100">{lekker ? 'Lekker card' : 'Eish! card'}</h2>
              <span className="text-xs text-amber-200/80 font-mono">Revealing road fate…</span>
            </div>
            {lekker ? <div className="h-1.5 w-24 bg-emerald-400 rounded-full" /> : <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_10px,#1c1917_10px,#1c1917_20px)] rounded" />}
          </div>

          <div className={`absolute inset-0 rounded-3xl p-6 flex flex-col justify-between border-4 bg-stone-900 backface-hidden ${lekker ? 'border-emerald-500' : 'border-red-500/90'}`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded border inline-block ${lekker ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' : 'bg-red-950/60 text-red-400 border-red-500/40'}`}>{lekker ? '★ Lekker event' : '⚠️ Road hazard'}</span>
                  {card.locationTag && <span className="text-[11px] text-stone-400 font-mono block mt-0.5">📍 {card.locationTag}</span>}
                </div>
              </div>
              <div className="w-11 border-2 border-dashed border-stone-700 rounded p-1 text-center rotate-3 bg-stone-950/50"><span className="text-[9px] font-mono text-stone-500 block">RSA</span><span className="text-xs">📯</span></div>
            </div>
            <div className="py-2">
              {image && <img src={image} alt={card.title} className="w-full h-24 object-cover rounded-lg mb-2 border border-stone-800" />}
              <h3 className="text-xl font-black mb-2">{card.title}</h3>
              <div className="bg-stone-950/70 p-3 rounded-xl border border-stone-800 mb-3"><p className="text-xs text-stone-300 italic">“{card.flavorText}”</p></div>
              <div className={`p-3 rounded-xl border flex gap-2.5 ${lekker ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200' : 'bg-red-950/40 border-red-500/50 text-red-200'}`}>
                <span>{lekker ? '⚡' : '🛑'}</span>
                <div><span className="text-[10px] uppercase font-mono font-bold block opacity-80">Road consequence</span><p className="text-xs font-semibold">{card.effectDescription}</p></div>
              </div>
            </div>
            <div className="pt-3 border-t border-stone-800 flex justify-between items-center">
              <span className="text-[10px] font-mono text-stone-500">MZANSI ROADS • #{card.id.toUpperCase()}</span>
              {card.statBadge && <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-300">{card.statBadge}</span>}
            </div>
          </div>
        </div>

        <div className="w-full mt-5">
          {interactive ? (
            <button onClick={onApply} disabled={!flipped} className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50 ${lekker ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950' : 'bg-amber-500 hover:bg-amber-400 text-stone-950'}`}>
              {lekker ? '🚀 Hit the gas' : '🛠️ Deal with it'}
            </button>
          ) : (
            <p className="text-center text-xs text-stone-400">{playerName} is reading the card…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventCardDrawerModal
