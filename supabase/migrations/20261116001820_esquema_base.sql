-- =============================================================================
-- 01 · Esquema base del sistema CERSAP
-- Tablas, tipos, índices y triggers. La seguridad (permisos y RLS) está en 02.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Permisos por defecto: nada queda expuesto a la API sin un GRANT explícito.
-- (Va primero para que aplique a todo lo que se crea en estas migraciones.)
-- ---------------------------------------------------------------------------
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;

create schema if not exists private;
comment on schema private is 'Funciones internas y tablas que NO se exponen por la API.';

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'tutor');
create type public.student_status as enum ('active', 'inactive');
create type public.guardian_relationship as enum ('father', 'mother', 'guardian', 'other');
create type public.discount_type as enum ('none', 'percent', 'amount');
create type public.document_kind as enum ('ci_front', 'ci_back', 'medical');
create type public.document_status as enum ('pending', 'in_review', 'complete', 'needs_update');
create type public.fee_concept as enum ('monthly', 'enrollment');
create type public.payment_method as enum ('transfer', 'cash');
create type public.payment_status as enum ('pending', 'confirmed', 'rejected');
create type public.link_status as enum ('pending', 'approved', 'rejected', 'revoked');

-- ---------------------------------------------------------------------------
-- Funciones auxiliares sin privilegios especiales
-- ---------------------------------------------------------------------------
create function private.today() returns date
language sql stable set search_path = ''
as $$ select (now() at time zone 'America/Asuncion')::date $$;
comment on function private.today() is 'Fecha de hoy en Paraguay (la base corre en UTC).';

create function private.normalize_ci(p_value text) returns text
language sql immutable set search_path = ''
as $$ select upper(regexp_replace(coalesce(p_value, ''), '[^0-9A-Za-z]', '', 'g')) $$;
comment on function private.normalize_ci(text) is 'Cédula sin puntos, espacios ni guiones.';

create function private.try_uuid(p_value text) returns uuid
language plpgsql immutable set search_path = ''
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end $$;

create function private.set_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'tutor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Un perfil por cuenta de Google. El rol lo asigna la base, nunca el cliente.';

create table public.admin_allowlist (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  note text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table public.admin_allowlist is 'Correos de Gmail que entran como administradores.';

create table public.settings (
  id boolean primary key default true check (id),
  org_name text not null default 'CERSAP',
  whatsapp_phone text check (whatsapp_phone is null or whatsapp_phone ~ '^[0-9]{8,15}$'),
  monthly_fee integer not null default 0 check (monthly_fee >= 0),
  enrollment_fee integer not null default 0 check (enrollment_fee >= 0),
  due_day smallint not null default 5 check (due_day between 1 and 28),
  disciplines text[] not null default array['Fútbol', 'Vóleibol', 'Básquetbol', 'Handball', 'Bádminton'],
  invoices_required_from date,
  updated_at timestamptz not null default now()
);
comment on table public.settings is 'Configuración general (una sola fila). Montos en guaraníes.';
comment on column public.settings.due_day is 'Último día para pagar sin atraso. Desde el día siguiente la cuota figura vencida.';
comment on column public.settings.invoices_required_from is 'Si tiene fecha, los pagos confirmados desde ese día piden factura en el panel.';

-- ---------------------------------------------------------------------------
-- Familias, tutores y alumnos
-- ---------------------------------------------------------------------------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.families.notes is 'Nota interna. Nunca se muestra en el portal.';

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) > 0),
  relationship public.guardian_relationship not null default 'guardian',
  ci text,
  phone text,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.guardians.email is 'Si coincide con el Gmail con el que entra el tutor, la vinculación se aprueba sola.';
create index guardians_family_id_idx on public.guardians (family_id);
create index guardians_email_idx on public.guardians (email) where email is not null;
create unique index guardians_one_primary_idx on public.guardians (family_id) where is_primary;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete restrict,
  first_name text not null check (length(btrim(first_name)) > 0),
  last_name text not null check (length(btrim(last_name)) > 0),
  full_name text generated always as (first_name || ' ' || last_name) stored,
  ci text not null unique check (ci ~ '^[0-9A-Z]{5,12}$'),
  birth_date date not null,
  discipline text,
  enrolled_on date not null default private.today(),
  status public.student_status not null default 'active',
  photo_path text,
  monthly_fee_override integer check (monthly_fee_override is null or monthly_fee_override >= 0),
  discount_type public.discount_type not null default 'none',
  discount_value integer not null default 0 check (discount_value >= 0),
  discount_reason text,
  is_exempt boolean not null default false,
  exempt_reason text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_discount_percent_max check (discount_type <> 'percent' or discount_value <= 100)
);
comment on column public.students.ci is 'Cédula normalizada (solo letras y números).';
comment on column public.students.monthly_fee_override is 'Mensualidad propia del alumno. Si es null se usa la general.';
create index students_family_id_idx on public.students (family_id);
create index students_status_idx on public.students (status);

create table public.student_withdrawals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  communicated_on date not null,
  reason text not null check (length(btrim(reason)) > 0),
  note text,
  reentered_on date,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint student_withdrawals_dates check (reentered_on is null or reentered_on >= communicated_on)
);
comment on table public.student_withdrawals is 'Bajas y reingresos. Exclusivo de administración.';
create index student_withdrawals_student_id_idx on public.student_withdrawals (student_id);
create unique index student_withdrawals_one_open_idx on public.student_withdrawals (student_id) where reentered_on is null;

create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  corrects_note_id uuid references public.student_notes (id) on delete restrict,
  author_id uuid not null references public.profiles (id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table public.student_notes is 'Seguimiento. Solo se agregan notas: una corrección es una nota nueva que apunta a la original.';
create index student_notes_student_id_idx on public.student_notes (student_id, created_at);
create index student_notes_corrects_idx on public.student_notes (corrects_note_id) where corrects_note_id is not null;
create index student_notes_author_idx on public.student_notes (author_id);

-- ---------------------------------------------------------------------------
-- Documentos del alumno
-- ---------------------------------------------------------------------------
create table public.student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  kind public.document_kind not null,
  status public.document_status not null default 'pending',
  file_path text,
  file_name text,
  mime_type text,
  size_bytes integer,
  review_note text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, kind)
);
comment on table public.student_documents is 'Cédula (frente y dorso) y ficha médica. Exclusivo de administración.';

create table public.student_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.student_documents (id) on delete cascade,
  file_path text not null,
  file_name text,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid references public.profiles (id) on delete set null,
  uploaded_at timestamptz,
  replaced_by uuid references public.profiles (id) on delete set null,
  replaced_at timestamptz not null default now()
);
comment on table public.student_document_versions is 'Archivos reemplazados, para trazabilidad.';
create index student_document_versions_document_idx on public.student_document_versions (document_id);

-- ---------------------------------------------------------------------------
-- Cuotas, pagos y facturas
-- ---------------------------------------------------------------------------
create table public.fees (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  family_id uuid not null references public.families (id) on delete restrict,
  concept public.fee_concept not null,
  period_year smallint not null check (period_year between 2020 and 2100),
  period_month smallint check (period_month between 1 and 12),
  base_amount integer not null check (base_amount >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  amount integer generated always as (base_amount - discount_amount) stored,
  is_exempt boolean not null default false,
  due_date date not null,
  note text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint fees_month_matches_concept check ((concept = 'monthly') = (period_month is not null)),
  constraint fees_discount_within_base check (discount_amount <= base_amount),
  constraint fees_exempt_is_free check (not is_exempt or discount_amount = base_amount)
);
comment on table public.fees is 'Cuotas: mensualidades y matrículas. Montos en guaraníes.';
create unique index fees_monthly_unique_idx on public.fees (student_id, period_year, period_month) where concept = 'monthly';
create unique index fees_enrollment_unique_idx on public.fees (student_id, period_year) where concept = 'enrollment';
create index fees_family_id_idx on public.fees (family_id);
create index fees_period_idx on public.fees (period_year, period_month);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete restrict,
  amount integer not null check (amount > 0),
  method public.payment_method not null,
  paid_on date not null,
  status public.payment_status not null default 'pending',
  receipt_path text,
  note text,
  submitted_by uuid references public.profiles (id) on delete set null default auth.uid(),
  submitted_via text not null check (submitted_via in ('portal', 'admin')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);
comment on table public.payments is 'Pagos de una familia. Solo los confirmados descuentan saldo.';
create index payments_family_id_idx on public.payments (family_id);
create index payments_status_idx on public.payments (status);
create index payments_submitted_by_idx on public.payments (submitted_by);
create index payments_reviewed_by_idx on public.payments (reviewed_by);
create unique index payments_receipt_path_unique_idx on public.payments (receipt_path) where receipt_path is not null;

create table public.payment_items (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  fee_id uuid not null references public.fees (id) on delete restrict,
  amount integer not null check (amount > 0),
  unique (payment_id, fee_id)
);
comment on table public.payment_items is 'A qué cuotas se aplica cada pago.';
create index payment_items_fee_id_idx on public.payment_items (fee_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete restrict,
  payment_id uuid unique references public.payments (id) on delete set null,
  number text not null check (length(btrim(number)) > 0),
  issued_on date not null,
  amount integer not null check (amount >= 0),
  file_path text not null,
  file_name text,
  size_bytes integer,
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table public.invoices is 'Facturas en PDF que la familia descarga desde el portal.';
create index invoices_family_id_idx on public.invoices (family_id);

-- ---------------------------------------------------------------------------
-- Vinculación de cuentas de tutores con familias
-- ---------------------------------------------------------------------------
create table public.family_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  student_id uuid references public.students (id) on delete set null,
  status public.link_status not null default 'pending',
  auto_approved boolean not null default false,
  requested_at timestamptz not null default now(),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  unique (user_id, family_id)
);
comment on table public.family_links is 'Qué cuenta de Google puede ver qué familia. Solo vale el estado approved.';
create index family_links_family_id_idx on public.family_links (family_id);
create index family_links_status_idx on public.family_links (status);

create table private.link_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);
comment on table private.link_attempts is 'Intentos de vinculación, para frenar a quien prueba cédulas al azar.';
create index link_attempts_user_idx on private.link_attempts (user_id, attempted_at);
alter table private.link_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text,
  action text not null,
  actor_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
comment on table public.audit_log is 'Quién cambió qué y cuándo. Lo escriben los triggers; nadie lo edita.';
create index audit_log_table_row_idx on public.audit_log (table_name, row_id);
create index audit_log_created_at_idx on public.audit_log (created_at);

-- ---------------------------------------------------------------------------
-- Vistas de saldos (respetan RLS: security_invoker)
-- ---------------------------------------------------------------------------
create view public.fee_balances with (security_invoker = true) as
select
  f.id,
  f.student_id,
  f.family_id,
  f.concept,
  f.period_year,
  f.period_month,
  f.base_amount,
  f.discount_amount,
  f.amount,
  f.is_exempt,
  f.due_date,
  f.note,
  f.created_at,
  coalesce(c.total, 0)::integer as paid_amount,
  coalesce(p.total, 0)::integer as pending_amount,
  (f.amount - coalesce(c.total, 0))::integer as balance,
  case
    when f.is_exempt then 'exempt'
    when f.amount - coalesce(c.total, 0) <= 0 then 'paid'
    when coalesce(p.total, 0) > 0 then 'in_review'
    when private.today() > f.due_date then 'overdue'
    when coalesce(c.total, 0) > 0 then 'partial'
    else 'pending'
  end as state
from public.fees f
left join lateral (
  select sum(pi.amount) as total
  from public.payment_items pi
  join public.payments pay on pay.id = pi.payment_id
  where pi.fee_id = f.id and pay.status = 'confirmed'
) c on true
left join lateral (
  select sum(pi.amount) as total
  from public.payment_items pi
  join public.payments pay on pay.id = pi.payment_id
  where pi.fee_id = f.id and pay.status = 'pending'
) p on true;
comment on view public.fee_balances is 'Cada cuota con lo pagado, lo que está en revisión, el saldo y su estado.';

create view public.student_balances with (security_invoker = true) as
select
  b.student_id,
  sum(b.balance) filter (where b.balance > 0)::integer as balance,
  sum(b.balance) filter (where b.balance > 0 and b.due_date < private.today())::integer as overdue_balance,
  count(*) filter (where b.balance > 0 and b.due_date < private.today())::integer as overdue_count
from public.fee_balances b
group by b.student_id;

create view public.family_balances with (security_invoker = true) as
select
  b.family_id,
  sum(b.balance) filter (where b.balance > 0)::integer as balance,
  sum(b.balance) filter (where b.balance > 0 and b.due_date < private.today())::integer as overdue_balance,
  sum(b.pending_amount)::integer as pending_amount
from public.fee_balances b
group by b.family_id;

-- ---------------------------------------------------------------------------
-- Triggers de normalización y mantenimiento
-- ---------------------------------------------------------------------------
create function private.students_normalize() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.ci := private.normalize_ci(new.ci);
  new.first_name := btrim(new.first_name);
  new.last_name := btrim(new.last_name);
  new.discipline := nullif(btrim(new.discipline), '');
  if new.discount_type = 'none' then
    new.discount_value := 0;
  end if;
  return new;
end $$;

create function private.guardians_normalize() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.full_name := btrim(new.full_name);
  new.ci := nullif(private.normalize_ci(new.ci), '');
  new.email := nullif(lower(btrim(new.email)), '');
  new.phone := nullif(regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g'), '');
  return new;
end $$;

create function private.admin_allowlist_normalize() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end $$;

create function private.students_create_document_slots() returns trigger
language plpgsql set search_path = ''
as $$
begin
  insert into public.student_documents (student_id, kind)
  select new.id, k from unnest(enum_range(null::public.document_kind)) as k
  on conflict (student_id, kind) do nothing;
  return new;
end $$;

create trigger students_normalize before insert or update on public.students
  for each row execute function private.students_normalize();
create trigger students_set_updated_at before update on public.students
  for each row execute function private.set_updated_at();
create trigger students_create_document_slots after insert on public.students
  for each row execute function private.students_create_document_slots();

create trigger guardians_normalize before insert or update on public.guardians
  for each row execute function private.guardians_normalize();
create trigger guardians_set_updated_at before update on public.guardians
  for each row execute function private.set_updated_at();

create trigger admin_allowlist_normalize before insert or update on public.admin_allowlist
  for each row execute function private.admin_allowlist_normalize();

create trigger families_set_updated_at before update on public.families
  for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger settings_set_updated_at before update on public.settings
  for each row execute function private.set_updated_at();
create trigger student_documents_set_updated_at before update on public.student_documents
  for each row execute function private.set_updated_at();
