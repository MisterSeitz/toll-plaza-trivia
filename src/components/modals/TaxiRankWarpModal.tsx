import { useEffect, useState } from 'react'
import type { Player } from '../../types/game'
import { soundManager } from '../../utils/soundEffects'
import { MZANSI_BOARD_GRAPH } from '../../engine/boardGraph'
import { invCount } from '../../engine/gameRules'

interface Props {
  currentHubId: string
  activePlayer: Player
  interactive: boolean
  isAiPlayer?: boolean
  onResolve: (result: {
    tookTaxi: boolean
    destinationNodeId?: string
    usedPass: boolean
    farePoints: number
    hadRoadblock: boolean
  }) => void
}

const FARE_COST = 75

// Candidate hubs for warp routes from key stations
const TRANSIT_ROUTES: Record<string, string[]> = {
  node_jhb_central: ['node_n3_durban_beach', 'node_n1_bloem', 'node_n4_nelspruit'],
  node_n3_durban_beach: ['node_jhb_central', 'node_n2_gqeberha', 'node_n2_east_london'],
  node_n1_cpt_waterfront: ['node_n2_knysna', 'node_n1_bloem', 'node_n1_beaufort_west'],
  node_n1_bloem: ['node_jhb_central', 'node_n1_cpt_waterfront', 'node_n1_colesberg'],
  node_n2_gqeberha: ['node_n3_durban_beach', 'node_n2_knysna', 'node_n2_east_london'],
  node_n4_nelspruit: ['node_jhb_central', 'node_n4_witbank'],
}

export function TaxiRankWarpModal({
  currentHubId,
  activePlayer,
  interactive,
  isAiPlayer = false,
  onResolve,
}: Props) {
  const currentHub = MZANSI_BOARD_GRAPH[currentHubId]
  const candidateIds = TRANSIT_ROUTES[currentHubId] || ['node_jhb_central', 'node_n3_durban_beach']
  const destinations = candidateIds
    .filter((id) => id !== currentHubId && MZANSI_BOARD_GRAPH[id])
    .map((id) => MZANSI_BOARD_GRAPH[id])

  const [selectedDestId, setSelectedDestId] = useState<string>(destinations[0]?.id || '')
  const [phase, setPhase] = useState<'prompt' | 'transit' | 'result'>('prompt')
  const [hadRoadblock, setHadRoadblock] = useState(false)

  const hasPass = invCount(activePlayer.inventory, 'taxi_pass') > 0
  const canAfford = activePlayer.points >= FARE_COST || hasPass

  const handleBoardTaxi = () => {
    soundManager.playTaxiHooter()
    setPhase('transit')

    // 25% chance of roadblock / puncture detour
    const roadblock = Math.random() < 0.25
    setHadRoadblock(roadblock)

    setTimeout(() => {
      setPhase('result')
      if (roadblock) {
        soundManager.playTireScreech()
      } else {
        soundManager.playSuccessChime()
      }

      setTimeout(() => {
        onResolve({
          tookTaxi: true,
          destinationNodeId: selectedDestId,
          usedPass: hasPass,
          farePoints: hasPass ? 0 : FARE_COST,
          hadRoadblock: roadblock,
        })
      }, 2500)
    }, 2000)
  }

  const handleJustRest = () => {
    soundManager.playCoin()
    onResolve({
      tookTaxi: false,
      usedPass: false,
      farePoints: 0,
      hadRoadblock: false,
    })
  }

  // AI Driver decision
  useEffect(() => {
    if (!isAiPlayer) return
    const timer = setTimeout(() => {
      // AI likes taking the taxi if points > 150 or has pass
      if (canAfford && (hasPass || activePlayer.points >= 150) && destinations.length > 0) {
        setSelectedDestId(destinations[0].id)
        handleBoardTaxi()
      } else {
        handleJustRest()
      }
    }, 1400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiPlayer])

  const selectedDest = MZANSI_BOARD_GRAPH[selectedDestId]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-gradient-to-b from-stone-900 via-stone-900 to-amber-950/30 border-2 border-amber-500/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-950/80 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🚐💨</span>
            <div>
              <h2 className="text-base font-black text-amber-300 uppercase tracking-wider">
                Minibus Taxi Rank Transit
              </h2>
              <p className="text-[11px] text-stone-400 font-mono">
                {currentHub?.name || 'Provincial Taxi Rank'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-stone-800 text-amber-400 border border-stone-700">
            {activePlayer.points} PTS
          </span>
        </div>

        {/* Phase: Prompt */}
        {phase === 'prompt' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-100">
                "Ga-te-way! Who's going long distance?"
              </h3>
              <p className="text-xs text-stone-400">
                You can hitch a minibus taxi to bypass hundreds of kilometers down the highway, or rest here for +20 points.
              </p>
            </div>

            {/* Destination Selector */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase font-mono">
                  Select Destination Hub:
                </label>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Fare: {hasPass ? '1x TAXI PASS' : `R${FARE_COST}`}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {destinations.map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setSelectedDestId(dest.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedDestId === dest.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{dest.name}</div>
                      <div className="text-[11px] text-stone-400">{dest.region}</div>
                    </div>
                    <span className="text-lg">🛣️</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!interactive && !isAiPlayer}
                onClick={handleJustRest}
                className="py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold uppercase tracking-wider transition-all"
              >
                ☕ Just Rest (+20 pts)
              </button>

              <button
                type="button"
                disabled={(!interactive && !isAiPlayer) || !canAfford || destinations.length === 0}
                onClick={handleBoardTaxi}
                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                🚐 Board Quantum ({hasPass ? 'Pass' : `R${FARE_COST}`})
              </button>
            </div>
          </div>
        )}

        {/* Phase: Transit Animation */}
        {phase === 'transit' && (
          <div className="p-10 text-center space-y-4">
            <div className="text-5xl animate-bounce">🚐💨</div>
            <h3 className="text-lg font-black text-amber-400">
              Cruising down the National Highway...
            </h3>
            <p className="text-xs text-stone-400">
              Heading towards {selectedDest?.name || 'Destination'} at full speed with the bass pumping!
            </p>
            <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 animate-pulse w-full" />
            </div>
          </div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && (
          <div className="p-8 text-center space-y-4">
            <div className="text-4xl">{hadRoadblock ? '🛑🚔' : '🏁🌴'}</div>
            <h3 className={`text-xl font-black ${hadRoadblock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {hadRoadblock ? 'Roadblock Delay!' : 'Arrived Sharp Sharp!'}
            </h3>
            <p className="text-sm text-stone-300 max-w-sm mx-auto">
              {hadRoadblock
                ? `Traffic police inspection delayed the taxi! You reached ${selectedDest?.name} but lost momentum.`
                : `Flawless journey! The minibus pulled straight into ${selectedDest?.name}.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaxiRankWarpModal
