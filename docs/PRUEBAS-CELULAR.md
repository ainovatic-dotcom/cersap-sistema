# Pruebas de la app en celulares

## Lo que se probó con agentes (16/11/2026)

Tres agentes probaron la app en paralelo con Playwright y una base simulada:

| Agente | Equipos | Resultado |
|---|---|---|
| iPhone y iPad | SE, 13 mini, 15, 15 Pro Max, 15 acostado, iPad mini, iPad Pro 12,9 | 101 cargas. Sin desbordes ni errores. Encontró 6 problemas medios y 9 bajos, todos corregidos |
| Android | 320 px (celular viejo), Galaxy A 360, Pixel 7, S24 Ultra, celular acostado y tablet | 72 cargas más pruebas de letra grande, sin conexión, teclado y 3G lento. Encontró 1 problema alto y 9 medios, todos corregidos |
| Auditoría PWA | Chrome por CDP y Lighthouse | Instalable sin errores, aviso de actualización correcto, sin datos de familias en la caché. Lighthouse móvil: accesibilidad 100 y buenas prácticas 100 |

Lo que se corrigió a partir de esas pruebas:

- **Abrir la app sin señal.** Ya no pide cerrar sesión: muestra "Sin conexión" con Reintentar.
- **Franja de "sin conexión".** Va debajo del encabezado y no tapa botones.
- **Letra.** Está en `rem` y sigue el tamaño de letra del celular. Los montos bajan de renglón en vez de pisarse.
- **Zonas táctiles.** Miden 44 px en pantallas táctiles.
- **Celular acostado.** Usa el diseño de celular y respeta el notch.
- **Diálogos.** Los botones quedan siempre a la vista.
- **Escudo.** Está en WebP y se ve apenas abre la app.
- **Peso de la instalación.** Pasó de 1,4 MB a 0,9 MB, y las librerías van en un archivo aparte que casi no cambia.

Las pruebas automáticas quedaron en `tests/e2e/`: son 44, en escritorio y en celular, e incluyen 5 de la PWA.

## Lo que hay que probar en un teléfono real

Estas cosas no se pueden simular desde una computadora. Conviene probarlas una vez en un iPhone y en un Android barato.

**iPhone (Safari):**

1. Instalar con Compartir → Agregar a inicio. Con Safari en el diseño "compacto" (iOS 26), Compartir está dentro de "···".
2. Que se vea la pantalla de arranque con el escudo y que la barra de estado quede blanca sobre noche.
3. **Entrar con Google desde la app instalada** y confirmar que, al volver, la sesión queda dentro de la app.
4. Elegir la fecha de nacimiento en `/vincular` con la rueda de iOS.
5. Subir un comprobante desde la cámara, desde Fotos (HEIC) y en PDF desde Archivos.
6. Modo avión: que aparezca la franja "Sin conexión" y que la app abra igual.

**Android (Chrome):**

1. Que aparezca "Instalá la app en tu celular" y que **Instalar** abra el aviso de Chrome.
2. Mantener apretado el ícono instalado y revisar que aparezcan los atajos "Pagar" y "Cuotas".
3. Agrandar la letra en Ajustes y revisar que la app la siga sin que se pisen los textos.
4. Usar el botón "atrás" con una hoja abierta: tiene que cerrar la hoja, no salir de la app.
5. Entrar con Google desde la app instalada.
6. Abrir un enlace desde Instagram o Facebook y tocar "Copiar enlace".

**En los dos:**

- Después de una publicación nueva, tiene que aparecer "Hay una versión nueva de la app", y **Actualizar** tiene que cargarla.
