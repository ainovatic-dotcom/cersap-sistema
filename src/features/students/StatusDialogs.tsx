import { useState, type FormEvent } from 'react'
import { Alert, Button, Dialog, DialogActions, Field, FormError, Input, Select, Textarea, useToast } from '@/components/ui'
import { todayIso } from '@/lib/format'
import { WITHDRAWAL_REASONS } from '@/lib/labels'
import { useReactivateStudent, useWithdrawStudent } from './api'

type StatusDialogProps = { open: boolean; onClose: () => void; studentId: string; studentName: string }

/** Registrar la baja de un alumno. */
export function WithdrawDialog({ open, onClose, studentId, studentName }: StatusDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={`Dar de baja a ${studentName}`} size="sm">
      <WithdrawForm onClose={onClose} studentId={studentId} />
    </Dialog>
  )
}

function WithdrawForm({ onClose, studentId }: { onClose: () => void; studentId: string }) {
  const toast = useToast()
  const withdraw = useWithdrawStudent()
  const [communicatedOn, setCommunicatedOn] = useState(todayIso())
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await withdraw.mutateAsync({ studentId, communicatedOn, reason, note })
      toast.success('Baja registrada')
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <Alert tone="info">
        El mes en que se comunica la baja se cobra completo. Desde el mes siguiente no se generan cuotas. Las deudas anteriores
        se conservan y la ficha queda guardada.
      </Alert>
      <Field label="¿Cuándo avisó la familia?">
        {(props) => (
          <Input {...props} type="date" value={communicatedOn} max={todayIso()} onChange={(event) => setCommunicatedOn(event.target.value)} required />
        )}
      </Field>
      <Field label="Motivo">
        {(props) => (
          <Select {...props} value={reason} onChange={(event) => setReason(event.target.value)} required>
            <option value="">Elegí un motivo</option>
            {WITHDRAWAL_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Observación" optional hint="Solo la ve administración.">
        {(props) => <Textarea {...props} value={note} onChange={(event) => setNote(event.target.value)} />}
      </Field>
      <FormError error={withdraw.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={withdraw.isPending}>
          Cancelar
        </Button>
        <Button type="submit" variant="danger" loading={withdraw.isPending} disabled={!reason || !communicatedOn}>
          Registrar baja
        </Button>
      </DialogActions>
    </form>
  )
}

/** Reingreso: se reactiva la misma ficha, con todo su historial. */
export function ReactivateDialog({ open, onClose, studentId, studentName }: StatusDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={`Reingresar a ${studentName}`} size="sm">
      <ReactivateForm onClose={onClose} studentId={studentId} />
    </Dialog>
  )
}

function ReactivateForm({ onClose, studentId }: { onClose: () => void; studentId: string }) {
  const toast = useToast()
  const reactivate = useReactivateStudent()
  const [reenteredOn, setReenteredOn] = useState(todayIso())

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await reactivate.mutateAsync({ studentId, reenteredOn })
      toast.success('Alumno reingresado')
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <Alert tone="info">
        Se reactiva la misma ficha, con sus documentos, pagos, bajas y observaciones. El mes del reingreso se cobra completo. Si
        ya pagó la matrícula de este año, no se vuelve a cobrar.
      </Alert>
      <Field label="Fecha de reingreso">
        {(props) => (
          <Input {...props} type="date" value={reenteredOn} max={todayIso()} onChange={(event) => setReenteredOn(event.target.value)} required />
        )}
      </Field>
      <FormError error={reactivate.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={reactivate.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={reactivate.isPending} disabled={!reenteredOn}>
          Reingresar alumno
        </Button>
      </DialogActions>
    </form>
  )
}
