import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { isNetworkError } from '@/lib/errors'
import type { Profile } from '@/types/domain'

type AuthContextValue = {
  session: Session | null
  /** Perfil de la base. Su campo role decide a qué parte de la app se entra. */
  profile: Profile | null
  /** true mientras se resuelve la sesión o el perfil */
  loading: boolean
  profileError: unknown
  /** true si el perfil no se pudo leer por falta de conexión (se reintenta solo al volver la señal) */
  profileOffline: boolean
  retryProfile: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Sesión y perfil del usuario.
 *
 * Importante: esto solo decide qué PANTALLAS mostrar. La seguridad real está
 * en la base (RLS y funciones): aunque alguien fuerce la interfaz, la base no
 * le entrega datos que no le corresponden.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setSessionLoading(false)
    })
    // En la app instalada de Android, entrar con Google puede terminar en otra
    // ventana del navegador. Al volver a la app se vuelve a leer la sesión guardada.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void supabase.auth.getSession().then(({ data: current }) => {
        if (active) setSession((previous) => (previous?.access_token === current.session?.access_token ? previous : current.session))
      })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      data.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const userId = session?.user.id

  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId as string).single()
      if (error) throw error
      return data
    },
  })

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        // Siempre deja elegir la cuenta: en un celular compartido evita entrar con la de otra persona
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    // Sin esto, los datos del usuario anterior quedarían en memoria
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile: profileQuery.data ?? null,
      // Sin conexión la consulta queda en pausa: no es "cargando", es "esperando señal"
      loading: sessionLoading || (Boolean(userId) && profileQuery.isPending && profileQuery.fetchStatus !== 'paused'),
      profileError: profileQuery.error,
      profileOffline: profileQuery.fetchStatus === 'paused' || isNetworkError(profileQuery.error),
      retryProfile: () => void profileQuery.refetch(),
      signInWithGoogle,
      signOut,
    }),
    [session, profileQuery, sessionLoading, userId, signInWithGoogle, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>')
  return value
}
