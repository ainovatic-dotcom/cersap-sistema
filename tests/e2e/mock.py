"""Datos y servidor simulado de Supabase para capturas y pruebas (no toca la base real)."""
import os
import pathlib
import base64, json, re, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173'
OUT = str(pathlib.Path(__file__).with_name('capturas'))
os.makedirs(OUT, exist_ok=True)
SUPA = 'https://aynronszcpwepvkcyrbu.supabase.co'

def b64(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')

def session(uid, email, name):
    exp = int(time.time()) + 3600 * 6
    token = f"{b64({'alg':'HS256','typ':'JWT'})}.{b64({'sub':uid,'email':email,'role':'authenticated','exp':exp,'aud':'authenticated'})}.firma"
    user = {'id': uid, 'aud': 'authenticated', 'role': 'authenticated', 'email': email,
            'app_metadata': {'provider': 'google', 'providers': ['google']},
            'user_metadata': {'full_name': name}, 'created_at': '2026-11-01T00:00:00Z'}
    return {'access_token': token, 'token_type': 'bearer', 'expires_in': 21600, 'expires_at': exp,
            'refresh_token': 'refresco', 'user': user}

ADMIN = ('11111111-1111-4111-8111-111111111111', 'administracion@ejemplo.com', 'Carla Administración')
TUTOR = ('22222222-2222-4222-8222-222222222222', 'marta.benitez@ejemplo.com', 'Marta Benítez')

F1, F2, F3 = 'f0000001-0000-4000-8000-000000000001', 'f0000002-0000-4000-8000-000000000002', 'f0000003-0000-4000-8000-000000000003'
def sid(n): return f'a000000{n}-0000-4000-8000-00000000000{n}'
def fid(n): return f'c00000{n:02d}-0000-4000-8000-0000000000{n:02d}'

families = [
    {'id': F1, 'name': 'Familia Benítez Rojas', 'notes': None, 'created_at': '2026-02-01T12:00:00Z', 'updated_at': '2026-02-01T12:00:00Z'},
    {'id': F2, 'name': 'Familia Giménez', 'notes': None, 'created_at': '2026-02-01T12:00:00Z', 'updated_at': '2026-02-01T12:00:00Z'},
    {'id': F3, 'name': 'Familia Ortiz Villalba', 'notes': None, 'created_at': '2026-02-01T12:00:00Z', 'updated_at': '2026-02-01T12:00:00Z'},
]
guardians = {
    F1: [{'id': 'g1', 'family_id': F1, 'full_name': 'Marta Benítez', 'relationship': 'mother', 'ci': '2345678', 'phone': '595981111222', 'email': 'marta.benitez@ejemplo.com', 'is_primary': True, 'created_at': '', 'updated_at': ''},
         {'id': 'g2', 'family_id': F1, 'full_name': 'Hugo Rojas', 'relationship': 'father', 'ci': None, 'phone': '595982333444', 'email': None, 'is_primary': False, 'created_at': '', 'updated_at': ''}],
    F2: [{'id': 'g3', 'family_id': F2, 'full_name': 'Lourdes Giménez', 'relationship': 'mother', 'ci': None, 'phone': '595983555666', 'email': None, 'is_primary': True, 'created_at': '', 'updated_at': ''}],
    F3: [],
}
def student(n, first, last, fam, ci, birth, disc, status='active', **extra):
    base = {'id': sid(n), 'family_id': fam, 'first_name': first, 'last_name': last, 'full_name': f'{first} {last}', 'ci': ci,
            'birth_date': birth, 'discipline': disc, 'enrolled_on': '2026-02-10', 'status': status, 'photo_path': None,
            'monthly_fee_override': None, 'discount_type': 'none', 'discount_value': 0, 'discount_reason': None,
            'is_exempt': False, 'exempt_reason': None, 'created_by': None, 'created_at': '2026-02-10T12:00:00Z', 'updated_at': '2026-02-10T12:00:00Z'}
    base.update(extra)
    return base
students = [
    student(1, 'Ana', 'Benítez Rojas', F1, '6123456', '2015-03-10', 'Fútbol'),
    student(2, 'Mateo', 'Benítez Rojas', F1, '6789012', '2017-07-22', 'Handball', discount_type='percent', discount_value=25, discount_reason='Hermano'),
    student(3, 'Lucía', 'Giménez', F2, '5987654', '2014-11-02', 'Vóleibol'),
    student(4, 'Thiago', 'Ortiz Villalba', F3, '7012345', '2016-01-15', 'Básquetbol'),
    student(5, 'Sofía', 'Ortiz Villalba', F3, '7345678', '2018-09-30', 'Bádminton', status='inactive'),
]
fam_by_id = {f['id']: f for f in families}
def fee(n, stu, fam, month, amount, paid, pending, state, disc=0, concept='monthly'):
    return {'id': fid(n), 'student_id': stu, 'family_id': fam, 'concept': concept, 'period_year': 2026,
            'period_month': month if concept == 'monthly' else None, 'base_amount': amount + disc, 'discount_amount': disc,
            'amount': amount, 'is_exempt': False, 'due_date': f'2026-{month:02d}-05', 'note': None, 'created_at': '2026-11-01T12:00:00Z',
            'paid_amount': paid, 'pending_amount': pending, 'balance': amount - paid, 'state': state}
fees = [
    fee(1, sid(1), F1, 11, 200000, 0, 0, 'overdue'),
    fee(2, sid(2), F1, 11, 150000, 0, 0, 'overdue', disc=50000),
    fee(3, sid(1), F1, 10, 200000, 200000, 0, 'paid'),
    fee(4, sid(2), F1, 10, 150000, 150000, 0, 'paid', disc=50000),
    fee(5, sid(3), F2, 11, 200000, 0, 200000, 'in_review'),
    fee(6, sid(4), F3, 11, 200000, 100000, 0, 'overdue'),
    fee(7, sid(1), F1, 12, 200000, 0, 0, 'pending'),
]
payments = [
    {'id': 'p0000001-0000-4000-8000-000000000001', 'family_id': F2, 'amount': 200000, 'method': 'transfer', 'paid_on': '2026-11-14',
     'status': 'pending', 'receipt_path': None, 'note': 'Transferí desde la cuenta de mi esposo', 'submitted_by': TUTOR[0], 'submitted_via': 'portal',
     'reviewed_by': None, 'reviewed_at': None, 'rejection_reason': None, 'created_at': '2026-11-14T22:10:00Z',
     'family': {'id': F2, 'name': 'Familia Giménez'}, 'submitter': {'full_name': 'Lourdes Giménez', 'email': 'lourdes@ejemplo.com'},
     'reviewer': None, 'invoice': None,
     'items': [{'id': 'i1', 'amount': 200000, 'fee_id': fid(5), 'fee': {'id': fid(5), 'concept': 'monthly', 'period_year': 2026, 'period_month': 11, 'amount': 200000,
                'student': {'id': sid(3), 'first_name': 'Lucía', 'last_name': 'Giménez'}}}]},
]
dashboard = {'today': '2026-11-15', 'period_year': 2026, 'period_month': 11, 'settings_ready': True, 'active_students': 148, 'inactive_students': 12,
             'families': 96, 'pending_balance': 8450000, 'overdue_balance': 3150000, 'overdue_fees': 17, 'collected_this_month': 21300000,
             'payments_to_review': 4, 'links_to_review': 2, 'students_missing_documents': 9, 'payments_without_invoice': 0, 'current_month_fees': 148,
             'collection_series': [{'year': 2026, 'month': m, 'collected': c, 'billed': 29600000} for m, c in [(6, 26100000), (7, 27400000), (8, 25900000), (9, 28200000), (10, 27750000), (11, 21300000)]],
             'month_states': {'paid': 96, 'partial': 6, 'in_review': 4, 'pending': 25, 'overdue': 17, 'exempt': 3},
             'birthdays': [{'id': sid(1), 'first_name': 'Ana', 'last_name': 'Benítez Rojas', 'birth_date': '2015-11-22', 'discipline': 'Fútbol', 'photo_path': None, 'enrolled_on': '2024-02-10'},
                           {'id': sid(3), 'first_name': 'Lucía', 'last_name': 'Giménez', 'birth_date': '2014-11-15', 'discipline': 'Vóleibol', 'photo_path': None, 'enrolled_on': '2023-03-01'},
                           {'id': sid(4), 'first_name': 'Thiago', 'last_name': 'Ortiz Villalba', 'birth_date': '2016-11-03', 'discipline': 'Básquetbol', 'photo_path': None, 'enrolled_on': '2025-02-15'}]}
settings = {'id': True, 'org_name': 'CERSAP', 'whatsapp_phone': '595981000000', 'monthly_fee': 200000, 'enrollment_fee': 100000, 'due_day': 5,
            'disciplines': ['Fútbol', 'Vóleibol', 'Básquetbol', 'Handball', 'Bádminton'], 'invoices_required_from': None, 'updated_at': '2026-11-01T00:00:00Z'}
documents = [{'id': f'd{i}', 'student_id': sid(1), 'kind': k, 'status': s, 'file_path': p, 'file_name': n, 'mime_type': 'image/jpeg', 'size_bytes': 284000,
              'review_note': None, 'uploaded_by': ADMIN[0], 'uploaded_at': '2026-03-02T15:00:00Z', 'updated_at': '2026-03-02T15:00:00Z'}
             for i, (k, s, p, n) in enumerate([('ci_front', 'complete', 'x/ci.jpg', 'cedula-frente.jpg'), ('ci_back', 'complete', 'x/ci2.jpg', 'cedula-dorso.jpg'), ('medical', 'pending', None, None)])]
links = [
    {'id': 'l1', 'user_id': 'u1', 'family_id': F3, 'student_id': sid(4), 'status': 'pending', 'auto_approved': False, 'requested_at': '2026-11-15T13:20:00Z',
     'decided_by': None, 'decided_at': None, 'decision_note': None, 'profile': {'full_name': 'Ramón Ortiz', 'email': 'ramon.ortiz@ejemplo.com', 'avatar_url': None},
     'family': {'id': F3, 'name': 'Familia Ortiz Villalba'}, 'student': {'id': sid(4), 'first_name': 'Thiago', 'last_name': 'Ortiz Villalba'}},
]
def overview(linked=True, pending=False):
    if not linked:
        return {'today': '2026-11-15', 'org': {'name': 'CERSAP', 'whatsapp_phone': '595981000000', 'due_day': 5},
                'links': ([{'status': 'pending', 'requested_at': '2026-11-15T13:20:00Z'}] if pending else []),
                'families': [], 'children': [], 'fees': [], 'payments': [], 'invoices': []}
    kids = [{k: s[k] for k in ('id', 'family_id', 'first_name', 'last_name', 'birth_date', 'discipline', 'status', 'enrolled_on', 'photo_path')} for s in students[:2]]
    myfees = [{k: v for k, v in f.items() if k not in ('note', 'created_at')} for f in fees if f['family_id'] == F1]
    return {'today': '2026-11-15', 'org': {'name': 'CERSAP', 'whatsapp_phone': '595981000000', 'due_day': 5},
            'links': [{'status': 'approved', 'requested_at': '2026-11-01T13:20:00Z'}], 'families': [{'id': F1, 'name': 'Familia Benítez Rojas'}],
            'children': kids, 'fees': myfees,
            'payments': [{'id': 'pp1', 'family_id': F1, 'amount': 350000, 'method': 'transfer', 'paid_on': '2026-10-04', 'status': 'confirmed', 'receipt_path': None,
                          'note': None, 'rejection_reason': None, 'created_at': '2026-10-04T12:00:00Z', 'items': [{'fee_id': fid(3), 'amount': 200000}, {'fee_id': fid(4), 'amount': 150000}]}],
            'invoices': []}

def make_handler(who, portal_state, log=None, link_result='pending'):
    uid, email, name = who
    role = 'admin' if who is ADMIN else 'tutor'
    def handler(route):
        req = route.request
        url = req.url
        path = url.split(SUPA, 1)[1].split('?')[0]
        single = 'vnd.pgrst.object' in (req.headers.get('accept') or '')
        def send(data, status=200):
            route.fulfill(status=status, content_type='application/json', body=json.dumps(data),
                          headers={'access-control-allow-origin': '*', 'content-range': '0-0/*'})
        if req.method == 'OPTIONS':
            return route.fulfill(status=204, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'})
        if path.startswith('/auth/v1/user'):
            return send(session(uid, email, name)['user'])
        if path.startswith('/auth/v1/token'):
            return send(session(uid, email, name))
        if path.startswith('/auth/v1'):
            return send({})
        if path.startswith('/storage/v1/object/') and req.method == 'POST' and '/sign/' not in path:
            if log is not None:
                log.append({'method': 'POST', 'path': path, 'url': url, 'body': None})
            return send({'Key': path.split('/storage/v1/object/')[1], 'Id': 'obj-1'})
        if path.startswith('/storage/v1'):
            return send({'error': 'no'}, 400)
        body = None
        try:
            body = req.post_data_json if req.method in ('POST', 'PATCH') else None
        except Exception:
            body = req.post_data
        if log is not None and req.method in ('POST', 'PATCH', 'DELETE') and not path.startswith('/auth'):
            log.append({'method': req.method, 'path': path, 'url': url, 'body': body})
        if path.startswith('/storage/v1/object/') and req.method == 'POST' and '/sign/' not in path:
            return send({'Key': path.split('/storage/v1/object/')[1], 'Id': 'obj-1'})
        t = path.replace('/rest/v1/', '')
        if t == 'rpc/request_family_link': return send(link_result)
        if t == 'rpc/portal_submit_payment': return send('p0000009-0000-4000-8000-000000000009')
        if t == 'rpc/review_payment': return send('confirmed')
        if t == 'rpc/register_payment': return send('p0000010-0000-4000-8000-000000000010')
        if t == 'rpc/create_enrollment_fee': return send('c0000099-0000-4000-8000-000000000099')
        if t == 'rpc/generate_monthly_fees': return send(0)
        if req.method in ('POST', 'PATCH') and not t.startswith('rpc/'):
            row = dict(body[0] if isinstance(body, list) else (body or {}))
            row.setdefault('id', 'f0000009-0000-4000-8000-000000000009' if t == 'families' else 'a0000009-0000-4000-8000-000000000009')
            return send(row if single else [row], 201)
        if t == 'profiles':
            p = {'id': uid, 'email': email, 'full_name': name, 'avatar_url': None, 'role': role, 'created_at': '', 'updated_at': ''}
            return send(p if single else [p])
        if t == 'rpc/admin_dashboard': return send(dashboard)
        if t == 'rpc/portal_overview': return send(overview(**portal_state))
        if t == 'settings': return send(settings)
        if t == 'students':
            if single:
                s = dict(students[0]); f = dict(fam_by_id[s['family_id']]); f['guardians'] = guardians[f['id']]; s['family'] = f
                return send(s)
            return send([dict(s, family={'id': s['family_id'], 'name': fam_by_id[s['family_id']]['name']}) for s in students])
        if t == 'student_balances':
            return send([{'student_id': sid(1), 'balance': 400000, 'overdue_balance': 200000, 'overdue_count': 1},
                         {'student_id': sid(2), 'balance': 150000, 'overdue_balance': 150000, 'overdue_count': 1},
                         {'student_id': sid(3), 'balance': 200000, 'overdue_balance': 0, 'overdue_count': 0},
                         {'student_id': sid(4), 'balance': 100000, 'overdue_balance': 100000, 'overdue_count': 1}])
        if t == 'student_documents':
            if 'select=student_id' in url: return send([{'student_id': sid(1)}, {'student_id': sid(4)}])
            return send(documents)
        if t == 'fee_balances':
            m = re.search(r'student_id=eq\.([0-9a-f-]+)', url)
            if m: return send([f for f in fees if f['student_id'] == m.group(1)])
            m = re.search(r'family_id=eq\.([0-9a-f-]+)', url)
            if m: return send([f for f in fees if f['family_id'] == m.group(1)])
            return send([f for f in fees if f['period_month'] == 11])
        if t == 'families':
            if single:
                f = dict(families[0]); f['guardians'] = guardians[F1]; f['students'] = [s for s in students if s['family_id'] == F1]
                return send(f)
            if 'guardians' in url:
                return send([dict(f, guardians=guardians[f['id']], students=[{'id': s['id'], 'first_name': s['first_name'], 'last_name': s['last_name'], 'status': s['status']} for s in students if s['family_id'] == f['id']]) for f in families])
            return send([{'id': f['id'], 'name': f['name']} for f in families])
        if t == 'family_balances':
            return send([{'family_id': F1, 'balance': 550000, 'overdue_balance': 350000, 'pending_amount': 0},
                         {'family_id': F2, 'balance': 200000, 'overdue_balance': 0, 'pending_amount': 200000},
                         {'family_id': F3, 'balance': 100000, 'overdue_balance': 100000, 'pending_amount': 0}])
        if t == 'payments': return send(payments if 'status=eq.pending' in url or 'family_id' in url else [])
        if t == 'family_links': return send(links)
        if t in ('student_notes', 'student_withdrawals', 'invoices'): return send([])
        if t == 'admin_allowlist': return send([{'email': email, 'note': None, 'created_by': None, 'created_at': ''}])
        print('SIN MOCK:', req.method, url[:140])
        return send([])
    return handler

