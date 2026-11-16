"""
Genera los íconos de la app y las pantallas de arranque de iPhone/iPad a partir
de public/escudo.png. Correr desde la raíz del proyecto:

    python3 scripts/generar-iconos.py

Escribe public/icons/*.png y public/splash/*.png, e imprime las etiquetas <link>
de las pantallas de arranque para pegar en index.html si cambia la lista.
Necesita Pillow (pip install pillow).
"""
from pathlib import Path

from PIL import Image, ImageDraw

NOCHE = (10, 31, 53, 255)
CINTA = [(239, 43, 45), (255, 255, 255), (0, 138, 212)]

# Ancho y alto en puntos CSS y escala de cada iPhone/iPad (vertical)
DISPOSITIVOS = [
    (320, 568, 2), (375, 667, 2), (414, 736, 3), (375, 812, 3), (414, 896, 2), (414, 896, 3),
    (390, 844, 3), (393, 852, 3), (428, 926, 3), (430, 932, 3), (402, 874, 3), (440, 956, 3), (420, 912, 3),
    (744, 1133, 2), (834, 1210, 2), (1032, 1376, 2), (768, 1024, 2), (810, 1080, 2), (820, 1180, 2), (834, 1112, 2), (834, 1194, 2), (1024, 1366, 2),
]


def sobre_fondo(escudo: Image.Image, lado: int, escala: float, fondo) -> Image.Image:
    lienzo = Image.new('RGBA', (lado, lado), fondo)
    medida = round(lado * escala)
    lienzo.alpha_composite(escudo.resize((medida, medida), Image.LANCZOS), ((lado - medida) // 2, (lado - medida) // 2))
    return lienzo


def liviano(imagen: Image.Image) -> Image.Image:
    """Paleta de 255 colores: el ícono pesa 4 a 5 veces menos y no se nota la diferencia."""
    return imagen.quantize(colors=255, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)


def pantalla_de_arranque(escudo: Image.Image, ancho: int, alto: int) -> Image.Image:
    imagen = Image.new('RGB', (ancho, alto), NOCHE[:3])
    dibujo = ImageDraw.Draw(imagen)
    franja = max(6, round(min(ancho, alto) * 0.008))
    tercio = ancho / 3
    for i, color in enumerate(CINTA):
        dibujo.rectangle([round(i * tercio), 0, round((i + 1) * tercio), franja], fill=color)
    medida = round(min(ancho, alto) * 0.34)
    chico = escudo.resize((medida, medida), Image.LANCZOS)
    imagen.paste(chico, ((ancho - medida) // 2, (alto - medida) // 2 - round(alto * 0.03)), chico)
    return imagen.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)


def main() -> None:
    raiz = Path('public')
    escudo = Image.open(raiz / 'escudo.png').convert('RGBA')
    (raiz / 'icons').mkdir(exist_ok=True)
    (raiz / 'splash').mkdir(exist_ok=True)

    for lado in (192, 512):
        liviano(sobre_fondo(escudo, lado, 0.94, (0, 0, 0, 0))).save(raiz / f'icons/icon-{lado}.png', optimize=True)
        # Maskable: el escudo dentro de la zona segura (círculo del 80 %)
        liviano(sobre_fondo(escudo, lado, 0.68, NOCHE)).save(raiz / f'icons/maskable-{lado}.png', optimize=True)
    # iPhone no admite transparencia en el ícono
    liviano(sobre_fondo(escudo, 180, 0.8, NOCHE).convert('RGB')).save(raiz / 'icons/apple-touch-icon.png', optimize=True)
    liviano(sobre_fondo(escudo, 96, 0.72, NOCHE)).save(raiz / 'icons/shortcut-96.png', optimize=True)

    enlaces = []
    for ancho_css, alto_css, escala in DISPOSITIVOS:
        for orientacion in ('portrait', 'landscape'):
            if orientacion == 'landscape' and ancho_css < 700:
                continue  # los teléfonos se usan en vertical
            ancho, alto = ancho_css * escala, alto_css * escala
            if orientacion == 'landscape':
                ancho, alto = alto, ancho
            nombre = f'apple-splash-{ancho}x{alto}.png'
            pantalla_de_arranque(escudo, ancho, alto).save(raiz / 'splash' / nombre, optimize=True)
            enlaces.append(
                f'    <link rel="apple-touch-startup-image" media="(device-width: {ancho_css}px) and '
                f'(device-height: {alto_css}px) and (-webkit-device-pixel-ratio: {escala}) and '
                f'(orientation: {orientacion})" href="/splash/{nombre}" />'
            )
    print('\n'.join(enlaces))


if __name__ == '__main__':
    main()
