import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TablesUpdate } from '@/lib/supabase/database.types'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'

export function useSettings() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'settings'],
    queryFn: async () => unwrap(await supabase.from('settings').select('*').single()),
  })
}

export function useUpdateSettings() {
  return useAdminMutation(async (changes: TablesUpdate<'settings'>) =>
    unwrap(await supabase.from('settings').update(changes).eq('id', true).select().single()),
  )
}

export function useAdminEmails() {
  return useQuery({
    queryKey: [ADMIN_KEY, 'admin-allowlist'],
    queryFn: async () => unwrap(await supabase.from('admin_allowlist').select('*').order('created_at')),
  })
}

export function useAddAdminEmail() {
  return useAdminMutation(async (email: string) =>
    unwrap(await supabase.from('admin_allowlist').insert({ email: email.trim().toLowerCase() }).select().single()),
  )
}

export function useRemoveAdminEmail() {
  return useAdminMutation(async (email: string) => {
    const { error } = await supabase.from('admin_allowlist').delete().eq('email', email)
    if (error) throw error
  })
}
