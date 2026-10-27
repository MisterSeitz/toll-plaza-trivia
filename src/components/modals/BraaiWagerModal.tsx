import { useEffect, useRef, useState } from 'react'
import type { Player, TriviaQuestion } from '../../types/game'
import { soundManager } from '../../utils/soundEffects'
import { AI_PERSONAS } from '../../engine/aiDriverEngine'

interface Props {
  question: TriviaQuestion
  activePlayer: Player
  allPlayers: Player[]
  interactive: boolean
  isAiPlayer?: boolean
  onResolve: (result: {
    won: boolean
    wagerAmount: number
    challengedPlayerId?: string
    gotSouvenir: boolean
  }) => void
}

type Phase = 'choose_mode' | 'question' | 'result'
type Key = 'A' | 'B' | 'C' | 'D'

export function BraaiWagerModal({
  question,
  activePlayer,
  allPlayers,
  interactive,
  isAiPlayer = false,
  onResolve,
}: Props) {
  const [phase, setPhase] = useState<Phase>('choose_mode')
  const [mode, setMode] = useState<'solo' | 'wager'>('solo')
  const [wager, setWager] = useState(50)

  const opponents = allPlayers.filter((p) => p.id !== activePlayer.id)
  const [challengedId, setChallengedId] = useState<string>(opponents[0]?.id || '')

  const [left, setLeft] = useState(12)
  const [selected, setSelected] = useState<Key | 'TIMEOUT' | null>(null)
  const [aiOpponentAnswered, setAiOpponentAnswered] = useState<{ correct: boolean; timeUsed: number } | null>(null)
  const [resultMsg, setResultMsg] = useState('')
  const [wonWager, setWonWager] = useState(false)

  const endAt = useRef(0)
  const doneRef = useRef(false)

  const challengedPlayer = allPlayers.find((p) => p.id === challengedId)

  useEffect(() => {
    soundManager.playBraaiCrackle(1.4)
  }, [])

  // Start the actual question round
  const startQuestion = (chosenMode: 'solo' | 'wager') => {
    soundManager.playBraaiCrackle(1.8)
    setMode(chosenMode)
    setPhase('question')
    endAt.current = Date.now() + 12000
    setLeft(12)

    // If opponent is AI in a wager, simulate their response
    if (chosenMode === 'wager' && challengedPlayer?.isAi) {
      const persona = AI_PERSONAS[challengedPlayer.aiPersona || 'oom_piet'] || AI_PERSONAS.oom_piet
      const correctRate = persona.triviaAccuracy.braai_chow || 0.8
      const isCorrect = Math.random() <= correctRate
      const timeUsed = Math.floor(2500 + Math.random() * 3500)
      setTimeout(() => {
        setAiOpponentAnswered({ correct: isCorrect, timeUsed: Math.floor(timeUsed / 1000) })
      }, timeUsed)
    }
  }

  // Answer handler
  const handleAnswer = (key: Key | 'TIMEOUT') => {
    if (doneRef.current) return
    doneRef.current = true
    setSelected(key)

    const correct = key === question.correctAnswer
    const timeUsed = Math.max(1, Math.ceil((12000 - (endAt.current - Date.now())) / 1000))

    if (correct) {
      soundManager.playSuccessChime()
    } else {
      soundManager.playWrong()
    }

    let win = false
    let msg = ''

    if (mode === 'solo') {
      win = correct
      msg = correct
        ? `Lekker braai master! You aced the question (+100 pts) and unlocked the Golden Braai Tongs!`
        : `Eish, the chops are burnt! Better luck next braai.`
    } else {
      // Wager showdown
      const oppCorrect = aiOpponentAnswered ? aiOpponentAnswered.correct : false
      const oppTime = aiOpponentAnswered ? aiOpponentAnswered.timeUsed : 6

      if (correct && (!oppCorrect || timeUsed <= oppTime)) {
        win = true
        msg = `Sizzling victory! You outsmarted ${challengedPlayer?.name || 'opponent'} and won the R${wager * 2} wager pot!`
      } else if (correct && oppCorrect && timeUsed > oppTime) {
        win = false
        msg = `Both got it right, but ${challengedPlayer?.name || 'opponent'} answered faster! You lost R${wager}.`
      } else {
        win = false
        msg = `Missed! ${challengedPlayer?.name || 'opponent'} wins the wager of R${wager}.`
      }
    }

    setWonWager(win)
    setResultMsg(msg)
    setPhase('result')

    setTimeout(() => {
      onResolve({
        won: win,
        wagerAmount: mode === 'wager' ? wager : 0,
        challengedPlayerId: mode === 'wager' ? challengedId : undefined,
        gotSouvenir: win,
      })
    }, 2800)
  }

  // AI driver auto-plays when active
  useEffect(() => {
    if (!isAiPlayer) return
    if (phase === 'choose_mode') {
      const timer = setTimeout(() => {
        // AI decides whether to wager or go solo
        const wantsWager = Math.random() < 0.6 && opponents.length > 0 && activePlayer.points >= 50
        if (wantsWager) {
          setWager(50)
          startQuestion('wager')
        } else {
          startQuestion('solo')
        }
      }, 1300)
      return () => clearTimeout(timer)
    }

    if (phase === 'question') {
      const persona = AI_PERSONAS[activePlayer.aiPersona || 'bra_dan'] || AI_PERSONAS.bra_dan
      const correctRate = persona.triviaAccuracy.braai_chow || 0.8
      const isCorrect = Math.random() <= correctRate
      const thinkingMs = Math.floor(2000 + Math.random() * 2500)

      const timer = setTimeout(() => {
        handleAnswer(isCorrect ? question.correctAnswer : 'A')
      }, thinkingMs)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isAiPlayer])

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question' || selected !== null) return
    const id = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000))
      setLeft(rem)
      if (rem <= 4 && rem > 0) soundManager.playClockTick(rem % 2 === 0)
      if (Date.now() >= endAt.current) {
        clearInterval(id)
        handleAnswer('TIMEOUT')
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selected])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950/40 border-2 border-amber-600/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/80 border-b border-amber-600/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-pulse">🥩🔥</span>
            <div>
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wider">
                Braai Stand Showdown
              </h2>
              <p className="text-[11px] text-amber-200/70 font-mono">
                {activePlayer.name}'s Pitstop Duel
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {activePlayer.points} PTS
          </span>
        </div>

        {/* Phase 1: Mode Selection */}
        {phase === 'choose_mode' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-100">
                The coals are white hot! How do you want to play?
              </h3>
              <p className="text-xs text-stone-400">
                Play solo for points & souvenir, or challenge an opponent to a high-stakes trivia wager.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Solo */}
              <button
                type="button"
                disabled={!interactive && !isAiPlayer}
                onClick={() => startQuestion('solo')}
                className="p-4 rounded-2xl bg-stone-950/80 hover:bg-stone-800 border-2 border-stone-700 hover:border-amber-400 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-2xl mb-1">🍖</div>
                  <div className="font-black text-sm text-amber-300 group-hover:text-amber-200">
                    Solo Braai Master
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Answer 1 question to win +100 points and the Golden Braai Tongs souvenir.
                  </p>
                </div>
                <span className="mt-4 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Play Solo →
                </span>
              </button>

              {/* Option B: Wager Duel */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border-2 border-amber-600/60 flex flex-col justify-between">
                <div>
                  <div className="text-2xl mb-1">⚔️</div>
                  <div className="font-black text-sm text-amber-400">
                    Challenge an Opponent
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Wager Padstal points on a head-to-head buzzer duel! Winner takes the pot.
                  </p>

                  {opponents.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase font-mono">Opponent:</label>
                        <select
                          value={challengedId}
                          onChange={(e) => setChallengedId(e.target.value)}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                        >
                          {opponents.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.isAi ? '🤖 ' : ''}{o.name} ({o.points} pts)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-stone-400 uppercase font-mono">Wager:</label>
                        <div className="flex gap-2 mt-0.5">
                          {[50, 100, 150].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setWager(amt)}
                              disabled={activePlayer.points < amt}
                              className={`flex-1 py-1 rounded text-xs font-mono font-bold border transition-all ${
                                wager === amt
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                                  : 'bg-stone-900 text-stone-400 border-stone-800 disabled:opacity-30'
                              }`}
                            >
                              R{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 mt-2">No opponents in match to duel.</p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={(!interactive && !isAiPlayer) || opponents.length === 0 || activePlayer.points < wager}
                  onClick={() => startQuestion('wager')}
                  className="w-full mt-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-black uppercase tracking-wider text-xs active:scale-95 transition-all shadow-lg shadow-amber-600/30"
                >
                  ⚔️ Start Duel (R{wager})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: The Question */}
        {phase === 'question' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">
                {mode === 'wager' ? `⚔️ Wager Duel vs ${challengedPlayer?.name} (Pot: R${wager * 2})` : '🍖 Solo Braai Question'}
              </span>
              <span className={`font-bold ${left <= 4 ? 'text-red-400 animate-pulse' : 'text-stone-300'}`}>
                ⏱️ {left}s left
              </span>
            </div>

            <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300 ease-linear"
                style={{ width: `${(left / 12) * 100}%` }}
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
                let style = 'bg-stone-950/80 border-stone-800 hover:bg-stone-800'
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
                    <span className="w-6 h-6 rounded-md bg-stone-900 border border-stone-700 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      {opt.key}
                    </span>
                    <span className="text-sm font-medium pt-0.5">{opt.label}</span>
                  </button>
                )
              })}
            </div>

            {aiOpponentAnswered && mode === 'wager' && (
              <p className="text-xs text-amber-300 font-mono italic">
                🤖 {challengedPlayer?.name} has locked in an answer!
              </p>
            )}
          </div>
        )}

        {/* Phase 3: Result */}
        {phase === 'result' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-4xl mb-2">{wonWager ? '🏆🥩' : '💨🔥'}</div>
            <h3 className={`text-xl font-black ${wonWager ? 'text-emerald-400' : 'text-amber-400'}`}>
              {wonWager ? 'Victory at the Braai!' : 'Burnt to a Crisp!'}
            </h3>
            <p className="text-sm text-stone-300 max-w-md mx-auto">{resultMsg}</p>
            <div className="p-3 bg-stone-950/70 rounded-xl border border-stone-800 text-xs text-stone-400 max-w-md mx-auto">
              <span className="font-bold text-amber-400">Did you know?</span> {question.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BraaiWagerModal
