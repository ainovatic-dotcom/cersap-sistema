import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Colores de la app instalada: la barra de estado y la pantalla de arranque van en noche,
// igual que los encabezados.
const NOCHE = '#0a1f35'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // La actualización la decide la persona: aparece un aviso "Hay una versión nueva".
      // Así nunca se recarga la página en medio de un pago.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: '/',
        name: 'CERSAP',
        short_name: 'CERSAP',
        description: 'Cuotas, pagos y facturas del Centro de Entrenamiento Región Sur, Alto Paraná.',
        lang: 'es-PY',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        background_color: NOCHE,
        theme_color: NOCHE,
        categories: ['sports', 'education', 'finance'],
        prefer_related_applications: false,
        // Si la app ya está abierta, un enlace la reutiliza en vez de abrir otra ventana
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Mantener apretado el ícono (Android) muestra estos accesos directos
        shortcuts: [
          {
            name: 'Informar un pago',
            short_name: 'Pagar',
            description: 'Subí el comprobante de una transferencia',
            url: '/portal/pagar',
            icons: [{ src: '/icons/shortcut-96.png', sizes: '96x96', type: 'image/png' }],
          },
          {
            name: 'Mis cuotas',
            short_name: 'Cuotas',
            description: 'Lo que vence y lo que ya pagaste',
            url: '/portal/cuotas',
            icons: [{ src: '/icons/shortcut-96.png', sizes: '96x96', type: 'image/png' }],
          },
        ],
        // Capturas para la ventana de instalación de Android
        screenshots: [
          {
            src: '/screenshots/portal-celular.png',
            sizes: '780x1688',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Inicio del portal de familias',
          },
          {
            src: '/screenshots/panel-escritorio.png',
            sizes: '1360x900',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Panel de administración',
          },
        ],
      },
      workbox: {
        // La "cáscara" de la app (código, estilos, fuentes, íconos) queda en el celular
        // y abre aunque no haya señal. Los datos NO se guardan: son de las familias.
        globPatterns: ['**/*.{js,css,html,woff2,png,webp,svg,ico,webmanifest}'],
        globIgnores: [
          'splash/**',
          'screenshots/**',
          // Lo que una familia no usa no se baja al instalar: administración se guarda la primera vez que se abre
          'assets/AdminRoutes-*.js',
          // Archivo trae variantes para otros alfabetos; el castellano usa solo la latina básica
          'assets/archivo-latin-ext-*.woff2',
          'assets/archivo-vietnamese-*.woff2',
          // Versiones grandes del escudo que la app ya no usa (quedan para compartir o imprimir)
          'escudo.png',
          'escudo-192.png',
        ],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Lo que no se guardó al instalar (administración, fuentes de otros alfabetos) se guarda
        // la primera vez que se usa. Supabase no pasa por acá: va siempre directo a la red.
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'cersap-assets', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    // El archivo de librerías pesa ~500 KiB a propósito (se baja una vez y queda guardado)
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Las librerías van en un archivo aparte que casi nunca cambia: después de cada
        // actualización el celular baja solo el código nuevo, no las ~450 KiB de React y Supabase.
        advancedChunks: {
          groups: [{ name: 'librerias', test: /node_modules[\\/](react|react-dom|scheduler|react-router|@tanstack|@supabase)[\\/]/ }],
        },
      },
    },
  },
})
