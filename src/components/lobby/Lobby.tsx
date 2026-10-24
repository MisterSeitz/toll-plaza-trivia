import { useState } from 'react'
import type { AiPersonaKey, VehicleType } from '../../types/game'
import type { LobbyPlayer, RoomStatus } from '../../hooks/useOnlineRoom'
import { isSupabaseConfigured } from '../../services/supabaseClient'
import { AI_PERSONAS } from '../../engine/aiDriverEngine'

const VEHICLES: { id: VehicleType; icon: string; label: string }[] = [
  { id: 'taxi', icon: '🚕', label: 'Minibus Taxi' },
  { id: 'bakkie', icon: '🛻', label: 'Bakkie' },
  { id: 'citi_golf', icon: '🚗', label: 'Citi Golf' },
]

export interface LocalSetup {
  name: string
  vehicle: VehicleType
  isAi?: boolean
  aiPersona?: AiPersonaKey
}

interface MenuProps {
  onStartLocal: (players: LocalSetup[]) => void
  onJoinOnline: (roomCode: string, name: string, vehicle: VehicleType) => void
}

const randomCode = () => `MZANSI-${Math.floor(10 + Math.random() * 90)}`

function VehiclePicker({ value, onChange }: { value: VehicleType; onChange: (v: VehicleType) => void }) {
  return (
    <div className="flex gap-1">
      {VEHICLES.map((v) => (
        <button key={v.id} type="button" title={v.label} aria-label={v.label} onClick={() => onChange(v.id)}
          className={`w-10 h-10 rounded-lg border text-xl transition-all ${value === v.id ? 'border-amber-400 bg-amber-500/20 scale-110' : 'border-stone-700 bg-stone-800 hover:bg-stone-700'}`}>{v.icon}</button>
      ))}
    </div>
  )
}

export function MainMenu({ onStartLocal, onJoinOnline }: MenuProps) {
  const [mode, setMode] = useState<'solo' | 'local' | 'online'>('solo')
  const [soloName, setSoloName] = useState('Thabo')
  const [soloVehicle, setSoloVehicle] = useState<VehicleType>('taxi')
  const [selectedBots, setSelectedBots] = useState<Record<AiPersonaKey, boolean>>({
    bra_dan: true,
    oom_piet: true,
    sipho: true,
  })

  const [local, setLocal] = useState<LocalSetup[]>([
    { name: 'Thabo', vehicle: 'taxi', isAi: false },
    { name: 'Lerato', vehicle: 'bakkie', isAi: false },
  ])
  const [name, setName] = useState('')
  const [vehicle, setVehicle] = useState<VehicleType>('taxi')
  const [code, setCode] = useState('')

  const setPlayer = (i: number, patch: Partial<LocalSetup>) => setLocal((l) => l.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const vehOrder: VehicleType[] = ['taxi', 'bakkie', 'citi_golf']

  const toggleBot = (key: AiPersonaKey) => {
    setSelectedBots((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // Ensure at least one bot is selected
      const count = Object.values(next).filter(Boolean).length
      return count > 0 ? next : prev
    })
  }

  const handleStartSolo = () => {
    const human: LocalSetup = {
      name: soloName.trim() || 'Driver',
      vehicle: soloVehicle,
      isAi: false,
    }
    const bots: LocalSetup[] = (Object.keys(selectedBots) as AiPersonaKey[])
      .filter((k) => selectedBots[k])
      .map((k) => {
        const persona = AI_PERSONAS[k]
        return {
          name: persona.name,
          vehicle: persona.vehicle,
          isAi: true,
          aiPersona: k,
        }
      })
    onStartLocal([human, ...bots])
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,#44403c_0%,#0c0a09_60%)]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🇿🇦🛣️</div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">Mzansi Trivia Road Trip</h1>
          <p className="text-sm text-stone-400 mt-2">Cross toll gates, dodge potholes, collect all 6 souvenirs and reach Table Mountain or Moses Mabhida first.</p>
        </div>

        <div className="bg-stone-900/90 border-2 border-stone-800 rounded-3xl shadow-2xl p-5">
          <div className="flex gap-1.5 mb-5 p-1 bg-stone-950 rounded-xl">
            {(['solo', 'local', 'online'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === m ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'}`}>
                {m === 'solo' ? '🤖 Solo vs AI' : m === 'local' ? '🛋️ Same screen' : '🌐 Online room'}
              </button>
            ))}
          </div>

          {mode === 'solo' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Your Driver Profile</label>
                <div className="flex items-center gap-2">
                  <input value={soloName} maxLength={12} placeholder="Your name" onChange={(e) => setSoloName(e.target.value)} aria-label="Your driver name" className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500" />
                  <VehiclePicker value={soloVehicle} onChange={setSoloVehicle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Choose AI Opponents</label>
                <div className="space-y-2">
                  {(Object.keys(AI_PERSONAS) as AiPersonaKey[]).map((key) => {
                    const persona = AI_PERSONAS[key]
                    const selected = selectedBots[key]
                    return (
                      <div
                        key={key}
                        onClick={() => toggleBot(key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selected
                            ? 'bg-stone-800/90 border-amber-500/80 shadow-md'
                            : 'bg-stone-950/60 border-stone-800 opacity-50'
                        }`}
                      >
                        <span className="text-2xl">{persona.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-200">{persona.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 border border-stone-700 text-stone-400 uppercase">{persona.vehicle}</span>
                          </div>
                          <p className="text-xs text-stone-400 truncate italic">"{persona.tagline}"</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          className="w-4 h-4 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={handleStartSolo}
                className="w-full mt-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                🚀 Hit the road solo
              </button>
            </div>
          ) : mode === 'local' ? (
            <div className="space-y-3">
              {local.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={p.name} maxLength={12} onChange={(e) => setPlayer(i, { name: e.target.value })} aria-label={`Player ${i + 1} name`} className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500" />
                  <VehiclePicker value={p.vehicle} onChange={(v) => setPlayer(i, { vehicle: v })} />
                  <button
                    type="button"
                    onClick={() => setPlayer(i, { isAi: !p.isAi })}
                    title={p.isAi ? 'AI Bot Player' : 'Human Player'}
                    className={`w-9 h-9 rounded-lg border text-sm font-bold flex items-center justify-center transition-all ${
                      p.isAi ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-stone-700 bg-stone-800 text-stone-300'
                    }`}
                  >
                    {p.isAi ? '🤖' : '👤'}
                  </button>
                  {local.length > 2 && <button onClick={() => setLocal((l) => l.filter((_, idx) => idx !== i))} aria-label="Remove player" className="w-8 h-8 text-stone-500 hover:text-red-400">✕</button>}
                </div>
              ))}
              {local.length < 6 && (
                <button onClick={() => setLocal((l) => [...l, { name: `Player ${l.length + 1}`, vehicle: vehOrder[l.length % 3], isAi: false }])} className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-xs text-stone-400 hover:text-amber-300 hover:border-amber-500/50">+ Add driver</button>
              )}
              <button onClick={() => onStartLocal(local.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` })))} className="w-full mt-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20">🚀 Start road trip</button>
            </div>
          ) : !isSupabaseConfigured ? (
            <p className="text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl p-4">Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .gemini/.env.local and restart the dev server.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input value={name} maxLength={12} placeholder="Your name" onChange={(e) => setName(e.target.value)} aria-label="Your name" className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500" />
                <VehiclePicker value={vehicle} onChange={setVehicle} />
              </div>
              <button disabled={!name.trim()} onClick={() => onJoinOnline(randomCode(), name.trim(), vehicle)} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95">Create room</button>
              <div className="flex items-center gap-2">
                <input value={code} placeholder="MZANSI-42" onChange={(e) => setCode(e.target.value.toUpperCase())} aria-label="Room code" className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm font-mono focus:outline-none focus:border-amber-500" />
                <button disabled={!name.trim() || !code.trim()} onClick={() => onJoinOnline(code.trim(), name.trim(), vehicle)} className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold">Join</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


interface WaitingProps {
  roomCode: string
  roster: LobbyPlayer[]
  hostId: string | null
  isHost: boolean
  meId: string
  status: RoomStatus
  onStart: () => void
  onLeave: () => void
}

export function WaitingRoom({ roomCode, roster, hostId, isHost, meId, status, onStart, onLeave }: WaitingProps) {
  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,#44403c_0%,#0c0a09_60%)]">
      <div className="w-full max-w-md bg-stone-900/90 border-2 border-stone-800 rounded-3xl p-6 shadow-2xl text-center">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Room code</p>
        <button onClick={() => navigator.clipboard?.writeText(roomCode)} title="Copy" className="text-4xl font-black font-mono text-amber-400 mb-1 hover:text-amber-300">{roomCode}</button>
        <p className="text-[11px] text-stone-500 mb-4">Share this code · tap to copy · {status === 'online' ? '🟢 connected' : status === 'error' ? '🔴 connection error' : '🟡 connecting…'}</p>
        <ul className="space-y-2 mb-5 text-left">
          {roster.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-xl">{VEHICLES.find((v) => v.id === p.vehicle)?.icon}</span>
              <span className="font-semibold text-sm flex-1">{p.name}{p.id === meId ? ' (you)' : ''}</span>
              {p.id === hostId && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">HOST</span>}
            </li>
          ))}
          {roster.length === 0 && <li className="text-xs text-stone-500 text-center py-3">Connecting to room…</li>}
        </ul>
        {isHost ? (
          <button disabled={roster.length < 2} onClick={onStart} className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95">{roster.length < 2 ? 'Waiting for players…' : 'Start road trip'}</button>
        ) : (
          <p className="text-sm text-stone-400 py-2">Waiting for the host to start…</p>
        )}
        <button onClick={onLeave} className="mt-3 text-xs text-stone-500 hover:text-red-400">Leave room</button>
      </div>
    </div>
  )
}
