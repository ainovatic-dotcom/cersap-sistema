import { Download, FileText } from 'lucide-react'
import { Button, Card, EmptyState, useToast } from '@/components/ui'
import { formatDate, formatMoney } from '@/lib/format'
import { openFile } from '@/lib/storage'
import { usePortalData } from './PortalGate'

export function PortalInvoicesPage() {
  const data = usePortalData()
  const toast = useToast()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-[30px] text-ink">Facturas</h1>
        <p className="mt-1 text-[15px] text-ink-2">Descargá en PDF las facturas de tus pagos.</p>
      </div>

      {data.invoices.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText />} title="Todavía no hay facturas">
            Cuando administración cargue la factura de un pago, la vas a poder descargar desde acá.
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {data.invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-bold text-ink">Factura {invoice.number}</p>
                  <p className="text-sm text-ink-3">
                    {formatDate(invoice.issued_on)}, {formatMoney(invoice.amount)}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download aria-hidden="true" />}
                  onClick={() => openFile('invoices', invoice.file_path).catch(toast.error)}
                >
                  Descargar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
