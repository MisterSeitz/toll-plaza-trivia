import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import type { VehicleType } from '../types/game'
import type { GameState } from '../engine/gameRules'

export interface LobbyPlayer {
  id: string
  name: string
  vehicle: VehicleType
  joinedAt: number
}

export type RoomStatus = 'connecting' | 'online' | 'error'

/**
 * Supabase Realtime room: presence for the roster/disconnect detection and
 * broadcast of authoritative game-state snapshots from whoever holds the turn.
 */
export function useOnlineRoom(roomCode: string | null, me: LobbyPlayer | null) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const [roster, setRoster] = useState<LobbyPlayer[]>([])
  const [remoteState, setRemoteState] = useState<GameState | null>(null)
  const [status, setStatus] = useState<RoomStatus>('connecting')

  const meId = me?.id
  const meName = me?.name
  const meVehicle = me?.vehicle
  const meJoined = me?.joinedAt

  useEffect(() => {
    if (!supabase || !roomCode || meId === undefined) return
    const channel = supabase.channel(`game_room:${roomCode}`, {
      config: { broadcast: { self: false }, presence: { key: meId } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const st = channel.presenceState() as Record<string, LobbyPlayer[]>
        const list = Object.values(st)
          .map((v) => v[0])
          .filter(Boolean)
          .sort((a, b) => a.joinedAt - b.joinedAt)
        setRoster(list)
      })
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        setRemoteState(payload as GameState)
      })
      .on('broadcast', { event: 'state:request' }, () => {
        // Anyone holding state answers; duplicates are harmless because of revision numbers.
        if (stateRef.current) {
          void channel.send({ type: 'broadcast', event: 'state', payload: stateRef.current })
        }
      })
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') {
          setStatus('online')
          await channel.track({ id: meId, name: meName, vehicle: meVehicle, joinedAt: meJoined })
          void channel.send({ type: 'broadcast', event: 'state:request', payload: {} })
        } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
          setStatus('error')
        }
      })

    return () => {
      void channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomCode, meId, meName, meVehicle, meJoined])

  const sendState = useCallback((s: GameState) => {
    void channelRef.current?.send({ type: 'broadcast', event: 'state', payload: s })
  }, [])

  const hostId = roster[0]?.id ?? null

  return { roster, hostId, isHost: hostId !== null && hostId === meId, status, remoteState, sendState, stateRef }
}

export const GRACE_PERIOD_MS = 45_000
