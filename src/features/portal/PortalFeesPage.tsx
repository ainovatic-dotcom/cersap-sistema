import { Upload, Wallet } from 'lucide-react'
import { ButtonLink, Card, EmptyState, FeeStateBadge } from '@/components/ui'
import { feeLabel, formatDate, formatMoney } from '@/lib/format'
import { payableAmount, type PortalFee } from './api'
import { usePortalData } from './PortalGate'

export function PortalFeesPage() {
  const data = usePortalData()
  const canPay = data.fees.some((fee) => payableAmount(fee) > 0)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-[30px] text-ink">Cuotas</h1>
        <p className="mt-1 text-[15px] text-ink-2">Mensualidades y matrículas de cada alumno, de la más nueva a la más vieja.</p>
      </div>

      {data.fees.length === 0 ? (
        <Card>
          <EmptyState icon={<Wallet />} title="Todavía no hay cuotas">
            Cuando administración cargue la primera mensualidad, la vas a ver acá.
          </EmptyState>
        </Card>
      ) : (
        data.children.map((child) => {
          const fees = data.fees.filter((fee) => fee.student_id === child.id)
          if (fees.length === 0) return null
          return (
            <section key={child.id} aria-label={`Cuotas de ${child.first_name}`}>
              <h2 className="display mb-2 text-xl text-ink">
                {child.first_name} {child.last_name}
              </h2>
              <Card>
                <ul className="divide-y divide-line">
                  {fees.map((fee) => (
                    <FeeRow key={fee.id} fee={fee} />
                  ))}
                </ul>
              </Card>
            </section>
          )
        })
      )}

      {canPay && (
        <ButtonLink to="/portal/pagar" size="lg" block icon={<Upload aria-hidden="true" />}>
          Informar un pago
        </ButtonLink>
      )}
    </div>
  )
}

function FeeRow({ fee }: { fee: PortalFee }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold text-ink">{feeLabel(fee)}</p>
        <p className="text-sm text-ink-3">
          {fee.is_exempt ? 'No se cobra' : `Vence el ${formatDate(fee.due_date)}`}
          {fee.discount_amount > 0 && !fee.is_exempt && `, con descuento de ${formatMoney(fee.discount_amount)}`}
        </p>
        {fee.paid_amount > 0 && fee.balance > 0 && (
          <p className="text-sm font-medium text-ink-2">
            Pagaste {formatMoney(fee.paid_amount)}, faltan {formatMoney(fee.balance)}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="tabular text-[16px] font-bold text-ink">{formatMoney(fee.amount)}</span>
        <FeeStateBadge state={fee.state} />
      </div>
    </li>
  )
}
