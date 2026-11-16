import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { ADMIN_KEY, unwrap, useAdminMutation } from '@/lib/query'
import type { LinkStatus } from '@/types/domain'

const LINK_SELECT = `
  *,
  profile:profiles!family_links_user_id_fkey(full_name, email, avatar_url),
  family:families(id, name),
  student:students(id, first_name, last_name)
`

/** Cuentas de Google que pidieron o tienen acceso a una familia. */
export function useFamilyLinks(familyId?: string) {
  return useQuery({
    queryKey: [ADMIN_KEY, 'links', familyId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('family_links').select(LINK_SELECT)
      if (familyId) query = query.eq('family_id', familyId)
      return unwrap(await query.order('requested_at', { ascending: false }).limit(500))
    },
  })
}

export type FamilyLinkItem = NonNullable<ReturnType<typeof useFamilyLinks>['data']>[number]

export function useSetLinkStatus() {
  return useAdminMutation(async (input: { linkId: string; status: Exclude<LinkStatus, 'pending'>; note?: string }) => {
    const { error } = await supabase.rpc('set_family_link_status', {
      p_link_id: input.linkId,
      p_status: input.status,
      p_note: input.note?.trim() || undefined,
    })
    if (error) throw error
  })
}
