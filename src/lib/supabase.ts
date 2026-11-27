import { createClient } from '@supabase/supabase-js'

// Estas dos credenciales son públicas (publishable) y pueden estar en el
// frontend. La protección real de los datos depende de las políticas RLS.
// Nunca colocar aquí una secret key ni una service_role.
const url = 'https://kskgcxmbnmitgcivippr.supabase.co'
const publishableKey = 'sb_publishable_J8Je4jM_ZEkCM1QSfjrp8Q_z-jhmFI1'

export const supabase = createClient(url, publishableKey)
export const isSupabaseConfigured = true
