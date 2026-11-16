import { Eye, Receipt, Upload } from 'lucide-react'
import { Button, ButtonLink, Card, EmptyState, PaymentStatusBadge, useToast } from '@/components/ui'
import { PAYMENT_METHOD } from '@/lib/labels'
import { feeLabel, formatDate, formatMoney } from '@/lib/format'
import { openFile } from '@/lib/storage'
import { usePortalData } from './PortalGate'

export function PortalPaymentsPage() {
  const data = usePortalData()
  const toast = useToast()

  function describe(feeId: string) {
    const fee = data.fees.find((item) => item.id === feeId)
    if (!fee) return 'Cuota'
    const child = data.children.find((item) => item.id === fee.student_id)
    return `${feeLabel(fee)}${child ? `, ${child.first_name}` : ''}`
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-[1.875rem] text-ink">Pagos</h1>
        <p className="mt-1 text-[0.9375rem] text-ink-2">Lo que informaste y lo que registró administración.</p>
      </div>

      {data.payments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt />}
            title="Todavía no hay pagos"
            action={
              <ButtonLink to="/portal/pagar" icon={<Upload aria-hidden="true" />}>
                Informar un pago
              </ButtonLink>
            }
          >
            Cuando transfieras, subí el comprobante y lo vas a ver acá.
          </EmptyState>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.payments.map((payment) => (
            <li key={payment.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="tabular text-xl font-bold text-ink">{formatMoney(payment.amount)}</p>
                    <p className="text-sm text-ink-3">
                      {PAYMENT_METHOD[payment.method]} del {formatDate(payment.paid_on)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={payment.status} />
                </div>

                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-[0.9375rem] text-ink-2">
                  {payment.items.map((item) => (
                    <li key={item.fee_id} className="flex justify-between gap-3">
                      <span>{describe(item.fee_id)}</span>
                      <span className="tabular shrink-0 font-semibold">{formatMoney(item.amount)}</span>
                    </li>
                  ))}
                </ul>

                {payment.status === 'rejected' && payment.rejection_reason && (
                  <p className="mt-3 rounded-control bg-rojo-50 px-3 py-2 text-sm font-medium text-rojo-700">
                    Motivo: {payment.rejection_reason}
                  </p>
                )}

                {payment.receipt_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 mt-2"
                    icon={<Eye aria-hidden="true" />}
                    onClick={() => openFile('payment-receipts', payment.receipt_path as string).catch(toast.error)}
                  >
                    Ver comprobante
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
