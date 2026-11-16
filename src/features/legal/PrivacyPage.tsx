import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

/**
 * Política de privacidad pública. Google la exige para que cualquier familia
 * pueda entrar con su cuenta. Es un texto base: el centro debe revisarlo.
 */
export function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-cancha">
      <div className="cinta" />
      <main className="mx-auto max-w-[680px] px-5 py-10 md:py-14">
        <Link to="/ingresar" className="mb-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al ingreso
        </Link>
        <div className="flex items-center gap-3">
          <img src="/escudo-192.png" alt="" className="size-12" />
          <h1 className="display text-[34px] text-ink md:text-[42px]">Política de privacidad</h1>
        </div>
        <p className="mt-3 text-[15px] text-ink-3">Última actualización: 16 de noviembre de 2026.</p>

        <div className="mt-8 flex flex-col gap-7 text-[15px] leading-relaxed text-ink-2">
          <Block title="Quiénes somos">
            Este sistema es del Centro de Entrenamiento Región Sur, Alto Paraná (CERSAP), en Paraguay. Lo usamos para llevar las fichas de los
            alumnos, las cuotas y los pagos, y para que cada familia vea lo de sus hijos.
          </Block>

          <Block title="Qué datos usamos de tu cuenta de Google">
            Cuando entrás con Google recibimos solo tu nombre, tu correo y tu foto de perfil. Los usamos para saber quién sos y mostrarte lo que
            te corresponde. No accedemos a tus correos, contactos, archivos ni a ninguna otra información de tu cuenta.
          </Block>

          <Block title="Qué datos de los alumnos guardamos">
            Administración carga el nombre, la cédula, la fecha de nacimiento, la foto, la disciplina, la familia y los tutores de cada alumno.
            También guardamos las cuotas, los pagos, los comprobantes de transferencia, las facturas, los documentos y la ficha médica que la
            familia entrega al centro.
          </Block>

          <Block title="Para qué los usamos">
            Solo para gestionar la inscripción, las cuotas y los pagos, cuidar a los chicos durante los entrenamientos y comunicarnos con la
            familia. No los vendemos, no los usamos para publicidad y no los compartimos con nadie fuera del centro.
          </Block>

          <Block title="Quién puede verlos">
            Administración del centro ve las fichas completas. Cada familia ve solo a sus hijos: sus cuotas, sus pagos y sus facturas. La
            cédula, la ficha médica, los documentos y las notas internas no se muestran en el portal de familias. Para vincularte con un alumno
            tenés que conocer su cédula y su fecha de nacimiento, y administración puede revisar el pedido.
          </Block>

          <Block title="Dónde se guardan">
            Los datos se guardan en Supabase, con acceso restringido para cada persona, y los archivos en carpetas privadas que se abren con
            enlaces que vencen en minutos. El sitio se sirve desde Cloudflare.
          </Block>

          <Block title="Cuánto tiempo">
            Mientras el alumno esté en el centro. Después de la baja guardamos lo necesario para la contabilidad y lo que pida la ley, y borramos
            lo demás a pedido de la familia.
          </Block>

          <Block title="Tus derechos">
            Podés pedir ver, corregir o borrar los datos de tu familia, y dejar de usar el portal cuando quieras. Escribinos por WhatsApp a
            administración desde el portal, o al correo ainovatic@gmail.com.
          </Block>
        </div>
      </main>
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="display mb-1.5 text-[21px] text-ink">{title}</h2>
      <p>{children}</p>
    </section>
  )
}
