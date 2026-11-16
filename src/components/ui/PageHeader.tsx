import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  /** Acciones de la página (a la derecha en escritorio, debajo en celular) */
  actions?: ReactNode
  /** Enlace para volver a la lista */
  back?: { to: string; label: string }
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <header className="mb-5 md:mb-7">
      {back && (
        <Link
          to={back.to}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="display text-[2.25rem] text-ink md:text-[2.875rem]">{title}</h1>
          {description && <p className="mt-2 max-w-[68ch] text-[0.9375rem] text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
