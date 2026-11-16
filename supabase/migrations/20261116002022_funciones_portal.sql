-- =============================================================================
-- 04 · Funciones del portal de padres y tutores
--
-- Los tutores no tienen políticas RLS sobre las tablas: todo lo que ven sale
-- de acá. Cada función tiene dos partes:
--   · private.<nombre>  SECURITY DEFINER, con las verificaciones de acceso.
--   · public.<nombre>   envoltorio sin privilegios, que es lo que llama la app.
-- Así ninguna función con privilegios queda expuesta directo por la API.
--
-- Lo que el portal NUNCA devuelve: cédulas, documentos, ficha médica,
-- observaciones de seguimiento, motivos de baja ni notas internas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Pedir acceso a una familia validando cédula + fecha de nacimiento de un hijo.
-- Devuelve: approved | pending | rejected | not_found | too_many_attempts
-- (Devuelve un texto en vez de lanzar un error para que el intento fallido
--  quede guardado y cuente para el límite.)
-- ---------------------------------------------------------------------------
create function private.request_family_link(p_ci text, p_birth_date date) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_student public.students;
  v_link public.family_links;
  v_auto boolean;
begin
  if v_uid is null then
    raise exception 'Iniciá sesión para continuar.' using errcode = '28000';
  end if;

  -- Máximo 5 intentos fallidos por hora y 3 solicitudes pendientes a la vez
  if (
    select count(*) from private.link_attempts
    where user_id = v_uid and not succeeded and attempted_at > now() - interval '1 hour'
  ) >= 5 then
    return 'too_many_attempts';
  end if;
  if (select count(*) from public.family_links where user_id = v_uid and status = 'pending') >= 3 then
    return 'too_many_attempts';
  end if;

  select * into v_student
  from public.students
  where ci = private.normalize_ci(p_ci) and birth_date = p_birth_date;

  if not found then
    insert into private.link_attempts (user_id, succeeded) values (v_uid, false);
    return 'not_found';
  end if;

  insert into private.link_attempts (user_id, succeeded) values (v_uid, true);

  select * into v_link
  from public.family_links
  where user_id = v_uid and family_id = v_student.family_id;

  if found then
    if v_link.status = 'revoked' then
      return 'rejected';
    end if;
    return v_link.status::text;
  end if;

  -- Se aprueba sola únicamente si el Gmail verificado de la cuenta es el que
  -- administración cargó en la ficha de la familia.
  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  v_auto := v_email is not null and exists (
    select 1 from public.guardians g
    where g.family_id = v_student.family_id and g.email = v_email
  );

  insert into public.family_links (user_id, family_id, student_id, status, auto_approved, decided_at)
  values (
    v_uid, v_student.family_id, v_student.id,
    case when v_auto then 'approved'::public.link_status else 'pending'::public.link_status end,
    v_auto,
    case when v_auto then now() end
  );

  return case when v_auto then 'approved' else 'pending' end;
end $$;

create function public.request_family_link(p_ci text, p_birth_date date) returns text
language sql security invoker set search_path = ''
as $$ select private.request_family_link(p_ci, p_birth_date) $$;

-- ---------------------------------------------------------------------------
-- Todo lo que necesita el portal, en una sola llamada.
-- ---------------------------------------------------------------------------
create function private.portal_overview() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_families uuid[];
begin
  if v_uid is null then
    raise exception 'Iniciá sesión para continuar.' using errcode = '28000';
  end if;

  select coalesce(array_agg(l.family_id), '{}'::uuid[]) into v_families
  from public.family_links l
  where l.user_id = v_uid and l.status = 'approved';

  return jsonb_build_object(
    'today', private.today(),
    'org', (
      select jsonb_build_object('name', s.org_name, 'whatsapp_phone', s.whatsapp_phone, 'due_day', s.due_day)
      from public.settings s
    ),
    -- De las solicitudes solo se informa el estado: nada de la familia hasta que se apruebe.
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('status', l.status, 'requested_at', l.requested_at) order by l.requested_at desc)
      from public.family_links l where l.user_id = v_uid
    ), '[]'::jsonb),
    'families', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name) order by f.name)
      from public.families f where f.id = any (v_families)
    ), '[]'::jsonb),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'family_id', s.family_id, 'first_name', s.first_name, 'last_name', s.last_name,
        'birth_date', s.birth_date, 'discipline', s.discipline, 'status', s.status,
        'enrolled_on', s.enrolled_on, 'photo_path', s.photo_path
      ) order by s.birth_date)
      from public.students s where s.family_id = any (v_families)
    ), '[]'::jsonb),
    'fees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id, 'student_id', b.student_id, 'family_id', b.family_id, 'concept', b.concept,
        'period_year', b.period_year, 'period_month', b.period_month,
        'base_amount', b.base_amount, 'discount_amount', b.discount_amount, 'amount', b.amount,
        'is_exempt', b.is_exempt, 'due_date', b.due_date,
        'paid_amount', b.paid_amount, 'pending_amount', b.pending_amount, 'balance', b.balance, 'state', b.state
      ) order by b.due_date desc, b.student_id)
      from public.fee_balances b where b.family_id = any (v_families)
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'family_id', p.family_id, 'amount', p.amount, 'method', p.method,
        'paid_on', p.paid_on, 'status', p.status, 'receipt_path', p.receipt_path,
        'note', case when p.submitted_via = 'portal' then p.note end,
        'rejection_reason', p.rejection_reason, 'created_at', p.created_at,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object('fee_id', pi.fee_id, 'amount', pi.amount))
          from public.payment_items pi where pi.payment_id = p.id
        ), '[]'::jsonb)
      ) order by p.created_at desc)
      from public.payments p where p.family_id = any (v_families)
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'family_id', i.family_id, 'payment_id', i.payment_id, 'number', i.number,
        'issued_on', i.issued_on, 'amount', i.amount, 'file_path', i.file_path
      ) order by i.issued_on desc)
      from public.invoices i where i.family_id = any (v_families)
    ), '[]'::jsonb)
  );
end $$;

create function public.portal_overview() returns jsonb
language sql stable security invoker set search_path = ''
as $$ select private.portal_overview() $$;

-- ---------------------------------------------------------------------------
-- El tutor informa una transferencia: elige cuotas y adjunta el comprobante.
-- El pago queda pendiente hasta que administración lo confirme, y mientras
-- tanto no descuenta saldo.
-- ---------------------------------------------------------------------------
create function private.portal_submit_payment(
  p_family_id uuid,
  p_fee_ids uuid[],
  p_paid_on date,
  p_receipt_path text,
  p_note text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_payment_id uuid;
  v_total bigint;
  v_rows integer;
  v_invalid integer;
  v_wanted integer;
begin
  if v_uid is null then
    raise exception 'Iniciá sesión para continuar.' using errcode = '28000';
  end if;
  if not private.has_family_access(p_family_id) then
    raise exception 'No tenés acceso a esta familia.' using errcode = '42501';
  end if;

  select count(distinct x) into v_wanted from unnest(coalesce(p_fee_ids, '{}'::uuid[])) as x;
  if v_wanted = 0 then
    raise exception 'Elegí al menos una cuota.' using errcode = 'P0001';
  end if;
  if v_wanted > 36 then
    raise exception 'Son demasiadas cuotas para un solo pago.' using errcode = 'P0001';
  end if;

  if p_paid_on is null or p_paid_on > private.today() then
    raise exception 'La fecha del pago no puede ser futura.' using errcode = 'P0001';
  end if;

  -- El comprobante tiene que estar en la carpeta de la familia y existir de verdad
  if coalesce(p_receipt_path, '') not like p_family_id::text || '/%' then
    raise exception 'Falta el comprobante.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'payment-receipts' and o.name = p_receipt_path
  ) then
    raise exception 'No se encontró el comprobante. Subilo de nuevo.' using errcode = 'P0001';
  end if;

  if (select count(*) from public.payments where family_id = p_family_id and status = 'pending') >= 10 then
    raise exception 'Ya hay varios pagos esperando revisión. Esperá a que administración los confirme.' using errcode = 'P0001';
  end if;

  perform 1 from public.fees f where f.id = any (p_fee_ids) for update;

  -- Solo se puede informar lo que falta pagar y no está ya en revisión
  select
    count(*),
    count(*) filter (where b.family_id <> p_family_id or b.is_exempt or b.balance - b.pending_amount <= 0),
    coalesce(sum(b.balance - b.pending_amount), 0)
  into v_rows, v_invalid, v_total
  from public.fee_balances b
  where b.id = any (p_fee_ids);

  if v_rows <> v_wanted or v_invalid > 0 then
    raise exception 'Alguna de las cuotas elegidas ya está paga o en revisión. Actualizá la página.' using errcode = 'P0001';
  end if;

  insert into public.payments
    (family_id, amount, method, paid_on, status, receipt_path, note, submitted_by, submitted_via)
  values
    (p_family_id, v_total, 'transfer', p_paid_on, 'pending', p_receipt_path, nullif(btrim(p_note), ''), v_uid, 'portal')
  returning id into v_payment_id;

  insert into public.payment_items (payment_id, fee_id, amount)
  select v_payment_id, b.id, b.balance - b.pending_amount
  from public.fee_balances b
  where b.id = any (p_fee_ids);

  return v_payment_id;
end $$;

create function public.portal_submit_payment(
  p_family_id uuid,
  p_fee_ids uuid[],
  p_paid_on date,
  p_receipt_path text,
  p_note text default null
) returns uuid
language sql security invoker set search_path = ''
as $$ select private.portal_submit_payment(p_family_id, p_fee_ids, p_paid_on, p_receipt_path, p_note) $$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------------
grant execute on function
  private.request_family_link(text, date),
  private.portal_overview(),
  private.portal_submit_payment(uuid, uuid[], date, text, text),
  public.request_family_link(text, date),
  public.portal_overview(),
  public.portal_submit_payment(uuid, uuid[], date, text, text)
to authenticated;
