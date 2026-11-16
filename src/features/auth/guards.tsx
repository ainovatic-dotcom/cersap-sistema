import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { WifiOff } from 'lucide-react'
import { Alert, Button, FullPageLoading } from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'
import { useAuth } from './AuthProvider'

/** Deja pasar solo con sesión iniciada. Si no hay, manda a la pantalla de ingreso. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, profile, loading, profileError, profileOffline, retryProfile, signOut } = useAuth()

  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/ingresar" replace />

  // Sin señal: no es un problema de la cuenta. Nunca se ofrece cerrar sesión acá,
  // porque sin conexión después no se podría volver a entrar.
  if (!profile && profileOffline) {
    return (
      <AuthShell title="Sin conexión" description="Tu cuenta se carga apenas vuelva la señal. No hace falta que hagas nada.">
        <div className="flex items-center gap-3 rounded-card bg-cancha p-4 text-[0.9375rem] text-ink-2">
          <WifiOff aria-hidden="true" className="size-5 shrink-0 text-ink-3" />
          Revisá que el celular tenga datos o wifi.
        </div>
        <Button block size="lg" className="mt-4" onClick={retryProfile}>
          Reintentar
        </Button>
      </AuthShell>
    )
  }

  if (!profile) {
    return (
      <AuthShell title="No pudimos cargar tu cuenta">
        <Alert tone="error">
          {profileError ? 'Hubo un problema al leer tu perfil.' : 'Tu cuenta todavía no tiene un perfil.'} Cerrá sesión y
          volvé a entrar. Si sigue pasando, avisá a administración.
        </Alert>
        <Button variant="secondary" block className="mt-4" onClick={() => void signOut()}>
          Cerrar sesión
        </Button>
      </AuthShell>
    )
  }

  return <>{children}</>
}

/** Deja pasar solo a administración. Un tutor que escribe /admin a mano vuelve a su portal. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  if (profile?.role !== 'admin') return <Navigate to="/portal" replace />
  return <>{children}</>
}

/** La raíz "/" reparte según el rol. */
export function HomeRedirect() {
  const { profile } = useAuth()
  return <Navigate to={profile?.role === 'admin' ? '/admin' : '/portal'} replace />
}
