import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import {
  Button,
  ButtonLink,
  Card,
  Checkbox,
  EmptyState,
  Field,
  FilePicker,
  FormError,
  Input,
  Money,
  ReceiptRow,
  Tabs,
  useToast,
} from '@/components/ui'
import { feeLabel, formatDate, formatMoney, todayIso } from '@/lib/format'
import { payableAmount, useSubmitPayment } from './api'
import { usePortalData } from './PortalGate'

/**
 * Informar una transferencia en tres pasos: qué se paga, el comprobante y enviar.
 * El pago queda "por verificar" hasta que administración lo confirma.
 */
export function PortalPayPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const data = usePortalData()
  const submit = useSubmitPayment()

  const [familyId, setFamilyId] = useState(data.families[0]?.id ?? '')
  const payable = useMemo(
    () =>
      data.fees
        .filter((fee) => fee.family_id === familyId && payableAmount(fee) > 0)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [data.fees, familyId],
  )

  // Arranca marcado lo vencido y lo de este mes. Las cuotas de meses que
  // todavía no llegaron quedan sin marcar: quien quiera adelantar, las tilda.
  const futureFeeIds = (family: string) =>
    new Set(
      data.fees
        .filter((fee) => fee.family_id === family && fee.due_date.slice(0, 7) > data.today.slice(0, 7))
        .map((fee) => fee.id),
    )
  const [unchecked, setUnchecked] = useState<Set<string>>(() => futureFeeIds(data.families[0]?.id ?? ''))
  const [receipt, setReceipt] = useState<File | null>(null)
  const [paidOn, setPaidOn] = useState(todayIso())

  const selected = payable.filter((fee) => !unchecked.has(fee.id))
  const total = selected.reduce((sum, fee) => sum + payableAmount(fee), 0)
  const childName = (studentId: string) => data.children.find((child) => child.id === studentId)?.first_name ?? ''

  function toggle(feeId: string) {
    setUnchecked((current) => {
      const next = new Set(current)
      if (next.has(feeId)) next.delete(feeId)
      else next.add(feeId)
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!receipt || selected.length === 0) return
    try {
      await submit.mutateAsync({ familyId, feeIds: selected.map((fee) => fee.id), paidOn, receipt })
      toast.success('Pago informado. Administración lo va a revisar.')
      navigate('/portal/pagos')
    } catch {
      // El error se muestra arriba del botón
    }
  }

  if (payable.length === 0 && data.families.length <= 1) {
    return (
      <Card>
        <EmptyState
          icon={<CircleCheck />}
          title="No hay nada para informar"
          action={
            <ButtonLink to="/portal" variant="secondary">
              Volver al inicio
            </ButtonLink>
          }
        >
          Tus cuotas están pagas o ya tienen un pago en revisión.
        </EmptyState>
      </Card>
    )
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
      <div>
        <h1 className="display text-[30px] text-ink">Informar un pago</h1>
        <p className="mt-1 text-[15px] text-ink-2">
          Hacé la transferencia como siempre y después subí acá la foto del comprobante.
        </p>
      </div>

      {data.families.length > 1 && (
        <Tabs
          label="Familia"
          value={familyId}
          onChange={(next) => {
            setFamilyId(next)
            setUnchecked(futureFeeIds(next))
          }}
          items={data.families.map((family) => ({ value: family.id, label: family.name }))}
        />
      )}

      <Step number={1} title="Marcá lo que pagaste">
        {payable.length === 0 ? (
          <p className="text-[15px] text-ink-3">Esta familia no tiene cuotas para informar.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {payable.map((fee) => (
              <li key={fee.id} className="rounded-control px-2 py-2.5 hover:bg-cancha">
                <Checkbox
                  checked={!unchecked.has(fee.id)}
                  onChange={() => toggle(fee.id)}
                  label={
                    <span className="flex items-baseline justify-between gap-3">
                      <span>
                        {feeLabel(fee)}, {childName(fee.student_id)}
                      </span>
                      <span className="tabular shrink-0 font-bold">{formatMoney(payableAmount(fee))}</span>
                    </span>
                  }
                  description={
                    fee.due_date < data.today ? `Venció el ${formatDate(fee.due_date)}` : `Vence el ${formatDate(fee.due_date)}`
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Step>

      <Step number={2} title="Subí el comprobante">
        <div className="flex flex-col gap-4">
          <FilePicker
            value={receipt}
            onChange={setReceipt}
            label="Tocá para elegir la foto o sacarla"
            hint="Captura de pantalla, foto o PDF de la transferencia"
          />
          <Field label="¿Qué día transferiste?">
            {(props) => (
              <Input {...props} type="date" value={paidOn} max={todayIso()} onChange={(event) => setPaidOn(event.target.value)} required />
            )}
          </Field>
        </div>
      </Step>

      <Step number={3} title="Revisá y enviá">
        {/* Formato recibo: etiqueta apagada a la izquierda, monto a la derecha, total aparte */}
        <div className="rounded-control border border-dashed border-line-strong bg-cancha/60 px-4 py-3">
          {selected.length === 0 ? (
            <p className="py-1.5 text-[15px] text-ink-3">Marcá al menos una cuota.</p>
          ) : (
            selected.map((fee) => (
              <ReceiptRow
                key={fee.id}
                label={`${feeLabel(fee)}, ${childName(fee.student_id)}`}
                value={formatMoney(payableAmount(fee))}
              />
            ))
          )}
          <div className="mt-2 border-t border-line-strong">
            <ReceiptRow strong label="Total que informás" value={<Money value={total} size="lg" />} />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <FormError error={submit.error} />
          <Button type="submit" size="lg" block loading={submit.isPending} disabled={!receipt || selected.length === 0 || !paidOn}>
            Informar pago
          </Button>
          {!receipt && selected.length > 0 && <p className="text-center text-[13px] text-ink-3">Falta subir el comprobante.</p>}
          <p className="text-center text-[13px] text-ink-3">Queda en revisión hasta que administración confirme la transferencia.</p>
        </div>
      </Step>
    </form>
  )
}

/** Paso numerado: acá los números sí indican un orden. */
function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 flex items-center gap-2.5">
        <span className="dorsal flex size-9 shrink-0 items-center justify-center rounded-full bg-noche-900 text-[20px] text-white">{number}</span>
        <span className="display text-[22px] text-ink">{title}</span>
      </h2>
      {children}
    </Card>
  )
}
