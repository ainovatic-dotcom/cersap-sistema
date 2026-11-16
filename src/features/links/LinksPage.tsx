import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Alert, Card, EmptyState, ErrorState, SkeletonRows, PageHeader, Tabs } from '@/components/ui'
import { useFamilyLinks } from './api'
import { LinkRow } from './LinkRow'

type TabKey = 'pending' | 'approved' | 'closed'

const EMPTY: Record<TabKey, { title: string; text: string }> = {
  pending: { title: 'Nadie espera acceso', text: 'Cuando un familiar valide la cédula de un alumno desde el portal, su pedido aparece acá.' },
  approved: { title: 'Todavía no hay cuentas con acceso', text: 'Acá vas a ver qué cuentas de Google pueden ver a cada familia.' },
  closed: { title: 'No hay solicitudes rechazadas', text: 'Acá quedan las solicitudes rechazadas y los accesos que quitaste.' },
}

/** Quién puede ver a cada familia en el portal. */
export function LinksPage() {
  const links = useFamilyLinks()
  const [tab, setTab] = useState<TabKey>('pending')

  const all = links.data ?? []
  const groups: Record<TabKey, typeof all> = {
    pending: all.filter((link) => link.status === 'pending'),
    approved: all.filter((link) => link.status === 'approved'),
    closed: all.filter((link) => link.status === 'rejected' || link.status === 'revoked'),
  }
  const visible = groups[tab]

  return (
    <>
      <PageHeader
        title="Accesos al portal"
        description="Un familiar entra con su Gmail y valida la cédula y la fecha de nacimiento del alumno. Vos confirmás que sea quien dice ser."
      />

      <Alert tone="info" className="mb-4">
        Antes de dar acceso, fijate que el nombre y el correo sean de alguien de la familia. Si cargás el Gmail del tutor en la
        ficha de la familia, la próxima vez entra directo sin pasar por acá.
      </Alert>

      <Tabs
        label="Estado de las solicitudes"
        className="mb-4 w-fit max-w-full"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'pending', label: 'Esperando', count: groups.pending.length },
          { value: 'approved', label: 'Con acceso', count: groups.approved.length },
          { value: 'closed', label: 'Rechazadas o quitadas' },
        ]}
      />

      <Card>
        {links.isPending ? (
          <SkeletonRows />
        ) : links.isError ? (
          <ErrorState error={links.error} onRetry={() => void links.refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState icon={<ShieldCheck />} title={EMPTY[tab].title}>
            {EMPTY[tab].text}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((link) => (
              <LinkRow key={link.id} link={link} />
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
