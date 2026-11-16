/**
 * Datos del portal de familias.
 *
 * El portal NO consulta tablas: todo sale de tres funciones de la base
 * (portal_overview, request_family_link y portal_submit_payment) que devuelven
 * solo lo que una familia puede ver. Ver supabase/migrations/*_funciones_portal.sql
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/storage'
import type { FeeBalance, LinkStatus, PaymentMethod, PaymentStatus, StudentStatus } from '@/types/domain'

export type PortalChild = {
  id: string
  family_id: string
  first_name: string
  last_name: string
  birth_date: string
  discipline: string | null
  status: StudentStatus
  enrolled_on: string
  photo_path: string | null
}

export type PortalFee = Omit<FeeBalance, 'note'>

export type PortalPayment = {
  id: string
  family_id: string
  amount: number
  method: PaymentMethod
  paid_on: string
  status: PaymentStatus
  receipt_path: string | null
  note: string | null
  rejection_reason: string | null
  created_at: string
  items: { fee_id: string; amount: number }[]
}

export type PortalInvoice = {
  id: string
  family_id: string
  payment_id: string | null
  number: string
  issued_on: string
  amount: number
  file_path: string
}

export type PortalOverview = {
  today: string
  org: { name: string; whatsapp_phone: string | null; due_day: number }
  links: { status: LinkStatus; requested_at: string }[]
  families: { id: string; name: string }[]
  children: PortalChild[]
  fees: PortalFee[]
  payments: PortalPayment[]
  invoices: PortalInvoice[]
}

export const portalKeys = { overview: ['portal', 'overview'] as const }

export function usePortalOverview() {
  return useQuery({
    queryKey: portalKeys.overview,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('portal_overview')
      if (error) throw error
      return data as unknown as PortalOverview
    },
  })
}

export type LinkResult = 'approved' | 'pending' | 'rejected' | 'not_found' | 'too_many_attempts'

/** Pide acceso a una familia con la cédula y la fecha de nacimiento de un hijo. */
export function useRequestFamilyLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { ci: string; birthDate: string }) => {
      const { data, error } = await supabase.rpc('request_family_link', {
        p_ci: input.ci,
        p_birth_date: input.birthDate,
      })
      if (error) throw error
      return data as LinkResult
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: portalKeys.overview }),
  })
}

/** Cuánto se puede informar de una cuota: lo que falta menos lo que ya está en revisión. */
export function payableAmount(fee: PortalFee) {
  if (fee.is_exempt) return 0
  return Math.max(0, fee.balance - fee.pending_amount)
}

/** Sube el comprobante y registra el pago como "por verificar". */
export function useSubmitPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; feeIds: string[]; paidOn: string; receipt: File; note?: string }) => {
      const uploaded = await uploadFile('payment-receipts', input.familyId, input.receipt)
      const { data, error } = await supabase.rpc('portal_submit_payment', {
        p_family_id: input.familyId,
        p_fee_ids: input.feeIds,
        p_paid_on: input.paidOn,
        p_receipt_path: uploaded.path,
        p_note: input.note?.trim() || undefined,
      })
      if (error) throw error
      return data
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: portalKeys.overview }),
  })
}
