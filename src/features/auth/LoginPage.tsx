import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Button, FormError, FullPageLoading } from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'
import { InstallLink } from '@/components/pwa/InstallCard'
import { useOnline } from '@/lib/pwa'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const online = useOnline()

  if (loading) return <FullPageLoading />
  if (session) return <Navigate to="/" replace />

  async function handleSignIn() {
    setSubmitting(true)
    setError(null)
    try {
      await signInWithGoogle()
      // Si sale bien, el navegador se va a Google; no hay nada más que hacer acá.
    } catch (cause) {
      setError(cause)
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Entrá con tu cuenta de Google"
      description="Usá el Gmail que tenés en tu celular. No hace falta crear una contraseña nueva."
      footer={
        <>
          <p className="text-center">¿Sos mamá, papá o tutor? Después de entrar te pedimos la cédula de tu hijo o hija.</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4">
            <InstallLink />
            <Link to="/privacidad" className="inline-flex min-h-11 items-center px-2 font-semibold text-brand-700 hover:underline">
              Política de privacidad
            </Link>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormError error={error} />
        {!online && (
          <p role="status" className="rounded-control bg-cancha px-3.5 py-2.5 text-[0.9375rem] text-ink-2">
            Necesitás conexión para entrar. El botón se activa cuando vuelva la señal.
          </p>
        )}
        <Button
          size="lg"
          block
          disabled={!online}
          loading={submitting}
          onClick={() => void handleSignIn()}
          icon={
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-white text-[0.8125rem] font-extrabold text-brand-700"
            >
              G
            </span>
          }
        >
          Entrar con Google
        </Button>
      </div>
    </AuthShell>
  )
}
