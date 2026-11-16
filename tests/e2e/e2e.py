"""
Pruebas de punta a punta con Playwright, en escritorio y celular.
Usan la red simulada de mock.py: no tocan la base real ni Google.

Cubre: navegación, botones principales, formularios, diálogos, permisos por rol,
consola sin errores, accesibilidad básica y movimiento reducido.
"""
import os
import pathlib
import json
import struct
import sys
import zlib

from playwright.sync_api import expect, sync_playwright

import mock
from mock import ADMIN, F1, SUPA, TUTOR, make_handler, session, sid

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'
OUT = str(pathlib.Path(__file__).with_name('capturas'))
os.makedirs(OUT, exist_ok=True)
DESK = {'width': 1360, 'height': 900}
MOB = {'width': 390, 'height': 844}

results = []


def png_bytes():
    """Una imagen PNG chica y válida, para simular la foto del comprobante."""
    width = height = 4
    raw = b''.join(b'\x00' + b'\xff\x00\x00' * width for _ in range(height))
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')


class Session:
    def __init__(self, browser, viewport, who=None, portal_state=None, link_result='pending', reduced=False):
        mobile = viewport['width'] < 500
        self.ctx = browser.new_context(
            viewport=viewport, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile,
            locale='es-PY', timezone_id='America/Asuncion', reduced_motion='reduce' if reduced else 'no-preference',
        )
        self.page = self.ctx.new_page()
        self.log, self.errors, self.authorize = [], [], []
        self.page.on('console', lambda m: self.errors.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        if who:
            self.page.route(SUPA + '/**', make_handler(who, portal_state or {}, self.log, link_result))
            self.page.add_init_script(f"window.localStorage.setItem('sb-aynronszcpwepvkcyrbu-auth-token', {json.dumps(json.dumps(session(*who)))});")
        else:
            def anon(route):
                if '/auth/v1/authorize' in route.request.url:
                    self.authorize.append(route.request.url)
                    return route.fulfill(status=200, content_type='text/html', body='<h1>Google</h1>')
                return route.fulfill(status=200, content_type='application/json', body='{}')
            self.page.route(SUPA + '/**', anon)

    def go(self, path):
        self.page.goto(BASE + path, wait_until='networkidle')
        self.page.wait_for_timeout(250)

    def calls(self, fragment):
        return [entry for entry in self.log if fragment in entry['path']]

    def close(self):
        self.ctx.close()


def check(name, device, fn, *args):
    try:
        detail = fn(*args) or ''
        results.append((device, name, True, detail))
        print(f'  ✓ [{device}] {name} {detail}')
    except Exception as error:  # noqa: BLE001
        message = str(error).split('\n')[0][:220]
        results.append((device, name, False, message))
        print(f'  ✗ [{device}] {name}: {message}')


# --------------------------------------------------------------------------- pruebas

def t_login(browser, vp, device):
    s = Session(browser, vp)
    s.go('/ingresar')
    expect(s.page.get_by_role('heading', name='Entrá con tu cuenta de Google')).to_be_visible()
    s.page.get_by_role('button', name='Entrar con Google').click()
    s.page.wait_for_timeout(800)
    assert s.authorize, 'el botón no llevó a Google'
    url = s.authorize[0]
    assert 'provider=google' in url and 'code_challenge=' in url and 'prompt=select_account' in url, url
    errors = s.errors
    s.close()
    assert not errors, errors
    return '(PKCE y elegir cuenta)'


def t_protected_redirect(browser, vp, device):
    s = Session(browser, vp)
    s.go('/admin')
    assert s.page.url.endswith('/ingresar'), s.page.url
    s.close()


def t_admin_nav(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin')
    targets = [('Alumnos', '/admin/alumnos', 'Alumnos'), ('Cuotas', '/admin/cuotas', 'Cuotas'), ('Pagos', '/admin/pagos', 'Pagos'), ('Panel', '/admin', 'Panel')]
    if device == 'escritorio':
        targets += [('Familias', '/admin/familias', 'Familias'), ('Facturas', '/admin/facturas', 'Facturas'), ('Accesos', '/admin/accesos', 'Accesos al portal'), ('Configuración', '/admin/configuracion', 'Configuración')]
    nav = s.page.get_by_role('navigation', name='Secciones')
    for label, path, heading in targets:
        nav.get_by_role('link', name=label, exact=False).first.click()
        expect(s.page).to_have_url(BASE + path)
        expect(s.page.get_by_role('heading', level=1)).to_have_text(heading)
    if device == 'celular':
        for label, path, heading in [('Familias', '/admin/familias', 'Familias'), ('Configuración', '/admin/configuracion', 'Configuración')]:
            s.page.get_by_role('button', name='Más').click()
            dialog = s.page.get_by_role('dialog')
            expect(dialog).to_be_visible()
            dialog.get_by_role('button', name=label).click()
            expect(s.page).to_have_url(BASE + path)
            expect(s.page.get_by_role('heading', level=1)).to_have_text(heading)
    errors = s.errors
    s.close()
    assert not errors, errors
    return f'({len(targets) + (2 if device == "celular" else 0)} secciones)'


def t_dashboard_ctas(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin')
    expect(s.page.get_by_text('Falta cobrar')).to_be_visible()
    expect(s.page.get_by_role('img', name='Cobrado por mes, últimos 6 meses')).to_be_visible()
    bars = s.page.get_by_role('button', name='Noviembre 2026: Gs. 21.300.000')
    expect(bars).to_have_count(1)
    s.page.get_by_role('link', name='Registrar pago').click()
    expect(s.page.get_by_role('heading', name='Registrar pago', level=2)).to_be_visible()
    s.page.keyboard.press('Escape')
    expect(s.page.get_by_role('heading', name='Registrar pago', level=2)).to_be_hidden()
    s.go('/admin')
    s.page.get_by_role('link', name='Nuevo alumno').first.click()
    expect(s.page).to_have_url(BASE + '/admin/alumnos/nuevo')
    s.close()
    return '(gráfico, Registrar pago, Escape cierra, Nuevo alumno)'


def t_new_student(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin/alumnos/nuevo')
    submit = s.page.get_by_role('button', name='Cargar alumno')
    expect(submit).to_be_disabled()
    s.page.get_by_label('Nombres').fill('Juan Ignacio')
    s.page.get_by_label('Apellidos').fill('Duarte')
    s.page.get_by_label('Cédula de identidad').fill('12')
    expect(s.page.get_by_text('Tiene que tener entre 5 y 12 números o letras.')).to_be_visible()
    s.page.get_by_label('Cédula de identidad').fill('6.234.567')
    s.page.get_by_label('Fecha de nacimiento').fill('2016-05-20')
    s.page.get_by_label('Familia', exact=True).select_option(label='Crear una familia nueva')
    expect(s.page.get_by_label('Nombre de la familia nueva')).to_have_value('Familia Duarte')
    expect(submit).to_be_enabled()
    submit.click()
    s.page.wait_for_url('**/admin/alumnos/a0000009-*')
    families = s.calls('/rest/v1/families')
    students = s.calls('/rest/v1/students')
    enrollment = s.calls('/rpc/create_enrollment_fee')
    assert families and families[0]['body'].get('name') == 'Familia Duarte', families
    body = students[0]['body']
    assert body['ci'] == '6234567' and body['family_id'] == 'f0000009-0000-4000-8000-000000000009', body
    assert enrollment, 'no cargó la matrícula'
    s.close()
    return '(validación, familia nueva, cédula normalizada, matrícula)'


def t_review_payment(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin/pagos')
    s.page.get_by_text('Familia Giménez').first.click()
    dialog = s.page.get_by_role('dialog')
    expect(dialog.get_by_role('heading', name='Verificar pago')).to_be_visible()
    dialog.get_by_role('button', name='Confirmar pago').click()
    expect(s.page.get_by_role('status').filter(has_text='Pago confirmado')).to_be_visible()
    calls = s.calls('/rpc/review_payment')
    assert calls and calls[0]['body']['p_approve'] is True, calls
    s.close()
    return '(confirmar y aviso)'


def t_reject_payment(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin/pagos')
    s.page.get_by_text('Familia Giménez').first.click()
    dialog = s.page.get_by_role('dialog')
    dialog.get_by_role('button', name='Rechazar').click()
    reject = dialog.get_by_role('button', name='Rechazar pago')
    expect(reject).to_be_disabled()
    dialog.get_by_label('Motivo del rechazo').fill('El monto no coincide con el extracto')
    reject.click()
    expect(s.page.get_by_role('status').filter(has_text='Pago rechazado')).to_be_visible()
    calls = s.calls('/rpc/review_payment')
    assert calls and calls[0]['body']['p_approve'] is False and 'extracto' in calls[0]['body']['p_reason'], calls
    s.close()
    return '(motivo obligatorio)'


def t_register_payment(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin/pagos?registrar=1')
    dialog = s.page.get_by_role('dialog')
    dialog.get_by_label('Familia').select_option(label='Familia Benítez Rojas')
    dialog.get_by_role('checkbox').first.check()
    dialog.get_by_role('button', name='Registrar pago').click()
    expect(s.page.get_by_role('status').filter(has_text='Pago registrado')).to_be_visible()
    calls = s.calls('/rpc/register_payment')
    assert calls and len(calls[0]['body']['p_items']) == 1 and calls[0]['body']['p_method'] == 'cash', calls
    s.close()
    return '(efectivo, 1 cuota)'


def t_students_views(browser, vp, device):
    s = Session(browser, vp, ADMIN)
    s.go('/admin/alumnos')
    s.page.get_by_placeholder('Buscar por nombre, cédula o familia').fill('gimenez')
    expect(s.page.get_by_text('Giménez, Lucía')).to_be_visible()
    expect(s.page.get_by_text('Benítez Rojas, Ana')).to_be_hidden()
    s.page.get_by_placeholder('Buscar por nombre, cédula o familia').fill('')
    rows = s.page.locator('main ul > li a[href^="/admin/alumnos/"]')
    count = rows.count()
    heights = rows.evaluate_all('els => els.map(e => Math.round(e.getBoundingClientRect().height))')
    rows.first.click()
    expect(s.page).to_have_url(BASE + '/admin/alumnos/' + sid(1))
    s.close()
    assert max(heights) <= 80, heights
    return f'(búsqueda sin tildes, {count} filas de {min(heights)}-{max(heights)} px)'


def t_link_child(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': False}, link_result='not_found')
    s.go('/vincular')
    validate = s.page.get_by_role('button', name='Validar')
    expect(validate).to_be_disabled()
    s.page.get_by_label('Cédula del alumno').fill('6123456')
    s.page.get_by_label('Fecha de nacimiento del alumno').fill('2015-03-10')
    validate.click()
    expect(s.page.get_by_text('No encontramos a nadie con esa cédula')).to_be_visible()
    calls = s.calls('/rpc/request_family_link')
    assert calls and calls[0]['body'] == {'p_ci': '6123456', 'p_birth_date': '2015-03-10'}, calls
    s.close()

    s = Session(browser, vp, TUTOR, {'linked': False}, link_result='pending')
    s.go('/vincular')
    s.page.get_by_label('Cédula del alumno').fill('6123456')
    s.page.get_by_label('Fecha de nacimiento del alumno').fill('2015-03-10')
    s.page.get_by_role('button', name='Validar').click()
    s.page.wait_for_timeout(400)
    s.close()
    return '(no encontrado y pendiente)'


def t_portal_pay(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': True})
    s.go('/portal')
    expect(s.page.get_by_text('Te falta pagar')).to_be_visible()
    expect(s.page.get_by_role('heading', name='Tus hijos en el centro')).to_be_visible()
    expect(s.page.get_by_text('Ana Benítez Rojas')).to_be_visible()
    s.page.get_by_role('link', name='Informar un pago').click()
    expect(s.page).to_have_url(BASE + '/portal/pagar')
    submit = s.page.get_by_role('button', name='Informar pago')
    expect(submit).to_be_disabled()
    boxes = s.page.get_by_role('checkbox')
    checked = [boxes.nth(i).is_checked() for i in range(boxes.count())]
    assert checked == [True, True, False], f'selección inicial {checked}'
    s.page.locator('input[type=file]').set_input_files(files=[{'name': 'comprobante.png', 'mimeType': 'image/png', 'buffer': png_bytes()}])
    expect(s.page.get_by_text('comprobante.png')).to_be_visible()
    expect(submit).to_be_enabled()
    submit.click()
    expect(s.page).to_have_url(BASE + '/portal/pagos')
    expect(s.page.get_by_role('status').filter(has_text='Pago informado')).to_be_visible()
    uploads = [e for e in s.log if e['path'].startswith('/storage/v1/object/payment-receipts/')]
    rpc = s.calls('/rpc/portal_submit_payment')
    assert uploads and uploads[0]['path'].split('/payment-receipts/')[1].startswith(F1 + '/'), uploads
    assert rpc and len(rpc[0]['body']['p_fee_ids']) == 2 and rpc[0]['body']['p_receipt_path'].startswith(F1 + '/'), rpc
    errors = s.errors
    s.close()
    assert not errors, errors
    return '(2 cuotas vencidas marcadas, diciembre no, comprobante en la carpeta de la familia)'


def t_portal_nav(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': True})
    s.go('/portal')
    nav = s.page.get_by_role('navigation', name='Secciones del portal')
    for label, path, heading in [('Cuotas', '/portal/cuotas', 'Cuotas'), ('Pagos', '/portal/pagos', 'Pagos'), ('Facturas', '/portal/facturas', 'Facturas'), ('Inicio', '/portal', 'Hola, Marta')]:
        nav.get_by_role('link', name=label).click()
        expect(s.page).to_have_url(BASE + path)
        expect(s.page.get_by_role('heading', level=1)).to_have_text(heading)
    s.close()


def t_tutor_blocked(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': True})
    s.go('/admin/alumnos')
    assert s.page.url.endswith('/portal'), s.page.url
    admin_calls = [e for e in s.log if 'students' in e['path']]
    s.close()
    assert not admin_calls
    return '(un tutor que escribe /admin vuelve a su portal)'


def t_a11y(browser, vp, device):
    problems = []
    for who, state, path in [(ADMIN, None, '/admin'), (ADMIN, None, '/admin/alumnos'), (TUTOR, {'linked': True}, '/portal'), (TUTOR, {'linked': True}, '/portal/pagar'), (None, None, '/ingresar')]:
        s = Session(browser, vp, who, state)
        s.go(path)
        found = s.page.evaluate("""() => {
          const out = [];
          for (const el of document.querySelectorAll('button, a[href]')) {
            const name = (el.getAttribute('aria-label') || el.innerText || el.title || '').trim();
            if (!name && el.offsetParent !== null) out.push(el.outerHTML.slice(0, 80));
          }
          for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) out.push('img sin alt');
          for (const input of document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')) {
            const labelled = input.labels?.length || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
            if (!labelled) out.push('campo sin etiqueta: ' + input.outerHTML.slice(0, 80));
          }
          if (document.querySelectorAll('h1').length !== 1) out.push('h1: ' + document.querySelectorAll('h1').length);
          return out;
        }""")
        problems += [f'{path}: {p}' for p in found]
        s.close()
    assert not problems, problems[:6]
    return '(botones con nombre, imágenes con alt, campos con etiqueta, un h1)'


def t_small_targets(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': True})
    s.go('/portal')
    small = s.page.evaluate("""() => [...document.querySelectorAll('button, a[href], input[type=checkbox]')]
      .filter(el => el.offsetParent !== null)
      .map(el => { const r = el.getBoundingClientRect(); return { t: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) } })
      .filter(x => x.h < 40 && x.w < 300)""")
    s.close()
    assert not small, small
    return '(todo lo tocable del portal mide 40 px o más)'


def t_reduced_motion(browser, vp, device):
    s = Session(browser, vp, TUTOR, {'linked': True}, reduced=True)
    s.go('/portal')
    name = s.page.evaluate("getComputedStyle(document.querySelector('.entrar')).animationName")
    s.close()
    assert name == 'aparecer', name
    return '(sin desplazamiento, solo opacidad)'


def t_overflow(browser, vp, device):
    issues = []
    for who, state, path in [(ADMIN, None, '/admin'), (ADMIN, None, '/admin/cuotas'), (ADMIN, None, f'/admin/alumnos/{sid(1)}'), (TUTOR, {'linked': True}, '/portal'), (TUTOR, {'linked': True}, '/portal/pagar')]:
        s = Session(browser, vp, who, state)
        s.go(path)
        wide = s.page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
        if wide > 1:
            issues.append(f'{path}: {wide}px de desborde horizontal')
        s.close()
    assert not issues, issues
    return '(sin desborde horizontal)'


TESTS = [
    ('Ingreso con Google', t_login),
    ('Rutas protegidas sin sesión', t_protected_redirect),
    ('Navegación de administración', t_admin_nav),
    ('Panel: gráfico y botones', t_dashboard_ctas),
    ('Formulario de alumno nuevo', t_new_student),
    ('Verificar un pago', t_review_payment),
    ('Rechazar un pago', t_reject_payment),
    ('Registrar un pago en efectivo', t_register_payment),
    ('Alumnos: búsqueda y filas', t_students_views),
    ('Vincular hijo (cédula + nacimiento)', t_link_child),
    ('Portal: informar un pago', t_portal_pay),
    ('Portal: navegación', t_portal_nav),
    ('Tutor no entra a administración', t_tutor_blocked),
    ('Accesibilidad básica', t_a11y),
    ('Zonas táctiles del portal', t_small_targets),
    ('Movimiento reducido', t_reduced_motion),
    ('Sin desborde horizontal', t_overflow),
]

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_PATH') or None)
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    for device, vp in [('escritorio', DESK), ('celular', MOB)]:
        print(f'\n{device.upper()} {vp["width"]}x{vp["height"]}')
        for name, fn in TESTS:
            if only and not any(o.lower() in name.lower() for o in only):
                continue
            check(name, device, fn, browser, vp, device)
    browser.close()

passed = sum(1 for r in results if r[2])
print(f'\n{passed}/{len(results)} pruebas pasaron')
json.dump([{'dispositivo': d, 'prueba': n, 'ok': ok, 'detalle': det} for d, n, ok, det in results], open(pathlib.Path(OUT, 'resultado.json'), 'w'), ensure_ascii=False, indent=1)
