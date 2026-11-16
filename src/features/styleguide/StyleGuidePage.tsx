import { useState } from 'react'
import { Check, Plus, Trash2, Upload } from 'lucide-react'
import { BarChart } from '@/components/charts/BarChart'
import { StateBar } from '@/components/charts/StateBar'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DocumentStatusBadge,
  FeeStateBadge,
  Field,
  FilePicker,
  IconButton,
  Input,
  Money,
  MoneyInput,
  PageHeader,
  PaymentStatusBadge,
  Scoreboard,
  ScoreStat,
  StudentRow,
  SearchInput,
  Section,
  Select,
  Tabs,
  Textarea,
  useToast,
  WhatsAppLink,
} from '@/components/ui'
import { formatMoney, formatMoneyShort, monthShort } from '@/lib/format'

const COLORS = [
  { name: 'noche-900', hex: '#0A1F35', use: 'Menú y marcador', className: 'bg-noche-900' },
  { name: 'celeste', hex: '#4FB3EA', use: 'Acento sobre noche', className: 'bg-celeste' },
  { name: 'cancha', hex: '#EDF2F7', use: 'Fondo de página', className: 'bg-cancha border border-line' },
  { name: 'surface', hex: '#FFFFFF', use: 'Tarjetas', className: 'bg-surface border border-line' },
  { name: 'ink', hex: '#0B1B2B', use: 'Texto', className: 'bg-ink' },
  { name: 'brand-500', hex: '#008AD4', use: 'Azul del escudo', className: 'bg-brand-500' },
  { name: 'brand-600', hex: '#0073B8', use: 'Botones', className: 'bg-brand-600' },
  { name: 'rojo-600', hex: '#D91F26', use: 'Vencido, borrar', className: 'bg-rojo-600' },
  { name: 'verde-600', hex: '#12814A', use: 'Pagado, confirmar', className: 'bg-verde-600' },
  { name: 'ambar-500', hex: '#D98B0B', use: 'En revisión', className: 'bg-ambar-500' },
]

/**
 * Guía de estilo viva: todas las piezas del sistema visual en una pantalla.
 * Sirve para revisar cómo se ve cada componente antes de usarlo y para que
 * cualquier pantalla nueva se arme con lo que ya existe. Ver docs/DISENO.md.
 */
export function StyleGuidePage() {
  const toast = useToast()
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a')
  const [money, setMoney] = useState<number | null>(150000)
  const [file, setFile] = useState<File | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      <PageHeader title="Guía de estilo" description="Las piezas con las que se arma toda la app. Si necesitás algo nuevo, primero fijate si ya está acá." />

      <div className="flex flex-col gap-4">
        <Section title="La cinta" description="La firma: la cinta tricolor del escudo. Va una sola vez por pantalla, arriba de todo.">
          <div className="cinta rounded-full" />
        </Section>

        <Section title="Marcador" description="La única pieza expresiva de cada pantalla: noche, luz de reflector y la cancha dibujada.">
          <Scoreboard>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div>
                <p className="text-[15px] font-semibold text-noche-muted">Falta cobrar</p>
                <Money value={8450000} size="xl" className="mt-2 text-white" />
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                  <ScoreStat label="Ya vencido" tone="rojo">3,2 M</ScoreStat>
                  <ScoreStat label="Cobrado este mes" tone="verde">21 M</ScoreStat>
                </dl>
              </div>
              <BarChart
                title="Ejemplo de cobranza"
                format={formatMoney}
                formatShort={formatMoneyShort}
                bars={[6, 7, 8, 9, 10, 11].map((month, index) => ({
                  key: String(month),
                  label: monthShort(month),
                  fullLabel: monthShort(month),
                  value: [26, 27, 25, 28, 27, 21][index] * 1_000_000,
                  highlight: month === 11,
                }))}
              />
            </div>
          </Scoreboard>
        </Section>

        <Section title="Fila de alumno" description="La única forma de mostrar a un chico en una lista: foto chica, nombre, una línea de datos y el estado a la derecha." flush>
          <ul className="divide-y divide-line border-t border-line">
            <li>
              <StudentRow name="Ana Benítez Rojas" meta="Fútbol, 11 años" aside={<Badge tone="verde">Al día</Badge>} />
            </li>
            <li>
              <StudentRow name="Mateo Benítez Rojas" meta="Handball, 9 años" aside={<Badge tone="rojo">Debe Gs. 150.000</Badge>} to="/admin/guia-de-estilo" />
            </li>
          </ul>
        </Section>

        <Section title="Estado del mes" description="Barra segmentada con colores validados (skill dataviz) y leyenda siempre visible.">
          <StateBar
            title="Ejemplo"
            segments={[
              { key: 'paid', label: 'Pagadas', count: 96, color: '#12814A' },
              { key: 'partial', label: 'Pago parcial', count: 6, color: '#0073B8' },
              { key: 'in_review', label: 'En revisión', count: 4, color: '#D98B0B' },
              { key: 'pending', label: 'Pendientes', count: 25, color: '#9AA8B5' },
              { key: 'overdue', label: 'Vencidas', count: 17, color: '#D91F26' },
            ]}
          />
        </Section>

        <Section title="Colores">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLORS.map((color) => (
              <li key={color.name}>
                <div className={`h-16 rounded-control ${color.className}`} />
                <p className="mt-1.5 text-sm font-bold text-ink">{color.name}</p>
                <p className="tabular text-[13px] text-ink-3">
                  {color.hex}, {color.use}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tipografía" description="Una sola familia, Archivo. Angosta y pesada para títulos y cifras; normal para leer.">
          <div className="flex flex-col gap-4">
            <p className="display text-[36px] text-ink">Título de página</p>
            <p className="display text-[22px] text-ink">Título de sección</p>
            <Money value={1250000} size="xl" />
            <p className="max-w-[60ch] text-[15px] text-ink-2">
              Texto corrido. Frases cortas, en voseo, que digan qué pasa y qué puede hacer la persona. Los montos siempre con
              números tabulares: <span className="tabular font-semibold">Gs. 200.000</span>.
            </p>
            <p className="text-sm text-ink-3">Texto de apoyo, para ayudas y datos secundarios.</p>
          </div>
        </Section>

        <Section title="Botones" description="Un solo primario por pantalla. El texto dice lo que pasa al tocarlo.">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="ghost">Discreto</Button>
              <Button variant="success" icon={<Check aria-hidden="true" />}>
                Confirmar pago
              </Button>
              <Button variant="danger" icon={<Trash2 aria-hidden="true" />}>
                Borrar
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" icon={<Plus aria-hidden="true" />}>
                Chico
              </Button>
              <Button icon={<Plus aria-hidden="true" />}>Mediano</Button>
              <Button size="lg" icon={<Upload aria-hidden="true" />}>
                Grande
              </Button>
              <IconButton label="Solo ícono">
                <Trash2 />
              </IconButton>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                loading={loading}
                onClick={() => {
                  setLoading(true)
                  window.setTimeout(() => setLoading(false), 1500)
                }}
              >
                Probar la carga
              </Button>
              <Button disabled>Deshabilitado</Button>
              <Button variant="secondary" disabled>
                Deshabilitado
              </Button>
              <WhatsAppLink phone="595981000000" message="Hola">
                Escribir por WhatsApp
              </WhatsAppLink>
            </div>
            <div className="max-w-sm">
              <Button size="lg" block icon={<Upload aria-hidden="true" />}>
                A todo el ancho, para celular
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Estados" description="Siempre punto de color más texto. Nunca el color solo.">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <FeeStateBadge state="paid" />
              <FeeStateBadge state="in_review" />
              <FeeStateBadge state="overdue" />
              <FeeStateBadge state="partial" />
              <FeeStateBadge state="pending" />
              <FeeStateBadge state="exempt" />
            </div>
            <div className="flex flex-wrap gap-2">
              <PaymentStatusBadge status="pending" />
              <PaymentStatusBadge status="confirmed" />
              <PaymentStatusBadge status="rejected" />
              <DocumentStatusBadge status="complete" />
              <DocumentStatusBadge status="needs_update" />
              <Badge tone="azul">Principal</Badge>
            </div>
          </div>
        </Section>

        <Section title="Formularios">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campo de texto" hint="La ayuda va abajo, corta.">
              {(props) => <Input {...props} placeholder="Escribí acá" />}
            </Field>
            <Field label="Con error" error="Decí qué está mal y cómo se arregla.">
              {(props) => <Input {...props} defaultValue="dato inválido" />}
            </Field>
            <Field label="Monto en guaraníes">{(props) => <MoneyInput {...props} value={money} onChange={setMoney} />}</Field>
            <Field label="Lista de opciones">
              {(props) => (
                <Select {...props} defaultValue="1">
                  <option value="1">Fútbol</option>
                  <option value="2">Vóleibol</option>
                </Select>
              )}
            </Field>
            <Field label="Texto largo" optional>
              {(props) => <Textarea {...props} />}
            </Field>
            <div className="flex flex-col gap-3">
              <SearchInput placeholder="Buscar" onChange={() => undefined} />
              <Checkbox label="Casilla con descripción" description="Para opciones de sí o no." defaultChecked />
            </div>
          </div>
          <div className="mt-4 max-w-md">
            <FilePicker value={file} onChange={setFile} label="Tocá para elegir un archivo" hint="Foto o PDF" />
          </div>
        </Section>

        <Section title="Avisos, pestañas y diálogos">
          <div className="flex flex-col gap-3">
            <Alert tone="info" title="Aviso informativo">
              Explica algo que conviene saber.
            </Alert>
            <Alert tone="warning" title="Atención">
              Falta algo para poder seguir.
            </Alert>
            <Alert tone="error">No se pudo guardar. Probá de nuevo.</Alert>
            <Tabs
              label="Ejemplo"
              className="w-fit"
              value={tab}
              onChange={setTab}
              items={[
                { value: 'a', label: 'Activos', count: 148 },
                { value: 'b', label: 'Inactivos', count: 12 },
                { value: 'c', label: 'Todos' },
              ]}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                Abrir un diálogo
              </Button>
              <Button variant="secondary" onClick={() => toast.success('Pago confirmado')}>
                Mostrar una confirmación
              </Button>
              <Button variant="secondary" onClick={() => toast.error('No hay conexión. Revisá internet y probá de nuevo.')}>
                Mostrar un error
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Carnet" description="Así se muestra una persona en las listas.">
          <Card className="flex max-w-md items-center gap-3.5 p-3.5">
            <Avatar name="Ana Benítez" size="lg" square />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-bold text-ink">Ana Benítez</p>
              <p className="text-sm text-ink-3">11 años, Fútbol</p>
            </div>
            <Badge tone="verde">Al día</Badge>
          </Card>
        </Section>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => setConfirming(false)}
        title="Título del diálogo"
        description="En celular sube desde abajo; en escritorio va al centro."
        confirmLabel="Hacer la acción"
      />
    </>
  )
}
