import { useEffect, useRef, useState } from 'react'
import type { Player, TriviaQuestion } from '../../types/game'
import { soundManager } from '../../utils/soundEffects'
import { invCount } from '../../engine/gameRules'

interface Props {
  question: TriviaQuestion
  activePlayer: Player
  interactive: boolean
  isAiPlayer?: boolean
  onResolve: (result: {
    correct: boolean
    generatorStarted: boolean
    secondsLeft: number
  }) => void
}

type Phase = 'blackout_alert' | 'generator_qte' | 'trivia' | 'result'
type Key = 'A' | 'B' | 'C' | 'D'

export function LoadSheddingModal({
  question,
  activePlayer,
  interactive,
  isAiPlayer = false,
  onResolve,
}: Props) {
  const [phase, setPhase] = useState<Phase>('blackout_alert')
  const [pullCount, setPullCount] = useState(0)
  const [qteLeft, setQteLeft] = useState(5)
  const [generatorStarted, setGeneratorStarted] = useState(false)

  const [triviaLeft, setTriviaLeft] = useState(15)
  const [selected, setSelected] = useState<Key | 'TIMEOUT' | null>(null)
  const [wasCorrect, setWasCorrect] = useState(false)

  const hasInverter = invCount(activePlayer.inventory, 'stoney_revival') > 0
  const qteEndRef = useRef(0)
  const triviaEndRef = useRef(0)

  // Phase 1: Blackout alert on mount
  useEffect(() => {
    soundManager.playBlackout()
    const timer = setTimeout(() => {
      if (hasInverter) {
        // Inverter bypass
        soundManager.playSuccessChime()
        setGeneratorStarted(true)
        setPhase('trivia')
        startTriviaRound(true)
      } else {
        setPhase('generator_qte')
        qteEndRef.current = Date.now() + 5000
      }
    }, 1800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Phase 2: QTE Timer for generator
  useEffect(() => {
    if (phase !== 'generator_qte') return
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((qteEndRef.current - Date.now()) / 1000))
      setQteLeft(rem)
      if (Date.now() >= qteEndRef.current) {
        clearInterval(id)
        // Generator failed
        soundManager.playGenerator(false)
        setGeneratorStarted(false)
        setPhase('trivia')
        startTriviaRound(false)
      }
    }, 200)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Pull generator cord
  const handlePullCord = () => {
    if (phase !== 'generator_qte') return
    const next = pullCount + 1
    setPullCount(next)
    soundManager.playDiceRattle()

    if (next >= 3) {
      soundManager.playGenerator(true)
      setGeneratorStarted(true)
      setPhase('trivia')
      startTriviaRound(true)
    }
  }

  // Start trivia round (normal or candle mode)
  const startTriviaRound = (powerOn: boolean) => {
    const dur = powerOn ? 15 : 8
    setTriviaLeft(dur)
    triviaEndRef.current = Date.now() + dur * 1000
  }

  // Trivia countdown timer
  useEffect(() => {
    if (phase !== 'trivia' || selected !== null) return
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((triviaEndRef.current - Date.now()) / 1000))
      setTriviaLeft(rem)
      if (rem <= 3 && rem > 0) soundManager.playClockTick(rem % 2 === 0)
      if (Date.now() >= triviaEndRef.current) {
        clearInterval(id)
        handleAnswer('TIMEOUT')
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected])

  const handleAnswer = (key: Key | 'TIMEOUT') => {
    setSelected(key)
    const correct = key === question.correctAnswer
    setWasCorrect(correct)
    if (correct) soundManager.playSuccessChime()
    else soundManager.playWrong()

    setPhase('result')
    setTimeout(() => {
      onResolve({
        correct,
        generatorStarted,
        secondsLeft: triviaLeft,
      })
    }, 2500)
  }

  // AI driver automated behaviour
  useEffect(() => {
    if (!isAiPlayer) return
    if (phase === 'generator_qte') {
      const timer = setTimeout(() => {
        // AI has 70% chance of successfully pulling generator
        if (Math.random() < 0.7) {
          handlePullCord()
          setTimeout(handlePullCord, 400)
          setTimeout(handlePullCord, 800)
        }
      }, 700)
      return () => clearTimeout(timer)
    }

    if (phase === 'trivia') {
      const timer = setTimeout(() => {
        const correct = Math.random() < (generatorStarted ? 0.8 : 0.45)
        handleAnswer(correct ? question.correctAnswer : 'A')
      }, generatorStarted ? 2500 : 1800)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isAiPlayer, generatorStarted])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-stone-950 border-2 border-yellow-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Amber Hazard Police Tape Top Banner */}
        <div className="px-6 py-3 bg-yellow-500 text-stone-950 font-black text-xs uppercase tracking-widest flex items-center justify-between">
          <span className="flex items-center gap-1.5 animate-pulse">
            <span>⚡</span> ESKOM ALERT: STAGE 6 LOAD SHEDDING
          </span>
          <span className="font-mono">GRID: DOWN</span>
        </div>

        {/* Phase 1: Blackout Alert */}
        {phase === 'blackout_alert' && (
          <div className="p-10 text-center space-y-4">
            <div className="text-6xl animate-pulse">💡💥</div>
            <h2 className="text-2xl font-black text-yellow-400">
              The Power Just Tripped!
            </h2>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              A substation transformer blew and the traffic signals died. Pitch darkness descends across the highway!
            </p>
          </div>
        )}

        {/* Phase 2: Generator QTE */}
        {phase === 'generator_qte' && (
          <div className="p-8 text-center space-y-5">
            <div>
              <div className="text-5xl mb-2">⚡🛢️</div>
              <h3 className="text-xl font-black text-yellow-300">
                Start The Emergency Generator!
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Pull the starter cord 3 times within {qteLeft}s to restore power, or answer by candlelight!
              </p>
            </div>

            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black text-base transition-all ${
                    pullCount >= num
                      ? 'bg-yellow-500 border-yellow-400 text-stone-950 scale-110 shadow-lg shadow-yellow-500/30'
                      : 'bg-stone-900 border-stone-800 text-stone-600'
                  }`}
                >
                  {pullCount >= num ? '⚡' : num}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!interactive && !isAiPlayer}
              onClick={handlePullCord}
              className="w-full max-w-xs mx-auto py-4 rounded-2xl bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-stone-950 font-black uppercase tracking-widest text-sm shadow-xl shadow-yellow-500/25 transition-all"
            >
              ✊ PULL CORD! ({pullCount}/3)
            </button>

            <div className="text-xs font-mono text-yellow-500/80">
              Time remaining: {qteLeft}s
            </div>
          </div>
        )}

        {/* Phase 3: Trivia (Powered vs Candlelight) */}
        {phase === 'trivia' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className={generatorStarted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {generatorStarted ? '⚡ Generator Hum: Power On!' : '🕯️ Emergency Candlelight: Options Blurred!'}
              </span>
              <span className={`font-bold ${triviaLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
                ⏱️ {triviaLeft}s
              </span>
            </div>

            <div className="w-full bg-stone-900 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${generatorStarted ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(triviaLeft / (generatorStarted ? 15 : 8)) * 100}%` }}
              />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-stone-100 min-h-[3rem]">
              {question.prompt}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((opt) => {
                const isSel = selected === opt.key
                const isRight = opt.key === question.correctAnswer
                const revealed = selected !== null
                let style = 'bg-stone-900 border-stone-800 hover:bg-stone-850'
                if (revealed) {
                  style = isRight
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                    : isSel
                    ? 'bg-red-950 border-red-500 text-red-200'
                    : 'bg-stone-950 opacity-40 border-stone-900'
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={!interactive && !isAiPlayer}
                    onClick={() => handleAnswer(opt.key)}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${style}`}
                  >
                    <span className="w-6 h-6 rounded-md bg-stone-950 border border-stone-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {opt.key}
                    </span>
                    <span className={`text-sm font-medium pt-0.5 ${!generatorStarted && !revealed ? 'blur-sm select-none' : ''}`}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Phase 4: Result */}
        {phase === 'result' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-4xl">{wasCorrect ? '🎉💡' : '⚡😵'}</div>
            <h3 className={`text-xl font-black ${wasCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
              {wasCorrect ? 'Answered Through The Darkness!' : 'Stage 6 Got The Better Of You!'}
            </h3>
            <p className="text-sm text-stone-300 max-w-sm mx-auto">
              {wasCorrect
                ? `Sharp! You powered through the blackout (+100 pts).`
                : `Missed in the dark! Better keep that generator serviced next time.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoadSheddingModal
