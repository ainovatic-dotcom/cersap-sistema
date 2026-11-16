import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, SkeletonRows, PageHeader, SearchInput } from '@/components/ui'
import { formatMoney, normalizeText } from '@/lib/format'
import { useFamilies, useFamilyBalances } from './api'
import { FamilyDialog } from './FamilyDialogs'

export function FamiliesPage() {
  const navigate = useNavigate()
  const families = useFamilies()
  const balances = useFamilyBalances()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  const all = useMemo(() => families.data ?? [], [families.data])
  const visible = useMemo(() => {
    const term = normalizeText(search)
    if (!term) return all
    return all.filter((family) => {
      const haystack = normalizeText(
        [family.name, ...family.guardians.map((g) => g.full_name), ...family.students.map((s) => `${s.first_name} ${s.last_name}`)].join(' '),
      )
      return term.split(/\s+/).every((word) => haystack.includes(word))
    })
  }, [all, search])

  return (
    <>
      <PageHeader
        title="Familias"
        description="Cada familia agrupa a los hermanos, sus tutores y un solo estado de cuenta."
        actions={
          <Button icon={<Plus aria-hidden="true" />} onClick={() => setCreating(true)}>
            Nueva familia
          </Button>
        }
      />

      <SearchInput className="mb-4 max-w-md" placeholder="Buscar por familia, tutor o alumno" value={search} onChange={setSearch} />

      <Card>
        {families.isPending ? (
          <SkeletonRows />
        ) : families.isError ? (
          <ErrorState error={families.error} onRetry={() => void families.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Todavía no hay familias"
            action={
              <Button icon={<Plus aria-hidden="true" />} onClick={() => setCreating(true)}>
                Crear la primera familia
              </Button>
            }
          >
            También se crean solas cuando cargás un alumno nuevo.
          </EmptyState>
        ) : visible.length === 0 ? (
          <EmptyState title="Ninguna familia coincide">Probá con otro apellido o con el nombre de un tutor.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((family) => {
              const balance = balances.data?.get(family.id)
              const owed = balance?.balance ?? 0
              const active = family.students.filter((student) => student.status === 'active')
              return (
                <li key={family.id}>
                  <Link to={`/admin/familias/${family.id}`} className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-cancha md:px-5">
                    <div className="min-w-0 flex-1 md:grid md:grid-cols-[1.2fr_1.4fr] md:items-center md:gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-bold text-ink">{family.name}</p>
                        <p className="truncate text-sm text-ink-3">
                          {family.guardians.length > 0 ? family.guardians.map((g) => g.full_name).join(', ') : 'Sin tutores cargados'}
                        </p>
                      </div>
                      <p className="truncate text-sm text-ink-2">
                        {family.students.length === 0
                          ? 'Sin alumnos'
                          : family.students.map((student) => student.first_name).join(', ')}
                        {family.students.length > 0 && active.length === 0 && ' (inactivos)'}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {owed > 0 ? (
                        <Badge tone={(balance?.overdue_balance ?? 0) > 0 ? 'rojo' : 'neutro'}>Debe {formatMoney(owed)}</Badge>
                      ) : (
                        family.students.length > 0 && <Badge tone="verde">Al día</Badge>
                      )}
                      {(balance?.pending_amount ?? 0) > 0 && <Badge tone="ambar">Pago por verificar</Badge>}
                    </div>
                    <ChevronRight aria-hidden="true" className="hidden size-5 shrink-0 text-ink-3 sm:block" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <FamilyDialog open={creating} onClose={() => setCreating(false)} onSaved={(family) => navigate(`/admin/familias/${family.id}`)} />
    </>
  )
}
