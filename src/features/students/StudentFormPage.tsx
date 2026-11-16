import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  Button,
  ButtonLink,
  Checkbox,
  ErrorState,
  Field,
  FormError,
  Input,
  Loading,
  MoneyInput,
  PageHeader,
  Section,
  Select,
  useToast,
} from '@/components/ui'
import { useFamilyOptions } from '@/features/families/api'
import { useSettings } from '@/features/settings/api'
import { formatMoney, todayIso } from '@/lib/format'
import type { DiscountType, Settings, Student } from '@/types/domain'
import { useSaveStudent, useStudent, type StudentInput } from './api'

const NEW_FAMILY = '__nueva__'

/** Alta y edición de la ficha de un alumno. */
export function StudentFormPage() {
  const { id } = useParams()
  const student = useStudent(id)
  const settings = useSettings()

  if (settings.isPending || (id && student.isPending)) return <Loading />
  if (settings.isError) return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />
  if (id && student.isError) return <ErrorState error={student.error} onRetry={() => void student.refetch()} />

  return <StudentForm student={id ? student.data : undefined} settings={settings.data} />
}

function StudentForm({ student, settings }: { student?: Student; settings: Settings }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const families = useFamilyOptions()
  const save = useSaveStudent()
  const isNew = !student
  const year = Number(todayIso().slice(0, 4))

  const [firstName, setFirstName] = useState(student?.first_name ?? '')
  const [lastName, setLastName] = useState(student?.last_name ?? '')
  const [ci, setCi] = useState(student?.ci ?? '')
  const [birthDate, setBirthDate] = useState(student?.birth_date ?? '')
  const [discipline, setDiscipline] = useState(student?.discipline ?? '')
  const [enrolledOn, setEnrolledOn] = useState(student?.enrolled_on ?? todayIso())
  const [familyId, setFamilyId] = useState(student?.family_id ?? searchParams.get('familia') ?? '')
  const [newFamilyName, setNewFamilyName] = useState('')
  const [feeOverride, setFeeOverride] = useState<number | null>(student?.monthly_fee_override ?? null)
  const [discountType, setDiscountType] = useState<DiscountType>(student?.discount_type ?? 'none')
  const [discountValue, setDiscountValue] = useState<number | null>(student?.discount_value || null)
  const [discountReason, setDiscountReason] = useState(student?.discount_reason ?? '')
  const [isExempt, setIsExempt] = useState(student?.is_exempt ?? false)
  const [exemptReason, setExemptReason] = useState(student?.exempt_reason ?? '')
  const [chargeEnrollment, setChargeEnrollment] = useState(isNew && settings.enrollment_fee > 0)

  const cleanCi = ci.replace(/[^0-9a-zA-Z]/g, '')
  const errors = {
    ci: cleanCi.length > 0 && (cleanCi.length < 5 || cleanCi.length > 12) ? 'Tiene que tener entre 5 y 12 números o letras.' : undefined,
    discount:
      discountType === 'percent' && (discountValue ?? 0) > 100 ? 'El porcentaje no puede pasar de 100.' : undefined,
    family: familyId === NEW_FAMILY && newFamilyName.trim() === '' ? 'Escribí el nombre de la familia.' : undefined,
  }
  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    cleanCi.length >= 5 &&
    birthDate !== '' &&
    enrolledOn !== '' &&
    familyId !== '' &&
    !errors.ci &&
    !errors.discount &&
    !errors.family

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const values: StudentInput = {
      first_name: firstName,
      last_name: lastName,
      ci: cleanCi,
      birth_date: birthDate,
      discipline: discipline || null,
      enrolled_on: enrolledOn,
      family_id: familyId === NEW_FAMILY ? '' : familyId,
      monthly_fee_override: feeOverride,
      discount_type: isExempt ? 'none' : discountType,
      discount_value: isExempt || discountType === 'none' ? 0 : (discountValue ?? 0),
      discount_reason: !isExempt && discountType !== 'none' ? discountReason.trim() || null : null,
      is_exempt: isExempt,
      exempt_reason: isExempt ? exemptReason.trim() || null : null,
    }
    try {
      const saved = await save.mutateAsync({
        id: student?.id,
        values,
        newFamilyName: familyId === NEW_FAMILY ? newFamilyName : undefined,
        enrollmentYear: isNew && chargeEnrollment ? year : undefined,
      })
      toast.success(isNew ? 'Alumno cargado' : 'Ficha guardada')
      navigate(`/admin/alumnos/${saved.id}`, { replace: true })
    } catch {
      // El error se muestra arriba de los botones
    }
  }

  const backTo = student ? `/admin/alumnos/${student.id}` : '/admin/alumnos'

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mx-auto flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={isNew ? 'Nuevo alumno' : 'Editar ficha'}
        back={{ to: backTo, label: student ? 'Volver a la ficha' : 'Alumnos' }}
      />

      <Section title="Datos del alumno">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombres">
            {(props) => <Input {...props} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="off" required />}
          </Field>
          <Field label="Apellidos">
            {(props) => (
              <Input
                {...props}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                onBlur={() => {
                  if (familyId === NEW_FAMILY && newFamilyName === '' && lastName.trim()) setNewFamilyName(`Familia ${lastName.trim()}`)
                }}
                autoComplete="off"
                required
              />
            )}
          </Field>
          <Field label="Cédula de identidad" error={errors.ci} hint="Con esta cédula la familia se vincula en el portal.">
            {(props) => (
              <Input {...props} value={ci} onChange={(event) => setCi(event.target.value)} inputMode="numeric" autoComplete="off" required />
            )}
          </Field>
          <Field label="Fecha de nacimiento">
            {(props) => (
              <Input {...props} type="date" value={birthDate} max={todayIso()} onChange={(event) => setBirthDate(event.target.value)} required />
            )}
          </Field>
          <Field label="Disciplina" optional>
            {(props) => (
              <Select {...props} value={discipline} onChange={(event) => setDiscipline(event.target.value)}>
                <option value="">Sin definir</option>
                {settings.disciplines.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                {discipline && !settings.disciplines.includes(discipline) && <option value={discipline}>{discipline}</option>}
              </Select>
            )}
          </Field>
          <Field label="Fecha de alta">
            {(props) => (
              <Input {...props} type="date" value={enrolledOn} max={todayIso()} onChange={(event) => setEnrolledOn(event.target.value)} required />
            )}
          </Field>
        </div>
      </Section>

      <Section title="Familia" description="Los hermanos van en la misma familia: comparten tutores y estado de cuenta.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Familia">
            {(props) => (
              <Select
                {...props}
                value={familyId}
                onChange={(event) => {
                  setFamilyId(event.target.value)
                  if (event.target.value === NEW_FAMILY && newFamilyName === '' && lastName.trim()) {
                    setNewFamilyName(`Familia ${lastName.trim()}`)
                  }
                }}
                required
              >
                <option value="">Elegí una familia</option>
                <option value={NEW_FAMILY}>Crear una familia nueva</option>
                {(families.data ?? []).map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {familyId === NEW_FAMILY && (
            <Field label="Nombre de la familia nueva" error={errors.family} hint="Después cargás los tutores desde la ficha de la familia.">
              {(props) => <Input {...props} value={newFamilyName} onChange={(event) => setNewFamilyName(event.target.value)} />}
            </Field>
          )}
        </div>
      </Section>

      <Section title="Cobro" description="Se aplica a las cuotas que se generen de ahora en adelante.">
        <div className="flex flex-col gap-4">
          <Checkbox
            checked={isExempt}
            onChange={(event) => setIsExempt(event.target.checked)}
            label="Exonerado: no paga mensualidad ni matrícula"
            description="Las cuotas se generan igual, en cero, para que quede el registro."
          />
          {isExempt ? (
            <Field label="Motivo de la exoneración" optional hint="Solo lo ve administración.">
              {(props) => <Input {...props} value={exemptReason} onChange={(event) => setExemptReason(event.target.value)} />}
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Mensualidad propia"
                optional
                hint={`Dejalo vacío para cobrar la general (${formatMoney(settings.monthly_fee)}).`}
              >
                {(props) => <MoneyInput {...props} value={feeOverride} onChange={setFeeOverride} placeholder="" />}
              </Field>
              <Field label="Descuento">
                {(props) => (
                  <Select {...props} value={discountType} onChange={(event) => setDiscountType(event.target.value as DiscountType)}>
                    <option value="none">Sin descuento</option>
                    <option value="percent">Porcentaje</option>
                    <option value="amount">Monto fijo</option>
                  </Select>
                )}
              </Field>
              {discountType === 'percent' && (
                <Field label="Porcentaje de descuento" error={errors.discount}>
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      min={0}
                      max={100}
                      inputMode="numeric"
                      value={discountValue ?? ''}
                      onChange={(event) => setDiscountValue(event.target.value === '' ? null : Number(event.target.value))}
                    />
                  )}
                </Field>
              )}
              {discountType === 'amount' && (
                <Field label="Monto del descuento">
                  {(props) => <MoneyInput {...props} value={discountValue} onChange={setDiscountValue} />}
                </Field>
              )}
              {discountType !== 'none' && (
                <Field label="Motivo del descuento" optional hint="Por ejemplo: hermano. Solo lo ve administración.">
                  {(props) => <Input {...props} value={discountReason} onChange={(event) => setDiscountReason(event.target.value)} />}
                </Field>
              )}
            </div>
          )}

          {isNew && settings.enrollment_fee > 0 && (
            <Checkbox
              checked={chargeEnrollment}
              onChange={(event) => setChargeEnrollment(event.target.checked)}
              label={`Cargar la matrícula ${year} (${formatMoney(settings.enrollment_fee)})`}
            />
          )}
        </div>
      </Section>

      <FormError error={save.error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink to={backTo} variant="secondary">
          Cancelar
        </ButtonLink>
        <Button type="submit" loading={save.isPending} disabled={!canSubmit}>
          {isNew ? 'Cargar alumno' : 'Guardar ficha'}
        </Button>
      </div>
    </form>
  )
}
