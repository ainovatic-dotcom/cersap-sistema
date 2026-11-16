-- =============================================================================
-- 07 · Endurecer una función que ya venía con el proyecto
--
-- rls_auto_enable() es la función de Supabase que activa RLS sola en cada tabla
-- nueva (se dispara como event trigger). No hace falta que nadie la llame por la
-- API, así que se le quita el permiso de ejecución a los roles públicos.
-- =============================================================================
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
