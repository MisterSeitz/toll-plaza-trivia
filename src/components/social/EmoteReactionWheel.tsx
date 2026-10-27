import { useState } from 'react'
import { soundManager } from '../../utils/soundEffects'

export interface ActiveEmote {
  id: string
  playerId: string
  playerName: string
  emoji: string
  timestamp: number
}

interface Props {
  onSendEmote: (emoji: string) => void
  disabled?: boolean
}

const EMOTE_OPTIONS = [
  { emoji: '🇿🇦', label: 'Mzansi', sound: () => soundManager.playSuccessChime() },
  { emoji: '🎺', label: 'Vuvuzela', sound: () => soundManager.playVuvuzela(false) },
  { emoji: '🚕', label: 'Taxi Horn', sound: () => soundManager.playTaxiHooter() },
  { emoji: '🥩', label: 'Braai', sound: () => soundManager.playBraaiCrackle(1.2) },
  { emoji: '🕳️', label: 'Pothole', sound: () => soundManager.playTireScreech() },
  { emoji: '🕯️', label: 'Blackout', sound: () => soundManager.playBlackout() },
  { emoji: '🤣', label: 'Lekker laugh', sound: () => soundManager.playStreakBeep() },
  { emoji: '😱', label: 'Hayibo!', sound: () => soundManager.playWrong() },
]

export function EmoteReactionWheel({ onSendEmote, disabled }: Props) {
  const [open, setOpen] = useState(false)

  const handleSelect = (item: (typeof EMOTE_OPTIONS)[number]) => {
    item.sound()
    onSendEmote(item.emoji)
    setOpen(false)
  }

  return (
    <div className="relative">
      {open && (
        <div
          className="absolute bottom-12 right-0 z-40 flex items-center gap-1.5 p-2 bg-stone-900/95 backdrop-blur-md border border-stone-700/80 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {EMOTE_OPTIONS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              title={item.label}
              onClick={() => handleSelect(item)}
              className="w-10 h-10 rounded-xl hover:bg-stone-800 active:scale-125 text-2xl flex items-center justify-center transition-all hover:scale-110"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        title="Reaction Emotes"
        aria-label="Reaction Emotes"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all shadow-xl active:scale-95 border ${
          open
            ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold scale-105'
            : 'bg-stone-900/90 hover:bg-stone-800 text-amber-300 border-stone-700'
        }`}
      >
        💬
      </button>
    </div>
  )
}

export function FloatingEmoteOverlay({ emotes, playerPositions }: {
  emotes: ActiveEmote[]
  playerPositions: Record<string, { x: number; y: number }>
}) {
  const visible = emotes.slice(-5)
  if (!visible.length) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {visible.map((e) => {
        const pos = playerPositions[e.playerId]
        // If coordinate on map is known, position near player; else center top
        const style = pos
          ? { left: `${pos.x}px`, top: `${pos.y - 45}px` }
          : { right: '2rem', bottom: '6rem' }

        return (
          <div
            key={e.id}
            style={style}
            className="absolute -translate-x-1/2 flex flex-col items-center animate-bounce duration-1000"
          >
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-950/90 border border-amber-400/80 shadow-2xl backdrop-blur-sm">
              <span className="text-2xl drop-shadow">{e.emoji}</span>
              <span className="text-[10px] font-bold text-amber-300 font-mono">{e.playerName}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
