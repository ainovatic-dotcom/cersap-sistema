import { useState } from 'react'
import { Eye, HeartPulse, IdCard, Upload } from 'lucide-react'
import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogActions,
  DocumentStatusBadge,
  ErrorState,
  Field,
  FormError,
  Loading,
  Select,
  Textarea,
  useToast,
} from '@/components/ui'
import { useAuth } from '@/features/auth/AuthProvider'
import { formatDateTime } from '@/lib/format'
import { formatFileSize } from '@/lib/image'
import { DOCUMENT_KIND, DOCUMENT_STATUS } from '@/lib/labels'
import { openFile } from '@/lib/storage'
import type { DocumentStatus, StudentDocument } from '@/types/domain'
import { useSetDocumentStatus, useStudentDocuments, useUploadStudentDocument } from './api'

/**
 * Cédula (frente y dorso) y ficha médica.
 * Las familias los mandan por WhatsApp; administración los revisa y los sube acá.
 * No se muestran nunca en el portal.
 */
export function StudentDocumentsTab({ studentId }: { studentId: string }) {
  const documents = useStudentDocuments(studentId)
  const [editing, setEditing] = useState<StudentDocument | null>(null)

  if (documents.isPending) return <Loading />
  if (documents.isError) return <ErrorState error={documents.error} onRetry={() => void documents.refetch()} />

  return (
    <div className="flex flex-col gap-3">
      <Alert tone="info">
        Estos archivos son privados: solo administración puede verlos. No aparecen en el portal de familias ni en los reportes.
      </Alert>
      {documents.data.map((document) => (
        <DocumentCard key={document.id} document={document} onEditStatus={() => setEditing(document)} />
      ))}
      <DocumentStatusDialog document={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function DocumentCard({ document, onEditStatus }: { document: StudentDocument; onEditStatus: () => void }) {
  const toast = useToast()
  const { profile } = useAuth()
  const upload = useUploadStudentDocument()
  const Icon = document.kind === 'medical' ? HeartPulse : IdCard

  function handleFile(file: File | undefined) {
    if (!file || !profile) return
    upload.mutate(
      { document, file, userId: profile.id },
      { onSuccess: () => toast.success(`${DOCUMENT_KIND[document.kind]} guardado`), onError: toast.error },
    )
  }

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[16px] font-bold text-ink">{DOCUMENT_KIND[document.kind]}</p>
          <DocumentStatusBadge status={document.status} />
        </div>
        <p className="mt-0.5 truncate text-[13px] text-ink-3">
          {document.file_path
            ? `${document.file_name ?? 'Archivo'}, ${formatFileSize(document.size_bytes)}, subido el ${formatDateTime(document.uploaded_at)}`
            : 'Todavía no se subió ningún archivo.'}
        </p>
        {document.review_note && <p className="mt-1 text-sm font-medium text-ink-2">{document.review_note}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {document.file_path && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye aria-hidden="true" />}
            onClick={() => openFile('student-documents', document.file_path as string).catch(toast.error)}
          >
            Ver
          </Button>
        )}
        <label
          className={
            'inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-control px-3 text-[13px] font-semibold transition-colors focus-within:ring-3 focus-within:ring-brand-500/40 ' +
            (document.file_path
              ? 'border-[1.5px] border-line-strong bg-surface text-ink hover:bg-cancha'
              : 'btn-edge bg-brand-600 text-white hover:bg-brand-700') +
            (upload.isPending ? ' pointer-events-none opacity-50' : '')
          }
        >
          <Upload aria-hidden="true" className="size-4" />
          {upload.isPending ? 'Subiendo…' : document.file_path ? 'Reemplazar' : 'Subir archivo'}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            disabled={upload.isPending}
            onChange={(event) => {
              handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </label>
        <Button variant="ghost" size="sm" onClick={onEditStatus}>
          Cambiar estado
        </Button>
      </div>
    </Card>
  )
}

function DocumentStatusDialog({ document, onClose }: { document: StudentDocument | null; onClose: () => void }) {
  return (
    <Dialog open={document !== null} onClose={onClose} title={document ? DOCUMENT_KIND[document.kind] : ''} size="sm">
      {document && <DocumentStatusForm document={document} onClose={onClose} />}
    </Dialog>
  )
}

function DocumentStatusForm({ document, onClose }: { document: StudentDocument; onClose: () => void }) {
  const toast = useToast()
  const setStatus = useSetDocumentStatus()
  const [status, setStatusValue] = useState<DocumentStatus>(document.status)
  const [note, setNote] = useState(document.review_note ?? '')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setStatus.mutate(
          { documentId: document.id, status, note },
          {
            onSuccess: () => {
              toast.success('Estado guardado')
              onClose()
            },
          },
        )
      }}
    >
      <Field label="Estado">
        {(props) => (
          <Select {...props} value={status} onChange={(event) => setStatusValue(event.target.value as DocumentStatus)}>
            {(Object.keys(DOCUMENT_STATUS) as DocumentStatus[]).map((key) => (
              <option key={key} value={key}>
                {DOCUMENT_STATUS[key].label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Nota" optional hint="Por ejemplo: la foto salió borrosa, pedirla de nuevo.">
        {(props) => <Textarea {...props} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />}
      </Field>
      <FormError error={setStatus.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={setStatus.isPending}>
          Cancelar
        </Button>
        <Button type="submit" loading={setStatus.isPending}>
          Guardar estado
        </Button>
      </DialogActions>
    </form>
  )
}
