-- =============================================================================
-- 03 · Funciones de administración (RPC)
--
-- Son SECURITY INVOKER: corren con los permisos de quien llama, así que RLS
-- sigue aplicando. Además verifican el rol al empezar para dar un error claro.
-- Se usan para operaciones de varios pasos que tienen que ser atómicas.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Validación compartida de los ítems de un pago.
-- p_items: [{"fee_id": "<uuid>", "amount": 150000}, ...]
-- Bloquea las cuotas (for update) para que dos pagos simultáneos no superen el saldo.
-- ---------------------------------------------------------------------------
create function private.validate_payment_items(p_family_id uuid, p_items jsonb) returns bigint
language plpgsql set search_path = ''
as $$
declare
  v_item record;
  v_total bigint := 0;
  v_distinct integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Elegí al menos una cuota.' using errcode = 'P0001';
  end if;

  select count(distinct i ->> 'fee_id') into v_distinct from jsonb_array_elements(p_items) as i;
  if v_distinct <> jsonb_array_length(p_items) then
    raise exception 'Hay cuotas repetidas en el pago.' using errcode = 'P0001';
  end if;

  perform 1
  from public.fees f
  where f.id in (select (i ->> 'fee_id')::uuid from jsonb_array_elements(p_items) as i)
  for update;

  for v_item in
    select
      (i ->> 'amount')::integer as amount,
      f.id as fee_id,
      f.family_id,
      f.amount as fee_amount,
      f.is_exempt,
      coalesce((
        select sum(pi.amount)
        from public.payment_items pi
        join public.payments pay on pay.id = pi.payment_id
        where pi.fee_id = f.id and pay.status = 'confirmed'
      ), 0) as paid
    from jsonb_array_elements(p_items) as i
    left join public.fees f on f.id = (i ->> 'fee_id')::uuid
  loop
    if v_item.fee_id is null or v_item.family_id <> p_family_id then
      raise exception 'Una de las cuotas no pertenece a esta familia.' using errcode = 'P0001';
    end if;
    if v_item.is_exempt then
      raise exception 'Una de las cuotas está exonerada y no se cobra.' using errcode = 'P0001';
    end if;
    if v_item.amount is null or v_item.amount <= 0 then
      raise exception 'Los montos tienen que ser mayores a cero.' using errcode = 'P0001';
    end if;
    if v_item.amount > v_item.fee_amount - v_item.paid then
      raise exception 'El monto supera el saldo de una de las cuotas.' using errcode = 'P0001';
    end if;
    v_total := v_total + v_item.amount;
  end loop;

  return v_total;
end $$;

-- ---------------------------------------------------------------------------
-- Generar las mensualidades de un mes. Se puede correr varias veces: solo crea
-- las que faltan.
--
-- Reglas:
--   · Se cobra a quien estaba inscripto ese mes.
--   · El mes en que se comunica la baja se cobra completo; los siguientes no.
--   · El mes del reingreso se cobra completo.
-- ---------------------------------------------------------------------------
create function public.generate_monthly_fees(p_year integer, p_month integer) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_settings public.settings;
  v_start date;
  v_end date;
  v_due date;
  v_count integer;
begin
  perform private.require_admin();

  if p_month not between 1 and 12 or p_year not between 2020 and 2100 then
    raise exception 'El período no es válido.' using errcode = 'P0001';
  end if;

  select * into strict v_settings from public.settings;
  if v_settings.monthly_fee <= 0 then
    raise exception 'Cargá primero el monto de la mensualidad en Configuración.' using errcode = 'P0001';
  end if;

  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_due := make_date(p_year, p_month, v_settings.due_day);

  insert into public.fees
    (student_id, family_id, concept, period_year, period_month, base_amount, discount_amount, is_exempt, due_date)
  select
    s.id,
    s.family_id,
    'monthly',
    p_year,
    p_month,
    b.base,
    case
      when s.is_exempt then b.base
      when s.discount_type = 'percent' then round(b.base * s.discount_value / 100.0)::integer
      when s.discount_type = 'amount' then least(s.discount_value, b.base)
      else 0
    end,
    s.is_exempt,
    v_due
  from public.students s
  cross join lateral (select coalesce(s.monthly_fee_override, v_settings.monthly_fee) as base) as b
  where s.enrolled_on <= v_end
    -- sin una baja anterior al mes que siga abierta durante todo el mes
    and not exists (
      select 1 from public.student_withdrawals w
      where w.student_id = s.id
        and w.communicated_on < v_start
        and (w.reentered_on is null or w.reentered_on > v_end)
    )
    -- activo hoy, o dado de baja durante este mes o después
    and (
      s.status = 'active'
      or exists (
        select 1 from public.student_withdrawals w
        where w.student_id = s.id and w.reentered_on is null and w.communicated_on >= v_start
      )
    )
  on conflict (student_id, period_year, period_month) where concept = 'monthly' do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- ---------------------------------------------------------------------------
-- Matrícula: una sola por alumno y por año.
-- ---------------------------------------------------------------------------
create function public.create_enrollment_fee(
  p_student_id uuid,
  p_year integer,
  p_amount integer default null,
  p_due_date date default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_student public.students;
  v_base integer;
  v_id uuid;
begin
  perform private.require_admin();

  select * into v_student from public.students where id = p_student_id;
  if not found then
    raise exception 'No se encontró el alumno.' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.fees
    where student_id = p_student_id and concept = 'enrollment' and period_year = p_year
  ) then
    raise exception 'Este alumno ya tiene la matrícula % cargada.', p_year using errcode = 'P0001';
  end if;

  v_base := coalesce(p_amount, (select enrollment_fee from public.settings));
  if v_base is null or v_base < 0 then
    raise exception 'El monto de la matrícula no es válido.' using errcode = 'P0001';
  end if;

  insert into public.fees
    (student_id, family_id, concept, period_year, base_amount, discount_amount, is_exempt, due_date)
  values (
    p_student_id,
    v_student.family_id,
    'enrollment',
    p_year,
    v_base,
    case when v_student.is_exempt then v_base else 0 end,
    v_student.is_exempt,
    coalesce(p_due_date, private.today())
  )
  returning id into v_id;

  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Registrar un pago desde administración (efectivo o transferencia ya verificada).
-- Queda confirmado en el momento.
-- ---------------------------------------------------------------------------
create function public.register_payment(
  p_family_id uuid,
  p_method public.payment_method,
  p_paid_on date,
  p_items jsonb,
  p_receipt_path text default null,
  p_note text default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_payment_id uuid;
  v_total bigint;
begin
  perform private.require_admin();

  if p_paid_on is null or p_paid_on > private.today() then
    raise exception 'La fecha del pago no puede ser futura.' using errcode = 'P0001';
  end if;

  v_total := private.validate_payment_items(p_family_id, p_items);

  insert into public.payments
    (family_id, amount, method, paid_on, status, receipt_path, note, submitted_via, reviewed_by, reviewed_at)
  values (
    p_family_id, v_total, p_method, p_paid_on, 'confirmed',
    nullif(btrim(p_receipt_path), ''), nullif(btrim(p_note), ''),
    'admin', (select auth.uid()), now()
  )
  returning id into v_payment_id;

  insert into public.payment_items (payment_id, fee_id, amount)
  select v_payment_id, (i ->> 'fee_id')::uuid, (i ->> 'amount')::integer
  from jsonb_array_elements(p_items) as i;

  return v_payment_id;
end $$;

-- ---------------------------------------------------------------------------
-- Revisar un pago.
--   · Aprobar (solo si está pendiente). p_items permite corregir los montos
--     cuando la transferencia no coincide con lo que informó el tutor.
--   · Rechazar un pendiente, o anular uno ya confirmado. Siempre con motivo.
-- ---------------------------------------------------------------------------
create function public.review_payment(
  p_payment_id uuid,
  p_approve boolean,
  p_items jsonb default null,
  p_reason text default null
) returns public.payment_status
language plpgsql security invoker set search_path = ''
as $$
declare
  v_payment public.payments;
  v_items jsonb;
  v_total bigint;
begin
  perform private.require_admin();

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'No se encontró el pago.' using errcode = 'P0001';
  end if;

  if p_approve then
    if v_payment.status <> 'pending' then
      raise exception 'Este pago ya fue revisado.' using errcode = 'P0001';
    end if;

    v_items := coalesce(p_items, (
      select jsonb_agg(jsonb_build_object('fee_id', pi.fee_id, 'amount', pi.amount))
      from public.payment_items pi where pi.payment_id = p_payment_id
    ));
    v_total := private.validate_payment_items(v_payment.family_id, v_items);

    if p_items is not null then
      delete from public.payment_items where payment_id = p_payment_id;
      insert into public.payment_items (payment_id, fee_id, amount)
      select p_payment_id, (i ->> 'fee_id')::uuid, (i ->> 'amount')::integer
      from jsonb_array_elements(p_items) as i;
    end if;

    update public.payments
    set status = 'confirmed', amount = v_total, reviewed_by = (select auth.uid()),
        reviewed_at = now(), rejection_reason = null
    where id = p_payment_id;
    return 'confirmed';
  end if;

  if v_payment.status = 'rejected' then
    raise exception 'Este pago ya está rechazado.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'Escribí el motivo.' using errcode = 'P0001';
  end if;

  update public.payments
  set status = 'rejected', reviewed_by = (select auth.uid()), reviewed_at = now(),
      rejection_reason = btrim(p_reason)
  where id = p_payment_id;
  return 'rejected';
end $$;

-- ---------------------------------------------------------------------------
-- Baja y reingreso de alumnos. La ficha y el historial se conservan siempre.
-- ---------------------------------------------------------------------------
create function public.withdraw_student(
  p_student_id uuid,
  p_communicated_on date,
  p_reason text,
  p_note text default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_status public.student_status;
  v_id uuid;
begin
  perform private.require_admin();

  select status into v_status from public.students where id = p_student_id for update;
  if not found then
    raise exception 'No se encontró el alumno.' using errcode = 'P0001';
  end if;
  if v_status <> 'active' then
    raise exception 'El alumno ya está inactivo.' using errcode = 'P0001';
  end if;
  if p_communicated_on is null or p_communicated_on > private.today() then
    raise exception 'La fecha de la baja no puede ser futura.' using errcode = 'P0001';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception 'Elegí el motivo de la baja.' using errcode = 'P0001';
  end if;

  insert into public.student_withdrawals (student_id, communicated_on, reason, note)
  values (p_student_id, p_communicated_on, btrim(p_reason), nullif(btrim(p_note), ''))
  returning id into v_id;

  update public.students set status = 'inactive' where id = p_student_id;
  return v_id;
end $$;

create function public.reactivate_student(p_student_id uuid, p_reentered_on date default null) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_status public.student_status;
  v_date date := coalesce(p_reentered_on, private.today());
begin
  perform private.require_admin();

  select status into v_status from public.students where id = p_student_id for update;
  if not found then
    raise exception 'No se encontró el alumno.' using errcode = 'P0001';
  end if;
  if v_status <> 'inactive' then
    raise exception 'El alumno ya está activo.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.student_withdrawals
    where student_id = p_student_id and reentered_on is null and communicated_on > v_date
  ) then
    raise exception 'El reingreso no puede ser anterior a la baja.' using errcode = 'P0001';
  end if;

  update public.student_withdrawals
  set reentered_on = v_date
  where student_id = p_student_id and reentered_on is null;

  update public.students set status = 'active' where id = p_student_id;
end $$;

-- ---------------------------------------------------------------------------
-- Aprobar, rechazar o quitar el acceso de una cuenta a una familia.
-- ---------------------------------------------------------------------------
create function public.set_family_link_status(
  p_link_id uuid,
  p_status public.link_status,
  p_note text default null
) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  perform private.require_admin();

  if p_status = 'pending' then
    raise exception 'Una solicitud revisada no vuelve a pendiente.' using errcode = 'P0001';
  end if;

  update public.family_links
  set status = p_status, decided_by = (select auth.uid()), decided_at = now(),
      decision_note = nullif(btrim(p_note), '')
  where id = p_link_id;

  if not found then
    raise exception 'No se encontró la solicitud.' using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Números del panel de inicio, en una sola llamada.
-- ---------------------------------------------------------------------------
create function public.admin_dashboard() returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_today date := private.today();
  v_year integer := extract(year from private.today())::integer;
  v_month integer := extract(month from private.today())::integer;
  v_month_start date := date_trunc('month', private.today())::date;
  v_settings public.settings;
begin
  perform private.require_admin();
  select * into strict v_settings from public.settings;

  return jsonb_build_object(
    'today', v_today,
    'period_year', v_year,
    'period_month', v_month,
    'settings_ready', v_settings.monthly_fee > 0,
    'active_students', (select count(*) from public.students where status = 'active'),
    'inactive_students', (select count(*) from public.students where status = 'inactive'),
    'families', (select count(*) from public.families),
    'pending_balance', (select coalesce(sum(balance), 0) from public.fee_balances where balance > 0),
    'overdue_balance', (select coalesce(sum(balance), 0) from public.fee_balances where balance > 0 and due_date < v_today),
    'overdue_fees', (select count(*) from public.fee_balances where balance > 0 and due_date < v_today),
    'collected_this_month', (
      select coalesce(sum(amount), 0) from public.payments
      where status = 'confirmed' and paid_on >= v_month_start
    ),
    'payments_to_review', (select count(*) from public.payments where status = 'pending'),
    'links_to_review', (select count(*) from public.family_links where status = 'pending'),
    'students_missing_documents', (
      select count(distinct d.student_id)
      from public.student_documents d
      join public.students s on s.id = d.student_id
      where s.status = 'active' and d.status <> 'complete'
    ),
    'payments_without_invoice', (
      select count(*) from public.payments p
      where v_settings.invoices_required_from is not null
        and p.status = 'confirmed'
        and p.paid_on >= v_settings.invoices_required_from
        and not exists (select 1 from public.invoices i where i.payment_id = p.id)
    ),
    'current_month_fees', (
      select count(*) from public.fees
      where concept = 'monthly' and period_year = v_year and period_month = v_month
    )
  );
end $$;

-- ---------------------------------------------------------------------------
-- Permisos de ejecución
-- ---------------------------------------------------------------------------
grant execute on function private.validate_payment_items(uuid, jsonb) to authenticated;
grant execute on function
  public.generate_monthly_fees(integer, integer),
  public.create_enrollment_fee(uuid, integer, integer, date),
  public.register_payment(uuid, public.payment_method, date, jsonb, text, text),
  public.review_payment(uuid, boolean, jsonb, text),
  public.withdraw_student(uuid, date, text, text),
  public.reactivate_student(uuid, date),
  public.set_family_link_status(uuid, public.link_status, text),
  public.admin_dashboard()
to authenticated;
