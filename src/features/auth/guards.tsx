import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Alert, Button, FullPageLoading } from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'
import { useAuth } from './AuthProvider'

/** Deja pasar solo con sesión iniciada. Si no hay, manda a la pantalla de ingreso. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { session, profile, loading, profileError, signOut } = useAuth()

  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/ingresar" replace />

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
