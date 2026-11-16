-- =============================================================================
-- 02 · Seguridad: roles, permisos (GRANT) y políticas RLS
--
-- Modelo:
--   · Administración: acceso completo a las tablas, siempre pasando por RLS.
--   · Tutores: NO leen ninguna tabla directo (salvo su propio perfil). Todo lo
--     que ve el portal sale de funciones portal_* que devuelven solo lo permitido.
--   · anon (sin sesión): no tiene permiso sobre nada.
--
-- Las funciones SECURITY DEFINER viven en el esquema private (no expuesto por
-- la API) y siempre verifican quién llama.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Funciones de autorización (se usan dentro de las políticas RLS)
-- ---------------------------------------------------------------------------
create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function private.has_family_access(p_family_id uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.family_links
    where user_id = (select auth.uid())
      and family_id = p_family_id
      and status = 'approved'
  );
$$;

create function private.require_admin() returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception 'Solo administración puede hacer esto.' using errcode = '42501';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Perfil automático al iniciar sesión por primera vez
-- Un correo de admin_allowlist entra como admin solo si la cuenta es de Google
-- (y únicamente de Google) con el correo verificado.
-- ---------------------------------------------------------------------------
create function private.handle_auth_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(coalesce(new.email, ''));
  v_providers jsonb := coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb);
  v_can_be_admin boolean;
begin
  v_can_be_admin :=
    new.email_confirmed_at is not null
    and v_providers ? 'google'
    and not (v_providers ? 'email')
    and not (v_providers ? 'phone')
    and exists (select 1 from public.admin_allowlist a where a.email = v_email);

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    v_email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    case when v_can_be_admin then 'admin'::public.user_role else 'tutor'::public.user_role end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        role = case when v_can_be_admin then 'admin'::public.user_role else public.profiles.role end;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_auth_user();
create trigger on_auth_user_updated
  after update of email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data on auth.users
  for each row execute function private.handle_auth_user();

-- Alta y baja de administradores desde la lista de correos
create function private.admin_allowlist_sync() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles p
    set role = 'admin'
    where p.email = new.email
      and exists (
        select 1 from auth.users u
        where u.id = p.id
          and u.email_confirmed_at is not null
          and coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'google'
          and not (coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'email')
          and not (coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'phone')
      );
    return new;
  end if;

  update public.profiles p set role = 'tutor' where p.email = old.email;
  return old;
end $$;

create function private.admin_allowlist_guard() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (select count(*) from public.admin_allowlist) <= 1 then
    raise exception 'Tiene que quedar al menos un administrador.' using errcode = 'P0001';
  end if;
  if old.email = lower(coalesce((select auth.jwt() ->> 'email'), '')) then
    raise exception 'No podés quitarte a vos mismo como administrador.' using errcode = 'P0001';
  end if;
  return old;
end $$;

create trigger admin_allowlist_guard before delete on public.admin_allowlist
  for each row execute function private.admin_allowlist_guard();
create trigger admin_allowlist_sync after insert or delete on public.admin_allowlist
  for each row execute function private.admin_allowlist_sync();

-- ---------------------------------------------------------------------------
-- Trazabilidad de documentos reemplazados
-- ---------------------------------------------------------------------------
create function private.student_documents_keep_version() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.file_path is not null and old.file_path is distinct from new.file_path then
    insert into public.student_document_versions
      (document_id, file_path, file_name, mime_type, size_bytes, uploaded_by, uploaded_at, replaced_by)
    values
      (old.id, old.file_path, old.file_name, old.mime_type, old.size_bytes, old.uploaded_by, old.uploaded_at, (select auth.uid()));
  end if;
  return new;
end $$;

create trigger student_documents_keep_version before update on public.student_documents
  for each row execute function private.student_documents_keep_version();

-- ---------------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------------
create function private.audit() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
begin
  insert into public.audit_log (table_name, row_id, action, actor_id, old_data, new_data)
  values (tg_table_name, coalesce(v_row ->> 'id', v_row ->> 'email'), tg_op, (select auth.uid()), v_old, v_new);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'profiles', 'admin_allowlist', 'settings', 'families', 'guardians', 'students',
    'student_withdrawals', 'student_documents', 'fees', 'payments', 'payment_items',
    'invoices', 'family_links'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit()',
      v_table || '_audit', v_table
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Permisos (GRANT). Solo lo mínimo, y solo al rol authenticated.
-- ---------------------------------------------------------------------------
grant usage on schema private to authenticated;
grant execute on function
  private.today(),
  private.normalize_ci(text),
  private.try_uuid(text),
  private.is_admin(),
  private.has_family_access(uuid),
  private.require_admin()
to authenticated;

grant select on public.profiles to authenticated;
grant select, insert, delete on public.admin_allowlist to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.families to authenticated;
grant select, insert, update, delete on public.guardians to authenticated;
grant select, insert, update on public.students to authenticated;
grant select, insert, update on public.student_withdrawals to authenticated;
grant select, insert on public.student_notes to authenticated;
grant select, insert, update on public.student_documents to authenticated;
grant select on public.student_document_versions to authenticated;
grant select, insert, update, delete on public.fees to authenticated;
grant select, insert, update on public.payments to authenticated;
grant select, insert, update, delete on public.payment_items to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, update on public.family_links to authenticated;
grant select on public.audit_log to authenticated;
grant select on public.fee_balances, public.student_balances, public.family_balances to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.admin_allowlist enable row level security;
alter table public.settings enable row level security;
alter table public.families enable row level security;
alter table public.guardians enable row level security;
alter table public.students enable row level security;
alter table public.student_withdrawals enable row level security;
alter table public.student_notes enable row level security;
alter table public.student_documents enable row level security;
alter table public.student_document_versions enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.payment_items enable row level security;
alter table public.invoices enable row level security;
alter table public.family_links enable row level security;
alter table public.audit_log enable row level security;

-- Perfil: cada uno ve el suyo; administración ve todos. Nadie lo edita desde el cliente.
create policy "Cada usuario ve su perfil" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

-- Tablas que administración gestiona completas
create policy "Administración gestiona la lista de admins" on public.admin_allowlist
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona la configuración" on public.settings
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona familias" on public.families
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona tutores" on public.guardians
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona alumnos" on public.students
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona bajas" on public.student_withdrawals
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona documentos" on public.student_documents
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona cuotas" on public.fees
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona pagos" on public.payments
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona el detalle de pagos" on public.payment_items
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona facturas" on public.invoices
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy "Administración gestiona vinculaciones" on public.family_links
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Seguimiento: solo leer y agregar, firmando con el propio usuario
create policy "Administración lee el seguimiento" on public.student_notes
  for select to authenticated
  using ((select private.is_admin()));
create policy "Administración agrega seguimiento" on public.student_notes
  for insert to authenticated
  with check ((select private.is_admin()) and author_id = (select auth.uid()));

-- Solo lectura
create policy "Administración lee versiones de documentos" on public.student_document_versions
  for select to authenticated
  using ((select private.is_admin()));
create policy "Administración lee la auditoría" on public.audit_log
  for select to authenticated
  using ((select private.is_admin()));
