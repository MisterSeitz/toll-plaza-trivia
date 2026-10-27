import { useEffect, useState } from 'react'
import type { Player } from '../../types/game'
import { soundManager } from '../../utils/soundEffects'
import { MZANSI_BOARD_GRAPH } from '../../engine/boardGraph'

interface Props {
  nodeId: string
  activePlayer: Player
  interactive: boolean
  isAiPlayer?: boolean
  onResolve: (result: {
    unlocked: boolean
    paidDirections: boolean
    cost: number
  }) => void
}

const NAV_QUESTIONS = [
  {
    prompt: 'Which national highway connects Colesberg directly to Cape Town through the Great Karoo?',
    options: ['N1', 'N2', 'N3', 'N4'],
    answer: 'N1',
  },
  {
    prompt: 'At the Colesberg junction, which highway branches south toward Gqeberha / Port Elizabeth?',
    options: ['N9 / R56', 'N4', 'N3', 'M1'],
    answer: 'N9 / R56',
  },
  {
    prompt: 'Heading north from Colesberg towards Johannesburg, which provincial capital city do you pass through first?',
    options: ['Bloemfontein', 'Durban', 'Kimberley', 'Polokwane'],
    answer: 'Bloemfontein',
  },
]

export function RoundaboutLockModal({
  nodeId,
  activePlayer,
  interactive,
  isAiPlayer = false,
  onResolve,
}: Props) {
  const node = MZANSI_BOARD_GRAPH[nodeId]
  const [phase, setPhase] = useState<'options' | 'dice' | 'trivia' | 'result'>('options')
  const [diceRoll, setDiceRoll] = useState<number | null>(null)
  const [question] = useState(() => NAV_QUESTIONS[Math.floor(Math.random() * NAV_QUESTIONS.length)])
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  const handleRollDice = () => {
    soundManager.playDiceRattle()
    setPhase('dice')
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1
      setDiceRoll(roll)
      const even = roll % 2 === 0
      if (even) {
        soundManager.playSuccessChime()
        setUnlocked(true)
        setResultMsg(`You rolled a ${roll} (Even)! Found the correct exit ramp!`)
      } else {
        soundManager.playWrong()
        setUnlocked(false)
        setResultMsg(`You rolled a ${roll} (Odd)! Missed the exit and took another lap around the circle.`)
      }
      setTimeout(() => setPhase('result'), 1200)
    }, 800)
  }

  const handleAnswerQuestion = (opt: string) => {
    setSelectedOpt(opt)
    const correct = opt === question.answer
    if (correct) {
      soundManager.playSuccessChime()
      setUnlocked(true)
      setResultMsg(`Sharp! ${opt} is correct — you navigated out onto the open road!`)
    } else {
      soundManager.playWrong()
      setUnlocked(false)
      setResultMsg(`Eish! The exit was ${question.answer}. You did an extra circle lap!`)
    }
    setTimeout(() => setPhase('result'), 1400)
  }

  const handlePayDirections = () => {
    if (activePlayer.points < 30) return
    soundManager.playCoin()
    setUnlocked(true)
    setResultMsg('The friendly petrol attendant pointed you directly down the N1. Unlocked!')
    setPhase('result')
    setTimeout(() => {
      onResolve({ unlocked: true, paidDirections: true, cost: 30 })
    }, 2200)
  }

  // AI Driver automated choices
  useEffect(() => {
    if (!isAiPlayer) return
    const timer = setTimeout(() => {
      if (activePlayer.points >= 50 && Math.random() < 0.5) {
        handlePayDirections()
      } else if (Math.random() < 0.5) {
        handleRollDice()
      } else {
        setPhase('trivia')
        setTimeout(() => handleAnswerQuestion(question.answer), 1500)
      }
    }, 1300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiPlayer])

  useEffect(() => {
    if (phase === 'result' && !resultMsg.includes('petrol attendant')) {
      const timer = setTimeout(() => {
        onResolve({ unlocked, paidDirections: false, cost: 0 })
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [phase, unlocked, resultMsg, onResolve])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950/30 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-spin" style={{ animationDuration: '6s' }}>🔄</span>
            <div>
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wider">
                Traffic Circle Lock
              </h2>
              <p className="text-[11px] text-stone-400 font-mono">
                {node?.name || 'Highway Roundabout'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-800 text-amber-400 border border-stone-700">
            {activePlayer.points} PTS
          </span>
        </div>

        {/* Phase: Options */}
        {phase === 'options' && (
          <div className="p-6 space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-100">
                Trapped in the Roundabout!
              </h3>
              <p className="text-xs text-stone-400">
                You are stuck circling the intersection. Choose how to break free onto the highway:
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Roll Even */}
              <button
                type="button"
                disabled={!interactive && !isAiPlayer}
                onClick={handleRollDice}
                className="w-full p-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-400 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-amber-300">🎲 Roll An Even Number</div>
                  <div className="text-xs text-stone-400">Roll 2, 4, or 6 to time the exit gap.</div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase">Roll →</span>
              </button>

              {/* Option 2: Highway Trivia */}
              <button
                type="button"
                disabled={!interactive && !isAiPlayer}
                onClick={() => setPhase('trivia')}
                className="w-full p-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-400 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-emerald-300">🗺️ Highway Navigation Trivia</div>
                  <div className="text-xs text-stone-400">Answer 1 quick route question correctly.</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Quiz →</span>
              </button>

              {/* Option 3: Pay Directions */}
              <button
                type="button"
                disabled={(!interactive && !isAiPlayer) || activePlayer.points < 30}
                onClick={handlePayDirections}
                className="w-full p-3.5 rounded-xl bg-stone-950/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-400 disabled:opacity-40 text-left transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-sm text-sky-300">⛽ Ask Attendant for Directions (R30)</div>
                  <div className="text-xs text-stone-400">Guaranteed instant exit down the highway.</div>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400 uppercase">Pay R30 →</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase: Dice Roll */}
        {phase === 'dice' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-6xl animate-bounce">
              {diceRoll ? `🎲 ${diceRoll}` : '🎲...'}
            </div>
            <p className="text-xs text-stone-400">Timing the traffic circle exit gap...</p>
          </div>
        )}

        {/* Phase: Trivia Question */}
        {phase === 'trivia' && (
          <div className="p-6 space-y-4">
            <div className="text-xs font-mono text-emerald-400 font-bold uppercase">
              🧭 Highway Direction Check
            </div>
            <h3 className="text-base font-bold text-stone-100">{question.prompt}</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={!interactive && !isAiPlayer}
                  onClick={() => handleAnswerQuestion(opt)}
                  className={`p-3 rounded-xl border text-sm font-bold font-mono transition-all ${
                    selectedOpt === opt
                      ? opt === question.answer
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : 'bg-red-950 border-red-500 text-red-200'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-4xl">{unlocked ? '🛣️💨' : '🔄😵'}</div>
            <h3 className={`text-xl font-black ${unlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
              {unlocked ? 'Exit Unlocked!' : 'Still Circling!'}
            </h3>
            <p className="text-sm text-stone-300 max-w-sm mx-auto">{resultMsg}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoundaboutLockModal
