import { useMemo } from 'react'
import type { Player } from '../../types/game'
import type { MatchStats } from '../../engine/gameRules'
import { soundManager } from '../../utils/soundEffects'
import { SOUVENIRS } from '../../data/gameData'

interface Props {
  players: Player[]
  winnerId: string | null
  stats: MatchStats
  onExit: () => void
}

const VEHICLE_ICONS: Record<string, string> = {
  taxi: '🚕',
  bakkie: '🛻',
  citi_golf: '🚗',
}

export function PostMatchPodiumModal({ players, winnerId, stats, onExit }: Props) {
  // Sort players for podium: winner first, then by souvenirs, then points
  const ranked = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.id === winnerId) return -1
      if (b.id === winnerId) return 1
      if (b.souvenirs.length !== a.souvenirs.length) return b.souvenirs.length - a.souvenirs.length
      return b.points - a.points
    })
  }, [players, winnerId])

  // Compute Special Awards
  const awards = useMemo(() => {
    // 1. Pothole Magnet (most potholes hit)
    let maxPotholes = -1
    let potholeMagnet: Player | null = null
    for (const p of players) {
      const hits = stats.potholesHit[p.id] || 0
      if (hits > maxPotholes) {
        maxPotholes = hits
        potholeMagnet = p
      }
    }

    // 2. Toll Sprint Demon (most toll sprints cleared)
    let maxTolls = -1
    let tollDemon: Player | null = null
    for (const p of players) {
      const sprints = stats.tollSprintsCleared[p.id] || 0
      if (sprints > maxTolls) {
        maxTolls = sprints
        tollDemon = p
      }
    }

    // 3. Spaza VIP (most money spent)
    let maxSpent = -1
    let spazaVip: Player | null = null
    for (const p of players) {
      const spent = stats.spazaSpent[p.id] || 0
      if (spent > maxSpent) {
        maxSpent = spent
        spazaVip = p
      }
    }

    // 4. Mzansi Professor (highest trivia accuracy)
    let bestAcc = -1
    let professor: Player | null = null
    for (const p of players) {
      const t = stats.triviaAnswers[p.id]
      if (t && t.total >= 2) {
        const acc = t.correct / t.total
        if (acc > bestAcc) {
          bestAcc = acc
          professor = p
        }
      }
    }

    return {
      potholeMagnet: { player: potholeMagnet, count: maxPotholes },
      tollDemon: { player: tollDemon, count: maxTolls },
      spazaVip: { player: spazaVip, spent: maxSpent },
      professor: { player: professor, acc: bestAcc },
    }
  }, [players, stats])

  const handleShareWhatsApp = () => {
    const winner = ranked[0]
    const title = `🇿🇦 Mzansi Trivia Road Trip Results! 🚗💨\n\n`
    const podiumText = ranked
      .slice(0, 3)
      .map((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
        return `${medal} ${p.name}: ${p.points} pts (${p.souvenirs.length}/${SOUVENIRS.length} souvenirs)`
      })
      .join('\n')

    const awardsText = `\n\n🎖️ Mzansi Awards:\n` +
      `🕳️ Pothole Magnet: ${awards.potholeMagnet.player?.name || 'Nobody'} (${awards.potholeMagnet.count} hits)\n` +
      `⚡ Toll Sprint Demon: ${awards.tollDemon.player?.name || 'Nobody'} (${awards.tollDemon.count} sprints)\n` +
      `🛒 Spaza VIP: ${awards.spazaVip.player?.name || 'Nobody'} (R${awards.spazaVip.spent} spent)\n` +
      `🧠 Mzansi Professor: ${awards.professor.player ? `${awards.professor.player.name} (${Math.round(awards.professor.acc * 100)}%)` : winner?.name || 'Nobody'}`

    const url = typeof window !== 'undefined' ? `\n\nPlay here: ${window.location.origin}` : ''
    const fullMsg = `${title}${podiumText}${awardsText}${url}`

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMsg)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="max-w-xl w-full bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-5xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-black text-amber-400">Road Trip Champions</h2>
          <p className="text-xs text-stone-400">Mzansi national expedition completed · Lekker road trip!</p>
        </div>

        {/* Podium Standings (Top 3) */}
        <div className="flex items-end justify-center gap-2 pt-4 pb-2">
          {/* 2nd Place */}
          {ranked[1] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">{VEHICLE_ICONS[ranked[1].vehicle] || '🚗'}</span>
              <span className="text-xs font-bold text-stone-300 truncate max-w-[80px]">{ranked[1].name}</span>
              <span className="text-[10px] text-stone-400 font-mono mb-1">{ranked[1].points} pts</span>
              <div className="w-full bg-gradient-to-t from-stone-800 to-stone-700 h-24 rounded-t-xl flex flex-col items-center justify-center border-t-2 border-stone-400">
                <span className="text-2xl font-black text-stone-300">🥈</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase">2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place Winner */}
          {ranked[0] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-3xl mb-1">{VEHICLE_ICONS[ranked[0].vehicle] || '🚕'}</span>
              <span className="text-sm font-black text-amber-300 truncate max-w-[100px]">{ranked[0].name}</span>
              <span className="text-xs text-amber-400 font-mono font-bold mb-1">{ranked[0].points} pts</span>
              <div className="w-full bg-gradient-to-t from-amber-600 to-amber-500 h-32 rounded-t-xl flex flex-col items-center justify-center border-t-2 border-amber-300 shadow-lg shadow-amber-500/20">
                <span className="text-3xl font-black text-stone-950">🥇</span>
                <span className="text-xs font-black text-stone-950 uppercase tracking-wider">Winner</span>
                <span className="text-[10px] font-mono text-stone-900 font-bold mt-0.5">{ranked[0].souvenirs.length} souvenirs</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {ranked[2] && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">{VEHICLE_ICONS[ranked[2].vehicle] || '🛻'}</span>
              <span className="text-xs font-bold text-stone-300 truncate max-w-[80px]">{ranked[2].name}</span>
              <span className="text-[10px] text-stone-400 font-mono mb-1">{ranked[2].points} pts</span>
              <div className="w-full bg-gradient-to-t from-stone-900 to-amber-950/80 h-16 rounded-t-xl flex flex-col items-center justify-center border-t-2 border-amber-700">
                <span className="text-xl font-black text-amber-700">🥉</span>
                <span className="text-[10px] font-bold text-amber-700/80 uppercase">3rd</span>
              </div>
            </div>
          )}
        </div>

        {/* Distinctive Mzansi Awards Cards */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block text-center">
            🎖️ Distinctive Mzansi Road Awards
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Pothole Magnet */}
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <span className="text-2xl">🕳️</span>
              <div className="min-w-0">
                <span className="font-bold text-stone-200 block truncate">Pothole Magnet</span>
                <span className="text-[10px] text-stone-400 block truncate">
                  {awards.potholeMagnet.player?.name || 'Nobody'} ({awards.potholeMagnet.count} hits)
                </span>
              </div>
            </div>

            {/* Toll Demon */}
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div className="min-w-0">
                <span className="font-bold text-stone-200 block truncate">Toll Sprint Demon</span>
                <span className="text-[10px] text-stone-400 block truncate">
                  {awards.tollDemon.player?.name || 'Nobody'} ({awards.tollDemon.count} aced)
                </span>
              </div>
            </div>

            {/* Spaza VIP */}
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <span className="text-2xl">🛒</span>
              <div className="min-w-0">
                <span className="font-bold text-stone-200 block truncate">Spaza Shop VIP</span>
                <span className="text-[10px] text-stone-400 block truncate">
                  {awards.spazaVip.player?.name || 'Nobody'} (R{awards.spazaVip.spent} spent)
                </span>
              </div>
            </div>

            {/* Mzansi Professor */}
            <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <span className="text-2xl">🧠</span>
              <div className="min-w-0">
                <span className="font-bold text-stone-200 block truncate">Mzansi Professor</span>
                <span className="text-[10px] text-stone-400 block truncate">
                  {awards.professor.player
                    ? `${awards.professor.player.name} (${Math.round(awards.professor.acc * 100)}%)`
                    : ranked[0]?.name || 'Nobody'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => soundManager.playVuvuzela(true)}
              className="flex-1 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>🎺</span> Blow Vuvuzela!
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>📲</span> Share on WhatsApp
            </button>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            Back to Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
