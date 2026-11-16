import { useState } from 'react'
import { Plus, Receipt, Trash2, Wallet } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  FeeStateBadge,
  FormError,
  IconButton,
  Loading,
  Section,
  useToast,
} from '@/components/ui'
import { useCreateEnrollmentFee, useDeleteFee, useFees } from '@/features/fees/api'
import { RegisterPaymentDialog } from '@/features/payments/RegisterPaymentDialog'
import { feeLabel, formatDate, formatMoney, todayIso } from '@/lib/format'
import type { FeeBalance } from '@/types/domain'

/** Cuotas de un alumno: mensualidades y matrículas, con lo pagado y lo que falta. */
export function StudentFeesTab({ studentId, familyId }: { studentId: string; familyId: string }) {
  const toast = useToast()
  const fees = useFees({ studentId })
  const createEnrollment = useCreateEnrollmentFee()
  const deleteFee = useDeleteFee()
  const year = Number(todayIso().slice(0, 4))

  const [paying, setPaying] = useState(false)
  const [toDelete, setToDelete] = useState<FeeBalance | null>(null)

  const list = fees.data ?? []
  const hasEnrollment = list.some((fee) => fee.concept === 'enrollment' && fee.period_year === year)
  const owed = list.filter((fee) => !fee.is_exempt && fee.balance > 0)

  return (
    <>
      <Section
        title="Cuotas"
        flush
        actions={
          <>
            {!hasEnrollment && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus aria-hidden="true" />}
                loading={createEnrollment.isPending}
                onClick={() =>
                  createEnrollment.mutate(
                    { studentId, year },
                    { onSuccess: () => toast.success(`Matrícula ${year} cargada`), onError: toast.error },
                  )
                }
              >
                Cargar matrícula {year}
              </Button>
            )}
            {owed.length > 0 && (
              <Button size="sm" variant="success" icon={<Receipt aria-hidden="true" />} onClick={() => setPaying(true)}>
                Registrar pago
              </Button>
            )}
          </>
        }
      >
        {fees.isPending ? (
          <Loading />
        ) : fees.isError ? (
          <ErrorState error={fees.error} onRetry={() => void fees.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon={<Wallet />} title="Sin cuotas todavía">
            Las mensualidades se generan para todos los alumnos desde la sección Cuotas.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {list.map((fee) => (
              <li key={fee.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-bold text-ink">{feeLabel(fee)}</p>
                  <p className="text-[0.8125rem] text-ink-3">
                    Vence el {formatDate(fee.due_date)}
                    {fee.discount_amount > 0 && !fee.is_exempt && `, descuento de ${formatMoney(fee.discount_amount)}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular text-[0.9375rem] font-bold text-ink">{formatMoney(fee.amount)}</p>
                  {fee.paid_amount > 0 && fee.balance > 0 && (
                    <p className="tabular text-[0.8125rem] text-ink-3">Falta {formatMoney(fee.balance)}</p>
                  )}
                </div>
                <span className="flex w-[108px] shrink-0">
                  <FeeStateBadge state={fee.state} />
                </span>
                {fee.paid_amount === 0 && fee.pending_amount === 0 ? (
                  <IconButton label={`Borrar ${feeLabel(fee)}`} onClick={() => setToDelete(fee)}>
                    <Trash2 />
                  </IconButton>
                ) : (
                  <span className="size-10 shrink-0" />
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <RegisterPaymentDialog
        open={paying}
        onClose={() => setPaying(false)}
        familyId={familyId}
        feeIds={owed.map((fee) => fee.id)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => {
          setToDelete(null)
          deleteFee.reset()
        }}
        onConfirm={() => {
          if (!toDelete) return
          deleteFee.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Cuota borrada')
              setToDelete(null)
            },
          })
        }}
        title={toDelete ? `Borrar ${feeLabel(toDelete)}` : 'Borrar cuota'}
        description="Usalo solo si la cuota se cargó por error. No se puede deshacer."
        confirmLabel="Borrar cuota"
        confirmVariant="danger"
        loading={deleteFee.isPending}
      >
        <FormError error={deleteFee.error} />
      </ConfirmDialog>
    </>
  )
}
