import { useState } from 'react'
import { Link } from 'react-router'
import { CircleCheck, Clock, Plus, Upload } from 'lucide-react'
import { Badge, ButtonLink, Card, Money, StudentRow, SummaryCard, WhatsAppLink } from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { ageFrom, formatMoney } from '@/lib/format'
import { useSignedUrls } from '@/lib/storage'
import { payableAmount } from './api'
import { usePortalData } from './PortalGate'

// La entrada escalonada se ve una sola vez por carga: las familias entran pocas
// veces al mes, así que acá sí vale un momento de bienvenida (emil: lo raro puede deleitar).
let introPlayed = false

/**
 * Coreografía de la entrada (skill choreograph):
 *   saludo + resumen (protagonista)   0 ms    460 ms  sube 14 px
 *   lista de hijos (una sola pieza)   90 ms   360 ms  sube 8 px
 *   botón de WhatsApp                 quieto
 */

export function PortalHomePage() {
  const { profile } = useAuth()
  const data = usePortalData()
  const [intro] = useState(() => {
    const first = !introPlayed
    introPlayed = true
    return first
  })
  const photos = useSignedUrls(
    'student-photos',
    data.children.map((child) => child.photo_path),
  )

  const owed = data.fees.filter((fee) => !fee.is_exempt && fee.balance > 0)
  const totalOwed = owed.reduce((sum, fee) => sum + fee.balance, 0)
  const overdueCount = owed.filter((fee) => fee.due_date < data.today).length
  const inReview = data.fees.reduce((sum, fee) => sum + fee.pending_amount, 0)
  const canPay = owed.some((fee) => payableAmount(fee) > 0)
  const firstName = profile?.full_name?.trim().split(/\s+/)[0]

  return (
    <div className="flex flex-col gap-6">
      <div className={intro ? 'entrar' : undefined}>
        <h1 className="display mb-4 text-[34px] text-ink">{firstName ? `Hola, ${firstName}` : 'Hola'}</h1>

        {/* Lo primero que quiere saber una familia: cuánto debe y cómo pagarlo */}
        <SummaryCard>
          {totalOwed > 0 ? (
            <div className="p-5">
              <p className="text-[15px] text-ink-2">Te falta pagar</p>
              <Money value={totalOwed} size="xl" className="mt-1 text-ink" />
              <p className="mt-2 text-[15px] text-ink">
                {owed.length === 1 ? '1 cuota' : `${owed.length} cuotas`}
                {overdueCount > 0 && (
                  <span className="font-semibold text-rojo-600">
                    {overdueCount === 1 ? ', 1 ya venció' : `, ${overdueCount} ya vencieron`}
                  </span>
                )}
                {'. '}
                <span className="text-ink-3">Se paga hasta el día {data.org.due_day} de cada mes.</span>
              </p>
              {inReview > 0 && (
                <p className="mt-3 flex items-center gap-2 rounded-control bg-ambar-50 px-3 py-2.5 text-sm font-medium text-ambar-800">
                  <Clock aria-hidden="true" className="size-4 shrink-0" />
                  Ya informaste {formatMoney(inReview)}. Administración lo está revisando.
                </p>
              )}
              {canPay && (
                <ButtonLink to="/portal/pagar" size="lg" block className="mt-4" icon={<Upload aria-hidden="true" />}>
                  Informar un pago
                </ButtonLink>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-verde-50 text-verde-600">
                <CircleCheck aria-hidden="true" className="size-7" />
              </span>
              <div>
                <p className="display text-[25px] text-ink">Estás al día</p>
                <p className="text-[15px] text-ink-3">No tenés cuotas pendientes. ¡Gracias!</p>
              </div>
            </div>
          )}
        </SummaryCard>
      </div>

      <section aria-labelledby="hijos">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="hijos" className="display text-[21px] text-ink">
            {data.children.length === 1 ? 'Tu hijo en el centro' : 'Tus hijos en el centro'}
          </h2>
          <Link to="/vincular?agregar=1" className="-mr-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            <Plus aria-hidden="true" className="size-4" />
            Sumar otro
          </Link>
        </div>
        <Card className={intro ? 'entrar-suave overflow-hidden' : 'overflow-hidden'} style={{ ['--d' as string]: '90ms' }}>
          <ul className="divide-y divide-line">
            {data.children.map((child) => {
              const childOwed = owed.filter((fee) => fee.student_id === child.id).reduce((sum, fee) => sum + fee.balance, 0)
              const age = ageFrom(child.birth_date)
              return (
                <li key={child.id}>
                  <StudentRow
                    name={`${child.first_name} ${child.last_name}`}
                    photoUrl={child.photo_path ? photos[child.photo_path] : null}
                    meta={[child.discipline, age !== null ? `${age} años` : null].filter(Boolean).join(', ')}
                    aside={
                      child.status === 'inactive' ? (
                        <Badge>De baja</Badge>
                      ) : childOwed > 0 ? (
                        <span className="block leading-tight">
                          <span className="tabular block text-[15px] font-semibold text-rojo-700">{formatMoney(childOwed)}</span>
                          <span className="block text-[12px] text-ink-3">por pagar</span>
                        </span>
                      ) : (
                        <Badge tone="verde">Al día</Badge>
                      )
                    }
                  />
                </li>
              )
            })}
          </ul>
        </Card>
      </section>

      <WhatsAppLink
        phone={data.org.whatsapp_phone}
        message={`Hola, escribo desde el portal de ${data.org.name}.`}
        variant="secondary"
        size="lg"
        block
      >
        Escribir a administración
      </WhatsAppLink>
    </div>
  )
}
