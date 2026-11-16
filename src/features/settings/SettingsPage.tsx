import { useState, type FormEvent } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  Field,
  FormError,
  IconButton,
  Input,
  Loading,
  MoneyInput,
  PageHeader,
  Section,
  Select,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { normalizePhone } from '@/lib/whatsapp'
import type { Settings } from '@/types/domain'
import { useAddAdminEmail, useAdminEmails, useRemoveAdminEmail, useSettings, useUpdateSettings } from './api'

export function SettingsPage() {
  const settings = useSettings()

  if (settings.isPending) return <Loading />
  if (settings.isError) return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />

  return (
    <>
      <PageHeader title="Configuración" description="Montos, fechas de pago, datos de contacto y quién administra el sistema." />
      <div className="flex max-w-3xl flex-col gap-4">
        <BillingSection settings={settings.data} />
        <ContactSection settings={settings.data} />
        <DisciplinesSection settings={settings.data} />
        <AdminsSection />
      </div>
    </>
  )
}

function BillingSection({ settings }: { settings: Settings }) {
  const toast = useToast()
  const update = useUpdateSettings()
  const [monthlyFee, setMonthlyFee] = useState<number | null>(settings.monthly_fee || null)
  const [enrollmentFee, setEnrollmentFee] = useState<number | null>(settings.enrollment_fee || null)
  const [dueDay, setDueDay] = useState(settings.due_day)
  const [invoicesFrom, setInvoicesFrom] = useState(settings.invoices_required_from ?? '')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate(
      {
        monthly_fee: monthlyFee ?? 0,
        enrollment_fee: enrollmentFee ?? 0,
        due_day: dueDay,
        invoices_required_from: invoicesFrom || null,
      },
      { onSuccess: () => toast.success('Cobro guardado') },
    )
  }

  return (
    <Section title="Cobro" description="Los cambios valen para las cuotas que se generen de ahora en adelante. Las ya generadas no se tocan.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mensualidad general" hint="Lo que paga un alumno sin descuento ni monto propio.">
            {(props) => <MoneyInput {...props} value={monthlyFee} onChange={setMonthlyFee} />}
          </Field>
          <Field label="Matrícula" hint="Dejala en cero si no se cobra.">
            {(props) => <MoneyInput {...props} value={enrollmentFee} onChange={setEnrollmentFee} />}
          </Field>
          <Field label="Último día para pagar" hint={`Desde el día ${dueDay + 1} la cuota figura vencida.`}>
            {(props) => (
              <Select {...props} value={dueDay} onChange={(event) => setDueDay(Number(event.target.value))}>
                {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                  <option key={day} value={day}>
                    Día {day} de cada mes
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Pedir factura desde" optional hint="Los pagos confirmados desde esa fecha aparecen en el panel hasta que cargues su factura.">
            {(props) => <Input {...props} type="date" value={invoicesFrom} onChange={(event) => setInvoicesFrom(event.target.value)} />}
          </Field>
        </div>
        <FormError error={update.error} />
        <Button type="submit" className="self-end" loading={update.isPending}>
          Guardar cobro
        </Button>
      </form>
    </Section>
  )
}

function ContactSection({ settings }: { settings: Settings }) {
  const toast = useToast()
  const update = useUpdateSettings()
  const [orgName, setOrgName] = useState(settings.org_name)
  const [phone, setPhone] = useState(settings.whatsapp_phone ?? '')

  const normalized = normalizePhone(phone)
  const phoneError = phone.trim() !== '' && (normalized.length < 8 || normalized.length > 15) ? 'Ese número no parece válido.' : undefined

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ org_name: orgName.trim(), whatsapp_phone: normalized || null }, { onSuccess: () => toast.success('Contacto guardado') })
  }

  return (
    <Section title="Contacto" description="Es lo que ven las familias en el portal.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del centro">
            {(props) => <Input {...props} value={orgName} onChange={(event) => setOrgName(event.target.value)} required />}
          </Field>
          <Field
            label="WhatsApp de administración"
            error={phoneError}
            hint={normalized ? `Se guarda como +${normalized}.` : 'A este número escriben las familias desde el portal.'}
          >
            {(props) => (
              <Input {...props} type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0981 123 456" />
            )}
          </Field>
        </div>
        <FormError error={update.error} />
        <Button type="submit" className="self-end" loading={update.isPending} disabled={orgName.trim() === '' || Boolean(phoneError)}>
          Guardar contacto
        </Button>
      </form>
    </Section>
  )
}

function DisciplinesSection({ settings }: { settings: Settings }) {
  const toast = useToast()
  const update = useUpdateSettings()
  const [name, setName] = useState('')

  function save(disciplines: string[], message: string) {
    update.mutate({ disciplines }, { onSuccess: () => toast.success(message), onError: toast.error })
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const value = name.trim()
    if (!value || settings.disciplines.some((item) => item.toLowerCase() === value.toLowerCase())) return
    save([...settings.disciplines, value], 'Disciplina agregada')
    setName('')
  }

  return (
    <Section title="Disciplinas" description="Las opciones que aparecen al cargar un alumno.">
      <ul className="mb-4 flex flex-wrap gap-2">
        {settings.disciplines.map((item) => (
          <li key={item} className="flex items-center gap-1 rounded-full border border-line-strong bg-surface py-1 pl-3.5 pr-1 text-[0.9375rem] font-semibold text-ink">
            {item}
            <button
              type="button"
              aria-label={`Quitar ${item}`}
              disabled={update.isPending}
              onClick={() => save(settings.disciplines.filter((other) => other !== item), 'Disciplina quitada')}
              className="flex size-7 items-center justify-center rounded-full text-ink-3 hover:bg-line/70 hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input aria-label="Nueva disciplina" placeholder="Nueva disciplina" value={name} onChange={(event) => setName(event.target.value)} className="max-w-xs" />
        <Button type="submit" variant="secondary" icon={<Plus aria-hidden="true" />} disabled={name.trim() === ''} loading={update.isPending}>
          Agregar
        </Button>
      </form>
    </Section>
  )
}

function AdminsSection() {
  const toast = useToast()
  const { profile } = useAuth()
  const admins = useAdminEmails()
  const add = useAddAdminEmail()
  const remove = useRemoveAdminEmail()
  const [email, setEmail] = useState('')
  const [toRemove, setToRemove] = useState<string | null>(null)

  const valid = /^\S+@\S+\.\S+$/.test(email.trim())

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    add.mutate(email, {
      onSuccess: () => {
        toast.success('Administrador agregado')
        setEmail('')
      },
    })
  }

  return (
    <Section
      title="Administradores"
      description="Estas cuentas ven y cambian todo: alumnos, documentos y pagos. Tienen que entrar con Google usando exactamente este correo."
    >
      {admins.isPending ? (
        <Loading />
      ) : admins.isError ? (
        <ErrorState error={admins.error} onRetry={() => void admins.refetch()} />
      ) : (
        <ul className="mb-4 divide-y divide-line rounded-control border border-line">
          {admins.data.map((admin) => (
            <li key={admin.email} className="flex items-center gap-3 px-3.5 py-2.5">
              <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold text-ink">{admin.email}</p>
              {admin.email === profile?.email ? (
                <Badge tone="azul">Sos vos</Badge>
              ) : (
                <IconButton label={`Quitar a ${admin.email}`} onClick={() => setToRemove(admin.email)}>
                  <Trash2 />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            aria-label="Gmail del nuevo administrador"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            placeholder="correo@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="max-w-sm"
          />
          <Button type="submit" variant="secondary" icon={<Plus aria-hidden="true" />} disabled={!valid} loading={add.isPending}>
            Agregar
          </Button>
        </div>
        <FormError error={add.error} />
      </form>

      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => {
          setToRemove(null)
          remove.reset()
        }}
        onConfirm={() => {
          if (!toRemove) return
          remove.mutate(toRemove, {
            onSuccess: () => {
              toast.success('Administrador quitado')
              setToRemove(null)
            },
          })
        }}
        title="Quitar administrador"
        description={`${toRemove ?? ''} deja de poder entrar a administración en el momento.`}
        confirmLabel="Quitar administrador"
        confirmVariant="danger"
        loading={remove.isPending}
      >
        <FormError error={remove.error} />
      </ConfirmDialog>
    </Section>
  )
}
