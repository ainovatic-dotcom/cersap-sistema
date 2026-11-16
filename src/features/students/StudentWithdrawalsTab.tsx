import { History } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, Loading } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { useStudentWithdrawals } from './api'

/** Historial de bajas y reingresos. Exclusivo de administración. */
export function StudentWithdrawalsTab({ studentId }: { studentId: string }) {
  const withdrawals = useStudentWithdrawals(studentId)

  if (withdrawals.isPending) return <Loading />
  if (withdrawals.isError) return <ErrorState error={withdrawals.error} onRetry={() => void withdrawals.refetch()} />

  if (withdrawals.data.length === 0) {
    return (
      <Card>
        <EmptyState icon={<History />} title="Nunca se dio de baja">
          Si el alumno deja el centro, la baja y el eventual reingreso quedan registrados acá.
        </EmptyState>
      </Card>
    )
  }

  return (
    <ol className="flex flex-col gap-2.5">
      {withdrawals.data.map((withdrawal) => (
        <li key={withdrawal.id}>
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[1rem] font-bold text-ink">Baja comunicada el {formatDate(withdrawal.communicated_on)}</p>
              {withdrawal.reentered_on ? (
                <Badge tone="verde">Reingresó el {formatDate(withdrawal.reentered_on)}</Badge>
              ) : (
                <Badge tone="neutro">Sigue de baja</Badge>
              )}
            </div>
            <p className="mt-1.5 text-[0.9375rem] text-ink-2">Motivo: {withdrawal.reason}</p>
            {withdrawal.note && <p className="mt-1 whitespace-pre-wrap text-[0.9375rem] text-ink-2">{withdrawal.note}</p>}
          </Card>
        </li>
      ))}
    </ol>
  )
}
