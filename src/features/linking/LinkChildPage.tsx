import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Clock } from 'lucide-react'
import {
  Alert,
  Button,
  ErrorState,
  Field,
  FormError,
  FullPageLoading,
  Input,
  useToast,
  WhatsAppLink,
} from '@/components/ui'
import { AuthShell } from '@/components/layout/AuthShell'
import { useAuth } from '@/features/auth/AuthProvider'
import { usePortalOverview, useRequestFamilyLink, type LinkResult } from '@/features/portal/api'
import { todayIso } from '@/lib/format'
import { whatsappUrl } from '@/lib/whatsapp'

const RESULT_MESSAGES: Partial<Record<LinkResult, string>> = {
  not_found: 'No encontramos a nadie con esa cédula y esa fecha de nacimiento. Revisá los dos datos y probá de nuevo.',
  too_many_attempts: 'Hiciste varios intentos seguidos. Esperá una hora o escribí a administración para que te ayuden.',
  rejected: 'Administración no aprobó el acceso a esa familia. Escribiles para resolverlo.',
}

/**
 * Primer paso de un tutor: validar que es familiar de un alumno.
 * Pide la cédula y la fecha de nacimiento del hijo. Si el Gmail del tutor ya
 * está en la ficha de la familia entra directo; si no, administración aprueba.
 */
export function LinkChildPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { profile, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const addingAnother = searchParams.get('agregar') === '1'

  const overview = usePortalOverview()
  const request = useRequestFamilyLink()

  const [ci, setCi] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  if (overview.isPending) return <FullPageLoading />
  if (overview.isError) {
    return (
      <AuthShell title="No se pudo cargar">
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      </AuthShell>
    )
  }

  const data = overview.data
  const hasAccess = data.families.length > 0
  const hasPending = data.links.some((link) => link.status === 'pending')
  const helpMessage = `Hola, soy ${profile?.full_name ?? 'familiar de un alumno'} (${profile?.email ?? ''}). Pedí acceso al portal de ${data.org.name} y necesito ayuda.`
  const helpUrl = whatsappUrl(data.org.whatsapp_phone, helpMessage)

  if (hasAccess && !addingAnother) return <Navigate to="/portal" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    try {
      const result = await request.mutateAsync({ ci, birthDate })
      if (result === 'approved') {
        toast.success('Listo, ya podés ver a tu familia')
        navigate('/portal', { replace: true })
        return
      }
      if (result === 'pending') {
        setShowForm(false)
        setCi('')
        setBirthDate('')
        return
      }
      setMessage(RESULT_MESSAGES[result] ?? 'No se pudo validar. Probá de nuevo.')
    } catch {
      // El error queda en request.error y se muestra abajo
    }
  }

  const footer = (
    <>
      {hasAccess && (
        <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => navigate('/portal')}>
          Volver al portal
        </button>
      )}
      <p>
        Entraste como <span className="font-semibold text-ink-2">{profile?.email}</span>
      </p>
      <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => void signOut()}>
        Cerrar sesión
      </button>
    </>
  )

  if (hasPending && !showForm) {
    return (
      <AuthShell
        title="Tu pedido está en revisión"
        description="Administración tiene que confirmar que sos familiar del alumno. Cuando lo apruebe, vas a ver todo al entrar."
        footer={footer}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-control bg-ambar-50 p-3.5 text-ambar-800">
            <Clock aria-hidden="true" className="size-5 shrink-0" />
            <p className="text-[15px] font-medium">Suele resolverse en el día. No hace falta que vuelvas a pedirlo.</p>
          </div>
          <WhatsAppLink phone={data.org.whatsapp_phone} message={helpMessage} size="lg" block>
            Avisar por WhatsApp
          </WhatsAppLink>
          <Button variant="secondary" block onClick={() => void overview.refetch()} loading={overview.isRefetching}>
            Ver si ya me aprobaron
          </Button>
          <Button variant="ghost" block onClick={() => setShowForm(true)}>
            Tengo otro hijo en el centro
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={addingAnother || hasPending ? 'Sumá a otro hijo' : 'Decinos quién es tu hijo'}
      description="Para cuidar los datos de los chicos, solo los familiares pueden entrar. Escribí la cédula y la fecha de nacimiento de tu hijo o hija."
      footer={footer}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4" noValidate>
        <Field label="Cédula del alumno" hint="Solo los números, sin puntos.">
          {(props) => (
            <Input
              {...props}
              value={ci}
              onChange={(event) => setCi(event.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ej.: 6123456"
              required
            />
          )}
        </Field>
        <Field label="Fecha de nacimiento del alumno">
          {(props) => (
            <Input
              {...props}
              type="date"
              value={birthDate}
              max={todayIso()}
              onChange={(event) => setBirthDate(event.target.value)}
              required
            />
          )}
        </Field>

        {message && <Alert tone="warning">{message}</Alert>}
        <FormError error={request.error} />

        <Button type="submit" size="lg" block loading={request.isPending} disabled={ci.trim().length < 5 || !birthDate}>
          Validar
        </Button>

        {helpUrl && (
          <a href={helpUrl} target="_blank" rel="noreferrer" className="text-center text-sm font-semibold text-brand-700 hover:underline">
            ¿No te sale? Escribí a administración
          </a>
        )}
      </form>
    </AuthShell>
  )
}
