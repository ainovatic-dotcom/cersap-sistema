import { Link } from 'react-router'
import { ChevronRight, CircleCheck, FileText, FileWarning, Receipt, ShieldCheck, TriangleAlert, UserPlus } from 'lucide-react'
import { BarChart } from '@/components/charts/BarChart'
import { StateBar } from '@/components/charts/StateBar'
import {
  Alert,
  Badge,
  ButtonLink,
  ErrorState,
  Money,
  PageHeader,
  StudentRow,
  Scoreboard,
  ScoreStat,
  Section,
  Skeleton,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { ageFrom, formatDateLong, formatMoney, formatMoneyShort, monthName, monthShort } from '@/lib/format'
import { useSignedUrls } from '@/lib/storage'
import { useDashboard, type DashboardData } from './api'

/** Colores fijos de los estados (validados con la skill dataviz, ver docs/DISENO.md) */
const STATE_COLORS = {
  paid: '#12814A',
  partial: '#0073B8',
  in_review: '#D98B0B',
  pending: '#9AA8B5',
  overdue: '#D91F26',
}

export function DashboardPage() {
  const dashboard = useDashboard()

  if (dashboard.isPending) return <DashboardSkeleton />
  if (dashboard.isError) return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />

  const data = dashboard.data
  const month = monthName(data.period_month).toLowerCase()

  return (
    <>
      <PageHeader
        title="Panel"
        description={`Hoy es ${formatDateLong(data.today)}. Esto es lo que pasa en el centro.`}
        actions={
          <>
            <ButtonLink to="/admin/pagos?registrar=1" variant="secondary" icon={<Receipt aria-hidden="true" />}>
              Registrar pago
            </ButtonLink>
            <ButtonLink to="/admin/alumnos/nuevo" icon={<UserPlus aria-hidden="true" />}>
              Nuevo alumno
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-4 md:gap-5">
        {!data.settings_ready && (
          <Alert
            tone="warning"
            title="Falta cargar el monto de la mensualidad"
            action={
              <ButtonLink to="/admin/configuracion" variant="secondary" size="sm">
                Ir a Configuración
              </ButtonLink>
            }
          >
            Sin ese dato no se pueden generar las cuotas.
          </Alert>
        )}
        {data.settings_ready && data.active_students > 0 && data.current_month_fees === 0 && (
          <Alert
            tone="info"
            title={`Todavía no generaste las cuotas de ${month}`}
            action={
              <ButtonLink to="/admin/cuotas" size="sm">
                Generar cuotas
              </ButtonLink>
            }
          >
            Hasta que las generes, las familias no ven qué tienen que pagar.
          </Alert>
        )}

        <Marcador data={data} />

        <div className="grid gap-4 md:gap-5 lg:grid-cols-[1fr_1.15fr]">
          <MonthStates data={data} />
          <Tasks data={data} />
        </div>

        <Birthdays data={data} />
      </div>
    </>
  )
}

/** El marcador: lo que falta cobrar, lo cobrado y la cobranza de los últimos 6 meses. */
function Marcador({ data }: { data: DashboardData }) {
  const series = data.collection_series ?? []
  return (
    <Scoreboard aria-labelledby="marcador-titulo">
      <div className="grid gap-8 p-5 md:p-7 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div className="flex flex-col">
          <p id="marcador-titulo" className="text-[15px] font-semibold text-noche-muted">
            Falta cobrar
          </p>
          <Money value={data.pending_balance} size="hero" className="mt-2 text-white" />
          <dl className="mt-auto grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-5 sm:grid-cols-4 lg:mt-8 lg:grid-cols-2 xl:grid-cols-4">
            <ScoreStat label="Ya vencido" tone={data.overdue_balance > 0 ? 'rojo' : undefined}>
              {formatMoneyShort(data.overdue_balance)}
            </ScoreStat>
            <ScoreStat label="Cobrado este mes" tone="verde">
              {formatMoneyShort(data.collected_this_month)}
            </ScoreStat>
            <ScoreStat label="Alumnos activos">{data.active_students}</ScoreStat>
            <ScoreStat label="Familias">{data.families}</ScoreStat>
          </dl>
        </div>
        <div className="flex flex-col">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-semibold text-white">Cobrado por mes</p>
            <p className="text-[13px] text-noche-muted">Últimos 6 meses</p>
          </div>
          <BarChart
            title="Cobrado por mes, últimos 6 meses"
            height={170}
            format={formatMoney}
            formatShort={formatMoneyShort}
            bars={series.map((point, index) => ({
              key: `${point.year}-${point.month}`,
              label: monthShort(point.month),
              fullLabel: `${monthName(point.month)} ${point.year}`,
              value: point.collected,
              highlight: index === series.length - 1,
            }))}
          />
        </div>
      </div>
    </Scoreboard>
  )
}

/** Cómo vienen las mensualidades de este mes. */
function MonthStates({ data }: { data: DashboardData }) {
  const states = data.month_states
  const total = states.paid + states.partial + states.in_review + states.pending + states.overdue
  const month = monthName(data.period_month)
  return (
    <Section
      title={`Cuotas de ${month.toLowerCase()}`}
      description={total > 0 ? `${states.paid} de ${total} ya están pagadas.` : undefined}
      actions={
        <ButtonLink to="/admin/cuotas" variant="ghost" size="sm">
          Ver cuotas
        </ButtonLink>
      }
    >
      {total === 0 ? (
        <p className="text-[15px] text-ink-3">Cuando generes las cuotas del mes, acá vas a ver cuántas se pagaron.</p>
      ) : (
        <StateBar
          title={`Estado de las cuotas de ${month}`}
          note={states.exempt > 0 ? `Además hay ${states.exempt} exoneradas, que no se cobran.` : undefined}
          segments={[
            { key: 'paid', label: 'Pagadas', count: states.paid, color: STATE_COLORS.paid },
            { key: 'partial', label: 'Pago parcial', count: states.partial, color: STATE_COLORS.partial },
            { key: 'in_review', label: 'En revisión', count: states.in_review, color: STATE_COLORS.in_review },
            { key: 'pending', label: 'Pendientes', count: states.pending, color: STATE_COLORS.pending },
            { key: 'overdue', label: 'Vencidas', count: states.overdue, color: STATE_COLORS.overdue },
          ]}
        />
      )}
    </Section>
  )
}

/** Lo que espera una decisión de administración. */
function Tasks({ data }: { data: DashboardData }) {
  const tasks = [
    {
      count: data.payments_to_review,
      label: data.payments_to_review === 1 ? 'pago por verificar' : 'pagos por verificar',
      to: '/admin/pagos',
      icon: <Receipt />,
      tone: 'ambar' as const,
    },
    {
      count: data.links_to_review,
      label: data.links_to_review === 1 ? 'familiar espera acceso al portal' : 'familiares esperan acceso al portal',
      to: '/admin/accesos',
      icon: <ShieldCheck />,
      tone: 'ambar' as const,
    },
    {
      count: data.overdue_fees,
      label: data.overdue_fees === 1 ? 'cuota vencida' : 'cuotas vencidas',
      to: '/admin/cuotas?estado=overdue',
      icon: <TriangleAlert />,
      tone: 'rojo' as const,
    },
    {
      count: data.students_missing_documents,
      label: data.students_missing_documents === 1 ? 'alumno con documentos incompletos' : 'alumnos con documentos incompletos',
      to: '/admin/alumnos?documentos=incompletos',
      icon: <FileWarning />,
      tone: 'neutro' as const,
    },
    {
      count: data.payments_without_invoice,
      label: data.payments_without_invoice === 1 ? 'pago sin factura cargada' : 'pagos sin factura cargada',
      to: '/admin/facturas',
      icon: <FileText />,
      tone: 'neutro' as const,
    },
  ].filter((task) => task.count > 0)

  return (
    <Section title="Para hacer" flush>
      {tasks.length === 0 ? (
        <div className="flex items-center gap-3 px-5 pb-5 text-[15px] text-ink-2">
          <span className="flex size-10 items-center justify-center rounded-full bg-verde-50 text-verde-600">
            <CircleCheck aria-hidden="true" className="size-5" />
          </span>
          No hay nada pendiente.
        </div>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {tasks.map((task) => (
            <li key={task.to}>
              <Link to={task.to} className="flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-cancha md:px-5">
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
                    task.tone === 'ambar' && 'bg-ambar-50 text-ambar-800',
                    task.tone === 'rojo' && 'bg-rojo-50 text-rojo-700',
                    task.tone === 'neutro' && 'bg-[#e6ecf2] text-ink-2',
                  )}
                >
                  {task.icon}
                </span>
                <p className="min-w-0 flex-1 text-[15px] text-ink">
                  <span className="dorsal mr-2 text-[26px] align-[-3px]">{task.count}</span>
                  {task.label}
                </p>
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

/** Los que cumplen años este mes: un motivo para saludar. */
function Birthdays({ data }: { data: DashboardData }) {
  const birthdays = data.birthdays ?? []
  const photos = useSignedUrls(
    'student-photos',
    birthdays.map((student) => student.photo_path),
  )
  if (birthdays.length === 0) return null
  const month = monthName(data.period_month).toLowerCase()
  const today = Number(data.today.slice(8, 10))

  return (
    <Section title={`Cumplen años en ${month}`} flush>
      <ul className="divide-y divide-line border-t border-line md:grid md:grid-cols-2 md:divide-y-0 md:[&>li]:border-b md:[&>li]:border-line md:[&>li:nth-child(odd)]:border-r">
        {birthdays.map((student) => {
          const day = Number(student.birth_date.slice(8, 10))
          const age = ageFrom(student.birth_date)
          const turning = age !== null ? (day >= today ? age + 1 : age) : null
          return (
            <li key={student.id}>
              <StudentRow
                to={`/admin/alumnos/${student.id}`}
                name={`${student.first_name} ${student.last_name}`}
                photoUrl={student.photo_path ? photos[student.photo_path] : null}
                meta={student.discipline ?? undefined}
                aside={
                  day === today ? (
                    <Badge tone="azul">Hoy cumple {turning}</Badge>
                  ) : (
                    <span className="text-[13px] text-ink-2">
                      {day > today ? `Cumple ${turning ?? ''} el ${day}` : `Cumplió el ${day}`}
                    </span>
                  )
                }
              />
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Cargando el panel" className="flex flex-col gap-5">
      <Skeleton className="h-10 w-40" />
      <div className="noche flex h-[330px] flex-col gap-4 rounded-[22px] p-7">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-16 w-72" />
        <Skeleton className="mt-auto h-6 w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-48 rounded-card" />
      </div>
    </div>
  )
}
