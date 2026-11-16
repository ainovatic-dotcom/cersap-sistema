import { useState, type FormEvent } from 'react'
import { Button, Checkbox, Dialog, DialogActions, Field, FormError, Input, Select, Textarea, useToast } from '@/components/ui'
import { RELATIONSHIP } from '@/lib/labels'
import type { Family, Guardian, GuardianRelationship } from '@/types/domain'
import { useSaveFamily, useSaveGuardian } from './api'

type FamilyDialogProps = {
  open: boolean
  onClose: () => void
  /** Familia a editar. Si falta, se crea una nueva. */
  family?: Family
  onSaved?: (family: Family) => void
}

export function FamilyDialog({ open, onClose, family, onSaved }: FamilyDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={family ? 'Editar familia' : 'Nueva familia'} size="sm">
      <FamilyForm family={family} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  )
}

function FamilyForm({ family, onClose, onSaved }: Omit<FamilyDialogProps, 'open'>) {
  const toast = useToast()
  const save = useSaveFamily()
  const [name, setName] = useState(family?.name ?? '')
  const [notes, setNotes] = useState(family?.notes ?? '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      const saved = await save.mutateAsync({ id: family?.id, name, notes })
      toast.success(family ? 'Familia guardada' : 'Familia creada')
      onSaved?.(saved)
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <Field label="Nombre de la familia" hint="Por ejemplo: Familia López Orrego.">
        {(props) => <Input {...props} value={name} onChange={(event) => setName(event.target.value)} data-autofocus required />}
      </Field>
      <Field label="Nota interna" optional hint="Solo la ve administración.">
        {(props) => <Textarea {...props} value={notes} onChange={(event) => setNotes(event.target.value)} />}
      </Field>
      <FormError error={save.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending} disabled={name.trim() === ''}>
          {family ? 'Guardar familia' : 'Crear familia'}
        </Button>
      </DialogActions>
    </form>
  )
}

type GuardianDialogProps = {
  open: boolean
  onClose: () => void
  familyId: string
  /** Tutor a editar. Si falta, se agrega uno nuevo. */
  guardian?: Guardian
  /** El primer tutor de una familia arranca marcado como principal */
  defaultPrimary?: boolean
}

export function GuardianDialog({ open, onClose, familyId, guardian, defaultPrimary }: GuardianDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={guardian ? 'Editar tutor' : 'Agregar tutor'} size="md">
      <GuardianForm familyId={familyId} guardian={guardian} defaultPrimary={defaultPrimary} onClose={onClose} />
    </Dialog>
  )
}

function GuardianForm({ familyId, guardian, defaultPrimary, onClose }: Omit<GuardianDialogProps, 'open'>) {
  const toast = useToast()
  const save = useSaveGuardian()
  const [fullName, setFullName] = useState(guardian?.full_name ?? '')
  const [relationship, setRelationship] = useState<GuardianRelationship>(guardian?.relationship ?? 'mother')
  const [ci, setCi] = useState(guardian?.ci ?? '')
  const [phone, setPhone] = useState(guardian?.phone ?? '')
  const [email, setEmail] = useState(guardian?.email ?? '')
  const [isPrimary, setIsPrimary] = useState(guardian?.is_primary ?? defaultPrimary ?? false)

  const emailError = email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Ese correo no parece válido.' : undefined

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({
        id: guardian?.id,
        familyId,
        values: {
          full_name: fullName,
          relationship,
          ci: ci.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          is_primary: isPrimary,
        },
      })
      toast.success(guardian ? 'Tutor guardado' : 'Tutor agregado')
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre y apellido">
          {(props) => <Input {...props} value={fullName} onChange={(event) => setFullName(event.target.value)} data-autofocus required />}
        </Field>
        <Field label="Vínculo con el alumno">
          {(props) => (
            <Select {...props} value={relationship} onChange={(event) => setRelationship(event.target.value as GuardianRelationship)}>
              {(Object.keys(RELATIONSHIP) as GuardianRelationship[]).map((key) => (
                <option key={key} value={key}>
                  {RELATIONSHIP[key]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Celular" optional hint="Con WhatsApp, para los avisos.">
          {(props) => (
            <Input {...props} type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0981 123 456" />
          )}
        </Field>
        <Field label="Cédula" optional>
          {(props) => <Input {...props} inputMode="numeric" value={ci} onChange={(event) => setCi(event.target.value)} />}
        </Field>
      </div>
      <Field
        label="Gmail"
        optional
        error={emailError}
        hint="Si entra al portal con este Gmail, queda vinculado a la familia sin esperar tu aprobación."
      >
        {(props) => (
          <Input {...props} type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(event) => setEmail(event.target.value)} />
        )}
      </Field>
      <Checkbox
        checked={isPrimary}
        onChange={(event) => setIsPrimary(event.target.checked)}
        label="Es el contacto principal"
        description="A este celular se le escriben los recordatorios de pago."
      />
      <FormError error={save.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={save.isPending} disabled={fullName.trim() === '' || Boolean(emailError)}>
          {guardian ? 'Guardar tutor' : 'Agregar tutor'}
        </Button>
      </DialogActions>
    </form>
  )
}
