import { useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, FileText } from 'lucide-react'
import {
  Button,
  DataRow,
  Dialog,
  DialogActions,
  Field,
  FormError,
  Money,
  MoneyInput,
  PaymentStatusBadge,
  Textarea,
  useToast,
} from '@/components/ui'
import { feeLabel, formatDate, formatDateTime, formatMoney } from '@/lib/format'
import { PAYMENT_METHOD } from '@/lib/labels'
import { openFile, useSignedUrl } from '@/lib/storage'
import { useReviewPayment, type PaymentListItem } from './api'

type ReviewPaymentDialogProps = {
  /** Pago a revisar. null = diálogo cerrado. */
  payment: PaymentListItem | null
  onClose: () => void
}

/** Detalle de un pago con su comprobante, para confirmarlo, rechazarlo o anularlo. */
export function ReviewPaymentDialog({ payment, onClose }: ReviewPaymentDialogProps) {
  return (
    <Dialog
      open={payment !== null}
      onClose={onClose}
      title={payment?.status === 'pending' ? 'Verificar pago' : 'Detalle del pago'}
      description={payment?.family?.name}
      size="lg"
    >
      {payment && <ReviewPaymentContent payment={payment} onClose={onClose} />}
    </Dialog>
  )
}

function ReviewPaymentContent({ payment, onClose }: { payment: PaymentListItem; onClose: () => void }) {
  const toast = useToast()
  const review = useReviewPayment()
  const isPdf = payment.receipt_path?.toLowerCase().endsWith('.pdf') ?? false
  const receiptUrl = useSignedUrl('payment-receipts', isPdf ? null : payment.receipt_path)

  const [amounts, setAmounts] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(payment.items.map((item) => [item.fee_id, item.amount])),
  )
  // null = sin pedir motivo; 'reject' o 'void' = se está escribiendo el motivo
  const [reasonMode, setReasonMode] = useState<'reject' | 'void' | null>(null)
  const [reason, setReason] = useState('')

  const isPending = payment.status === 'pending'
  const total = Object.values(amounts).reduce<number>((sum, amount) => sum + (amount ?? 0), 0)
  const changed = payment.items.some((item) => amounts[item.fee_id] !== item.amount)
  const invalid = payment.items.some((item) => !amounts[item.fee_id])

  async function approve() {
    try {
      await review.mutateAsync({
        paymentId: payment.id,
        approve: true,
        items: changed ? payment.items.map((item) => ({ fee_id: item.fee_id, amount: amounts[item.fee_id] as number })) : undefined,
      })
      toast.success('Pago confirmado')
      onClose()
    } catch {
      // El error se muestra abajo
    }
  }

  async function rejectOrVoid() {
    try {
      await review.mutateAsync({ paymentId: payment.id, approve: false, reason })
      toast.success(reasonMode === 'void' ? 'Pago anulado' : 'Pago rechazado')
      onClose()
    } catch {
      // El error se muestra abajo
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
      {/* Comprobante */}
      <div>
        {payment.receipt_path ? (
          isPdf ? (
            <button
              type="button"
              onClick={() => openFile('payment-receipts', payment.receipt_path as string).catch(toast.error)}
              className="flex w-full flex-col items-center gap-2 rounded-control border border-line bg-cancha px-4 py-10 text-brand-700 hover:bg-brand-50"
            >
              <FileText aria-hidden="true" className="size-10" />
              <span className="font-semibold">Abrir el comprobante (PDF)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openFile('payment-receipts', payment.receipt_path as string).catch(toast.error)}
              className="group relative block w-full overflow-hidden rounded-control border border-line bg-cancha"
              aria-label="Abrir el comprobante en grande"
            >
              {receiptUrl ? (
                <img src={receiptUrl} alt="Comprobante de la transferencia" className="max-h-[420px] w-full object-contain" />
              ) : (
                <span className="block py-24 text-center text-sm text-ink-3">Cargando comprobante…</span>
              )}
              <span className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ExternalLink aria-hidden="true" className="size-4" />
              </span>
            </button>
          )
        ) : (
          <div className="rounded-control border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-3">
            Este pago no tiene comprobante adjunto.
          </div>
        )}
      </div>

      {/* Datos y acciones */}
      <div className="flex flex-col gap-4">
        <dl className="divide-y divide-line">
          <DataRow label="Estado">
            <PaymentStatusBadge status={payment.status} />
          </DataRow>
          <DataRow label="Fecha del pago">{formatDate(payment.paid_on)}</DataRow>
          <DataRow label="Forma de pago">{PAYMENT_METHOD[payment.method]}</DataRow>
          <DataRow label={payment.submitted_via === 'portal' ? 'Lo informó' : 'Lo registró'}>
            {payment.submitter?.full_name ?? payment.submitter?.email ?? 'Sin dato'}
            <span className="block text-[0.8125rem] font-normal text-ink-3">{formatDateTime(payment.created_at)}</span>
          </DataRow>
          {payment.note && <DataRow label="Nota">{payment.note}</DataRow>}
          {payment.reviewed_at && (
            <DataRow label="Revisado">
              {payment.reviewer?.full_name ?? payment.reviewer?.email ?? 'Administración'}
              <span className="block text-[0.8125rem] font-normal text-ink-3">{formatDateTime(payment.reviewed_at)}</span>
            </DataRow>
          )}
          {payment.rejection_reason && <DataRow label="Motivo">{payment.rejection_reason}</DataRow>}
          {payment.invoice && <DataRow label="Factura">{payment.invoice.number}</DataRow>}
        </dl>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Cuotas</p>
          <ul className="divide-y divide-line overflow-hidden rounded-control border border-line">
            {payment.items.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-semibold text-ink">{item.fee ? feeLabel(item.fee) : 'Cuota'}</p>
                  <p className="text-[0.8125rem] text-ink-3">
                    {item.fee?.student ? `${item.fee.student.first_name} ${item.fee.student.last_name}` : ''}
                  </p>
                </div>
                {isPending ? (
                  <div className="w-full sm:w-40">
                    <MoneyInput
                      aria-label="Monto confirmado"
                      value={amounts[item.fee_id] ?? null}
                      onChange={(value) => setAmounts((current) => ({ ...current, [item.fee_id]: value }))}
                    />
                  </div>
                ) : (
                  <span className="tabular font-bold text-ink">{formatMoney(item.amount)}</span>
                )}
              </li>
            ))}
            <li className="flex items-end justify-between border-t border-dashed border-line-strong bg-cancha px-3 py-3">
              <span className="text-[0.9375rem] font-bold text-ink">Total</span>
              <Money value={isPending ? total : payment.amount} size="lg" />
            </li>
          </ul>
          {isPending && (
            <p className="mt-1.5 text-[0.8125rem] text-ink-3">
              Si la transferencia fue por otro monto, corregilo acá antes de confirmar.
            </p>
          )}
        </div>

        {reasonMode && (
          <Field
            label={reasonMode === 'void' ? 'Motivo de la anulación' : 'Motivo del rechazo'}
            hint={reasonMode === 'reject' ? 'La familia lo va a leer en el portal.' : undefined}
          >
            {(props) => <Textarea {...props} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} data-autofocus autoFocus />}
          </Field>
        )}

        <FormError error={review.error} />

        {reasonMode ? (
          <DialogActions>
            <Button variant="secondary" onClick={() => setReasonMode(null)} disabled={review.isPending}>
              Volver
            </Button>
            <Button variant="danger" onClick={() => void rejectOrVoid()} loading={review.isPending} disabled={reason.trim() === ''}>
              {reasonMode === 'void' ? 'Anular pago' : 'Rechazar pago'}
            </Button>
          </DialogActions>
        ) : isPending ? (
          <DialogActions>
            <Button variant="secondary" onClick={() => setReasonMode('reject')} disabled={review.isPending}>
              Rechazar
            </Button>
            <Button variant="success" onClick={() => void approve()} loading={review.isPending} disabled={invalid}>
              Confirmar pago
            </Button>
          </DialogActions>
        ) : payment.status === 'confirmed' ? (
          <DialogActions>
            <Button variant="ghost" onClick={() => setReasonMode('void')}>
              Anular pago
            </Button>
            {!payment.invoice && (
              <Link
                to={`/admin/facturas?familia=${payment.family_id}&pago=${payment.id}`}
                className="inline-flex h-11 items-center justify-center rounded-control border-[1.5px] border-line-strong px-4 text-[0.9375rem] font-semibold text-ink hover:bg-cancha"
              >
                Cargar factura
              </Link>
            )}
          </DialogActions>
        ) : null}
      </div>
    </div>
  )
}
