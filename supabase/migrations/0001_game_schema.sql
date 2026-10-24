-- Mzansi Trivia Road Trip — Supabase schema (Phase 3)
-- Run in the Supabase SQL editor. The playable client uses Realtime broadcast/presence only;
-- these tables add authoritative persistence, anti-cheat RPCs and heartbeat tracking.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE game_status_enum AS ENUM ('lobby', 'in_progress', 'completed', 'abandoned');
CREATE TYPE vehicle_type_enum AS ENUM ('taxi', 'bakkie', 'citi_golf');
CREATE TYPE trivia_category_enum AS ENUM ('beats_screen','diski_bokke','braai_chow','history_icons','slang_lingo','scenic_route');

CREATE TABLE public.game_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(16) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status game_status_enum NOT NULL DEFAULT 'lobby',
  active_player_id UUID NULL,
  current_round INT NOT NULL DEFAULT 1,
  max_players INT NOT NULL DEFAULT 6 CHECK (max_players BETWEEN 2 AND 8),
  winner_id UUID NULL,
  is_turn_paused BOOLEAN NOT NULL DEFAULT false,
  pause_reason TEXT NULL,
  settings JSONB NOT NULL DEFAULT '{"turn_timeout_seconds":30,"target_souvenirs":6}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(32) NOT NULL,
  vehicle vehicle_type_enum NOT NULL DEFAULT 'taxi',
  turn_order INT NOT NULL DEFAULT 0,
  current_node_id VARCHAR(64) NOT NULL DEFAULT 'node_jhb_central',
  points INT NOT NULL DEFAULT 200 CHECK (points >= 0),
  souvenirs TEXT[] NOT NULL DEFAULT '{}',
  inventory JSONB NOT NULL DEFAULT '{"chappies_timer":1,"spare_tyre":0,"taxi_pass":0,"braai_tongs_lifeline":0}'::jsonb,
  connection_status VARCHAR(20) NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected','disconnected','abandoned')),
  disconnected_at TIMESTAMPTZ NULL,
  reconnect_grace_until TIMESTAMPTZ NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (room_id, user_id),
  UNIQUE (room_id, turn_order)
);

ALTER TABLE public.game_rooms
  ADD CONSTRAINT fk_active_player FOREIGN KEY (active_player_id) REFERENCES public.game_players(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_winner FOREIGN KEY (winner_id) REFERENCES public.game_players(id) ON DELETE SET NULL;

CREATE TABLE public.question_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  category trivia_category_enum NOT NULL,
  was_correct BOOLEAN NOT NULL,
  time_taken_seconds NUMERIC(4,1) NOT NULL CHECK (time_taken_seconds >= 0),
  points_awarded INT NOT NULL DEFAULT 0,
  power_ups_used TEXT[] NOT NULL DEFAULT '{}',
  selected_option VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_game_rooms_code ON public.game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX idx_game_players_room ON public.game_players(room_id);
CREATE INDEX idx_game_players_user ON public.game_players(user_id);
CREATE INDEX idx_question_history_room_player ON public.question_history(room_id, player_id);

-- ---------------------------------------------------------------- RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_player_in_room(p_room_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.game_players WHERE room_id = p_room_id AND user_id = auth.uid());
$$;

CREATE POLICY "Select accessible game rooms" ON public.game_rooms FOR SELECT TO authenticated
  USING (status = 'lobby' OR host_id = auth.uid() OR public.is_player_in_room(id));
CREATE POLICY "Create new game room" ON public.game_rooms FOR INSERT TO authenticated
  WITH CHECK (host_id = auth.uid());
CREATE POLICY "Host can update game room" ON public.game_rooms FOR UPDATE TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());

CREATE POLICY "View players in same room" ON public.game_players FOR SELECT TO authenticated
  USING (public.is_player_in_room(room_id)
         OR EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = game_players.room_id AND r.status = 'lobby'));
CREATE POLICY "Join game room as player" ON public.game_players FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()
    AND (SELECT COUNT(*) FROM public.game_players gp WHERE gp.room_id = game_players.room_id)
      < (SELECT max_players FROM public.game_rooms gr WHERE gr.id = game_players.room_id));
CREATE POLICY "Update own player state" ON public.game_players FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leave or remove player" ON public.game_players FOR DELETE TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.game_rooms r WHERE r.id = game_players.room_id AND r.host_id = auth.uid()));

CREATE POLICY "View question history for room" ON public.question_history FOR SELECT TO authenticated
  USING (public.is_player_in_room(room_id));
CREATE POLICY "Record question answer" ON public.question_history FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.game_players p WHERE p.id = question_history.player_id AND p.user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms, public.game_players, public.question_history;

-- ---------------------------------------------------------------- RPCs
CREATE OR REPLACE FUNCTION public.commit_player_turn(
  p_room_id UUID, p_player_id UUID, p_target_node_id TEXT, p_points_delta INT, p_souvenir_id TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_room RECORD; v_next UUID;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room.active_player_id IS DISTINCT FROM p_player_id THEN RAISE EXCEPTION 'Not your turn!'; END IF;
  IF NOT EXISTS (SELECT 1 FROM game_players WHERE id = p_player_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not your player';
  END IF;

  UPDATE game_players SET
    current_node_id = p_target_node_id,
    points = GREATEST(0, points + p_points_delta),
    souvenirs = CASE WHEN p_souvenir_id IS NOT NULL AND NOT (souvenirs @> ARRAY[p_souvenir_id])
                     THEN array_append(souvenirs, p_souvenir_id) ELSE souvenirs END
  WHERE id = p_player_id;

  -- next connected player in turn order (wraps around)
  SELECT id INTO v_next FROM game_players
  WHERE room_id = p_room_id AND connection_status = 'connected'
    AND turn_order > (SELECT turn_order FROM game_players WHERE id = p_player_id)
  ORDER BY turn_order ASC LIMIT 1;
  IF v_next IS NULL THEN
    SELECT id INTO v_next FROM game_players
    WHERE room_id = p_room_id AND connection_status = 'connected' ORDER BY turn_order ASC LIMIT 1;
  END IF;

  UPDATE game_rooms SET active_player_id = v_next, updated_at = NOW() WHERE id = p_room_id;
  RETURN jsonb_build_object('success', true, 'next_player_id', v_next);
END; $$;

CREATE OR REPLACE FUNCTION public.clear_toll_and_advance(
  p_room_id UUID, p_player_id UUID, p_toll_node_id VARCHAR, p_target_node_id VARCHAR,
  p_clearance_method VARCHAR, p_toll_cost INT DEFAULT 100)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_room RECORD; v_player RECORD; v_deduct INT := 0;
BEGIN
  SELECT * INTO v_room FROM game_rooms WHERE id = p_room_id FOR UPDATE;
  IF v_room IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Room not found'); END IF;
  IF v_room.active_player_id IS DISTINCT FROM p_player_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'It is not your turn');
  END IF;
  SELECT * INTO v_player FROM game_players WHERE id = p_player_id AND room_id = p_room_id AND user_id = auth.uid() FOR UPDATE;
  IF v_player IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Player not found'); END IF;
  IF v_player.current_node_id <> p_toll_node_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player is not at this toll chokepoint');
  END IF;

  IF p_clearance_method = 'points_paid' THEN
    IF v_player.points < p_toll_cost THEN RETURN jsonb_build_object('success', false, 'error', 'Insufficient Padstal points'); END IF;
    v_deduct := p_toll_cost;
  ELSIF p_clearance_method = 'item_pass' THEN
    IF COALESCE((v_player.inventory->>'taxi_pass')::INT, 0) <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'No Taxi Pass in roadside kit');
    END IF;
    UPDATE game_players SET inventory = jsonb_set(inventory, '{taxi_pass}', to_jsonb((inventory->>'taxi_pass')::INT - 1))
    WHERE id = p_player_id;
  END IF;

  UPDATE game_players SET current_node_id = p_target_node_id, points = points - v_deduct WHERE id = p_player_id;
  RETURN jsonb_build_object('success', true, 'current_node_id', p_target_node_id,
    'points_deducted', v_deduct, 'remaining_points', v_player.points - v_deduct);
END; $$;

CREATE OR REPLACE FUNCTION public.migrate_room_host(p_room_id UUID, p_departed_host_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID; v_name TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM game_rooms WHERE id = p_room_id AND host_id = p_departed_host_id) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'Not current host');
  END IF;
  SELECT user_id, display_name INTO v_user, v_name FROM game_players
  WHERE room_id = p_room_id AND user_id <> p_departed_host_id AND connection_status = 'connected'
  ORDER BY turn_order ASC LIMIT 1;
  IF v_user IS NULL THEN
    UPDATE game_rooms SET status = 'abandoned', updated_at = NOW() WHERE id = p_room_id;
    RETURN jsonb_build_object('success', false, 'reason', 'Room abandoned');
  END IF;
  UPDATE game_rooms SET host_id = v_user, updated_at = NOW() WHERE id = p_room_id;
  RETURN jsonb_build_object('success', true, 'new_host_user_id', v_user, 'new_host_name', v_name);
END; $$;

CREATE OR REPLACE FUNCTION public.force_skip_disconnected_turn(p_room_id UUID, p_disconnected_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid UUID; v_next UUID;
BEGIN
  IF NOT public.is_player_in_room(p_room_id) THEN RAISE EXCEPTION 'Not in room'; END IF;
  SELECT id INTO v_pid FROM game_players WHERE room_id = p_room_id AND user_id = p_disconnected_user_id;
  UPDATE game_players SET connection_status = 'disconnected', disconnected_at = NOW() WHERE id = v_pid;
  IF (SELECT active_player_id FROM game_rooms WHERE id = p_room_id) = v_pid THEN
    SELECT id INTO v_next FROM game_players WHERE room_id = p_room_id AND connection_status = 'connected' AND id <> v_pid
    ORDER BY turn_order ASC LIMIT 1;
    UPDATE game_rooms SET active_player_id = v_next, updated_at = NOW() WHERE id = p_room_id;
  END IF;
  RETURN jsonb_build_object('success', true, 'next_player_id', v_next);
END; $$;

-- Optional (pg_cron): mark players with a stale heartbeat as disconnected
-- SELECT cron.schedule('mark-stale-players', '* * * * *', $$
--   UPDATE public.game_players SET connection_status='disconnected', disconnected_at=NOW()
--   WHERE connection_status='connected' AND last_heartbeat < NOW() - INTERVAL '60 seconds' $$);
