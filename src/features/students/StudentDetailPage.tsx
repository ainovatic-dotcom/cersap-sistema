import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Camera, Pencil, RotateCcw, UserMinus } from 'lucide-react'
import {
  Avatar,
  Button,
  ButtonLink,
  buttonClasses,
  Card,
  DataRow,
  ErrorState,
  Loading,
  PageHeader,
  StudentStatusBadge,
  Tabs,
  useToast,
  WhatsAppLink,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { ageFrom, formatCi, formatDate, formatMoney } from '@/lib/format'
import { RELATIONSHIP } from '@/lib/labels'
import { useSignedUrl } from '@/lib/storage'
import { formatPhone } from '@/lib/whatsapp'
import { useStudent, useUploadStudentPhoto } from './api'
import { ReactivateDialog, WithdrawDialog } from './StatusDialogs'
import { StudentDocumentsTab } from './StudentDocumentsTab'
import { StudentFeesTab } from './StudentFeesTab'
import { StudentNotesTab } from './StudentNotesTab'
import { StudentWithdrawalsTab } from './StudentWithdrawalsTab'

type TabKey = 'fees' | 'documents' | 'notes' | 'withdrawals'

/** Ficha completa de un alumno. Solo la ve administración. */
export function StudentDetailPage() {
  const { id } = useParams()
  const toast = useToast()
  const student = useStudent(id)
  const uploadPhoto = useUploadStudentPhoto()
  const photoUrl = useSignedUrl('student-photos', student.data?.photo_path)

  const [tab, setTab] = useState<TabKey>('fees')
  const [dialog, setDialog] = useState<'withdraw' | 'reactivate' | null>(null)

  if (student.isPending) return <Loading />
  if (student.isError) return <ErrorState error={student.error} onRetry={() => void student.refetch()} />

  const data = student.data
  const fullName = `${data.first_name} ${data.last_name}`
  const age = ageFrom(data.birth_date)
  const guardians = data.family?.guardians ?? []

  function handlePhoto(file: File | undefined) {
    if (!file) return
    uploadPhoto.mutate(
      { student: data, file },
      { onSuccess: () => toast.success('Foto actualizada'), onError: toast.error },
    )
  }

  return (
    <>
      <PageHeader
        title={fullName}
        back={{ to: '/admin/alumnos', label: 'Alumnos' }}
        actions={
          <>
            {data.status === 'active' ? (
              <Button variant="secondary" icon={<UserMinus aria-hidden="true" />} onClick={() => setDialog('withdraw')}>
                Dar de baja
              </Button>
            ) : (
              <Button variant="secondary" icon={<RotateCcw aria-hidden="true" />} onClick={() => setDialog('reactivate')}>
                Reingresar
              </Button>
            )}
            <ButtonLink to={`/admin/alumnos/${data.id}/editar`} icon={<Pencil aria-hidden="true" />}>
              Editar ficha
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
        {/* Ficha */}
        <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={fullName} src={photoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-ink-2">
                {[data.discipline, age !== null ? `${age} años` : null].filter(Boolean).join(', ') || 'Sin disciplina'}
              </p>
              <div className="mt-1.5">
                <StudentStatusBadge status={data.status} />
              </div>
            </div>
          </div>
          <div className="mt-4">
          <label
            className={cn(
              buttonClasses({ variant: 'secondary', size: 'sm' }),
              'cursor-pointer focus-within:ring-3 focus-within:ring-brand-500/40',
              uploadPhoto.isPending && 'pointer-events-none opacity-60',
            )}
          >
            <Camera aria-hidden="true" />
            {uploadPhoto.isPending ? 'Subiendo foto…' : data.photo_path ? 'Cambiar la foto' : 'Subir una foto'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadPhoto.isPending}
              onChange={(event) => {
                handlePhoto(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
          </div>
          <dl className="mt-3 divide-y divide-line border-t border-line">
            <DataRow label="Cédula">
              <span className="tabular">{formatCi(data.ci)}</span>
            </DataRow>
            <DataRow label="Nacimiento">{formatDate(data.birth_date)}</DataRow>
            <DataRow label="Alta">{formatDate(data.enrolled_on)}</DataRow>
            <DataRow label="Familia">
              {data.family && (
                <Link to={`/admin/familias/${data.family.id}`} className="text-brand-700 hover:underline">
                  {data.family.name}
                </Link>
              )}
            </DataRow>
            <DataRow label="Cobro">
              {data.is_exempt
                ? 'Exonerado'
                : [
                    data.monthly_fee_override !== null ? `Mensualidad de ${formatMoney(data.monthly_fee_override)}` : 'Mensualidad general',
                    data.discount_type === 'percent' ? `${data.discount_value}% de descuento` : null,
                    data.discount_type === 'amount' ? `${formatMoney(data.discount_value)} de descuento` : null,
                  ]
                    .filter(Boolean)
                    .join(', ')}
              {(data.exempt_reason || data.discount_reason) && (
                <span className="block text-[13px] font-normal text-ink-3">{data.exempt_reason ?? data.discount_reason}</span>
              )}
            </DataRow>
          </dl>

          <div className="mt-4 border-t border-line pt-4">
            <p className="mb-2 text-sm font-semibold text-ink">Tutores</p>
            {guardians.length === 0 ? (
              <p className="text-sm text-ink-3">
                Esta familia todavía no tiene tutores cargados.{' '}
                {data.family && (
                  <Link to={`/admin/familias/${data.family.id}`} className="font-semibold text-brand-700 hover:underline">
                    Cargar tutores
                  </Link>
                )}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {guardians.map((guardian) => (
                  <li key={guardian.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{guardian.full_name}</p>
                      <p className="truncate text-[13px] text-ink-3">
                        {RELATIONSHIP[guardian.relationship]}
                        {guardian.phone ? `, ${formatPhone(guardian.phone)}` : ''}
                      </p>
                    </div>
                    <WhatsAppLink phone={guardian.phone} variant="secondary" size="sm" message={`Hola ${guardian.full_name}, le escribimos de CERSAP.`}>
                      Escribir
                    </WhatsAppLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        </div>

        <div className="min-w-0">
          <Tabs
            label="Secciones de la ficha"
            className="mb-4 w-fit max-w-full"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'fees', label: 'Cuotas' },
              { value: 'documents', label: 'Documentos' },
              { value: 'notes', label: 'Seguimiento' },
              { value: 'withdrawals', label: 'Bajas' },
            ]}
          />
          {tab === 'fees' && <StudentFeesTab studentId={data.id} familyId={data.family_id} />}
          {tab === 'documents' && <StudentDocumentsTab studentId={data.id} />}
          {tab === 'notes' && <StudentNotesTab studentId={data.id} />}
          {tab === 'withdrawals' && <StudentWithdrawalsTab studentId={data.id} />}
        </div>
      </div>

      <WithdrawDialog open={dialog === 'withdraw'} onClose={() => setDialog(null)} studentId={data.id} studentName={data.first_name} />
      <ReactivateDialog open={dialog === 'reactivate'} onClose={() => setDialog(null)} studentId={data.id} studentName={data.first_name} />
    </>
  )
}
