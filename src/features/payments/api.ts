import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/database.types'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import { uploadFile } from '@/lib/storage'
import type { PaymentItemInput, PaymentMethod, PaymentStatus } from '@/types/domain'

const PAYMENT_SELECT = `
  *,
  family:families(id, name),
  submitter:profiles!payments_submitted_by_fkey(full_name, email),
  reviewer:profiles!payments_reviewed_by_fkey(full_name, email),
  invoice:invoices(id, number),
  items:payment_items(
    id, amount, fee_id,
    fee:fees(id, concept, period_year, period_month, amount, student:students(id, first_name, last_name))
  )
`

type PaymentFilter = { status: PaymentStatus } | { familyId: string }

export function usePayments(filter: PaymentFilter) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'payments', filter],
    queryFn: async () => {
      let query = supabase.from('payments').select(PAYMENT_SELECT)
      query = 'status' in filter ? query.eq('status', filter.status) : query.eq('family_id', filter.familyId)
      return unwrap(await query.order('created_at', { ascending: false }).limit(200))
    },
  })
}

export type PaymentListItem = NonNullable<ReturnType<typeof usePayments>['data']>[number]

/** Registra un pago desde administración. Queda confirmado en el momento. */
export function useRegisterPayment() {
  return useAdminMutation(
    async (input: {
      familyId: string
      method: PaymentMethod
      paidOn: string
      items: PaymentItemInput[]
      receipt?: File | null
      note?: string
    }) => {
      const receiptPath = input.receipt ? (await uploadFile('payment-receipts', input.familyId, input.receipt)).path : undefined
      const { data, error } = await supabase.rpc('register_payment', {
        p_family_id: input.familyId,
        p_method: input.method,
        p_paid_on: input.paidOn,
        p_items: input.items as unknown as Json,
        p_receipt_path: receiptPath,
        p_note: input.note?.trim() || undefined,
      })
      if (error) throw error
      return data
    },
  )
}

/**
 * Revisa un pago: confirmar (con los montos corregidos si hace falta),
 * rechazar un pendiente o anular uno confirmado.
 */
export function useReviewPayment() {
  return useAdminMutation(
    async (input: { paymentId: string; approve: boolean; items?: PaymentItemInput[]; reason?: string }) => {
      const { data, error } = await supabase.rpc('review_payment', {
        p_payment_id: input.paymentId,
        p_approve: input.approve,
        p_items: input.items ? (input.items as unknown as Json) : undefined,
        p_reason: input.reason?.trim() || undefined,
      })
      if (error) throw error
      return data
    },
  )
}
