import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Button, FormError, FullPageLoading } from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)

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
          <p className="mt-3 text-center">
            <Link to="/privacidad" className="font-semibold text-brand-700 hover:underline">
              Política de privacidad
            </Link>
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FormError error={error} />
        <Button
          size="lg"
          block
          loading={submitting}
          onClick={() => void handleSignIn()}
          icon={
            <span
              aria-hidden="true"
              className="flex size-6 items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-brand-700"
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
