import { useEffect, useRef, useState } from 'react'
import type { TriviaQuestion } from '../../types/game'
import { CATEGORY_META } from '../../data/gameData'
import { soundManager } from '../../utils/soundEffects'

interface Props {
  question: TriviaQuestion
  seconds: number
  blurred: boolean
  points: number
  playerName: string
  /** false for spectators: they see the prompt + clock, but cannot answer. */
  interactive: boolean
  isAiPlayer?: boolean
  hasFiftyFifty: boolean
  hasTimerBoost: boolean
  onUseFiftyFifty: () => void
  onUseTimerBoost: () => void
  onResolve: (correct: boolean, secondsLeft: number, timedOut: boolean) => void
}

type Key = 'A' | 'B' | 'C' | 'D'

export function TriviaChallengeModal({ question, seconds, blurred, points, playerName, interactive, isAiPlayer, hasFiftyFifty, hasTimerBoost, onUseFiftyFifty, onUseTimerBoost, onResolve }: Props) {
  const [left, setLeft] = useState(seconds)
  const [disabled, setDisabled] = useState<Key[]>([])
  const [selected, setSelected] = useState<Key | 'TIMEOUT' | null>(null)
  const revealed = selected !== null
  const endAt = useRef(Date.now() + seconds * 1000)
  const total = useRef(seconds)
  const resolved = useRef(false)
  const meta = CATEGORY_META[question.category]

  const finish = (key: Key | 'TIMEOUT') => {
    if (resolved.current) return
    resolved.current = true
    setSelected(key)
    const secondsLeft = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
    const correct = key === question.correctAnswer
    if (correct) soundManager.playSuccessChime()
    else soundManager.playWrong()
    if (interactive) setTimeout(() => onResolve(correct, secondsLeft, key === 'TIMEOUT'), 2200)
  }

  useEffect(() => {
    if (revealed || !interactive) return
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft((prev) => {
        if (prev !== rem && rem <= 5 && rem > 0) soundManager.playClockTick(rem % 2 === 0)
        return rem
      })
      if (Date.now() >= endAt.current) finish('TIMEOUT')
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, interactive])

  const fifty = () => {
    if (!hasFiftyFifty || disabled.length || revealed) return
    const wrong = question.options.map((o) => o.key).filter((k) => k !== question.correctAnswer)
    setDisabled(wrong.sort(() => 0.5 - Math.random()).slice(0, 2))
    onUseFiftyFifty()
  }

  const boost = () => {
    if (!hasTimerBoost || revealed) return
    endAt.current += 10_000
    total.current += 10
    setLeft((l) => l + 10)
    onUseTimerBoost()
  }

  const pct = Math.max(0, Math.min(100, (left / total.current) * 100))
  const bar = pct <= 25 ? 'bg-red-500 animate-pulse' : pct <= 55 ? 'bg-amber-400' : 'bg-emerald-500'
  const wasCorrect = selected === question.correctAnswer

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm select-none ${revealed && !wasCorrect ? 'animate-shake' : ''}`}>
      <div className="w-full max-w-xl bg-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${meta.badge}`}>{meta.icon} {meta.name}</span>
          <span className="font-mono text-xs text-stone-400">{interactive ? 'Your question' : isAiPlayer ? `🤖 ${playerName} is answering…` : `${playerName} is answering`}</span>
        </div>
        <div className="w-full bg-stone-950 h-2">
          <div className={`h-full transition-all duration-300 ease-linear ${bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between text-xs font-semibold mb-3">
            <span className="text-stone-400 uppercase tracking-wider">{blurred ? '⚡ Load shedding — options blurred!' : 'Trivia prompt'}</span>
            <span className={`font-mono text-sm ${left <= 4 ? 'text-red-400 font-bold' : 'text-stone-300'}`}>⏱️ {left}s</span>
          </div>
          <h2 className="text-lg md:text-xl font-medium leading-relaxed mb-6 min-h-[4rem]">{question.prompt}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {question.options.map((o) => {
              const off = disabled.includes(o.key)
              const isSel = selected === o.key
              const isRight = o.key === question.correctAnswer
              let style = 'bg-stone-800/80 border-stone-700/80 hover:bg-stone-800 active:scale-[0.98]'
              if (revealed) style = isRight ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : isSel ? 'bg-red-950 border-red-500 text-red-200' : 'bg-stone-900 border-stone-800 text-stone-500 opacity-40'
              else if (off) style = 'bg-stone-950/60 border-stone-900 text-stone-600 line-through opacity-30'
              const hidden = !interactive && !isAiPlayer && !revealed
              return (
                <button key={o.key} disabled={!interactive || off || revealed} onClick={() => finish(o.key)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${style}`}>
                  <span className="w-6 h-6 rounded-md bg-stone-900/90 border border-stone-700/60 flex items-center justify-center font-mono text-xs font-semibold shrink-0">{o.key}</span>
                  <span className={`text-sm font-medium pt-0.5 ${(blurred && !revealed) || hidden ? 'blur-sm' : ''}`}>{o.label}</span>
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className={`p-4 rounded-xl border text-sm ${wasCorrect ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'}`}>
              <div className="font-semibold mb-1">{wasCorrect ? 'Sharp! That is correct.' : selected === 'TIMEOUT' ? "Time's up!" : 'Eish! Not quite.'}</div>
              <p className="text-xs text-stone-300">{question.explanation}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-stone-950/60 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Power-ups</span>
            <button onClick={fifty} disabled={!interactive || !hasFiftyFifty || disabled.length > 0 || revealed || blurred}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium bg-stone-800 hover:bg-stone-700 border-amber-500/40 text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed">✂️ 50/50</button>
            <button onClick={boost} disabled={!interactive || !hasTimerBoost || revealed}
              className="px-3 py-1.5 rounded-lg border text-xs font-medium bg-stone-800 hover:bg-stone-700 border-sky-500/40 text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed">🍬 +10s</button>
          </div>
          <span className="text-xs font-mono text-stone-400">Wallet <span className="text-amber-400 font-semibold">{points} pts</span></span>
        </div>
      </div>
    </div>
  )
}

export default TriviaChallengeModal
