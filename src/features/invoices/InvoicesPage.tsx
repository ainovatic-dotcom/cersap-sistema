import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Download, FileText, Plus, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogActions,
  EmptyState,
  ErrorState,
  Field,
  FilePicker,
  FormError,
  IconButton,
  Input,
  SkeletonRows,
  MoneyInput,
  PageHeader,
  Select,
  useToast,
} from '@/components/ui'
import { useFamilyOptions } from '@/features/families/api'
import { formatDate, formatMoney, todayIso } from '@/lib/format'
import { openFile } from '@/lib/storage'
import { useCreateInvoice, useDeleteInvoice, useInvoices, usePaymentsWithoutInvoice, type InvoiceListItem } from './api'

/** Facturas en PDF. Administración las sube y la familia las descarga desde el portal. */
export function InvoicesPage() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const invoices = useInvoices()
  const deleteInvoice = useDeleteInvoice()
  const [toDelete, setToDelete] = useState<InvoiceListItem | null>(null)

  // Se abre solo cuando se llega desde "Cargar factura" de un pago
  const presetFamily = searchParams.get('familia') ?? undefined
  const presetPayment = searchParams.get('pago') ?? undefined
  const creating = searchParams.get('nueva') === '1' || Boolean(presetFamily)

  return (
    <>
      <PageHeader
        title="Facturas"
        description="Subí el PDF de cada factura. La familia la descarga desde el portal."
        actions={
          <Button icon={<Plus aria-hidden="true" />} onClick={() => setSearchParams({ nueva: '1' })}>
            Cargar factura
          </Button>
        }
      />

      <Card>
        {invoices.isPending ? (
          <SkeletonRows />
        ) : invoices.isError ? (
          <ErrorState error={invoices.error} onRetry={() => void invoices.refetch()} />
        ) : invoices.data.length === 0 ? (
          <EmptyState
            icon={<FileText />}
            title="Todavía no hay facturas"
            action={
              <Button icon={<Plus aria-hidden="true" />} onClick={() => setSearchParams({ nueva: '1' })}>
                Cargar la primera factura
              </Button>
            }
          >
            Cuando emitas una factura electrónica, subí el PDF acá y asociala al pago.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {invoices.data.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600">
                  <FileText aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[1rem] font-bold text-ink">Factura {invoice.number}</p>
                  <p className="truncate text-sm text-ink-3">
                    {invoice.family?.name}, {formatDate(invoice.issued_on)}
                    {invoice.payment ? `, pago del ${formatDate(invoice.payment.paid_on)}` : ', sin pago asociado'}
                  </p>
                </div>
                <span className="tabular hidden shrink-0 text-[1rem] font-bold text-ink sm:block">{formatMoney(invoice.amount)}</span>
                <IconButton label={`Abrir la factura ${invoice.number}`} onClick={() => openFile('invoices', invoice.file_path).catch(toast.error)}>
                  <Download />
                </IconButton>
                <IconButton label={`Borrar la factura ${invoice.number}`} onClick={() => setToDelete(invoice)}>
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={creating} onClose={() => setSearchParams({})} title="Cargar factura" size="md">
        <InvoiceForm onClose={() => setSearchParams({})} presetFamily={presetFamily} presetPayment={presetPayment} />
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => {
          setToDelete(null)
          deleteInvoice.reset()
        }}
        onConfirm={() => {
          if (!toDelete) return
          deleteInvoice.mutate(toDelete, {
            onSuccess: () => {
              toast.success('Factura borrada')
              setToDelete(null)
            },
          })
        }}
        title={`Borrar la factura ${toDelete?.number ?? ''}`}
        description="La familia deja de verla en el portal. El pago no se toca."
        confirmLabel="Borrar factura"
        confirmVariant="danger"
        loading={deleteInvoice.isPending}
      >
        <FormError error={deleteInvoice.error} />
      </ConfirmDialog>
    </>
  )
}

function InvoiceForm({ onClose, presetFamily, presetPayment }: { onClose: () => void; presetFamily?: string; presetPayment?: string }) {
  const toast = useToast()
  const families = useFamilyOptions()
  const create = useCreateInvoice()

  const [familyId, setFamilyId] = useState(presetFamily ?? '')
  const [paymentId, setPaymentId] = useState(presetPayment ?? '')
  const [number, setNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState(todayIso())
  const [amount, setAmount] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const payments = usePaymentsWithoutInvoice(familyId)
  const selectedPayment = (payments.data ?? []).find((payment) => payment.id === paymentId)
  // Si se eligió un pago y no se tocó el monto, se usa el del pago
  const effectiveAmount = amount ?? selectedPayment?.amount ?? null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file || effectiveAmount === null) return
    try {
      await create.mutateAsync({ familyId, paymentId: paymentId || undefined, number, issuedOn, amount: effectiveAmount, file })
      toast.success('Factura cargada')
      onClose()
    } catch {
      // El error se muestra en el formulario
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Familia">
          {(props) => (
            <Select
              {...props}
              value={familyId}
              onChange={(event) => {
                setFamilyId(event.target.value)
                setPaymentId('')
              }}
              required
            >
              <option value="">Elegí una familia</option>
              {(families.data ?? []).map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Pago que factura" optional hint="Solo aparecen los pagos confirmados sin factura.">
          {(props) => (
            <Select {...props} value={paymentId} onChange={(event) => setPaymentId(event.target.value)} disabled={!familyId}>
              <option value="">Sin asociar a un pago</option>
              {(payments.data ?? []).map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {formatDate(payment.paid_on)}, {formatMoney(payment.amount)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Número de factura">
          {(props) => (
            <Input {...props} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="001-001-0000123" autoComplete="off" required />
          )}
        </Field>
        <Field label="Fecha de emisión">
          {(props) => <Input {...props} type="date" value={issuedOn} max={todayIso()} onChange={(event) => setIssuedOn(event.target.value)} required />}
        </Field>
        <Field label="Monto">{(props) => <MoneyInput {...props} value={effectiveAmount} onChange={setAmount} required />}</Field>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink">Archivo de la factura</p>
        <FilePicker value={file} onChange={setFile} accept="application/pdf" label="Elegí el PDF de la factura" hint="Hasta 5 MB" />
      </div>

      <FormError error={create.error} />
      <DialogActions>
        <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={create.isPending}
          disabled={!familyId || number.trim() === '' || !issuedOn || effectiveAmount === null || !file}
        >
          Cargar factura
        </Button>
      </DialogActions>
    </form>
  )
}
