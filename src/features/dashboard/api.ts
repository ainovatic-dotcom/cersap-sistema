import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ADMIN_KEY } from '@/lib/query'

/** Lo que devuelve la función admin_dashboard() de la base. */
export type DashboardData = {
  today: string
  period_year: number
  period_month: number
  settings_ready: boolean
  active_students: number
  inactive_students: number
  families: number
  pending_balance: number
  overdue_balance: number
  overdue_fees: number
  collected_this_month: number
  payments_to_review: number
  links_to_review: number
  students_missing_documents: number
  payments_without_invoice: number
  current_month_fees: number
  /** Últimos 6 meses, del más viejo al actual */
  collection_series: { year: number; month: number; collected: number; billed: number }[]
  /** Mensualidades del mes actual en cada estado */
  month_states: { paid: number; partial: number; in_review: number; pending: number; overdue: number; exempt: number }
  /** Alumnos activos que cumplen años este mes */
  birthdays: {
    id: string
    first_name: string
    last_name: string
    birth_date: string
    discipline: string | null
    photo_path: string | null
    enrolled_on: string
  }[]
}

export function useDashboard() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'dashboard'],
    // Se actualiza solo cada minuto para que aparezcan los pagos que informan las familias
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard')
      if (error) throw error
      return data as unknown as DashboardData
    },
  })
}
