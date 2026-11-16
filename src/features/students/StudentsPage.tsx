import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronRight, FileWarning, UserPlus, UsersRound } from 'lucide-react'
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Select,
  SkeletonRows,
  Tabs,
} from '@/components/ui'
import { useSettings } from '@/features/settings/api'
import { ageFrom, formatCi, formatMoney, normalizeText } from '@/lib/format'
import { useSignedUrls } from '@/lib/storage'
import type { StudentStatus } from '@/types/domain'
import { useStudentBalances, useStudents, useStudentsMissingDocuments } from './api'

export function StudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const onlyMissingDocuments = searchParams.get('documentos') === 'incompletos'

  const students = useStudents()
  const balances = useStudentBalances()
  const missingDocuments = useStudentsMissingDocuments()
  const settings = useSettings()

  const [status, setStatus] = useState<StudentStatus>('active')
  const [search, setSearch] = useState('')
  const [discipline, setDiscipline] = useState('')

  const all = useMemo(() => students.data ?? [], [students.data])
  const visible = useMemo(() => {
    const term = normalizeText(search)
    return all.filter((student) => {
      if (student.status !== status) return false
      if (discipline && student.discipline !== discipline) return false
      if (onlyMissingDocuments && !missingDocuments.data?.has(student.id)) return false
      if (!term) return true
      const haystack = normalizeText(`${student.first_name} ${student.last_name} ${student.ci} ${student.family?.name ?? ''}`)
      return term.split(/\s+/).every((word) => haystack.includes(word))
    })
  }, [all, status, discipline, search, onlyMissingDocuments, missingDocuments.data])

  const photos = useSignedUrls(
    'student-photos',
    visible.slice(0, 100).map((student) => student.photo_path),
  )

  const activeCount = all.filter((student) => student.status === 'active').length

  return (
    <>
      <PageHeader
        title="Alumnos"
        description="Las fichas de todos los alumnos, con su familia y cómo vienen con los pagos."
        actions={
          <ButtonLink to="/admin/alumnos/nuevo" icon={<UserPlus aria-hidden="true" />}>
            Nuevo alumno
          </ButtonLink>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs
          label="Estado de los alumnos"
          value={status}
          onChange={setStatus}
          items={[
            { value: 'active', label: 'Activos', count: activeCount },
            { value: 'inactive', label: 'Inactivos', count: all.length - activeCount },
          ]}
        />
        <SearchInput className="flex-1" placeholder="Buscar por nombre, cédula o familia" value={search} onChange={setSearch} />
        <Select
          aria-label="Disciplina"
          className="lg:w-60"
          value={discipline}
          onChange={(event) => setDiscipline(event.target.value)}
        >
          <option value="">Todas las disciplinas</option>
          {(settings.data?.disciplines ?? []).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      {onlyMissingDocuments && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-control bg-ambar-50 px-3.5 py-2.5 text-[0.9375rem] font-medium text-ambar-800">
          <FileWarning aria-hidden="true" className="size-[18px]" />
          Se muestran solo los alumnos con documentos incompletos.
          <button type="button" className="font-bold underline" onClick={() => setSearchParams({})}>
            Ver todos
          </button>
        </div>
      )}

      <Card>
        {students.isPending ? (
          <SkeletonRows />
        ) : students.isError ? (
          <ErrorState error={students.error} onRetry={() => void students.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState
            icon={<UsersRound />}
            title="Todavía no hay alumnos"
            action={
              <ButtonLink to="/admin/alumnos/nuevo" icon={<UserPlus aria-hidden="true" />}>
                Cargar el primer alumno
              </ButtonLink>
            }
          >
            Empezá cargando la ficha de un alumno. La familia se crea en el mismo paso.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState title="Nadie coincide con la búsqueda">Probá con otro nombre, o revisá la pestaña y la disciplina.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((student) => {
              const balance = balances.data?.get(student.id)
              const owed = balance?.balance ?? 0
              const overdue = (balance?.overdue_count ?? 0) > 0
              const age = ageFrom(student.birth_date)
              return (
                <li key={student.id}>
                  <Link
                    to={`/admin/alumnos/${student.id}`}
                    className="flex min-h-16 items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-cancha/70 md:px-5"
                  >
                    <Avatar
                      name={`${student.first_name} ${student.last_name}`}
                      src={student.photo_path ? photos[student.photo_path] : null}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1 md:grid md:grid-cols-[1.6fr_1fr_1.2fr] md:items-center md:gap-4">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-ink md:truncate">
                          {student.last_name}, {student.first_name}
                        </p>
                        <p className="tabular truncate text-[0.8125rem] text-ink-3">
                          <span className="md:hidden">{student.discipline ? `${student.discipline}, ` : ''}</span>
                          <span className="hidden md:inline">CI {formatCi(student.ci)}, </span>
                          {age !== null && `${age} años`}
                        </p>
                      </div>
                      <p className="hidden truncate text-sm text-ink-2 md:block">{student.discipline ?? ''}</p>
                      <p className="hidden truncate text-sm text-ink-2 md:block">{student.family?.name}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 max-sm:flex-row-reverse max-sm:items-center max-sm:gap-1.5">
                      {owed > 0 ? (
                        <Badge tone={overdue ? 'rojo' : 'neutro'}>Debe {formatMoney(owed)}</Badge>
                      ) : (
                        student.status === 'active' && <Badge tone="verde">Al día</Badge>
                      )}
                      {missingDocuments.data?.has(student.id) && student.status === 'active' && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-ambar-800">
                          <FileWarning aria-hidden="true" className="size-3.5" />
                          <span className="sr-only sm:not-sr-only">Faltan documentos</span>
                        </span>
                      )}
                    </div>
                    <ChevronRight aria-hidden="true" className="-mr-1 hidden size-4 shrink-0 text-ink-3 sm:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </>
  )
}
