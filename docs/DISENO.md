# Prompt de diseño · Sistema CERSAP

Este documento es el **prompt de diseño** del sistema. Sirve para dos cosas:

1. Pegarlo tal cual a una IA (o dárselo a un diseñador) cada vez que haya que crear o cambiar una pantalla, para que quede igual al resto.
2. Resolver dudas de diseño sin discusión: lo que no esté acá se decide con los principios de la sección 2.

Los valores están en `src/styles/index.css`, los componentes en `src/components/ui/` y los gráficos en `src/components/charts/`. La guía viva se ve en la app, en **/admin/guia-de-estilo**.

Fuentes que lo sostienen:
- **emil-design-eng** (Emil Kowalski): jerarquía, interacción y movimiento. Ver la sección 9.
- **/taste** de TeamSnap y Stripe, tomados **solo como principios**: `docs/referencias/teamsnap.com.md` y `docs/referencias/stripe.com.md`.
- **dataviz**: los colores de los gráficos se validaron con su script, no a ojo. Ver la sección 8.

---

## 1. Contexto: quién, qué y para qué

Sos el diseñador de producto del sistema de gestión de **CERSAP, Centro de Entrenamiento Región Sur, Alto Paraná (Paraguay)**, un centro multideporte para chicos: fútbol, vóleibol, básquetbol, handball y bádminton.

| | Administración | Portal de familias |
|---|---|---|
| **Quién** | Una o dos personas del centro | Madres, padres y tutores de unos 150 alumnos |
| **Dónde** | Notebook en la oficina y celular en la cancha | Casi siempre el celular. Muchos con poca práctica tecnológica |
| **Para qué** | Saber quién debe, verificar transferencias y tener fichas y documentos al día | Ver cuánto deben, avisar que pagaron y bajar la factura |
| **Qué tiene que sentir** | "Tengo el partido bajo control" | "Esto es del club de mis hijos, y es fácil" |
| **Frecuencia** | Todo el día | Pocas veces por mes |

**Cada pantalla contesta una pregunta en dos segundos.** El panel: ¿cómo viene la cobranza y qué tengo que hacer hoy? El inicio del portal: ¿cuánto debo y cómo lo pago?

---

## 2. Concepto: claro, compacto y en filas

La identidad sale del escudo de CERSAP: el azul marino del menú, la cinta roja, blanca y azul arriba de todo, y las cifras angostas como el número de una camiseta. Todo lo demás es blanco, simple y compacto: tarjetas blancas, filas de 64 px y una sola cifra grande por pantalla. La noche de partido (cancha dibujada y luz de reflector) quedó solo en la pantalla de ingreso.

| Pieza | Qué es | Dónde va |
|---|---|---|
| **La noche** | Azul marino profundo, del mismo tono que el azul del escudo | El menú lateral, los encabezados en celular y la pantalla de ingreso |
| **El resumen** | Tarjeta blanca con la cifra que importa en grande, sus datos chicos y, en el panel, el gráfico | **Una sola vez por pantalla**: el panel, la deuda en el portal y el mes en Cuotas |
| **El dorsal** | Cifras en Archivo muy angosta y pesada, como el número de una camiseta | La cifra del resumen y los conteos de "Para hacer" |
| **La fila** | Cada chico en una fila de 64 px: foto chica redonda, nombre, "Fútbol, 11 años" y el estado a la derecha | Portal, cumpleaños del panel, lista de alumnos y encabezado de la ficha |
| **La cinta** | La franja roja, blanca y azul del escudo, de 4 px | El borde superior de la pantalla. Nada más |
| **La planilla** | Fondo de día teñido de azul, tarjetas blancas con borde fino | Todo lo que se lee y se completa |

### Principios (para decidir cuando haya dudas)

1. **Una pregunta por pantalla.** Si una pantalla contesta dos, son dos pantallas o dos pestañas.
2. **Una sola cifra grande por pantalla.** El resumen lleva la cifra que importa; todo lo demás va en tamaño normal. Sin degradés, sin dibujos de fondo y sin bloques oscuros en el contenido. (De Stripe: un solo momento fuerte se recuerda; repartido, es ruido.)
3. **Un solo botón principal por superficie**, azul sólido.
4. **Profundidad mínima.** Las tarjetas llevan borde fino y una sombra casi invisible. Las sombras fuertes se reservan para lo que flota (diálogos y avisos) y van teñidas de noche. (De TeamSnap y de Stripe.)
5. **Filas, no tarjetas.** Las personas y los registros se muestran en filas compactas dentro de una tarjeta, separadas por una línea fina. Nada de tarjetas sueltas por persona, degradés ni marcas de agua.
6. **La plata se muestra como un recibo.** Etiqueta apagada a la izquierda, monto tabular a la derecha y total separado por una línea. (De Stripe.)
7. **El color significa algo.** Azul: acción. Verde: pagado o confirmar. Rojo: vencido, rechazar o borrar. Ámbar: en revisión. Nunca va el color solo, siempre con texto.
8. **Pensado para el pulgar.** Nada tocable mide menos de 44 px en el portal. En celular, las acciones principales ocupan todo el ancho.
9. **Se habla como acá.** Voseo y frases cortas, sin palabras de sistema.

---

## 3. Color

### Noche

| Token | Hex | Uso |
|---|---|---|
| `noche-950` | `#051424` | Fondo más profundo |
| `noche-900` | `#0A1F35` | **Menú lateral y encabezados** |
| `noche-800` | `#12304D` | Escalón de tono: lo que está "más cerca" sobre la noche |
| `noche-700` | `#1B4064` | Bordes y estados al pasar el mouse |
| `noche-text` | `#EEF5FB` | Texto sobre noche |
| `noche-muted` | `#8DA7BF` | Texto secundario sobre noche (contraste 6,7:1) |
| `celeste` | `#4FB3EA` | Ítem activo del menú (7,1:1 sobre noche) |

Los contadores rojos del menú usan `rojo-600` con texto blanco.

### Día

| Token | Hex | Uso |
|---|---|---|
| `cancha` | `#EDF2F7` | Fondo de página, teñido de azul (nunca gris puro) |
| `surface` | `#FFFFFF` | Tarjetas, campos y diálogos |
| `ink` | `#0B1B2B` | Texto principal |
| `ink-2` | `#3F5163` | Texto secundario |
| `ink-3` | `#5B6D7F` | Ayudas (4,7:1 sobre el fondo) |
| `line` / `line-strong` | `#DCE4EC` / `#BFCCD8` | Bordes de tarjetas / de campos |

### Marca y estados

| Token | Hex | Uso |
|---|---|---|
| `brand-500` | `#008AD4` | El azul exacto del escudo: la cinta y el foco |
| `brand-600` | `#0073B8` | **Botón principal sobre día** (5,1:1 con blanco) |
| `verde-600` | `#12814A` | Pagado, confirmar, WhatsApp |
| `ambar-500` | `#D98B0B` | En revisión (el texto va en `ambar-800` sobre `ambar-50`) |
| `rojo-600` | `#D91F26` | Vencido, rechazar, borrar. `rojo-500` solo en la cinta |

**No hay** degradados de decoración en el contenido. La luz de reflector y la cancha dibujada quedaron solo en la pantalla de ingreso.

---

## 4. Tipografía

**Una sola familia: Archivo variable**, con eje de ancho de 62 a 125 %. Se sirve desde el propio sitio (`@fontsource-variable/archivo`), sin pedir nada a Google.

| Rol | Clase | Ancho | Peso | Tamaño |
|---|---|---|---|---|
| Título de página | `.display` | 74 % | 800 | 36 px en celular, 46 px en escritorio |
| Título de sección o diálogo | `.display` | 74 % | 800 | 21 a 25 px |
| Cifra del resumen | `.dorsal` | 64 % | 850 | 52 px |
| Cifra secundaria | `.dorsal` | 64 % | 850 | 24 px |
| Texto | normal | 100 % | 400 | 15 px |
| Dato destacado | normal | 100 % | 700 | 15 a 17 px |
| Ayuda | normal | 100 % | 400 | 13 a 14 px |

- Títulos en minúscula con mayúscula inicial. **Nada en MAYÚSCULAS sostenidas.** (TeamSnap usa mayúsculas para la portada; en una herramienta de todos los días cansan, así que se toma el ancho y no las mayúsculas.)
- Toda cifra de plata va con números tabulares, para que las columnas alineen.
- Formatos: `Gs. 200.000`, `05/11/2026`, "Noviembre 2026", `0981 123 456`. En gráficos, `21 M` y `850 mil`.
- Líneas de texto de 68 caracteres como máximo.

---

## 5. Forma, espacio y sombras

| Pieza | Radio |
|---|---|
| Botones y campos | 12 px |
| Tarjetas | 16 px |
| Diálogos y hojas | 24 px |
| Etiquetas y contadores | Píldora |
| Foto en las filas | Redonda, 36 px (64 px en la ficha) |

| Sombra | Valor | Dónde |
|---|---|---|
| `raise` | `0 1px 2px` y `0 2px 10px -2px`, noche al 5–6 % | Tarjetas de día: apenas se despegan |
| `float` | `0 24px 60px -16px`, noche al 45 % | Diálogos y avisos |

Espaciado en múltiplos de 4. Ancho máximo del contenido: 1160 px en administración y 672 px en el portal. Todo se alinea a la izquierda.

---

## 6. Botones

Componentes: `Button`, `ButtonLink`, `IconButton` y `WhatsAppLink`.

| Variante | Aspecto | Cuándo |
|---|---|---|
| `primary` | Azul `brand-600` con texto blanco | La acción principal. **Una por superficie** |
| `secondary` | Blanco con borde de 1,5 px | Alternativas y "Cancelar" |
| `ghost` | Solo texto azul | Acciones menores dentro de una fila |
| `success` | Verde | Confirmar pago, cobrar, WhatsApp |
| `danger` | Rojo | Borrar, rechazar, dar de baja. Solo en el paso final de confirmar |

| Tamaño | Alto | Uso |
|---|---|---|
| `sm` | 36 px | Dentro de filas y encabezados de sección |
| `md` | 44 px | El de siempre |
| `lg` | 54 px | Acción principal en celular, a todo el ancho (`block`) |

- **Al apretar se hunden:** `scale(0.97)` en 160 ms con `--ease-out`. Es la confirmación de que la interfaz escuchó.
- **Borde físico** en los sólidos: un brillo de 1 px arriba y una sombra interna de 2 px abajo.
- **Cargando:** el ícono cambia por un indicador que gira rápido; el texto se queda.
- **Deshabilitado:** 45 % de opacidad, y al lado se explica por qué ("Falta subir el comprobante").
- El efecto al pasar el mouse solo existe en dispositivos con mouse (Tailwind 4 ya lo limita así).
- **El texto dice lo que pasa**, y el aviso repite la palabra: el botón "Confirmar pago" termina en el aviso "Pago confirmado".

---

## 7. Componentes

| Componente | Para qué | Reglas |
|---|---|---|
| `SummaryCard` + `SummaryStat` | El resumen | Uno por pantalla. La cifra grande va con `Money size="xl"` |
| `StudentRow` | Un chico en una lista | Siempre igual en todos lados. Va dentro de `<ul className="divide-y divide-line">` |
| `Money` | Cifra con "Gs." chico | Hereda el color del contenedor |
| `ReceiptRow` | Fila de recibo | Para cualquier detalle de plata con total |
| `PageHeader` | Título, descripción y acciones | Un `h1` por pantalla |
| `Section` / `Card` | Bloques de día | `flush` para listas que llegan al borde |
| `Tabs` | Filtrar una lista | El fondo de la pestaña activa se desliza |
| `Badge` y variantes | Estados | Punto de color más texto |
| `Field` + `Input`, `Select`, `Textarea`, `MoneyInput` | Formularios | Etiqueta arriba, ayuda abajo, error que dice cómo arreglarlo |
| `FilePicker` | Subir una foto o un PDF | Área grande para el dedo, con vista previa |
| `Dialog`, `ConfirmDialog` | Acciones en contexto | En celular es una hoja con asa; en escritorio va centrado |
| `SkeletonRows`, `Skeleton` | Carga | La forma del contenido mientras llega, no "Cargando…" |
| `EmptyState`, `ErrorState` | Sin datos o con error | Dicen qué falta y ofrecen el siguiente paso |
| `useToast` | Confirmar que algo salió bien | Una frase. Los errores de formulario van dentro del formulario |

### Estados (texto y color fijos, en `src/lib/labels.ts`)

| Cuota | | Pago | | Documento | |
|---|---|---|---|---|---|
| Pagada | verde | Por verificar | ámbar | Pendiente | gris |
| Pago parcial | azul | Confirmado | verde | En revisión | ámbar |
| En revisión | ámbar | Rechazado | rojo | Completo | verde |
| Pendiente | gris | | | Hay que actualizar | rojo |
| Vencida | rojo | | | | |
| Exonerada | gris | | | | |

---

## 8. Gráficos (skill dataviz)

- **Cobrado por mes** (resumen del panel): columnas de una sola serie sobre blanco. Barras de 24 px como máximo, con punta redondeada de 4 px y base recta, y una sola línea de base. Los meses anteriores van en `brand-300` y el mes actual en `brand-600`, que es el único con el valor escrito. La validación pasó todo salvo el contraste de `brand-300` (2:1), compensado con el tooltip, la tabla oculta y la etiqueta del mes actual. Cada barra muestra su tooltip al pasar o enfocarla, y hay una tabla oculta para lectores de pantalla. No hay un segundo eje.
- **Cuotas del mes**: barra segmentada sobre el día, con 2 px de separación y en este orden fijo: pagadas, parcial, en revisión, pendientes, vencidas. La leyenda está siempre visible, con nombre, cantidad y porcentaje.
- **Validación de colores** (`validate_palette.js`, modo claro, fondo blanco): CVD aprobado (el peor par, gris y ámbar, da ΔE 16,8) y visión normal aprobada (ΔE 17,6). Hay dos avisos aceptados a propósito:
  - El gris de "Pendientes" no tiene croma porque es un estado neutro.
  - El ámbar y el gris quedan por debajo de 3:1 contra el blanco. Por eso la leyenda va siempre con texto.

---

## 9. Movimiento (emil-design-eng)

**Primero se decide si algo se anima.** Lo que se usa decenas de veces por día no se anima; lo ocasional lleva una animación estándar; lo raro puede deleitar.

| Qué | Frecuencia | Movimiento | Curva y duración |
|---|---|---|---|
| Botones y todo lo que se toca | Constante | Se hunde a `scale(0.97)` | `--ease-out`, 160 ms |
| Menú lateral y barra inferior de administración | Constante | **Nada**, solo cambia el color | 150 ms |
| Barra inferior del portal | Pocas veces al mes | La píldora noche se desliza a la sección tocada | `--ease-in-out`, 300 ms |
| Cambio de pantalla en el portal | Pocas veces al mes | La pantalla nueva entra con un fundido y sube 8 px | `--ease-out`, 280 ms |
| Hoja en celular, al arrastrarla | Ocasional | Sigue al dedo; si se suelta lejos (más de 120 px) o rápido, se va hacia abajo; si no, vuelve | `--ease-drawer`, 320 ms |
| Deslizar para actualizar (app instalada) | Ocasional | El círculo baja con resistencia y gira; al soltar pasado el umbral, gira mientras actualiza | `--ease-drawer`, 320 ms |
| Aviso "Sin conexión" | Raro | Baja desde arriba | `--ease-out`, 320 ms |
| Indicador de pestañas | Frecuente | Se desliza a la pestaña nueva | `--ease-in-out`, 260 ms |
| Diálogo en celular | Ocasional | Sube desde abajo, como un cajón | `--ease-drawer` (iOS), 420 ms |
| Diálogo en escritorio | Ocasional | De `scale(0.96)` y transparente a normal, desde el centro | `--ease-out`, 220 ms |
| Avisos | Ocasional | Suben desde abajo; si llegan varios, se reacomodan | `ease`, 400 ms (como Sonner) |
| Barras del gráfico | Una vez por carga | Crecen desde la base con retardos que se achican: 0, 45, 80, 110, 135 y 155 ms | `--ease-out`, 520 ms |
| Entrada del portal | Pocas veces al mes | Saludo y resumen primero (sube 14 px); a los 90 ms, la lista de hijos como una sola pieza (sube 8 px) | `--ease-out`, 460 y 360 ms |
| Esqueletos de carga | Mientras carga | Brillo que recorre la forma | lineal, 1,4 s |

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);     /* entra o responde */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1); /* se mueve en pantalla */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* hoja que sube */
```

Reglas:

- Nada aparece desde `scale(0)`: lo mínimo es 0.95 con opacidad.
- Nunca `ease-in` en la interfaz, y nunca `transition: all`: siempre se nombran las propiedades.
- Solo se animan `transform`, `translate`, `scale` y `opacity`. La excepción es el ancho del indicador de pestañas, que es chico.
- Hay una sola entrada por contenedor: si el resumen entra, su contenido ya está adentro.
- Mientras algo se anima, todo se puede tocar igual.
- Con **reducir movimiento** desaparece el desplazamiento y queda solo la opacidad. Los esqueletos dejan de brillar y el celular no vibra.

---

## 9 bis. App en el celular (PWA)

La app se instala en el celular desde el navegador y se abre desde el ícono, a pantalla completa. Las familias la usan casi siempre así, con una mano y muchas veces con mala señal.

| Tema | Decisión |
|---|---|
| Ícono | El escudo sobre fondo noche (`maskable`), para que Android lo recorte en círculo o en gota sin cortar el escudo. En iPhone, `apple-touch-icon` de 180 px |
| Arranque | Android arma la pantalla de inicio con el fondo noche y el ícono. En iPhone hay 26 pantallas propias (`public/splash/`), una por modelo y orientación |
| Barra de estado | Noche. En iPhone es transparente (`black-translucent`): una franja noche fija ocupa la zona del notch y los encabezados empiezan debajo (`.pt-safe`) |
| Zonas seguras | Encabezados con `.pt-safe`, barras inferiores con `.safe-bottom`, costados con `max(1rem, env(safe-area-inset-left))` para el iPhone en horizontal |
| Instalación | No se muestra la barrita automática de Chrome. En el inicio del portal hay una tarjeta "Instalá la app" (se puede posponer 30 días) y en el ingreso un enlace chico. Android: un toque. iPhone: guía de tres pasos. Dentro de Instagram o Facebook: "Copiar enlace" para abrirlo en el navegador |
| Sin conexión | La app abre igual: el código, los estilos y las fuentes quedan guardados en el celular. Los **datos no se guardan** (son de las familias): una franja avisa "Sin conexión" y, al volver la señal, todo se actualiza solo |
| Versiones nuevas | Nunca se recarga sola. Aparece "Hay una versión nueva de la app" con un botón Actualizar. Se busca cada hora y al volver a la app |
| Gestos | Deslizar hacia abajo para actualizar (solo en la app instalada, porque el navegador ya tiene el suyo). Las hojas se bajan con el dedo desde el asa o el título |
| Vibración | Corta, solo al confirmar algo importante (pago informado, hijo vinculado). Solo en Android: Safari no lo permite |
| Teclado | Cédula con teclado numérico. En pantallas táctiles los campos quedan en 16 px, para que el iPhone no haga zoom (15 px solo con mouse) |
| Letra del celular | Todos los tamaños de letra están en `rem` y la página declara `<meta name="text-scale">`: si la familia agranda la letra del celular, la app la agranda. Montos y nombres bajan de renglón antes de pisarse |
| Zonas táctiles | 44 px como mínimo en pantallas táctiles: `Button size="sm"`, `IconButton` y las pestañas crecen solos con `pointer-coarse` |
| Sin señal al abrir | Si hay sesión guardada y no hay señal, se ve "Sin conexión" con Reintentar, y se carga sola al volver. Nunca se pide cerrar sesión por falta de señal |
| Celular acostado | La administración usa el diseño de escritorio solo con pantalla ancha **y** alta (variante `desk`); un celular acostado sigue con la barra inferior |
| Diálogos largos | Los botones de los formularios en diálogos quedan pegados abajo (`DialogActions` es `sticky`): "Confirmar" siempre a la vista |
| Arranque lento | `index.html` ya trae el escudo sobre noche dentro de `#root`: con 3G no se ve una pantalla vacía mientras baja el código |


## 10. Estructura de las pantallas

### Administración, escritorio

```
════════════════════════════════════════════════════════════════  cinta
┌────────────┐  Panel                       [Registrar pago] [Nuevo alumno]
│ [escudo]   │  Hoy es 15 de noviembre.
│ CERSAP     │  ╔════════════════════════════════════════════════════╗
│            │  ║ Falta cobrar                 Cobrado por mes        ║
│ Personas   │  ║ Gs. 8.450.000                ▆ ▇ ▆ █ ▇ ▅           ║ ← resumen (tarjeta blanca)
│ ▎Panel     │  ║ ─────────────────           Jun ... Nov            ║
│  Alumnos   │  ║ Vencido  Cobrado  Activos  Familias                 ║
│  Familias  │  ╚════════════════════════════════════════════════════╝
│ Plata      │  ┌ Cuotas de noviembre ──────┐ ┌ Para hacer ──────────┐
│  Cuotas    │  │ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ estados  │ │ 4  pagos por verificar│
│  Pagos   4 │  │ leyenda con cantidades    │ │ 2  familiares esperan │
│  Facturas  │  └───────────────────────────┘ └──────────────────────┘
│ Portal     │  ┌ Cumplen años en noviembre ────────────────────────┐
│  Accesos 2 │  │ (AR) Ana Benítez Rojas, Fútbol   Cumple 11 el 22 ›│
│ Config.    │
│ [cuenta]   │
└────────────┘   ← menú noche de 256 px
```

### Administración, celular

Encabezado noche con el escudo, contenido en una columna y **barra inferior noche** con Panel, Alumnos, Cuotas, Pagos y Más.

### Portal de familias (siempre una columna)

```
══════════════════════════  cinta
[escudo] Portal de familias   ← noche
Hola, Marta
╔════════════════════════╗
║ Te falta pagar         ║
║ Gs. 550.000            ║  ← resumen (tarjeta blanca, cifra grande)
║ 3 cuotas, 2 vencieron  ║
║ [ Informar un pago ]   ║  ← botón azul, todo el ancho
╚════════════════════════╝
Tus hijos en el centro   + Sumar otro
┌────────────────────────┐
│ (AR) Ana Benítez Rojas  Gs. 400.000 │  ← filas de 64 px
│      Fútbol, 11 años    por pagar   │
│────────────────────────│
│ (MR) Mateo Benítez R.   Al día      │
└────────────────────────┘
[ Escribir a administración ]
 Inicio  Cuotas  Pagos  Facturas  ← barra inferior, el activo en píldora noche
```

### Ingreso y vinculación

- **Escritorio:** pantalla dividida. A la izquierda, la cancha de noche con el escudo grande, "Centro de Entrenamiento" y las disciplinas. A la derecha, una sola cosa para hacer.
- **Celular:** arriba, la noche con el escudo; la tarjeta sube por encima como una hoja.

---

## 11. Redacción

- **Voseo y trato cercano:** "Entrá", "Subí", "Te falta pagar", "Estás al día".
- **Nombres de la gente, no del sistema:** Familia, Cuotas, Accesos; no "entidades", "cargos" ni "vinculaciones".
- **Los errores dicen qué pasó y qué hacer.** Nunca dicen solo "Error" y nunca piden perdón.
- **Las pantallas vacías invitan a actuar:** "Todavía no hay alumnos. Empezá cargando la ficha de un alumno."
- **Los datos se unen con comas**, no con puntos medios: "11 años, Fútbol".
- **Los números mandan:** "4 pagos por verificar", no "Tenés pagos pendientes".

---

## 12. Accesibilidad (piso mínimo)

- Contraste AA en todo texto, también sobre la noche. El color nunca es el único indicador.
- Todo se usa con teclado y el foco siempre se ve (anillo azul de 3 px).
- Cada campo tiene su etiqueta visible. Los botones de solo ícono llevan `aria-label`. Hay un solo `h1` por pantalla.
- En celular, los campos miden 16 px para que iOS no haga zoom.
- En el portal, todo lo que se toca mide 40 px o más.
- Los gráficos tienen nombre accesible, tooltip con teclado y una tabla oculta.

Las pruebas de Playwright revisan todo esto automáticamente (ver el README).

---

## 13. Privacidad en la interfaz

- El portal **nunca muestra** cédulas, documentos, ficha médica, observaciones, motivos de baja ni notas internas. La base no se los entrega.
- Documentos y comprobantes se abren con enlaces que vencen en minutos.
- Mientras un pedido de acceso está pendiente, el familiar no ve ni el nombre de la familia.

---

## 14. Lo que NO se hace

- Más de una cifra grande por pantalla, bloques oscuros en el contenido o la cancha dibujada fuera del ingreso.
- Tarjetas sueltas por persona (carnets), degradés, marcas de agua o números gigantes de adorno.
- Más de un botón principal sólido por superficie.
- Sombras negras o grises: si hay sombra, va teñida de noche y solo en lo que flota.
- Mayúsculas sostenidas, o etiquetitas en mayúsculas arriba de los títulos.
- Animar el menú, las filas de una lista o cualquier cosa que se use todo el día.
- Un color nuevo "porque queda lindo". Si hace falta, se agrega acá primero con su significado y se valida.
- Copiar logos, ilustraciones, tipografías o textos de las referencias.

---

## 15. Lista de control para una pantalla nueva

1. ¿Qué pregunta contesta? Escribila en una línea.
2. ¿Cuál es la cifra que importa, si hace falta un resumen? ¿Cuál es el botón principal?
3. ¿Se entiende en un celular de 360 px, usado con una mano?
4. ¿Qué se ve mientras carga (esqueleto), cuando no hay datos y cuando falla?
5. ¿Cada botón dice lo que hace, y el aviso usa la misma palabra?
6. ¿Algo se anima? ¿Pasa la tabla de frecuencia de la sección 9?
7. ¿Usa solo componentes de `src/components/ui`? Si falta uno, se agrega ahí y en la guía de estilo.
8. Si es del portal: ¿muestra algo que una familia no debería ver?
9. ¿Pasan las pruebas de Playwright en escritorio y en celular?

---

## 16. Prompt corto (para pegar en una IA)

> Diseñá una pantalla para el sistema de CERSAP, un centro de entrenamiento multideporte para chicos en Alto Paraná, Paraguay. El estilo es claro, minimalista y compacto. Solo el menú lateral y los encabezados del celular van en azul noche `#0A1F35`. Cada pantalla tiene como mucho un "resumen": una tarjeta blanca con la cifra que importa en grande (52 px) y sus datos chicos. Sin bloques oscuros, degradés ni dibujos de fondo en el contenido; las personas y los registros van en filas de 64 px (foto chica redonda, nombre, una línea de datos y el estado a la derecha) dentro de una tarjeta: fondo `#EDF2F7` y tarjetas blancas de radio 16 px con borde `#DCE4EC` y una sombra mínima teñida de noche. Una franja roja, blanca y azul de 4 px va solo en el borde superior. La tipografía es Archivo variable: títulos al 74 % de ancho y peso 800, cifras como dorsal de camiseta al 64 % de ancho y peso 850, y texto de 15 px. Un solo botón principal por superficie, azul `#0073B8`. Verde `#12814A` para pagado, rojo `#D91F26` para vencido y ámbar `#D98B0B` para en revisión. Nunca el color solo. La plata se muestra como un recibo: etiqueta apagada a la izquierda, monto tabular a la derecha y total separado. Los botones miden 44 px (54 px y todo el ancho en celular), tienen radio de 12 px y se hunden a `scale(0.97)` en 160 ms al apretarlos. El movimiento sigue a Emil Kowalski: nada que se use todo el día se anima; los diálogos suben como cajón en celular; nunca `ease-in` ni `scale(0)`; con "reducir movimiento" queda solo la opacidad. Escribí en castellano paraguayo con voseo y frases cortas, sin mayúsculas sostenidas. Pensá primero en un celular de 360 px usado con una mano. Mostrá esqueletos mientras carga, estados vacíos que invitan a actuar y errores que dicen cómo resolverse. La pantalla tiene que contestar esta pregunta: [ESCRIBIR LA PREGUNTA]. Contenido: [DATOS Y ACCIONES].
