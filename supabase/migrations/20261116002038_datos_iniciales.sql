-- =============================================================================
-- 06 · Datos iniciales
-- =============================================================================

-- Fila única de configuración. Los montos se cargan después desde la app.
insert into public.settings (id, org_name)
values (true, 'CERSAP')
on conflict (id) do nothing;

-- Primer administrador. Los demás se agregan desde Configuración.
insert into public.admin_allowlist (email, note)
values ('ainovatic@gmail.com', 'Administrador inicial')
on conflict (email) do nothing;
