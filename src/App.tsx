import { useEffect, useMemo, useState } from 'react'
import type { AppSettings, TriviaQuestion, VehicleType } from './types/game'
import { DEFAULT_SETTINGS } from './types/game'
import { CATEGORY_META } from './data/gameData'
import { createGame, createPlayer, PLAYER_COLORS, type GameState } from './engine/gameRules'
import { useOnlineRoom, type LobbyPlayer } from './hooks/useOnlineRoom'
import { usePublicLobbies } from './hooks/usePublicLobbies'
import { generateQuestions } from './services/geminiTrivia'
import { soundManager } from './utils/soundEffects'
import GameScreen from './components/GameScreen'
import { MainMenu, WaitingRoom, type LocalSetup } from './components/lobby/Lobby'
import AudioSettingsTray from './components/ui/AudioSettingsTray'

const SETTINGS_KEY = 'mzansi_settings'

function loadSettings(): AppSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function myPlayerId(): string {
  let id = sessionStorage.getItem('mzansi_pid')
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem('mzansi_pid', id)
  }
  return id
}

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [localGame, setLocalGame] = useState<GameState | null>(null)
  const [room, setRoom] = useState<{ code: string; me: LobbyPlayer } | null>(null)
  const [isPublicRoom, setIsPublicRoom] = useState(true)
  const [onlineGame, setOnlineGame] = useState<GameState | null>(null)
  const [extra, setExtra] = useState<TriviaQuestion[]>([])

  const initialRoomCode = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    return new URLSearchParams(window.location.search).get('room') || undefined
  }, [])

  const session = useOnlineRoom(room?.code ?? null, room?.me ?? null)

  const hostingInfo = useMemo(() => {
    if (!room || !session.isHost) return null
    return {
      roomCode: room.code,
      hostName: room.me.name,
      hostVehicle: room.me.vehicle,
      playerCount: session.roster.length,
      isPublic: isPublicRoom,
    }
  }, [room, session.isHost, session.roster.length, isPublicRoom])

  usePublicLobbies(hostingInfo)

  // Apply persisted audio settings once.
  useEffect(() => {
    soundManager.setMuted(settings.muted)
    soundManager.setMasterVolume(settings.master)
    soundManager.setSfxVolume(settings.sfx)
    soundManager.setHaptics(settings.haptics)
    if (settings.ambience) soundManager.startKarooAmbience()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateSettings = (s: AppSettings) => {
    setSettings(s)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  }

  // Online: first snapshot from the host (or a state reply when reloading mid-game) starts the game.
  useEffect(() => {
    if (room && !onlineGame && session.remoteState) setOnlineGame(session.remoteState)
  }, [room, onlineGame, session.remoteState])

  const inGame = Boolean(localGame || onlineGame)

  // Prefetch Gemini questions in the background when a game starts.
  useEffect(() => {
    if (!inGame || !settings.aiTrivia) return
    let live = true
    Promise.allSettled((Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((c) => generateQuestions(c, 3))).then((res) => {
      if (!live) return
      const ok = res.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      if (ok.length) setExtra(ok)
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inGame])

  const startLocal = (setups: LocalSetup[]) => {
    soundManager.playStreakBeep()
    setLocalGame(
      createGame(
        setups.map((p, i) =>
          createPlayer(`local-${i}`, p.name, p.vehicle, PLAYER_COLORS[i % PLAYER_COLORS.length], p.isAi, p.aiPersona),
        ),
      ),
    )
  }

  const joinOnline = (code: string, name: string, vehicle: VehicleType, isPublic = true) => {
    setIsPublicRoom(isPublic)
    setRoom({ code, me: { id: myPlayerId(), name, vehicle, joinedAt: Date.now() } })
  }

  const hostStart = () => {
    const state = createGame(session.roster.map((r, i) => createPlayer(r.id, r.name, r.vehicle, PLAYER_COLORS[i % PLAYER_COLORS.length])))
    setOnlineGame(state)
    session.sendState(state)
  }

  const exit = () => {
    setLocalGame(null)
    setOnlineGame(null)
    setRoom(null)
    setExtra([])
  }

  const onlineSession = useMemo(
    () =>
      room
        ? {
            roomCode: room.code,
            roster: session.roster,
            remoteState: session.remoteState,
            sendState: session.sendState,
            sendEmote: session.sendEmote,
            activeEmotes: session.activeEmotes,
            stateRef: session.stateRef,
          }
        : undefined,
    [room, session.roster, session.remoteState, session.sendState, session.sendEmote, session.activeEmotes, session.stateRef],
  )

  let screen
  if (localGame) {
    screen = <GameScreen key="local" initial={localGame} myId={null} settings={settings} extraQuestions={extra} onOpenSettings={() => setShowSettings(true)} onExit={exit} />
  } else if (room && onlineGame && onlineSession) {
    screen = <GameScreen key="online" initial={onlineGame} myId={room.me.id} session={onlineSession} settings={settings} extraQuestions={extra} onOpenSettings={() => setShowSettings(true)} onExit={exit} />
  } else if (room) {
    screen = <WaitingRoom roomCode={room.code} roster={session.roster} hostId={session.hostId} isHost={session.isHost} meId={room.me.id} status={session.status} onStart={hostStart} onLeave={exit} />
  } else {
    screen = <MainMenu initialRoomCode={initialRoomCode} onStartLocal={startLocal} onJoinOnline={joinOnline} />
  }

  return (
    <>
      {screen}
      {!inGame && (
        <button onClick={() => setShowSettings(true)} aria-label="Settings" className="fixed top-3 right-3 z-30 w-10 h-10 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700">⚙️</button>
      )}
      {showSettings && <AudioSettingsTray settings={settings} onChange={updateSettings} onClose={() => setShowSettings(false)} />}
    </>
  )
}
