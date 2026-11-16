import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Pencil, Plus, Receipt, Trash2, UserPlus } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  ConfirmDialog,
  ErrorState,
  FeeStateBadge,
  FormError,
  IconButton,
  Loading,
  Money,
  PageHeader,
  PaymentStatusBadge,
  Section,
  StudentStatusBadge,
  useToast,
  WhatsAppLink,
} from '@/components/ui'
import { useFees } from '@/features/fees/api'
import { useFamilyLinks } from '@/features/links/api'
import { LinkRow } from '@/features/links/LinkRow'
import { usePayments, type PaymentListItem } from '@/features/payments/api'
import { RegisterPaymentDialog } from '@/features/payments/RegisterPaymentDialog'
import { ReviewPaymentDialog } from '@/features/payments/ReviewPaymentDialog'
import { feeLabel, formatCi, formatDate, formatMoney } from '@/lib/format'
import { PAYMENT_METHOD, RELATIONSHIP } from '@/lib/labels'
import { useSignedUrls } from '@/lib/storage'
import { formatPhone } from '@/lib/whatsapp'
import type { Guardian } from '@/types/domain'
import { useDeleteFamily, useDeleteGuardian, useFamily } from './api'
import { FamilyDialog, GuardianDialog } from './FamilyDialogs'

/** Ficha de una familia: tutores, alumnos, estado de cuenta y accesos al portal. */
export function FamilyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const family = useFamily(id)
  const fees = useFees(id ? { familyId: id } : null)
  const payments = usePayments({ familyId: id ?? '' })
  const links = useFamilyLinks(id)
  const deleteGuardian = useDeleteGuardian()
  const deleteFamily = useDeleteFamily()

  const [editingFamily, setEditingFamily] = useState(false)
  const [guardianDialog, setGuardianDialog] = useState<{ guardian?: Guardian } | null>(null)
  const [guardianToDelete, setGuardianToDelete] = useState<Guardian | null>(null)
  const [deletingFamily, setDeletingFamily] = useState(false)
  const [paying, setPaying] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentListItem | null>(null)

  const photos = useSignedUrls(
    'student-photos',
    (family.data?.students ?? []).map((student) => student.photo_path),
  )

  if (family.isPending) return <Loading />
  if (family.isError) return <ErrorState error={family.error} onRetry={() => void family.refetch()} />

  const data = family.data
  const feeList = fees.data ?? []
  const owed = feeList.filter((fee) => !fee.is_exempt && fee.balance > 0)
  const totalOwed = owed.reduce((sum, fee) => sum + fee.balance, 0)
  const studentName = (studentId: string) => data.students.find((student) => student.id === studentId)?.first_name ?? ''
  const isEmpty = data.students.length === 0 && feeList.length === 0

  return (
    <>
      <PageHeader
        title={data.name}
        description={data.notes ?? undefined}
        back={{ to: '/admin/familias', label: 'Familias' }}
        actions={
          <>
            <Button variant="secondary" icon={<Pencil aria-hidden="true" />} onClick={() => setEditingFamily(true)}>
              Editar
            </Button>
            <ButtonLink to={`/admin/alumnos/nuevo?familia=${data.id}`} icon={<UserPlus aria-hidden="true" />}>
              Agregar alumno
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <Section
            title="Tutores"
            flush
            actions={
              <Button variant="secondary" size="sm" icon={<Plus aria-hidden="true" />} onClick={() => setGuardianDialog({})}>
                Agregar tutor
              </Button>
            }
          >
            {data.guardians.length === 0 ? (
              <p className="px-4 pb-4 text-[15px] text-ink-3 md:px-5 md:pb-5">
                Cargá al menos un tutor con su celular para poder escribirle, y su Gmail para que entre al portal sin esperar
                aprobación.
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {data.guardians.map((guardian) => (
                  <li key={guardian.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold text-ink">
                        {guardian.full_name}
                        {guardian.is_primary && <Badge tone="azul">Principal</Badge>}
                      </p>
                      <p className="truncate text-sm text-ink-3">
                        {[RELATIONSHIP[guardian.relationship], formatPhone(guardian.phone), guardian.ci ? `CI ${formatCi(guardian.ci)}` : null]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {guardian.email && <p className="truncate text-sm text-ink-3">{guardian.email}</p>}
                    </div>
                    <WhatsAppLink phone={guardian.phone} variant="secondary" size="sm" message={`Hola ${guardian.full_name}, le escribimos de CERSAP.`}>
                      Escribir
                    </WhatsAppLink>
                    <IconButton label={`Editar a ${guardian.full_name}`} onClick={() => setGuardianDialog({ guardian })}>
                      <Pencil />
                    </IconButton>
                    <IconButton label={`Quitar a ${guardian.full_name}`} onClick={() => setGuardianToDelete(guardian)}>
                      <Trash2 />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Alumnos" flush>
            {data.students.length === 0 ? (
              <p className="px-4 pb-4 text-[15px] text-ink-3 md:px-5 md:pb-5">Esta familia todavía no tiene alumnos.</p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {data.students.map((student) => (
                  <li key={student.id}>
                    <Link to={`/admin/alumnos/${student.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cancha md:px-5">
                      <Avatar
                        name={`${student.first_name} ${student.last_name}`}
                        src={student.photo_path ? photos[student.photo_path] : null}
                        square
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-bold text-ink">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="truncate text-sm text-ink-3">{student.discipline ?? 'Sin disciplina'}</p>
                      </div>
                      <StudentStatusBadge status={student.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Acceso al portal" description="Cuentas de Google que pueden ver a esta familia." flush>
            {links.isPending ? (
              <Loading />
            ) : (links.data ?? []).length === 0 ? (
              <p className="px-4 pb-4 text-[15px] text-ink-3 md:px-5 md:pb-5">
                Ningún familiar entró todavía. Tienen que ingresar con su Gmail y validar la cédula de un alumno.
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {(links.data ?? []).map((link) => (
                  <LinkRow key={link.id} link={link} showFamily={false} />
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section
            title="Estado de cuenta"
            flush
            actions={
              owed.length > 0 && (
                <Button variant="success" size="sm" icon={<Receipt aria-hidden="true" />} onClick={() => setPaying(true)}>
                  Registrar pago
                </Button>
              )
            }
          >
            <div className="px-4 pb-4 md:px-5">
              <p className="text-sm text-ink-3">{totalOwed > 0 ? 'Debe' : 'Saldo'}</p>
              <Money value={totalOwed} size="lg" className={totalOwed > 0 ? 'text-ink' : 'text-verde-700'} />
            </div>
            {fees.isPending ? (
              <Loading />
            ) : feeList.length === 0 ? (
              <p className="border-t border-line px-4 py-4 text-[15px] text-ink-3 md:px-5">Todavía no tiene cuotas generadas.</p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {feeList.slice(0, 24).map((fee) => (
                  <li key={fee.id} className="flex items-center gap-3 px-4 py-2.5 md:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {feeLabel(fee)}, {studentName(fee.student_id)}
                      </p>
                      <p className="text-[13px] text-ink-3">Vence el {formatDate(fee.due_date)}</p>
                    </div>
                    <span className="tabular shrink-0 text-[15px] font-bold text-ink">{formatMoney(fee.balance > 0 ? fee.balance : fee.amount)}</span>
                    <span className="flex w-[108px] shrink-0">
                      <FeeStateBadge state={fee.state} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Pagos" flush>
            {payments.isPending ? (
              <Loading />
            ) : (payments.data ?? []).length === 0 ? (
              <p className="px-4 pb-4 text-[15px] text-ink-3 md:px-5 md:pb-5">Esta familia todavía no tiene pagos.</p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {(payments.data ?? []).slice(0, 24).map((payment) => (
                  <li key={payment.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-cancha md:px-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="tabular text-[15px] font-bold text-ink">{formatMoney(payment.amount)}</p>
                        <p className="text-[13px] text-ink-3">
                          {PAYMENT_METHOD[payment.method]} del {formatDate(payment.paid_on)}
                        </p>
                      </div>
                      <PaymentStatusBadge status={payment.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {isEmpty && (
            <Button variant="ghost" className="self-start text-rojo-700 hover:bg-rojo-50" icon={<Trash2 aria-hidden="true" />} onClick={() => setDeletingFamily(true)}>
              Borrar esta familia
            </Button>
          )}
        </div>
      </div>

      <FamilyDialog open={editingFamily} onClose={() => setEditingFamily(false)} family={data} />
      <GuardianDialog
        open={guardianDialog !== null}
        onClose={() => setGuardianDialog(null)}
        familyId={data.id}
        guardian={guardianDialog?.guardian}
        defaultPrimary={data.guardians.length === 0}
      />
      <RegisterPaymentDialog open={paying} onClose={() => setPaying(false)} familyId={data.id} feeIds={owed.map((fee) => fee.id)} />
      <ReviewPaymentDialog payment={selectedPayment} onClose={() => setSelectedPayment(null)} />

      <ConfirmDialog
        open={guardianToDelete !== null}
        onClose={() => {
          setGuardianToDelete(null)
          deleteGuardian.reset()
        }}
        onConfirm={() => {
          if (!guardianToDelete) return
          deleteGuardian.mutate(guardianToDelete.id, {
            onSuccess: () => {
              toast.success('Tutor quitado')
              setGuardianToDelete(null)
            },
          })
        }}
        title={`Quitar a ${guardianToDelete?.full_name ?? 'este tutor'}`}
        description="Se borran sus datos de contacto de esta familia. Si ya tiene acceso al portal, lo conserva hasta que se lo quites."
        confirmLabel="Quitar tutor"
        confirmVariant="danger"
        loading={deleteGuardian.isPending}
      >
        <FormError error={deleteGuardian.error} />
      </ConfirmDialog>

      <ConfirmDialog
        open={deletingFamily}
        onClose={() => {
          setDeletingFamily(false)
          deleteFamily.reset()
        }}
        onConfirm={() =>
          deleteFamily.mutate(data.id, {
            onSuccess: () => {
              toast.success('Familia borrada')
              navigate('/admin/familias', { replace: true })
            },
          })
        }
        title={`Borrar ${data.name}`}
        description="Solo se puede borrar una familia sin alumnos ni cuotas. No se puede deshacer."
        confirmLabel="Borrar familia"
        confirmVariant="danger"
        loading={deleteFamily.isPending}
      >
        <FormError error={deleteFamily.error} />
      </ConfirmDialog>
    </>
  )
}
