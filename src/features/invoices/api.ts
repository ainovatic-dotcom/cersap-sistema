import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import { uploadFile } from '@/lib/storage'

export function useInvoices() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'invoices'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('invoices')
          .select('*, family:families(id, name), payment:payments(id, amount, paid_on)')
          .order('issued_on', { ascending: false })
          .limit(300),
      ),
  })
}

export type InvoiceListItem = NonNullable<ReturnType<typeof useInvoices>['data']>[number]

/** Pagos confirmados de una familia que todavía no tienen factura. */
export function usePaymentsWithoutInvoice(familyId: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'payments', 'without-invoice', familyId],
    enabled: Boolean(familyId),
    queryFn: async () => {
      const rows = unwrap(
        await supabase
          .from('payments')
          .select('id, amount, paid_on, invoice:invoices(id)')
          .eq('family_id', familyId)
          .eq('status', 'confirmed')
          .order('paid_on', { ascending: false }),
      )
      return rows.filter((row) => !row.invoice)
    },
  })
}

export function useCreateInvoice() {
  return useAdminMutation(
    async (input: { familyId: string; paymentId?: string; number: string; issuedOn: string; amount: number; file: File }) => {
      if (input.file.type !== 'application/pdf') throw new Error('La factura tiene que ser un archivo PDF.')
      const uploaded = await uploadFile('invoices', input.familyId, input.file)
      return unwrap(
        await supabase
          .from('invoices')
          .insert({
            family_id: input.familyId,
            payment_id: input.paymentId || null,
            number: input.number.trim(),
            issued_on: input.issuedOn,
            amount: input.amount,
            file_path: uploaded.path,
            file_name: uploaded.name,
            size_bytes: uploaded.size,
          })
          .select()
          .single(),
      )
    },
  )
}

export function useDeleteInvoice() {
  return useAdminMutation(async (invoice: { id: string; file_path: string }) => {
    const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
    if (error) throw error
    // El PDF se borra después: si esto falla, solo queda un archivo suelto que nadie ve
    await supabase.storage.from('invoices').remove([invoice.file_path])
  })
}
