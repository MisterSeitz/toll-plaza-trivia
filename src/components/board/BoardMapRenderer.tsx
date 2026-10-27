import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { BoardGraph, BoardNode, MovementPathOption, Player } from '../../types/game'
import { NODE_COORDINATES } from '../../engine/boardGraph'
import { CATEGORY_META, SOUVENIRS } from '../../data/gameData'

interface Props {
  graph: BoardGraph
  players: Player[]
  activePlayerId: string
  reachable: MovementPathOption[]
  canInteract: boolean
  onSelectDestination: (o: MovementPathOption) => void
}

const SPECIAL: Record<string, { fill: string; stroke: string; icon: string; label: string; badgeColor: string }> = {
  hub: { fill: '#0f766e', stroke: '#2dd4bf', icon: '★', label: 'FINISH / REST', badgeColor: '#2dd4bf' },
  toll_gate: { fill: '#be123c', stroke: '#fb7185', icon: '🛑', label: 'TOLL R100', badgeColor: '#fb7185' },
  padstal: { fill: '#b45309', stroke: '#f59e0b', icon: '☕', label: '+25 PTS & CARD', badgeColor: '#f59e0b' },
  spaza: { fill: '#4d7c0f', stroke: '#a3e635', icon: '🛒', label: 'SPAZA SHOP', badgeColor: '#a3e635' },
  pothole: { fill: '#44403c', stroke: '#f97316', icon: '⚠️', label: 'POTHOLE', badgeColor: '#f97316' },
  load_shedding: { fill: '#3f3f46', stroke: '#fde047', icon: '⚡', label: 'BLACKOUT', badgeColor: '#fde047' },
}

const VEHICLE: Record<string, string> = { taxi: '🚕', bakkie: '🛻', citi_golf: '🚗' }

const SOUVENIR_BY_CAT = Object.fromEntries(SOUVENIRS.map((s) => [s.category, s]))

function tileStyle(n: BoardNode) {
  if (n.isRoundabout) {
    return {
      fill: '#0369a1',
      stroke: '#38bdf8',
      icon: '🔄',
      label: 'TRAFFIC CIRCLE',
      badgeColor: '#38bdf8',
    }
  }
  if (n.category === 'hub') {
    return {
      fill: '#0f766e',
      stroke: '#2dd4bf',
      icon: '★',
      label: 'TAXI RANK & HUB',
      badgeColor: '#2dd4bf',
    }
  }
  if (n.category === 'braai_chow') {
    return {
      fill: '#c2410c',
      stroke: '#fb923c',
      icon: '🥩',
      label: 'BRAAI WAGER',
      badgeColor: '#fb923c',
    }
  }
  if (n.category in SPECIAL) return SPECIAL[n.category]
  const m = CATEGORY_META[n.category as keyof typeof CATEGORY_META]
  const s = SOUVENIR_BY_CAT[n.category]
  return {
    fill: m?.fill || '#3b82f6',
    stroke: m?.stroke || '#93c5fd',
    icon: m?.icon || '❓',
    label: s ? `${s.icon} ${s.name.slice(0, 11)}` : '+100 PTS',
    badgeColor: m?.stroke || '#facc15',
  }
}


export function BoardMapRenderer({
  graph,
  players,
  activePlayerId,
  reachable,
  canInteract,
  onSelectDestination,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const reachMap = useMemo(() => new Map(reachable.map((o) => [o.targetNodeId, o])), [reachable])

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [followActive, setFollowActive] = useState(false)

  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  })
  const touchStartDistRef = useRef<number | null>(null)
  const touchStartPanRef = useRef<{ x: number; y: number } | null>(null)

  const activePlayer = players.find((p) => p.id === activePlayerId)

  // Edge definition with Highway styling
  const edges = useMemo(() => {
    const seen = new Set<string>()
    const list: { id: string; a: string; b: string; label: string; gravel: boolean }[] = []
    Object.values(graph).forEach((n) =>
      n.edges.forEach((e) => {
        const key = [n.id, e.targetNodeId].sort().join('--')
        if (seen.has(key)) return
        seen.add(key)
        list.push({ id: key, a: n.id, b: e.targetNodeId, label: e.highwayLabel, gravel: e.routeType !== 'tar' })
      }),
    )
    return list
  }, [graph])

  // Center on coordinates helper
  const focusCoordinates = useCallback((cx: number, cy: number, targetZoom = 1.45) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // SVG coordinate space is 1260 x 900
    const svgW = 1260
    const scale = (rect.width / svgW) * targetZoom

    const offsetX = rect.width / 2 - cx * scale
    const offsetY = rect.height / 2 - cy * scale

    setZoom(targetZoom)
    setPan({ x: offsetX, y: offsetY })
  }, [])

  // Auto-focus on active player if follow active is enabled
  useEffect(() => {
    if (!followActive || !activePlayer) return
    const coord = NODE_COORDINATES[activePlayer.currentNodeId]
    if (coord) {
      focusCoordinates(coord.x, coord.y, zoom < 1.2 ? 1.4 : zoom)
    }
  }, [activePlayer?.currentNodeId, followActive, focusCoordinates, zoom, activePlayer])

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return
    setIsPanning(true)
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStartRef.current.mouseX
    const dy = e.clientY - panStartRef.current.mouseY
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    })
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setZoom((z) => {
      const next = Math.max(0.75, Math.min(2.5, +(z + delta).toFixed(2)))
      return next
    })
  }

  // Touch Handlers for mobile pan & pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true)
      panStartRef.current = {
        mouseX: e.touches[0].clientX,
        mouseY: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      }
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      touchStartDistRef.current = dist
      touchStartPanRef.current = { ...pan }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - panStartRef.current.mouseX
      const dy = e.touches[0].clientY - panStartRef.current.mouseY
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      })
    } else if (e.touches.length === 2 && touchStartDistRef.current != null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const ratio = dist / touchStartDistRef.current
      setZoom((z) => Math.max(0.75, Math.min(2.5, +(z * ratio).toFixed(2))))
      touchStartDistRef.current = dist
    }
  }

  const handleTouchEnd = () => {
    setIsPanning(false)
    touchStartDistRef.current = null
  }

  // Reset to full view
  const handleResetZoom = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    setFollowActive(false)
  }

  const handleFocusActive = () => {
    if (!activePlayer) return
    const coord = NODE_COORDINATES[activePlayer.currentNodeId]
    if (coord) {
      focusCoordinates(coord.x, coord.y, 1.5)
      setFollowActive(true)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-stone-950 flex items-center justify-center cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Interactive Map Zoom Controls Toolbar */}
      <div
        className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 p-1.5 bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Zoom In"
            aria-label="Zoom In"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-base font-bold flex items-center justify-center transition-all border border-stone-700"
          >
            +
          </button>
          <span className="text-[11px] font-mono font-bold text-amber-400 px-1.5 text-center min-w-[3rem]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            title="Zoom Out"
            aria-label="Zoom Out"
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
            className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 text-base font-bold flex items-center justify-center transition-all border border-stone-700"
          >
            −
          </button>
        </div>

        <div className="flex gap-1 border-t border-stone-800 pt-1.5">
          <button
            type="button"
            title="Overview (1x)"
            onClick={() => {
              setZoom(1.0)
              setPan({ x: 0, y: 0 })
            }}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border ${
              zoom === 1.0 && pan.x === 0 && pan.y === 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            1x
          </button>
          <button
            type="button"
            title="Regional (1.5x)"
            onClick={() => {
              setZoom(1.5)
            }}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border ${
              zoom === 1.5
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            1.5x
          </button>
          <button
            type="button"
            title="Focus (2x)"
            onClick={() => {
              setZoom(2.0)
            }}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border ${
              zoom === 2.0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
            }`}
          >
            2x
          </button>
        </div>

        <div className="flex gap-1 border-t border-stone-800 pt-1.5">
          <button
            type="button"
            title="Follow Active Player"
            onClick={handleFocusActive}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all border ${
              followActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <span>📍</span> <span>Focus</span>
          </button>
          <button
            type="button"
            title="Fit to Screen"
            onClick={handleResetZoom}
            className="py-1 px-2 rounded-lg text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-400 border border-stone-700"
          >
            ⛶ Fit
          </button>
        </div>
      </div>

      {/* SVG Canvas with Transform */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 1260 900"
          className="w-full h-full max-h-full drop-shadow-2xl overflow-visible"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="South Africa highway board map"
        >
          <defs>
            <radialGradient id="map-bg" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#24211e" />
              <stop offset="60%" stopColor="#171513" />
              <stop offset="100%" stopColor="#0c0a09" />
            </radialGradient>

            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="reachable-glow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="8" result="blur1" />
              <feGaussianBlur stdDeviation="4" result="blur2" />
              <feMerge>
                <feMergeNode in="blur1" />
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="n1-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            <pattern id="gravel-pattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#78350f" opacity="0.6" />
              <circle cx="8" cy="8" r="1.5" fill="#92400e" opacity="0.5" />
            </pattern>
          </defs>

          {/* Map Base Surface */}
          <rect width="1260" height="900" rx="32" fill="url(#map-bg)" />

          {/* Stylized Provincial Geographic Watermarks & Borders */}
          <g opacity="0.18" fill="none" stroke="#78716c" strokeWidth="1" strokeDasharray="3 3">
            <path d="M 640 40 L 780 40 L 860 210 L 640 210 Z" />
            <path d="M 640 210 L 820 210 L 820 370 L 640 370 Z" />
            <path d="M 460 370 L 840 370 L 880 570 L 460 570 Z" />
            <path d="M 840 370 L 1180 370 L 1180 840 L 840 840 Z" />
            <path d="M 240 570 L 640 570 L 640 840 L 240 840 Z" />
          </g>

          <g fill="#57534e" opacity="0.32" fontFamily="Outfit, sans-serif" fontWeight="900" letterSpacing="4">
            <text x="760" y="45" fontSize="13">LIMPOPO / WATERBERG</text>
            <text x="720" y="225" fontSize="13">GAUTENG (HIGHVELD)</text>
            <text x="960" y="240" fontSize="13">MPUMALANGA LOWVELD</text>
            <text x="940" y="605" fontSize="14">DRAKENSBERG ESCARPMENT</text>
            <text x="1040" y="865" fontSize="13">KWAZULU-NATAL COAST</text>
            <text x="560" y="475" fontSize="14">FREE STATE PLAINS</text>
            <text x="360" y="660" fontSize="16">GREAT KAROO</text>
            <text x="150" y="760" fontSize="14">CAPE PENINSULA</text>
            <text x="360" y="855" fontSize="12">GARDEN ROUTE</text>
            <text x="700" y="865" fontSize="12">SUNSHINE / WILD COAST</text>
          </g>

          {/* Landmark Vector Silhouettes */}
          {/* Table Mountain Silhouette at Cape Town (130, 805) */}
          <g transform="translate(60, 775)" opacity="0.22" fill="#78716c">
            <path d="M 0 35 L 20 20 L 35 12 L 85 12 L 100 20 L 120 35 Z" />
            <text x="60" y="48" fontSize="8" fill="#a8a29e" textAnchor="middle" fontWeight="bold">TABLE MOUNTAIN</text>
          </g>

          {/* Drakensberg Mountain Peaks near Van Reenen (930, 650) */}
          <g transform="translate(850, 615)" opacity="0.22" fill="#78716c">
            <path d="M 0 30 L 18 10 L 32 24 L 48 4 L 64 22 L 80 12 L 95 30 Z" />
            <text x="50" y="42" fontSize="8" fill="#a8a29e" textAnchor="middle" fontWeight="bold">DRAKENSBERG PEAKS</text>
          </g>

          {/* Moses Mabhida Arch at Durban (1135, 825) */}
          <g transform="translate(1105, 800)" opacity="0.22" stroke="#a8a29e" fill="none" strokeWidth="2">
            <path d="M 0 30 Q 30 -5 60 30" />
            <text x="30" y="42" fontSize="7" fill="#a8a29e" textAnchor="middle" fontWeight="bold" stroke="none">MOSES MABHIDA</text>
          </g>

          {/* Soweto Cooling Towers near JHB (670, 315) */}
          <g transform="translate(615, 275)" opacity="0.2" fill="#78716c">
            <path d="M 5 28 L 9 5 Q 12 14 15 5 L 19 28 Z" />
            <path d="M 22 28 L 26 5 Q 29 14 32 5 L 36 28 Z" />
            <text x="21" y="38" fontSize="7" fill="#a8a29e" textAnchor="middle" fontWeight="bold">SOWETO TOWERS</text>
          </g>

          {/* Kruger Wildlife Silhouette near Nelspruit (1050, 260) */}
          <g transform="translate(1030, 215)" opacity="0.22" fill="#78716c">
            <text x="25" y="25" fontSize="22">🐘</text>
            <text x="25" y="38" fontSize="7" fill="#a8a29e" textAnchor="middle" fontWeight="bold">KRUGER LOWVELD</text>
          </g>

          {/* Highway Network Edges */}
          {edges.map((e) => {
            const A = NODE_COORDINATES[e.a]
            const B = NODE_COORDINATES[e.b]
            if (!A || !B) return null

            const midX = (A.x + B.x) / 2
            const midY = (A.y + B.y) / 2

            return (
              <g key={e.id}>
                {/* Road Casing / Asphalt Bed */}
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke="#1c1917"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                {/* Road Surface */}
                <line
                  x1={A.x}
                  y1={A.y}
                  x2={B.x}
                  y2={B.y}
                  stroke={e.gravel ? '#b45309' : '#44403c'}
                  strokeWidth={e.gravel ? 4.5 : 7}
                  strokeDasharray={e.gravel ? '8 8' : undefined}
                  strokeLinecap="round"
                />
                {/* Center Road Markings for Tar Highways */}
                {!e.gravel && (
                  <line
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="10 8"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                )}

                {/* Highway Route Badge */}
                {e.label !== 'Local' && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-17"
                      y="-9"
                      width="34"
                      height="18"
                      rx="5"
                      fill="#1c1917"
                      stroke={e.gravel ? '#d97706' : '#f59e0b'}
                      strokeWidth="1.5"
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#fef08a"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="800"
                    >
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Nodes (Board Spaces) */}
          {Object.values(graph).map((n) => {
            const c = NODE_COORDINATES[n.id]
            if (!c) return null
            const style = tileStyle(n)
            const opt = reachMap.get(n.id)
            const reachableNow = Boolean(opt)
            const isHub = n.category === 'hub'
            const r = isHub ? 24 : 20

            return (
              <g
                key={n.id}
                transform={`translate(${c.x}, ${c.y})`}
                onClick={() => canInteract && opt && onSelectDestination(opt)}
                style={{ cursor: canInteract && reachableNow ? 'pointer' : 'default' }}
                role={reachableNow ? 'button' : undefined}
                aria-label={`${n.name}${reachableNow ? ' (reachable destination)' : ''}`}
              >
                {/* Reachable Pulsing Green Halo */}
                {reachableNow && (
                  <>
                    <circle
                      r={r + 14}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.5"
                      strokeDasharray="6 6"
                      filter="url(#reachable-glow)"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle r={r + 6} fill="#059669" opacity="0.35">
                      <animate
                        attributeName="r"
                        values={`${r + 4};${r + 12};${r + 4}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.4;0.1;0.4"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Base Node Outer Ring */}
                <circle
                  r={r + 3}
                  fill="#1c1917"
                  stroke={reachableNow ? '#34d399' : style.stroke}
                  strokeWidth={reachableNow ? 3.5 : 2}
                  filter={reachableNow ? 'url(#glow)' : undefined}
                />

                {/* Center Node Circle */}
                <circle
                  r={r}
                  fill={reachableNow ? '#064e3b' : style.fill}
                  stroke={reachableNow ? '#6ee7b7' : style.stroke}
                  strokeWidth="2"
                />

                {/* Node Center Icon */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHub ? 16 : 14}
                  fill="#ffffff"
                  style={{ pointerEvents: 'none' }}
                >
                  {reachableNow ? '🏁' : style.icon}
                </text>

                {/* Point / Action Sub-Badge (above or below node) */}
                <g transform={`translate(0, ${-r - 11})`}>
                  <rect
                    x="-42"
                    y="-8"
                    width="84"
                    height="16"
                    rx="5"
                    fill="#18181b"
                    stroke={style.badgeColor}
                    strokeWidth="1.2"
                    fillOpacity="0.95"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={style.badgeColor}
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="800"
                  >
                    {style.label}
                  </text>
                </g>

                {/* High-Contrast Readable Node Name Pill Badge */}
                <g transform={`translate(0, ${r + 13})`}>
                  <rect
                    x="-65"
                    y="-9"
                    width="130"
                    height="18"
                    rx="6"
                    fill="#09090b"
                    stroke={reachableNow ? '#10b981' : '#3f3f46'}
                    strokeWidth={reachableNow ? 2 : 1}
                    fillOpacity="0.95"
                    filter="drop-shadow(0 3px 6px rgba(0,0,0,0.7))"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={reachableNow ? '#34d399' : '#f4f4f5'}
                    fontSize="10"
                    fontWeight={reachableNow || isHub ? '800' : '600'}
                    style={{ pointerEvents: 'none' }}
                  >
                    {n.name}
                  </text>
                </g>

                {/* Reachable Tap Prompt */}
                {reachableNow && (
                  <g transform={`translate(0, ${r + 31})`}>
                    <rect
                      x="-38"
                      y="-7"
                      width="76"
                      height="14"
                      rx="4"
                      fill="#065f46"
                      stroke="#34d399"
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#a7f3d0"
                      fontSize="7.5"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      TAP TO DRIVE
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Player Vehicle Markers */}
          {players.map((p) => {
            const c = NODE_COORDINATES[p.currentNodeId]
            if (!c) return null
            const sameNode = players.filter((o) => o.currentNodeId === p.currentNodeId)
            const idx = sameNode.findIndex((o) => o.id === p.id)
            const dx = (idx - (sameNode.length - 1) / 2) * 34
            const isActive = p.id === activePlayerId

            return (
              <g
                key={p.id}
                style={{
                  transform: `translate(${c.x + dx}px, ${c.y - 28}px)`,
                  transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: p.connected ? 1 : 0.45,
                  pointerEvents: 'none',
                }}
              >
                {/* Active Player Pulse Halo */}
                {isActive && (
                  <circle
                    r="22"
                    fill="none"
                    stroke={p.color}
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    filter="url(#glow)"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0"
                      to="360"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Vehicle Token Base */}
                <circle
                  r="16"
                  fill="#1c1917"
                  stroke={p.color}
                  strokeWidth={isActive ? 3.5 : 2}
                  filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8))"
                />
                <text textAnchor="middle" dominantBaseline="central" fontSize="17">
                  {VEHICLE[p.vehicle] || '🚗'}
                </text>

                {/* Player Name Pill floating above token */}
                <g transform="translate(0, -25)">
                  <rect
                    x="-32"
                    y="-9"
                    width="64"
                    height="17"
                    rx="5"
                    fill="#09090b"
                    stroke={p.color}
                    strokeWidth={isActive ? 2 : 1}
                    fillOpacity="0.95"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fafaf9"
                    fontSize="9"
                    fontWeight="800"
                    fontFamily="Outfit, sans-serif"
                  >
                    {p.isAi ? `🤖${p.name.slice(0, 8)}` : p.name.slice(0, 9)}
                    {p.connected ? '' : ' ⚠'}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default BoardMapRenderer
