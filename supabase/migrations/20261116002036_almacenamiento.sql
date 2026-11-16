-- =============================================================================
-- 05 · Almacenamiento de archivos
--
-- Cuatro buckets, todos privados. Los archivos se abren con enlaces firmados
-- que vencen a los pocos minutos; no existe URL pública.
--
--   student-photos      {family_id}/{student_id}-{ts}.jpg   admin escribe · familia ve
--   student-documents   {student_id}/{tipo}-{ts}.ext        SOLO administración
--   payment-receipts    {family_id}/{uuid}.ext              familia sube y ve · admin todo
--   invoices            {family_id}/{uuid}.pdf              admin escribe · familia ve
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('student-photos', 'student-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('student-documents', 'student-documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('invoices', 'invoices', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "CERSAP: administración gestiona los archivos" on storage.objects
  for all to authenticated
  using (
    bucket_id in ('student-photos', 'student-documents', 'payment-receipts', 'invoices')
    and (select private.is_admin())
  )
  with check (
    bucket_id in ('student-photos', 'student-documents', 'payment-receipts', 'invoices')
    and (select private.is_admin())
  );

-- student-documents queda afuera a propósito: cédulas y fichas médicas no se ven en el portal.
create policy "CERSAP: la familia ve sus archivos" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('student-photos', 'payment-receipts', 'invoices')
    and private.has_family_access(private.try_uuid((storage.foldername(name))[1]))
  );

create policy "CERSAP: la familia sube sus comprobantes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and private.has_family_access(private.try_uuid((storage.foldername(name))[1]))
  );
