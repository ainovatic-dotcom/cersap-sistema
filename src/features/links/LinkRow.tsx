import { useState } from 'react'
import { Link } from 'react-router'
import { Avatar, Badge, Button, ConfirmDialog, FormError, LinkStatusBadge, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDateTime } from '@/lib/format'
import type { LinkStatus } from '@/types/domain'
import { useSetLinkStatus, type FamilyLinkItem } from './api'

type Decision = Exclude<LinkStatus, 'pending'>

const CONFIRM: Record<Decision, { title: string; text: string; button: string; done: string; danger: boolean }> = {
  approved: {
    title: 'Dar acceso a la familia',
    text: 'Esta cuenta va a poder ver a los alumnos de la familia, sus cuotas, pagos y facturas.',
    button: 'Dar acceso',
    done: 'Acceso aprobado',
    danger: false,
  },
  rejected: {
    title: 'Rechazar la solicitud',
    text: 'La cuenta no va a ver nada de la familia. Si fue un error, después podés darle acceso desde acá.',
    button: 'Rechazar solicitud',
    done: 'Solicitud rechazada',
    danger: true,
  },
  revoked: {
    title: 'Quitar el acceso',
    text: 'La cuenta deja de ver a la familia en el momento. Después podés volver a darle acceso.',
    button: 'Quitar acceso',
    done: 'Acceso quitado',
    danger: true,
  },
}

/**
 * Una cuenta de Google que pidió o tiene acceso a una familia, con sus acciones.
 * Con showFamily={false} (dentro de la ficha de la familia) se acomoda en vertical,
 * porque ahí la columna es angosta.
 */
export function LinkRow({ link, showFamily = true }: { link: FamilyLinkItem; showFamily?: boolean }) {
  const toast = useToast()
  const setStatus = useSetLinkStatus()
  const [decision, setDecision] = useState<Decision | null>(null)
  const confirm = decision ? CONFIRM[decision] : null

  return (
    <li className={cn('flex flex-col gap-3 px-4 py-3.5 md:px-5', showFamily && 'md:flex-row md:items-center')}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={link.profile?.full_name ?? link.profile?.email} src={link.profile?.avatar_url} />
        <div className="min-w-0">
          <p className="truncate text-[1rem] font-bold text-ink">{link.profile?.full_name ?? 'Sin nombre'}</p>
          <p className="truncate text-sm text-ink-3">{link.profile?.email}</p>
          <p className="mt-0.5 text-[0.8125rem] text-ink-3">
            {showFamily && link.family && (
              <>
                Pide ver a{' '}
                <Link to={`/admin/familias/${link.family.id}`} className="font-semibold text-brand-700 hover:underline">
                  {link.family.name}
                </Link>
                {'. '}
              </>
            )}
            {link.student && `Validó con la cédula de ${link.student.first_name} ${link.student.last_name}. `}
            {formatDateTime(link.requested_at)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <LinkStatusBadge status={link.status} />
        {link.auto_approved && link.status === 'approved' && <Badge tone="azul">Gmail de la ficha</Badge>}
        {link.status === 'pending' && (
          <>
            <Button variant="secondary" size="sm" onClick={() => setDecision('rejected')}>
              Rechazar
            </Button>
            <Button variant="success" size="sm" onClick={() => setDecision('approved')}>
              Dar acceso
            </Button>
          </>
        )}
        {link.status === 'approved' && (
          <Button variant="ghost" size="sm" onClick={() => setDecision('revoked')}>
            Quitar acceso
          </Button>
        )}
        {(link.status === 'rejected' || link.status === 'revoked') && (
          <Button variant="ghost" size="sm" onClick={() => setDecision('approved')}>
            Dar acceso
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={decision !== null}
        onClose={() => {
          setDecision(null)
          setStatus.reset()
        }}
        onConfirm={() => {
          if (!decision) return
          setStatus.mutate(
            { linkId: link.id, status: decision },
            {
              onSuccess: () => {
                toast.success(CONFIRM[decision].done)
                setDecision(null)
              },
            },
          )
        }}
        title={confirm?.title ?? ''}
        description={confirm?.text}
        confirmLabel={confirm?.button ?? ''}
        confirmVariant={confirm?.danger ? 'danger' : 'success'}
        loading={setStatus.isPending}
      >
        <p className="rounded-control bg-cancha px-3 py-2.5 text-[0.9375rem] font-medium text-ink">
          {link.profile?.full_name ?? 'Sin nombre'}
          <span className="block text-sm font-normal text-ink-3">{link.profile?.email}</span>
        </p>
        <div className="mt-3">
          <FormError error={setStatus.error} />
        </div>
      </ConfirmDialog>
    </li>
  )
}
