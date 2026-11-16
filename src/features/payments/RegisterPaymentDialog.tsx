import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  Field,
  FilePicker,
  FormError,
  Input,
  Loading,
  Money,
  MoneyInput,
  Select,
  Textarea,
  useToast,
} from '@/components/ui'
import { useFamily, useFamilyOptions } from '@/features/families/api'
import { useFees } from '@/features/fees/api'
import { feeLabel, formatMoney, todayIso } from '@/lib/format'
import { PAYMENT_METHOD } from '@/lib/labels'
import type { PaymentMethod } from '@/types/domain'
import { useRegisterPayment } from './api'

type RegisterPaymentDialogProps = {
  open: boolean
  onClose: () => void
  /** Familia ya elegida (cuando se abre desde una ficha) */
  familyId?: string
  /** Cuotas que arrancan marcadas */
  feeIds?: string[]
}

/** Administración registra un cobro en efectivo o una transferencia que ya verificó. */
export function RegisterPaymentDialog({ open, onClose, familyId, feeIds }: RegisterPaymentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Registrar pago"
      description="Queda confirmado en el momento y descuenta el saldo de las cuotas."
      size="md"
    >
      <RegisterPaymentForm onClose={onClose} initialFamilyId={familyId} initialFeeIds={feeIds} />
    </Dialog>
  )
}

function RegisterPaymentForm({
  onClose,
  initialFamilyId,
  initialFeeIds,
}: {
  onClose: () => void
  initialFamilyId?: string
  initialFeeIds?: string[]
}) {
  const toast = useToast()
  const register = useRegisterPayment()
  const families = useFamilyOptions()

  const [familyId, setFamilyId] = useState(initialFamilyId ?? '')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidOn, setPaidOn] = useState(todayIso())
  const [note, setNote] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  // fee_id -> monto a cobrar. Si la cuota no está en el mapa, no está marcada.
  const [amounts, setAmounts] = useState<Record<string, number | null>>({})
  const presetDone = useRef(false)

  const family = useFamily(familyId || undefined)
  const fees = useFees(familyId ? { familyId } : null)

  const payable = useMemo(
    () =>
      (fees.data ?? [])
        .filter((fee) => !fee.is_exempt && fee.balance > 0)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [fees.data],
  )

  // Marca las cuotas pedidas (initialFeeIds) una sola vez, cuando llegan los datos
  useEffect(() => {
    if (presetDone.current || !initialFeeIds?.length || payable.length === 0) return
    presetDone.current = true
    setAmounts(Object.fromEntries(payable.filter((fee) => initialFeeIds.includes(fee.id)).map((fee) => [fee.id, fee.balance])))
  }, [payable, initialFeeIds])

  const studentName = (studentId: string) => {
    const student = family.data?.students.find((item) => item.id === studentId)
    return student ? student.first_name : ''
  }

  const items = Object.entries(amounts)
    .filter(([, amount]) => amount !== null && amount > 0)
    .map(([fee_id, amount]) => ({ fee_id, amount: amount as number }))
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const overBalance = payable.some((fee) => (amounts[fee.id] ?? 0) > fee.balance)

  function toggle(feeId: string, balance: number) {
    setAmounts((current) => {
      const next = { ...current }
      if (feeId in next) delete next[feeId]
      else next[feeId] = balance
      return next
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await register.mutateAsync({ familyId, method, paidOn, items, receipt, note })
      toast.success('Pago registrado')
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      {!initialFamilyId && (
        <Field label="Familia">
          {(props) => (
            <Select
              {...props}
              value={familyId}
              onChange={(event) => {
                setFamilyId(event.target.value)
                setAmounts({})
              }}
              required
            >
              <option value="">Elegí una familia</option>
              {(families.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      {familyId && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-ink">Cuotas que se pagan</legend>
          {fees.isPending ? (
            <Loading label="Buscando cuotas" />
          ) : payable.length === 0 ? (
            <p className="rounded-control bg-verde-50 px-3 py-2.5 text-[0.9375rem] font-medium text-verde-700">
              Esta familia no tiene cuotas pendientes.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-control border border-line">
              {payable.map((fee) => {
                const checked = fee.id in amounts
                return (
                  <li key={fee.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                    <Checkbox
                      className="flex-1"
                      checked={checked}
                      onChange={() => toggle(fee.id, fee.balance)}
                      label={`${feeLabel(fee)}${studentName(fee.student_id) ? `, ${studentName(fee.student_id)}` : ''}`}
                      description={`Saldo ${formatMoney(fee.balance)}`}
                    />
                    {checked && (
                      <div className="w-full sm:w-44">
                        <MoneyInput
                          aria-label={`Monto para ${feeLabel(fee)}`}
                          value={amounts[fee.id] ?? null}
                          onChange={(value) => setAmounts((current) => ({ ...current, [fee.id]: value }))}
                          aria-invalid={(amounts[fee.id] ?? 0) > fee.balance || undefined}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {overBalance && <p className="mt-1.5 text-[0.8125rem] font-medium text-rojo-700">Un monto supera el saldo de su cuota.</p>}
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Forma de pago">
          {(props) => (
            <Select {...props} value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              <option value="cash">{PAYMENT_METHOD.cash}</option>
              <option value="transfer">{PAYMENT_METHOD.transfer}</option>
            </Select>
          )}
        </Field>
        <Field label="Fecha del pago">
          {(props) => (
            <Input {...props} type="date" value={paidOn} max={todayIso()} onChange={(event) => setPaidOn(event.target.value)} required />
          )}
        </Field>
      </div>

      {method === 'transfer' && (
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">
            Comprobante <span className="font-normal text-ink-3">(opcional)</span>
          </p>
          <FilePicker value={receipt} onChange={setReceipt} label="Adjuntar el comprobante" hint="Foto, captura o PDF" />
        </div>
      )}

      <Field label="Nota interna" optional>
        {(props) => <Textarea {...props} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />}
      </Field>

      <div className="flex items-end justify-between rounded-control bg-cancha px-4 py-3">
        <span className="text-[0.9375rem] font-semibold text-ink-2">Total</span>
        <Money value={total} size="lg" />
      </div>

      <FormError error={register.error} />

      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={register.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant="success" loading={register.isPending} disabled={!familyId || items.length === 0 || overBalance}>
          Registrar pago
        </Button>
      </DialogActions>
    </form>
  )
}
