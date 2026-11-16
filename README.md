# Sistema CERSAP

Sistema de gestión del **Centro de Entrenamiento Región Sur, Alto Paraná**. Lo usan dos tipos de persona:

- **Administración:** alumnos activos e inactivos, familias y hermanos, cuotas (descuentos y exonerados), pagos, facturas, documentos y accesos al portal.
- **Familias:** en el portal ven a sus hijos, cuánto deben, informan una transferencia con su comprobante, bajan facturas y escriben a administración por WhatsApp.

| Parte | Tecnología |
|---|---|
| Interfaz | React 19, React Router 8, TanStack Query 5, Tailwind 4, Vite 8 y TypeScript 7 |
| Base de datos, ingreso y archivos | Supabase (Postgres 17, ingreso con Google y almacenamiento privado) |
| Publicación | Cloudflare Workers, sirviendo la app como sitio estático |
| Errores (opcional) | Sentry |

El diseño (claro, compacto y en filas) está descrito en **[docs/DISENO.md](docs/DISENO.md)**, y la guía viva se ve en la app, en `/admin/guia-de-estilo`.

---

## Cómo funciona el ingreso

1. La persona entra con su cuenta de Google.
2. Si el correo es de un administrador, va al panel.
3. Si no, tiene que **vincularse**: escribe la cédula y la fecha de nacimiento de su hijo o hija.
   - Si su correo ya figura entre los tutores de esa familia, entra directo.
   - Si no, el pedido queda pendiente hasta que administración lo apruebe en **Accesos**.
   - Hay un límite de intentos fallidos, para que nadie pueda adivinar cédulas.
4. Una familia solo ve lo suyo. La base nunca le entrega cédulas, ficha médica, documentos, notas internas ni motivos de baja.

---

## Estructura

```
supabase/
  migrations/           el esquema completo, en orden (ya aplicado en el proyecto)
  tests/seguridad.sql   46 verificaciones de permisos; corre y deshace todo
src/
  app/                  arranque, rutas, guardas por rol y proveedor de sesión
  components/
    ui/                 piezas base: botones, campos, filas, marcador, diálogos…
    charts/             gráfico de barras y barra de estados (con accesibilidad)
    layout/             marcos de administración, portal e ingreso
  features/<área>/      una carpeta por pantalla o tema, cada una con su api.ts
  lib/                  formato de fechas y plata, cliente de Supabase, archivos
  styles/index.css      los tokens de diseño (colores, curvas, sombras)
  types/                tipos del dominio
tests/e2e/              pruebas de punta a punta con Playwright y backend simulado
docs/                   prompt de diseño y análisis de referencias
public/                 escudo, íconos y cabeceras de seguridad (_headers)
```

**Regla de datos:** las pantallas de administración leen tablas protegidas por RLS (solo admins). El portal **no lee tablas**: usa funciones de la base (`portal_overview`, `portal_submit_payment`, `request_family_link`) que ya filtran por la familia de quien pregunta.

---

## Trabajar en tu computadora

```bash
npm install
cp .env .env.local      # o completá .env con la URL y la clave pública
npm run dev             # http://localhost:5173
npm run typecheck
npm run build
```

En `.env` van solo **valores públicos**: la URL del proyecto y la clave *publishable*. La seguridad la dan las políticas de la base. **Nunca** pongas ahí la clave *secret* ni la *service_role*.

---

## Pruebas

### Pruebas de punta a punta (Playwright)

Corren contra una red simulada (`tests/e2e/mock.py`), así que no tocan la base real ni Google.

```bash
pip install playwright && playwright install chromium
npm run build && npx vite preview --port 4173 &
python3 tests/e2e/e2e.py http://localhost:4173            # todas
python3 tests/e2e/e2e.py http://localhost:4173 "portal"   # solo las que coinciden
python3 tests/e2e/shots.py http://localhost:4173          # capturas de cada pantalla
```

Corren 17 pruebas en escritorio (1360×900) y en celular (390×844):

- Ingreso con Google (PKCE).
- Rutas protegidas, y un tutor que no puede entrar a administración.
- Navegación completa, incluido el menú "Más" del celular.
- Panel: el gráfico y sus botones.
- Alta de alumno con familia nueva.
- Verificar, rechazar y registrar pagos.
- Búsqueda de alumnos sin importar las tildes.
- Vinculación con cédula y fecha de nacimiento.
- El portal informando un pago con comprobante.
- Accesibilidad básica, tamaño de lo que se toca, movimiento reducido y desborde horizontal.

Las capturas y el resultado quedan en `tests/e2e/capturas/`.

### Pruebas de seguridad de la base

Abrí `supabase/tests/seguridad.sql`, pegalo en el **SQL Editor** de Supabase y ejecutalo. Hace de admin, de tutor vinculado, de tutor ajeno y de visitante anónimo, y verifica qué puede ver y hacer cada uno. Si todo está bien, termina con:

```
ERROR: OK: 46 verificaciones pasaron (se deshace todo)
```

Que aparezca como "ERROR" es a propósito: así se deshacen todos los datos de prueba. Si una verificación falla, el mensaje dice `FALLO n` y qué se esperaba.

---

## Publicar en Cloudflare

```bash
npx wrangler login
npm run deploy
```

La alternativa es conectar el repositorio en **Workers Builds** (Cloudflare → Workers → Create → Import a repository), con `npm run build` como comando de compilación y `npx wrangler deploy` como comando de publicación.

`wrangler.jsonc` sirve la carpeta `dist/` como aplicación de una sola página. `public/_headers` agrega la política de contenido (CSP) y las demás cabeceras de seguridad.

---

## Lo que falta configurar (una sola vez)

1. **Google como proveedor de ingreso**
   - En Google Cloud → APIs & Services → Credentials, creá un *OAuth client ID* de tipo Web.
   - En *Authorized redirect URIs* poné `https://aynronszcpwepvkcyrbu.supabase.co/auth/v1/callback`.
   - En Supabase → Authentication → Sign In / Providers → Google, pegá el Client ID y el Client Secret.
   - En Supabase → Authentication → URL Configuration:
     - *Site URL*: la dirección final del sitio.
     - *Redirect URLs*: esa misma dirección con `/**`, más `http://localhost:5173/**` para desarrollo.
2. **Primer administrador:** `ainovatic@gmail.com` ya está cargado como admin. Los demás se suman desde **Configuración → Administradores** (quedan en `public.admin_allowlist`).
3. **Datos del centro:** completá en **Configuración** el WhatsApp de administración, la cuota general, la matrícula y el día de vencimiento.
4. **Sentry (opcional):** creá un proyecto de React y poné su DSN en `VITE_SENTRY_DSN`.

---

## Lo que queda para una fase 2

- Caja y banco: movimientos, conciliación y egresos.
- Reportes en PDF y Excel (morosidad, cobranza por mes y alumnos por disciplina).
- Recordatorios automáticos de vencimiento por correo o WhatsApp.
- Tareas y seguimiento con fechas para administración.
- Generación de cuotas por un proceso programado. Hoy se generan con un botón en **Cuotas**.
