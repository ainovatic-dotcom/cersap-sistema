import { useState, type FormEvent } from 'react'
import { StickyNote } from 'lucide-react'
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  Loading,
  Textarea,
  useToast,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import { useAddStudentNote, useStudentNotes, type StudentNoteItem } from './api'

/**
 * Seguimiento del alumno: observaciones fechadas y firmadas.
 * Una nota no se edita ni se borra. Para corregirla se escribe una corrección,
 * y la original queda visible y marcada como corregida.
 */
export function StudentNotesTab({ studentId }: { studentId: string }) {
  const toast = useToast()
  const notes = useStudentNotes(studentId)
  const addNote = useAddStudentNote()
  const [body, setBody] = useState('')
  const [correcting, setCorrecting] = useState<StudentNoteItem | null>(null)

  const list = notes.data ?? []
  // Ids de las notas que ya tienen una corrección
  const corrected = new Set(list.map((note) => note.corrects_note_id).filter(Boolean))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await addNote.mutateAsync({ studentId, body })
      setBody('')
      toast.success('Observación agregada')
    } catch {
      // El error se muestra debajo del campo
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4">
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-3">
          <Field label="Nueva observación" hint="Queda con tu nombre y la fecha. Solo la ve administración.">
            {(props) => (
              <Textarea {...props} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribí lo que haga falta recordar" />
            )}
          </Field>
          <FormError error={addNote.error} />
          <Button type="submit" className="self-end" loading={addNote.isPending} disabled={body.trim() === ''}>
            Agregar observación
          </Button>
        </form>
      </Card>

      {notes.isPending ? (
        <Loading />
      ) : notes.isError ? (
        <ErrorState error={notes.error} onRetry={() => void notes.refetch()} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={<StickyNote />} title="Sin observaciones">
            Lo que anotes sobre el alumno va a quedar acá, ordenado por fecha.
          </EmptyState>
        </Card>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {list.map((note) => {
            const isCorrected = corrected.has(note.id)
            const original = note.corrects_note_id ? list.find((item) => item.id === note.corrects_note_id) : null
            return (
              <li key={note.id}>
                <Card className={cn('p-4', isCorrected && 'bg-cancha')}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold text-ink">{note.author?.full_name ?? note.author?.email ?? 'Administración'}</p>
                    <time dateTime={note.created_at} className="tabular text-[0.8125rem] text-ink-3">
                      {formatDateTime(note.created_at)}
                    </time>
                  </div>
                  {original && (
                    <p className="mt-1 text-[0.8125rem] font-medium text-brand-700">Corrige la observación del {formatDateTime(original.created_at)}</p>
                  )}
                  <p className={cn('mt-2 whitespace-pre-wrap text-[0.9375rem] text-ink', isCorrected && 'text-ink-3 line-through')}>{note.body}</p>
                  {isCorrected ? (
                    <p className="mt-2 text-[0.8125rem] font-semibold text-ink-3">Corregida. La versión nueva está más arriba.</p>
                  ) : (
                    <Button variant="ghost" size="sm" className="-ml-2 mt-1" onClick={() => setCorrecting(note)}>
                      Corregir
                    </Button>
                  )}
                </Card>
              </li>
            )
          })}
        </ol>
      )}

      <Dialog
        open={correcting !== null}
        onClose={() => setCorrecting(null)}
        title="Corregir observación"
        description="La original no se borra: queda tachada, y debajo de tu corrección dice a cuál reemplaza."
        size="sm"
      >
        {correcting && <CorrectionForm studentId={studentId} note={correcting} onClose={() => setCorrecting(null)} />}
      </Dialog>
    </div>
  )
}

function CorrectionForm({ studentId, note, onClose }: { studentId: string; note: StudentNoteItem; onClose: () => void }) {
  const toast = useToast()
  const addNote = useAddStudentNote()
  const [body, setBody] = useState(note.body)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        addNote.mutate(
          { studentId, body, correctsNoteId: note.id },
          {
            onSuccess: () => {
              toast.success('Corrección guardada')
              onClose()
            },
          },
        )
      }}
    >
      <Field label="Texto corregido">
        {(props) => <Textarea {...props} rows={5} value={body} onChange={(event) => setBody(event.target.value)} data-autofocus />}
      </Field>
      <FormError error={addNote.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={addNote.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={addNote.isPending} disabled={body.trim() === '' || body.trim() === note.body.trim()}>
          Guardar corrección
        </Button>
      </DialogActions>
    </form>
  )
}
