import { useEffect, useState, useCallback, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import type { VehicleType } from '../types/game'

export interface PublicLobbyInfo {
  roomCode: string
  hostName: string
  hostVehicle: VehicleType
  playerCount: number
  maxPlayers: number
  createdAt: number
  updatedAt: number
}

export function usePublicLobbies(hostingRoom?: {
  roomCode: string
  hostName: string
  hostVehicle: VehicleType
  playerCount: number
  isPublic: boolean
} | null) {
  const [lobbies, setLobbies] = useState<PublicLobbyInfo[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const channel = supabase.channel('mzansi:public_lobbies', {
      config: { presence: { key: hostingRoom?.roomCode || `browser_${Math.random()}` } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PublicLobbyInfo[]>
        const activeRooms: PublicLobbyInfo[] = []
        const cutoff = Date.now() - 60_000 // 60s timeout

        for (const [code, items] of Object.entries(state)) {
          if (!code.startsWith('MZANSI-')) continue
          const latest = items[0]
          if (latest && latest.updatedAt > cutoff && latest.playerCount < (latest.maxPlayers || 6)) {
            activeRooms.push(latest)
          }
        }

        activeRooms.sort((a, b) => b.createdAt - a.createdAt)
        setLobbies(activeRooms)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && hostingRoom?.isPublic && hostingRoom.roomCode) {
          await channel.track({
            roomCode: hostingRoom.roomCode,
            hostName: hostingRoom.hostName,
            hostVehicle: hostingRoom.hostVehicle,
            playerCount: hostingRoom.playerCount,
            maxPlayers: 6,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
        }
      })

    return () => {
      void channel.unsubscribe()
      channelRef.current = null
    }
  }, [hostingRoom?.roomCode, hostingRoom?.hostName, hostingRoom?.hostVehicle, hostingRoom?.playerCount, hostingRoom?.isPublic])

  const findQuickMatch = useCallback((): PublicLobbyInfo | null => {
    // Pick the room with highest player count that is not full
    const candidates = lobbies.filter((l) => l.playerCount < l.maxPlayers)
    if (!candidates.length) return null
    return candidates.sort((a, b) => b.playerCount - a.playerCount)[0]
  }, [lobbies])

  return { lobbies, findQuickMatch }
}
