import { useMemo } from 'react'
import type { BoardGraph, MovementPathOption, Player, TileCategory } from '../../types/game'
import { NODE_COORDINATES } from '../../engine/boardGraph'
import { CATEGORY_META } from '../../data/gameData'

interface Props {
  graph: BoardGraph
  players: Player[]
  activePlayerId: string
  reachable: MovementPathOption[]
  canInteract: boolean
  onSelectDestination: (o: MovementPathOption) => void
}

const SPECIAL: Record<string, { fill: string; stroke: string; icon: string }> = {
  hub: { fill: '#0f766e', stroke: '#2dd4bf', icon: '★' },
  toll_gate: { fill: '#be123c', stroke: '#fb7185', icon: '🛑' },
  padstal: { fill: '#b45309', stroke: '#f59e0b', icon: '☕' },
  spaza: { fill: '#4d7c0f', stroke: '#a3e635', icon: '🛒' },
  pothole: { fill: '#44403c', stroke: '#f97316', icon: '⚠️' },
  load_shedding: { fill: '#3f3f46', stroke: '#fde047', icon: '⚡' },
}

const VEHICLE: Record<string, string> = { taxi: '🚕', bakkie: '🛻', citi_golf: '🚗' }

function tileStyle(cat: TileCategory) {
  if (cat in SPECIAL) return SPECIAL[cat]
  const m = CATEGORY_META[cat as keyof typeof CATEGORY_META]
  return { fill: m.fill, stroke: m.stroke, icon: m.icon }
}

export function BoardMapRenderer({ graph, players, activePlayerId, reachable, canInteract, onSelectDestination }: Props) {
  const reachMap = useMemo(() => new Map(reachable.map((o) => [o.targetNodeId, o])), [reachable])

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

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <svg viewBox="0 0 800 620" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet" role="img" aria-label="South Africa highway board map">
        <defs>
          <radialGradient id="bg" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#292524" />
            <stop offset="100%" stopColor="#0c0a09" />
          </radialGradient>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="800" height="620" rx="24" fill="url(#bg)" />
        <text x="30" y="40" fill="#44403c" fontSize="13" fontFamily="JetBrains Mono, monospace" letterSpacing="3">MZANSI HIGHWAY NETWORK</text>

        {edges.map((e) => {
          const A = NODE_COORDINATES[e.a], B = NODE_COORDINATES[e.b]
          return (
            <g key={e.id}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="#1c1917" strokeWidth="9" strokeLinecap="round" />
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={e.gravel ? '#d97706' : '#78716c'} strokeWidth={e.gravel ? 3 : 4} strokeDasharray={e.gravel ? '6 6' : undefined} strokeLinecap="round" />
              {e.label !== 'Local' && (
                <g transform={`translate(${(A.x + B.x) / 2}, ${(A.y + B.y) / 2})`}>
                  <rect x="-13" y="-7" width="26" height="14" rx="4" fill="#292524" stroke="#44403c" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#f59e0b" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="700">{e.label}</text>
                </g>
              )}
            </g>
          )
        })}

        {Object.values(graph).map((n) => {
          const c = NODE_COORDINATES[n.id]
          const style = tileStyle(n.category)
          const opt = reachMap.get(n.id)
          const reachableNow = Boolean(opt)
          const r = n.category === 'hub' ? 19 : 15
          return (
            <g
              key={n.id}
              transform={`translate(${c.x}, ${c.y})`}
              onClick={() => canInteract && opt && onSelectDestination(opt)}
              style={{ cursor: canInteract && reachableNow ? 'pointer' : 'default' }}
              role={reachableNow ? 'button' : undefined}
              aria-label={`${n.name}${reachableNow ? ' (reachable)' : ''}`}
            >
              {reachableNow && (
                <circle r={r + 8} fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="4 4">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={r} fill={reachableNow ? '#064e3b' : style.fill} stroke={reachableNow ? '#34d399' : style.stroke} strokeWidth={reachableNow ? 3.5 : 2} filter={reachableNow ? 'url(#glow)' : undefined} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={n.category === 'hub' ? 13 : 11} fill="#fff">{reachableNow ? '🏁' : style.icon}</text>
              <text y={r + 12} textAnchor="middle" fill={reachableNow ? '#34d399' : '#d6d3d1'} fontSize="9.5" fontWeight={reachableNow || n.category === 'hub' ? 700 : 500} style={{ pointerEvents: 'none', paintOrder: 'stroke', stroke: '#0c0a09', strokeWidth: 3 }}>
                {n.name}
              </text>
            </g>
          )
        })}

        {players.map((p) => {
          const c = NODE_COORDINATES[p.currentNodeId]
          if (!c) return null
          const sameNode = players.filter((o) => o.currentNodeId === p.currentNodeId)
          const idx = sameNode.findIndex((o) => o.id === p.id)
          const dx = (idx - (sameNode.length - 1) / 2) * 26
          const isActive = p.id === activePlayerId
          return (
            <g key={p.id} style={{ transform: `translate(${c.x + dx}px, ${c.y - 22}px)`, transition: 'transform 300ms ease-out', opacity: p.connected ? 1 : 0.4, pointerEvents: 'none' }}>
              <circle r="13" fill="#1c1917" stroke={p.color} strokeWidth={isActive ? 3 : 1.5} filter={isActive ? 'url(#glow)' : undefined} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">{VEHICLE[p.vehicle]}</text>
              <g transform="translate(0,-21)">
                <rect x="-26" y="-8" width="52" height="14" rx="4" fill="#0c0a09" stroke={p.color} fillOpacity="0.9" />
                <text textAnchor="middle" dominantBaseline="central" fill="#f5f5f4" fontSize="8" fontWeight="700">{p.isAi ? `🤖${p.name.slice(0, 7)}` : p.name.slice(0, 9)}{p.connected ? '' : ' ⚠'}</text>
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default BoardMapRenderer
