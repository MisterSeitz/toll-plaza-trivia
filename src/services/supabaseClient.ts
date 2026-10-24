import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const clean = (v: unknown) => String(v ?? '').trim().replace(/,$/, '').trim()

const url = clean(import.meta.env.SUPABASE_URL)
const key = clean(import.meta.env.SUPABASE_PUBLISHABLE_KEY)

export const isSupabaseConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = isSupabaseConfigured ? createClient(url, key) : null
