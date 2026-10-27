import { useState } from 'react'
import type { AiPersonaKey, VehicleType } from '../../types/game'
import type { LobbyPlayer, RoomStatus } from '../../hooks/useOnlineRoom'
import { isSupabaseConfigured } from '../../services/supabaseClient'
import { AI_PERSONAS } from '../../engine/aiDriverEngine'
import { usePublicLobbies } from '../../hooks/usePublicLobbies'

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
  initialRoomCode?: string
  onStartLocal: (players: LocalSetup[]) => void
  onJoinOnline: (roomCode: string, name: string, vehicle: VehicleType, isPublic?: boolean) => void
}

const randomCode = () => `MZANSI-${Math.floor(10 + Math.random() * 90)}`

function VehiclePicker({ value, onChange }: { value: VehicleType; onChange: (v: VehicleType) => void }) {
  return (
    <div className="flex gap-1">
      {VEHICLES.map((v) => (
        <button
          key={v.id}
          type="button"
          title={v.label}
          aria-label={v.label}
          onClick={() => onChange(v.id)}
          className={`w-10 h-10 rounded-lg border text-xl transition-all ${
            value === v.id
              ? 'border-amber-400 bg-amber-500/20 scale-110'
              : 'border-stone-700 bg-stone-800 hover:bg-stone-700'
          }`}
        >
          {v.icon}
        </button>
      ))}
    </div>
  )
}

export function MainMenu({ initialRoomCode, onStartLocal, onJoinOnline }: MenuProps) {
  const [mode, setMode] = useState<'solo' | 'local' | 'online'>(initialRoomCode ? 'online' : 'solo')
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
  const [code, setCode] = useState(initialRoomCode || '')
  const [makePublic, setMakePublic] = useState(true)

  const { lobbies, findQuickMatch } = usePublicLobbies()

  const setPlayer = (i: number, patch: Partial<LocalSetup>) =>
    setLocal((l) => l.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  const vehOrder: VehicleType[] = ['taxi', 'bakkie', 'citi_golf']

  const toggleBot = (key: AiPersonaKey) => {
    setSelectedBots((prev) => {
      const next = { ...prev, [key]: !prev[key] }
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

  const handleQuickMatch = () => {
    const playerName = name.trim() || 'Player'
    const found = findQuickMatch()
    if (found) {
      onJoinOnline(found.roomCode, playerName, vehicle, true)
    } else {
      // Create new public room and wait for challengers
      onJoinOnline(randomCode(), playerName, vehicle, true)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,#44403c_0%,#0c0a09_60%)] select-none">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🇿🇦🛣️</div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
            Mzansi Trivia Road Trip
          </h1>
          <p className="text-sm text-stone-400 mt-2">
            Cross toll gates, dodge potholes, collect all 6 souvenirs and reach Table Mountain or Moses Mabhida first.
          </p>
        </div>

        <div className="bg-stone-900/90 border-2 border-stone-800 rounded-3xl shadow-2xl p-5">
          <div className="flex gap-1.5 mb-5 p-1 bg-stone-950 rounded-xl">
            {(['solo', 'local', 'online'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === m ? 'bg-amber-500 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {m === 'solo' ? '🤖 Solo vs AI' : m === 'local' ? '🛋️ Same screen' : '🌐 Online room'}
              </button>
            ))}
          </div>

          {mode === 'solo' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Your Driver Profile
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={soloName}
                    maxLength={12}
                    placeholder="Your name"
                    onChange={(e) => setSoloName(e.target.value)}
                    aria-label="Your driver name"
                    className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <VehiclePicker value={soloVehicle} onChange={setSoloVehicle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Choose AI Opponents
                </label>
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
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 border border-stone-700 text-stone-400 uppercase">
                              {persona.vehicle}
                            </span>
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
                  <input
                    value={p.name}
                    maxLength={12}
                    onChange={(e) => setPlayer(i, { name: e.target.value })}
                    aria-label={`Player ${i + 1} name`}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500"
                  />
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
                  {local.length > 2 && (
                    <button
                      onClick={() => setLocal((l) => l.filter((_, idx) => idx !== i))}
                      aria-label="Remove player"
                      className="w-8 h-8 text-stone-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {local.length < 6 && (
                <button
                  onClick={() =>
                    setLocal((l) => [
                      ...l,
                      { name: `Player ${l.length + 1}`, vehicle: vehOrder[l.length % 3], isAi: false },
                    ])
                  }
                  className="w-full py-2 rounded-lg border border-dashed border-stone-700 text-xs text-stone-400 hover:text-amber-300 hover:border-amber-500/50"
                >
                  + Add driver
                </button>
              )}
              <button
                onClick={() =>
                  onStartLocal(
                    local.map((p, i) => ({ ...p, name: p.name.trim() || `Player ${i + 1}` })),
                  )
                }
                className="w-full mt-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                🚀 Start road trip
              </button>
            </div>
          ) : !isSupabaseConfigured ? (
            <p className="text-sm text-red-300 bg-red-950/40 border border-red-500/30 rounded-xl p-4">
              Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to .gemini/.env.local and restart the dev server.
            </p>
          ) : (
            <div className="space-y-4">
              {initialRoomCode && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                  <span>Joining via direct invite: <strong className="font-mono">{initialRoomCode}</strong></span>
                  <button onClick={() => setCode(initialRoomCode)} className="underline hover:text-white">Use code</button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Your Online Profile
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={name}
                    maxLength={12}
                    placeholder="Your name"
                    onChange={(e) => setName(e.target.value)}
                    aria-label="Your name"
                    className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm focus:outline-none focus:border-amber-500"
                  />
                  <VehiclePicker value={vehicle} onChange={setVehicle} />
                </div>
              </div>

              {/* ⚡ Quick Match Button (Challenge Random Online) */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={handleQuickMatch}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-500 to-amber-500 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black uppercase tracking-widest text-sm shadow-xl shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>⚡</span> Challenge Random Online Driver
                </button>
                <span className="text-[11px] text-stone-400 block text-center mt-1">
                  Instantly auto-matches with active players or opens a public room
                </span>
              </div>

              {/* Live Public Lobbies */}
              {lobbies.length > 0 && (
                <div className="space-y-2 border-t border-stone-800 pt-3">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-bold uppercase tracking-wider text-amber-400">Open Public Road Trips ({lobbies.length})</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">● Live</span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {lobbies.map((l) => (
                      <div
                        key={l.roomCode}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl">{VEHICLES.find((v) => v.id === l.hostVehicle)?.icon || '🚕'}</span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-stone-200 block truncate">{l.hostName}'s Room</span>
                            <span className="text-[10px] font-mono text-stone-400">{l.roomCode} · {l.playerCount}/{l.maxPlayers} players</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!name.trim()}
                          onClick={() => onJoinOnline(l.roomCode, name.trim(), vehicle, true)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white transition-all active:scale-95"
                        >
                          Join Trip
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Private / Custom Room Controls */}
              <div className="border-t border-stone-800 pt-3 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">Or Create / Join Custom Room</span>
                <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={makePublic}
                      onChange={(e) => setMakePublic(e.target.checked)}
                      className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                    />
                    <span>Allow random online players to discover &amp; join</span>
                  </label>
                </div>

                <button
                  disabled={!name.trim()}
                  onClick={() => onJoinOnline(randomCode(), name.trim(), vehicle, makePublic)}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 font-bold uppercase tracking-wider text-xs active:scale-95 transition-all border border-stone-700"
                >
                  Create Custom Room
                </button>

                <div className="flex items-center gap-2">
                  <input
                    value={code}
                    placeholder="MZANSI-42"
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    aria-label="Room code"
                    className="flex-1 px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    disabled={!name.trim() || !code.trim()}
                    onClick={() => onJoinOnline(code.trim(), name.trim(), vehicle, makePublic)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold active:scale-95"
                  >
                    Join
                  </button>
                </div>
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
  const [copied, setCopied] = useState(false)

  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : ''

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsAppInvite = () => {
    const text = `Join my Mzansi Trivia Road Trip! 🇿🇦🚗💨\nRoom code: ${roomCode}\nTap link to jump right in:\n${inviteUrl}`
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,#44403c_0%,#0c0a09_60%)] select-none">
      <div className="w-full max-w-md bg-stone-900/90 border-2 border-stone-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Room code</p>
          <button
            onClick={handleCopyLink}
            title="Click to copy link"
            className="text-4xl font-black font-mono text-amber-400 mb-1 hover:text-amber-300 transition-colors"
          >
            {roomCode}
          </button>
          <p className="text-[11px] text-stone-500">
            {status === 'online' ? '🟢 Online & Ready' : status === 'error' ? '🔴 Connection error' : '🟡 Connecting…'}
          </p>
        </div>

        {/* 1-Tap Invite Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleWhatsAppInvite}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span>📲</span> WhatsApp Invite
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span>{copied ? '✓' : '📋'}</span> {copied ? 'Link Copied!' : 'Copy Direct Link'}
          </button>
        </div>

        {/* Player Roster */}
        <ul className="space-y-2 text-left">
          {roster.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800">
              <span className="text-xl">{VEHICLES.find((v) => v.id === p.vehicle)?.icon || '🚕'}</span>
              <span className="font-semibold text-sm flex-1">
                {p.name}
                {p.id === meId ? ' (you)' : ''}
              </span>
              {p.id === hostId && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HOST
                </span>
              )}
            </li>
          ))}
          {roster.length === 0 && <li className="text-xs text-stone-500 text-center py-3">Connecting to room…</li>}
        </ul>

        {isHost ? (
          <button
            disabled={roster.length < 2}
            onClick={onStart}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-amber-500/20"
          >
            {roster.length < 2 ? 'Waiting for challengers to join…' : '🚀 Start road trip'}
          </button>
        ) : (
          <p className="text-sm text-stone-400 py-2">Waiting for the host to start the trip…</p>
        )}

        <button onClick={onLeave} className="text-xs text-stone-500 hover:text-red-400 block mx-auto">
          Leave room
        </button>
      </div>
    </div>
  )
}
