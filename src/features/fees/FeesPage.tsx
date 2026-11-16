import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CalendarPlus, ChevronLeft, ChevronRight, Wallet } from 'lucide-react'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  FeeStateBadge,
  IconButton,
  SkeletonRows,
  SummaryCard,
  SummaryStat,
  PageHeader,
  Tabs,
  useToast,
  WhatsAppLink,
} from '@/components/ui'
import { familyPhone, useFamilies } from '@/features/families/api'
import { RegisterPaymentDialog } from '@/features/payments/RegisterPaymentDialog'
import { useSettings } from '@/features/settings/api'
import { useStudents } from '@/features/students/api'
import { feeLabel, formatDate, formatMoney, formatMoneyShort, monthName, todayIso } from '@/lib/format'
import type { FeeBalance } from '@/types/domain'
import { useFees, useGenerateMonthlyFees } from './api'

type Filter = 'all' | 'owed' | 'in_review' | 'paid'

/** Mensualidades de un mes (o todas las vencidas), con cobro y recordatorio por WhatsApp. */
export function FeesPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const overdueMode = searchParams.get('estado') === 'overdue'
  const today = todayIso()

  const [year, setYear] = useState(Number(today.slice(0, 4)))
  const [month, setMonth] = useState(Number(today.slice(5, 7)))
  const [filter, setFilter] = useState<Filter>('all')
  const [paying, setPaying] = useState<FeeBalance | null>(null)

  const settings = useSettings()
  const fees = useFees(overdueMode ? { overdueOn: today } : { year, month })
  const students = useStudents()
  const families = useFamilies()
  const generate = useGenerateMonthlyFees()

  const studentById = useMemo(() => new Map((students.data ?? []).map((student) => [student.id, student])), [students.data])
  const familyById = useMemo(() => new Map((families.data ?? []).map((family) => [family.id, family])), [families.data])

  const all = useMemo(() => {
    const list = [...(fees.data ?? [])]
    const name = (fee: FeeBalance) => {
      const student = studentById.get(fee.student_id)
      return student ? `${student.last_name} ${student.first_name}` : ''
    }
    return list.sort((a, b) => name(a).localeCompare(name(b), 'es') || a.due_date.localeCompare(b.due_date))
  }, [fees.data, studentById])

  const groups: Record<Filter, FeeBalance[]> = {
    all,
    owed: all.filter((fee) => !fee.is_exempt && fee.balance > 0 && fee.pending_amount === 0),
    in_review: all.filter((fee) => fee.pending_amount > 0),
    paid: all.filter((fee) => fee.state === 'paid' || fee.state === 'exempt'),
  }
  const visible = overdueMode ? all : groups[filter]

  const billed = all.reduce((sum, fee) => sum + fee.amount, 0)
  const collected = all.reduce((sum, fee) => sum + fee.paid_amount, 0)
  const owed = all.reduce((sum, fee) => sum + Math.max(0, fee.balance), 0)
  const monthLabel = `${monthName(month)} ${year}`
  const progress = billed > 0 ? Math.min(100, Math.round((collected / billed) * 100)) : 0

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth() + 1)
    setFilter('all')
  }

  function handleGenerate() {
    generate.mutate(
      { year, month },
      {
        onSuccess: (count) =>
          toast.success(
            count === 0
              ? 'No había cuotas nuevas para generar'
              : count === 1
                ? 'Se generó 1 cuota'
                : `Se generaron ${count} cuotas`,
          ),
        onError: toast.error,
      },
    )
  }

  return (
    <>
      <PageHeader
        title={overdueMode ? 'Cuotas vencidas' : 'Cuotas'}
        description={
          overdueMode
            ? 'Todo lo que ya pasó su fecha de pago y sigue debiéndose, de cualquier mes.'
            : `Las mensualidades se generan una vez por mes. Se pagan hasta el día ${settings.data?.due_day ?? 5}; desde el día siguiente figuran vencidas.`
        }
        back={overdueMode ? { to: '/admin/cuotas', label: 'Ver por mes' } : undefined}
        actions={
          !overdueMode && (
            <Button icon={<CalendarPlus aria-hidden="true" />} onClick={handleGenerate} loading={generate.isPending}>
              Generar cuotas de {monthName(month).toLowerCase()}
            </Button>
          )
        }
      />

      {!overdueMode && (
        <>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1">
              <IconButton label="Mes anterior" onClick={() => shiftMonth(-1)}>
                <ChevronLeft />
              </IconButton>
              <p className="display min-w-44 text-center text-2xl text-ink" aria-live="polite">
                {monthLabel}
              </p>
              <IconButton label="Mes siguiente" onClick={() => shiftMonth(1)}>
                <ChevronRight />
              </IconButton>
            </div>
            <Tabs
              label="Filtrar cuotas"
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: 'Todas', count: groups.all.length },
                { value: 'owed', label: 'Deben', count: groups.owed.length },
                { value: 'in_review', label: 'En revisión', count: groups.in_review.length },
                { value: 'paid', label: 'Pagadas', count: groups.paid.length },
              ]}
            />
          </div>

          {all.length > 0 && (
            <SummaryCard className="mb-4">
              <div className="p-5 md:px-6">
                <dl className="grid grid-cols-3 gap-4">
                  <SummaryStat label="Total del mes">{formatMoneyShort(billed)}</SummaryStat>
                  <SummaryStat label="Cobrado" tone="verde">
                    {formatMoneyShort(collected)}
                  </SummaryStat>
                  <SummaryStat label="Falta cobrar" tone={owed > 0 ? 'rojo' : undefined}>
                    {formatMoneyShort(owed)}
                  </SummaryStat>
                </dl>
                <div className="mt-4">
                  <div
                    role="progressbar"
                    aria-label="Cobrado del total del mes"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="h-2 overflow-hidden rounded-full bg-cancha"
                  >
                    <span className="block h-full rounded-full bg-verde-600" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-2 text-[0.8125rem] text-ink-3">
                    Se cobró el <span className="tabular font-bold text-ink">{progress} %</span> de lo que se factura en{' '}
                    {monthName(month).toLowerCase()}.
                  </p>
                </div>
              </div>
            </SummaryCard>
          )}
        </>
      )}

      {settings.data && settings.data.monthly_fee <= 0 && (
        <Alert
          tone="warning"
          className="mb-4"
          title="Falta cargar el monto de la mensualidad"
          action={
            <ButtonLink to="/admin/configuracion" variant="secondary" size="sm">
              Ir a Configuración
            </ButtonLink>
          }
        />
      )}

      <Card>
        {fees.isPending ? (
          <SkeletonRows />
        ) : fees.isError ? (
          <ErrorState error={fees.error} onRetry={() => void fees.refetch()} />
        ) : all.length === 0 ? (
          overdueMode ? (
            <EmptyState icon={<Wallet />} title="No hay cuotas vencidas">
              Todas las familias están al día.
            </EmptyState>
          ) : (
            <EmptyState
              icon={<Wallet />}
              title={`Todavía no hay cuotas de ${monthLabel.toLowerCase()}`}
              action={
                <Button icon={<CalendarPlus aria-hidden="true" />} onClick={handleGenerate} loading={generate.isPending}>
                  Generar cuotas de {monthName(month).toLowerCase()}
                </Button>
              }
            >
              Al generarlas se crea una mensualidad para cada alumno activo, con su descuento si tiene.
            </EmptyState>
          )
        ) : visible.length === 0 ? (
          <EmptyState title="Ninguna cuota en este filtro">Probá con otra pestaña.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((fee) => {
              const student = studentById.get(fee.student_id)
              const family = familyById.get(fee.family_id)
              const canCharge = !fee.is_exempt && fee.balance > 0 && fee.pending_amount === 0
              const studentName = student ? `${student.first_name} ${student.last_name}` : 'Alumno'
              return (
                <li key={fee.id} className="flex flex-col gap-2 px-4 py-3 md:px-5 lg:flex-row lg:items-center lg:gap-4">
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/alumnos/${fee.student_id}`} className="text-[1rem] font-bold text-ink hover:text-brand-700 hover:underline">
                      {student ? `${student.last_name}, ${student.first_name}` : 'Alumno'}
                    </Link>
                    <p className="truncate text-sm text-ink-3">
                      {overdueMode && `${feeLabel(fee)}, `}
                      {family?.name}
                      {`, vence el ${formatDate(fee.due_date)}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <div className="shrink-0 lg:text-right">
                      <p className="tabular text-[1rem] font-bold text-ink">{formatMoney(fee.amount)}</p>
                      {fee.paid_amount > 0 && fee.balance > 0 && (
                        <p className="tabular text-[0.8125rem] text-ink-3">Falta {formatMoney(fee.balance)}</p>
                      )}
                    </div>
                    <span className="flex shrink-0 lg:w-[108px]">
                      <FeeStateBadge state={fee.state} />
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 md:w-[212px] lg:justify-end">
                    {fee.pending_amount > 0 && (
                      <ButtonLink to="/admin/pagos" variant="secondary" size="sm">
                        Verificar pago
                      </ButtonLink>
                    )}
                    {canCharge && (
                      <>
                        <WhatsAppLink
                          phone={familyPhone(family?.guardians)}
                          variant="secondary"
                          size="sm"
                          message={`Hola, le escribimos de CERSAP. Le recordamos la cuota de ${feeLabel(fee).toLowerCase()} de ${studentName}: ${formatMoney(fee.balance)}. ${fee.due_date < today ? 'Venció' : 'Vence'} el ${formatDate(fee.due_date)}. Puede informar el pago desde el portal. ¡Gracias!`}
                        >
                          Recordar
                        </WhatsAppLink>
                        <Button variant="success" size="sm" onClick={() => setPaying(fee)}>
                          Cobrar
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {!overdueMode && groups.owed.some((fee) => fee.due_date < today) && (
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-brand-700 hover:underline"
          onClick={() => setSearchParams({ estado: 'overdue' })}
        >
          Ver todas las cuotas vencidas, de cualquier mes
        </button>
      )}

      <RegisterPaymentDialog
        open={paying !== null}
        onClose={() => setPaying(null)}
        familyId={paying?.family_id}
        feeIds={paying ? [paying.id] : undefined}
      />
    </>
  )
}
