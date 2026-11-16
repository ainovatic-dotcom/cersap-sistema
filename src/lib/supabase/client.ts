import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Revisá el archivo .env en la raíz del proyecto.',
  )
}

/**
 * Único cliente de Supabase de toda la app. Importalo siempre desde acá.
 *
 * Usa la clave "publishable": es pública y por sí sola no da acceso a nada.
 * Qué puede ver o hacer cada persona lo decide la base (RLS y funciones).
 */
export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
