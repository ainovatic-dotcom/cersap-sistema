-- =============================================================================
-- 08 · Panel: series para los gráficos y cumpleaños del mes
-- Agrega a admin_dashboard():
--   · collection_series: cobrado y facturado de los últimos 6 meses
--   · month_states: cuántas mensualidades del mes hay en cada estado
--   · birthdays: alumnos activos que cumplen años este mes
-- =============================================================================
create or replace function public.admin_dashboard() returns jsonb
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
    ),
    'collection_series', (
      select jsonb_agg(jsonb_build_object(
        'year', extract(year from m.start)::integer,
        'month', extract(month from m.start)::integer,
        'collected', coalesce((
          select sum(p.amount) from public.payments p
          where p.status = 'confirmed'
            and p.paid_on >= m.start and p.paid_on < (m.start + interval '1 month')::date
        ), 0),
        'billed', coalesce((
          select sum(f.amount) from public.fees f
          where not f.is_exempt
            and f.due_date >= m.start and f.due_date < (m.start + interval '1 month')::date
        ), 0)
      ) order by m.start)
      from (
        select (v_month_start - make_interval(months => g))::date as start
        from generate_series(0, 5) as g
      ) m
    ),
    'month_states', (
      select jsonb_build_object(
        'paid', count(*) filter (where state = 'paid'),
        'partial', count(*) filter (where state = 'partial'),
        'in_review', count(*) filter (where state = 'in_review'),
        'pending', count(*) filter (where state = 'pending'),
        'overdue', count(*) filter (where state = 'overdue'),
        'exempt', count(*) filter (where state = 'exempt')
      )
      from public.fee_balances
      where concept = 'monthly' and period_year = v_year and period_month = v_month
    ),
    'birthdays', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'first_name', s.first_name, 'last_name', s.last_name,
        'birth_date', s.birth_date, 'discipline', s.discipline, 'photo_path', s.photo_path,
        'enrolled_on', s.enrolled_on
      ) order by extract(day from s.birth_date), s.first_name)
      from public.students s
      where s.status = 'active' and extract(month from s.birth_date)::integer = v_month
    ), '[]'::jsonb)
  );
end $$;

grant execute on function public.admin_dashboard() to authenticated;
