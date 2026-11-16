import os
import pathlib
from mock import *
from mock import make_handler, session
import json, sys
from playwright.sync_api import sync_playwright

def shoot(browser, name, path, who, viewport, portal_state=None, full=False, action=None):
    ctx = browser.new_context(viewport=viewport, device_scale_factor=2 if viewport['width'] < 500 else 1, locale='es-PY', timezone_id='America/Asuncion')
    page = ctx.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    if who:
        page.route(SUPA + '/**', make_handler(who, portal_state or {}))
        s = session(*who)
        page.add_init_script(f"window.localStorage.setItem('sb-aynronszcpwepvkcyrbu-auth-token', {json.dumps(json.dumps(s))});")
    else:
        page.route(SUPA + '/**', lambda r: r.fulfill(status=200, content_type='application/json', body='{}'))
    page.goto(BASE + path, wait_until='networkidle')
    page.wait_for_timeout(500)
    if action: action(page)
    page.screenshot(path=f'{OUT}/{name}.png', full_page=full)
    real = [e for e in errors if 'Failed to load resource' not in e]
    print(name, '->', page.url.replace(BASE, ''), ('ERRORES: ' + ' | '.join(real[:3])) if real else 'ok')
    ctx.close()

DESK = {'width': 1360, 'height': 900}
MOB = {'width': 390, 'height': 844}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_PATH') or None)
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    jobs = [
        ('01-ingresar-movil', '/ingresar', None, MOB, None, False, None),
        ('02-ingresar-escritorio', '/ingresar', None, DESK, None, False, None),
        ('03-panel', '/admin', ADMIN, DESK, None, False, None),
        ('04-panel-movil', '/admin', ADMIN, MOB, None, True, None),
        ('05-alumnos', '/admin/alumnos', ADMIN, DESK, None, False, None),
        ('06-alumno-ficha', f'/admin/alumnos/{sid(1)}', ADMIN, DESK, None, False, None),
        ('07-alumno-documentos', f'/admin/alumnos/{sid(1)}', ADMIN, DESK, None, False, lambda pg: (pg.get_by_role('tab', name='Documentos').click(), pg.wait_for_timeout(400))),
        ('08-cuotas', '/admin/cuotas', ADMIN, DESK, None, False, None),
        ('09-pagos-verificar', '/admin/pagos', ADMIN, DESK, None, False, lambda pg: (pg.get_by_text('Familia Giménez').first.click(), pg.wait_for_timeout(500))),
        ('10-registrar-pago-movil', '/admin/pagos?registrar=1', ADMIN, MOB, None, False, None),
        ('11-familia', f'/admin/familias/{F1}', ADMIN, DESK, None, True, None),
        ('12-accesos', '/admin/accesos', ADMIN, DESK, None, False, None),
        ('13-configuracion', '/admin/configuracion', ADMIN, DESK, None, True, None),
        ('14-guia-de-estilo', '/admin/guia-de-estilo', ADMIN, DESK, None, True, None),
        ('15-alumno-nuevo-movil', '/admin/alumnos/nuevo', ADMIN, MOB, None, True, None),
        ('20-vincular-movil', '/vincular', TUTOR, MOB, {'linked': False}, False, None),
        ('21-vincular-pendiente-movil', '/vincular', TUTOR, MOB, {'linked': False, 'pending': True}, False, None),
        ('22-portal-inicio-movil', '/portal', TUTOR, MOB, {'linked': True}, True, None),
        ('23-portal-cuotas-movil', '/portal/cuotas', TUTOR, MOB, {'linked': True}, True, None),
        ('24-portal-pagar-movil', '/portal/pagar', TUTOR, MOB, {'linked': True}, True, None),
        ('25-portal-pagos-movil', '/portal/pagos', TUTOR, MOB, {'linked': True}, False, None),
        ('26-tutor-intenta-admin', '/admin', TUTOR, MOB, {'linked': True}, False, None),
    ]
    for name, path, who, vp, st, full, act in jobs:
        if only and not any(name.startswith(o) for o in only): continue
        try:
            shoot(browser, name, path, who, vp, st, full, act)
        except Exception as e:
            print(name, 'FALLÓ:', str(e)[:200])
    browser.close()
