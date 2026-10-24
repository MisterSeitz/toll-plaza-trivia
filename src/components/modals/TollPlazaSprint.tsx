import { useEffect, useRef, useState } from 'react'
import { TOLL_QUESTIONS } from '../../data/tollQuestions'
import { soundManager } from '../../utils/soundEffects'

interface Props {
  tollName: string
  interactive: boolean
  playerName: string
  canPay: boolean
  canUsePass: boolean
  tollCost: number
  targetStreak?: number
  totalSeconds?: number
  onResolve: (method: 'sprint' | 'pay' | 'pass' | 'fail') => void
}

type Phase = 'ready' | 'playing' | 'passed' | 'failed'

export function TollPlazaSprint({ tollName, interactive, playerName, canPay, canUsePass, tollCost, targetStreak = 3, totalSeconds = 10, onResolve }: Props) {
  const [questions] = useState(() => [...TOLL_QUESTIONS].sort(() => 0.5 - Math.random()))
  const [idx, setIdx] = useState(0)
  const [streak, setStreak] = useState(0)
  const [left, setLeft] = useState(totalSeconds)
  const [phase, setPhase] = useState<Phase>('ready')
  const [msg, setMsg] = useState('')
  const endAt = useRef(0)
  const done = useRef(false)

  const fail = (text: string) => {
    if (done.current) return
    done.current = true
    setPhase('failed')
    setMsg(text)
    soundManager.playTollSiren()
    setTimeout(() => onResolve('fail'), 1800)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft((p) => {
        if (p !== rem && rem > 0) soundManager.playClockTick(rem % 2 === 0)
        return rem
      })
      if (Date.now() >= endAt.current) {
        clearInterval(id)
        fail("Time expired — the alarm sounds!")
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = () => {
    endAt.current = Date.now() + totalSeconds * 1000
    setLeft(totalSeconds)
    setPhase('playing')
  }

  const answer = (val: boolean) => {
    if (phase !== 'playing') return
    const q = questions[idx % questions.length]
    if (val === q.isTrue) {
      const next = streak + 1
      setStreak(next)
      if (next >= targetStreak) {
        done.current = true
        setPhase('passed')
        soundManager.playSuccessChime()
        setTimeout(() => onResolve('sprint'), 1300)
      } else {
        soundManager.playStreakBeep()
        setIdx((i) => i + 1)
      }
    } else {
      fail(`Eish! ${q.explanation}`)
    }
  }

  const q = questions[idx % questions.length]
  const pct = phase === 'playing' ? (left / totalSeconds) * 100 : 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-stone-900 border-2 border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-stone-100">
        <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🛑</span>
            <div>
              <div className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold">Toll plaza chokepoint</div>
              <h2 className="text-sm font-semibold">{tollName}</h2>
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: targetStreak }).map((_, i) => (
              <div key={i} className={`w-3.5 h-3.5 rounded-full border transition-all ${i < streak ? 'bg-emerald-500 border-emerald-400 scale-110' : 'bg-stone-800 border-stone-700'}`} />
            ))}
          </div>
        </div>
        <div className="w-full bg-stone-950 h-2.5 overflow-hidden">
          <div className={`h-full transition-all duration-300 ease-linear ${pct <= 30 ? 'bg-red-500 animate-pulse' : pct <= 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-full h-12 bg-stone-950 border border-stone-800 rounded-xl relative flex items-center px-4 overflow-hidden mb-5">
            <div className={`h-2.5 w-full rounded transition-all duration-700 ${phase === 'passed' ? 'bg-emerald-500 -translate-y-8 opacity-0' : 'bg-[repeating-linear-gradient(45deg,#ef4444,#ef4444_12px,#ffffff_12px,#ffffff_24px)]'}`} />
            <span className="absolute right-4 text-[10px] font-mono text-stone-400 uppercase tracking-widest">{phase === 'passed' ? 'Gate open' : 'Barrier down'}</span>
          </div>

          {!interactive && phase === 'ready' && <p className="text-sm text-stone-300 py-6">{playerName} is deciding how to cross the toll gate…</p>}

          {interactive && phase === 'ready' && (
            <div className="py-2 w-full">
              <h3 className="text-lg font-semibold mb-2">Toll boom gate sprint</h3>
              <p className="text-xs text-stone-300 max-w-sm mx-auto mb-6">Answer {targetStreak} True/False questions in {totalSeconds}s to lift the gate for free — or pay up.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={start} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 text-xs font-semibold uppercase tracking-wider">Start sprint ({totalSeconds}s)</button>
                <button disabled={!canPay} onClick={() => onResolve('pay')} className="px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed">Pay {tollCost} pts</button>
                {canUsePass && <button onClick={() => onResolve('pass')} className="px-6 py-3 rounded-xl bg-sky-900/50 hover:bg-sky-800/60 text-sky-200 text-xs font-semibold uppercase tracking-wider border border-sky-700/50">🚐 Use Taxi Hooter</button>}
              </div>
            </div>
          )}

          {phase === 'playing' && (
            <div className="w-full">
              <div className="flex justify-between text-xs font-mono text-stone-400 mb-2">
                <span>Streak {streak}/{targetStreak}</span>
                <span className={left <= 3 ? 'text-red-400 font-bold' : ''}>{left}s left</span>
              </div>
              <div className="min-h-[5.5rem] bg-stone-950/70 border border-stone-800 rounded-2xl p-4 flex items-center justify-center mb-6">
                <p className="text-sm sm:text-base font-medium leading-relaxed">{q.prompt}</p>
              </div>
              {interactive ? (
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => answer(true)} className="py-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border-2 border-emerald-600/50 text-emerald-300 text-sm font-semibold uppercase">✓ True</button>
                  <button onClick={() => answer(false)} className="py-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border-2 border-rose-600/50 text-rose-300 text-sm font-semibold uppercase">✕ False</button>
                </div>
              ) : (
                <p className="text-xs text-stone-400">{playerName} is racing the clock…</p>
              )}
            </div>
          )}

          {phase === 'passed' && (
            <div className="py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-2xl mb-3 text-emerald-400">✓</div>
              <h3 className="text-base font-semibold text-emerald-300">Gate lifted!</h3>
            </div>
          )}
          {phase === 'failed' && (
            <div className="py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-2xl mb-3 text-red-400">✕</div>
              <h3 className="text-base font-semibold text-red-300">Toll alarm sounded</h3>
              <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1">{msg}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-3 bg-stone-950/80 border-t border-stone-800 flex justify-between text-[11px] text-stone-500 font-mono">
          <span>FAST-PACED TOLL PASS</span><span>{totalSeconds}s BLITZ</span>
        </div>
      </div>
    </div>
  )
}

export default TollPlazaSprint
