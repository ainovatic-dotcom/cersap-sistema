import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronRight, Plus, Receipt } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, SkeletonRows, PageHeader, Tabs } from '@/components/ui'
import { useDashboard } from '@/features/dashboard/api'
import { feeLabel, formatDate, formatMoney } from '@/lib/format'
import { PAYMENT_METHOD } from '@/lib/labels'
import type { PaymentStatus } from '@/types/domain'
import { usePayments, type PaymentListItem } from './api'
import { RegisterPaymentDialog } from './RegisterPaymentDialog'
import { ReviewPaymentDialog } from './ReviewPaymentDialog'

const EMPTY: Record<PaymentStatus, { title: string; text: string }> = {
  pending: { title: 'No hay pagos por verificar', text: 'Cuando una familia informe una transferencia desde el portal, aparece acá.' },
  confirmed: { title: 'Todavía no hay pagos confirmados', text: 'Los pagos que confirmes o registres van a quedar en esta lista.' },
  rejected: { title: 'No hay pagos rechazados', text: 'Acá quedan los pagos rechazados o anulados, con su motivo.' },
}

export function PaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [selected, setSelected] = useState<PaymentListItem | null>(null)
  const registering = searchParams.get('registrar') === '1'

  const dashboard = useDashboard()
  const payments = usePayments({ status })

  return (
    <>
      <PageHeader
        title="Pagos"
        description="Verificá las transferencias que informan las familias y registrá los cobros en efectivo."
        actions={
          <Button icon={<Plus aria-hidden="true" />} onClick={() => setSearchParams({ registrar: '1' })}>
            Registrar pago
          </Button>
        }
      />

      <Tabs
        label="Estado de los pagos"
        className="mb-4 w-fit max-w-full"
        value={status}
        onChange={setStatus}
        items={[
          { value: 'pending', label: 'Por verificar', count: dashboard.data?.payments_to_review },
          { value: 'confirmed', label: 'Confirmados' },
          { value: 'rejected', label: 'Rechazados' },
        ]}
      />

      <Card>
        {payments.isPending ? (
          <SkeletonRows />
        ) : payments.isError ? (
          <ErrorState error={payments.error} onRetry={() => void payments.refetch()} />
        ) : payments.data.length === 0 ? (
          <EmptyState icon={<Receipt />} title={EMPTY[status].title}>
            {EMPTY[status].text}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {payments.data.map((payment) => (
              <li key={payment.id}>
                <button
                  type="button"
                  onClick={() => setSelected(payment)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cancha md:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-bold text-ink">{payment.family?.name ?? 'Familia'}</p>
                    <p className="truncate text-sm text-ink-3">
                      {payment.items
                        .map((item) => (item.fee ? `${feeLabel(item.fee)} de ${item.fee.student?.first_name ?? ''}` : 'Cuota'))
                        .join(', ')}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-3">
                      {PAYMENT_METHOD[payment.method]} del {formatDate(payment.paid_on)}
                      {payment.submitted_via === 'portal' ? ', informado desde el portal' : ''}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-[17px] font-bold text-ink">{formatMoney(payment.amount)}</span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-ink-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReviewPaymentDialog payment={selected} onClose={() => setSelected(null)} />
      <RegisterPaymentDialog open={registering} onClose={() => setSearchParams({})} />
    </>
  )
}
