import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import type { FeeBalance } from '@/types/domain'

type FeeFilter = { year: number; month: number } | { studentId: string } | { familyId: string } | { overdueOn: string }

/**
 * Cuotas con su saldo y estado (vista fee_balances).
 * Se filtra por mes, por alumno, por familia, o todas las vencidas a una fecha.
 */
export function useFees(filter: FeeFilter | null) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'fees', filter],
    enabled: filter !== null,
    queryFn: async () => {
      let query = supabase.from('fee_balances').select('*')
      if (filter && 'year' in filter) {
        query = query.eq('concept', 'monthly').eq('period_year', filter.year).eq('period_month', filter.month)
      } else if (filter && 'studentId' in filter) {
        query = query.eq('student_id', filter.studentId)
      } else if (filter && 'familyId' in filter) {
        query = query.eq('family_id', filter.familyId)
      } else if (filter && 'overdueOn' in filter) {
        query = query.gt('balance', 0).lt('due_date', filter.overdueOn)
      }
      const rows = unwrap(await query.order('due_date', { ascending: false }))
      return rows as unknown as FeeBalance[]
    },
  })
}

/** Genera las mensualidades de un mes. Devuelve cuántas se crearon (0 si ya estaban todas). */
export function useGenerateMonthlyFees() {
  return useAdminMutation(async (input: { year: number; month: number }) => {
    const { data, error } = await supabase.rpc('generate_monthly_fees', { p_year: input.year, p_month: input.month })
    if (error) throw error
    return data
  })
}

export function useCreateEnrollmentFee() {
  return useAdminMutation(async (input: { studentId: string; year: number; amount?: number; dueDate?: string }) => {
    const { data, error } = await supabase.rpc('create_enrollment_fee', {
      p_student_id: input.studentId,
      p_year: input.year,
      p_amount: input.amount,
      p_due_date: input.dueDate,
    })
    if (error) throw error
    return data
  })
}

/** Borra una cuota cargada por error. La base lo impide si ya tiene pagos. */
export function useDeleteFee() {
  return useAdminMutation(async (feeId: string) => {
    const { error } = await supabase.from('fees').delete().eq('id', feeId)
    if (error) throw error
  })
}
