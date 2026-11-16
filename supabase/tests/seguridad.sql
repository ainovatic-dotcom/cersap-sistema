-- =============================================================================
-- Prueba de seguridad y reglas de negocio
--
-- Cómo correrla: pegar todo en el SQL Editor de Supabase y ejecutar.
-- Crea usuarios y datos de prueba, actúa como cada uno (admin, tutor vinculado,
-- tutor sin relación) y verifica que cada cual vea y pueda hacer solo lo suyo.
--
-- NO deja nada en la base: termina a propósito con un error que deshace todo.
--   · "OK: N verificaciones pasaron"  -> todo bien.
--   · "FALLO n: ..."                  -> hay algo que revisar.
-- =============================================================================
do $$
declare
  v_admin uuid := gen_random_uuid();
  v_tutor_a uuid := gen_random_uuid();   -- su Gmail está en la ficha de la familia
  v_tutor_b uuid := gen_random_uuid();   -- no tiene relación con la familia
  v_fake uuid := gen_random_uuid();      -- cuenta con contraseña y correo de la lista de admins
  v_family uuid;
  v_s1 uuid;
  v_s2 uuid;
  v_fee1 uuid;
  v_fee2 uuid;
  v_pay uuid;
  v_link uuid;
  v_receipt text;
  v_year int := extract(year from private.today())::int;
  v_month int := extract(month from private.today())::int;
  v_next_year int;
  v_next_month int;
  v_n int;
  v_txt text;
  v_json jsonb;
  v_ok boolean;
  v_checks int := 0;
begin
  v_next_year := case when v_month = 12 then v_year + 1 else v_year end;
  v_next_month := case when v_month = 12 then 1 else v_month + 1 end;

  -- -------------------------------------------------------------------------
  -- Usuarios de prueba
  -- -------------------------------------------------------------------------
  insert into public.admin_allowlist (email) values ('prueba.admin@gmail.com'), ('prueba.falso@gmail.com');

  insert into auth.users
    (instance_id, id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated', 'prueba.admin@gmail.com', now(),
     '{"provider":"google","providers":["google"]}', '{"full_name":"Admin de prueba"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_tutor_a, 'authenticated', 'authenticated', 'prueba.papa@gmail.com', now(),
     '{"provider":"google","providers":["google"]}', '{"full_name":"Papá de prueba"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_tutor_b, 'authenticated', 'authenticated', 'prueba.curioso@gmail.com', now(),
     '{"provider":"google","providers":["google"]}', '{"full_name":"Curioso de prueba"}', now(), now()),
    ('00000000-0000-0000-0000-000000000000', v_fake, 'authenticated', 'authenticated', 'prueba.falso@gmail.com', now(),
     '{"provider":"email","providers":["email"]}', '{}', now(), now());

  if (select role from public.profiles where id = v_admin) <> 'admin' then
    raise exception 'FALLO 1: un correo de la lista que entra con Google debía ser admin';
  end if;
  if (select role from public.profiles where id = v_tutor_a) <> 'tutor' then
    raise exception 'FALLO 2: un correo cualquiera debía entrar como tutor';
  end if;
  if (select role from public.profiles where id = v_fake) <> 'tutor' then
    raise exception 'FALLO 3: una cuenta con contraseña no debía ser admin aunque su correo esté en la lista';
  end if;
  v_checks := v_checks + 3;

  -- -------------------------------------------------------------------------
  -- Como ADMINISTRACIÓN
  -- -------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'role', 'authenticated', 'email', 'prueba.admin@gmail.com')::text, true);
  set local role authenticated;

  update public.settings set monthly_fee = 200000, enrollment_fee = 100000;
  insert into public.families (name) values ('Familia de prueba') returning id into v_family;
  insert into public.guardians (family_id, full_name, relationship, email, is_primary)
  values (v_family, 'Papá de prueba', 'father', '  Prueba.Papa@Gmail.com ', true);
  insert into public.students (family_id, first_name, last_name, ci, birth_date, enrolled_on)
  values (v_family, 'Ana', 'Prueba', '99.123.456', '2015-03-10', make_date(v_year, 1, 10)) returning id into v_s1;
  insert into public.students (family_id, first_name, last_name, ci, birth_date, enrolled_on, discount_type, discount_value)
  values (v_family, 'Beto', 'Prueba', '99123457', '2017-07-20', make_date(v_year, 1, 10), 'percent', 25) returning id into v_s2;

  if (select ci from public.students where id = v_s1) <> '99123456' then
    raise exception 'FALLO 4: la cédula no se normalizó';
  end if;
  if (select count(*) from public.student_documents where student_id = v_s1) <> 3 then
    raise exception 'FALLO 5: el alumno debía nacer con sus 3 documentos pendientes';
  end if;

  v_n := public.generate_monthly_fees(v_year, v_month);
  if v_n <> 2 then raise exception 'FALLO 6: debía generar 2 cuotas y generó %', v_n; end if;
  v_n := public.generate_monthly_fees(v_year, v_month);
  if v_n <> 0 then raise exception 'FALLO 7: generar dos veces el mismo mes duplicó cuotas'; end if;

  select id into v_fee1 from public.fees where student_id = v_s1 and concept = 'monthly';
  select id into v_fee2 from public.fees where student_id = v_s2 and concept = 'monthly';
  if (select amount from public.fees where id = v_fee2) <> 150000 then
    raise exception 'FALLO 8: el descuento del 25%% está mal calculado';
  end if;

  perform public.create_enrollment_fee(v_s1, v_year);
  v_ok := false;
  begin
    perform public.create_enrollment_fee(v_s1, v_year);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 9: dejó duplicar la matrícula del año'; end if;

  perform public.register_payment(v_family, 'cash', private.today(),
    jsonb_build_array(jsonb_build_object('fee_id', v_fee1, 'amount', 50000)));
  if (select balance from public.fee_balances where id = v_fee1) <> 150000 then
    raise exception 'FALLO 10: el saldo después de un pago parcial no cierra';
  end if;

  v_ok := false;
  begin
    perform public.register_payment(v_family, 'cash', private.today(),
      jsonb_build_array(jsonb_build_object('fee_id', v_fee1, 'amount', 150001)));
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 11: dejó cobrar más que el saldo de la cuota'; end if;

  v_json := public.admin_dashboard();
  if jsonb_array_length(v_json -> 'collection_series') <> 6 or (v_json -> 'month_states' ->> 'partial')::int <> 1 then
    raise exception 'FALLO 12: el panel no trae la serie de 6 meses o el estado del mes';
  end if;
  v_checks := v_checks + 9;

  -- Un comprobante de prueba en el almacenamiento (lo carga el sistema, no el tutor)
  reset role;
  v_receipt := v_family::text || '/comprobante-de-prueba.jpg';
  insert into storage.objects (bucket_id, name) values ('payment-receipts', v_receipt);
  insert into storage.objects (bucket_id, name) values ('student-documents', v_s1::text || '/ci_front-prueba.jpg');

  -- -------------------------------------------------------------------------
  -- Como TUTOR SIN RELACIÓN con la familia
  -- -------------------------------------------------------------------------
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_tutor_b, 'role', 'authenticated', 'email', 'prueba.curioso@gmail.com')::text, true);
  set local role authenticated;

  if (select count(*) from public.students) <> 0 then
    raise exception 'FALLO 13: un tutor puede leer la tabla de alumnos';
  end if;
  if (select count(*) from public.fees) + (select count(*) from public.payments)
     + (select count(*) from public.guardians) + (select count(*) from public.families)
     + (select count(*) from public.settings) + (select count(*) from public.admin_allowlist)
     + (select count(*) from public.family_links) + (select count(*) from public.audit_log)
     + (select count(*) from public.student_documents) + (select count(*) from public.fee_balances) <> 0 then
    raise exception 'FALLO 14: un tutor puede leer tablas internas';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'FALLO 15: un tutor ve perfiles de otras personas';
  end if;
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'FALLO 16: un tutor sin vínculo ve archivos';
  end if;

  v_ok := false;
  begin
    update public.profiles set role = 'admin' where id = v_tutor_b;
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 17: un tutor pudo cambiar su propio rol'; end if;

  v_ok := false;
  begin
    insert into public.family_links (user_id, family_id, status) values (v_tutor_b, v_family, 'approved');
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 18: un tutor pudo vincularse solo, sin validar'; end if;

  v_ok := false;
  begin
    perform public.generate_monthly_fees(v_next_year, v_next_month);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 19: un tutor pudo generar cuotas'; end if;

  v_ok := false;
  begin
    perform public.admin_dashboard();
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 20: un tutor pudo leer el panel de administración'; end if;

  v_ok := false;
  begin
    perform public.review_payment(gen_random_uuid(), true);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 21: un tutor pudo revisar pagos'; end if;

  v_ok := false;
  begin
    perform public.portal_submit_payment(v_family, array[v_fee2], private.today(), v_receipt);
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 22: un tutor sin vínculo pudo informar un pago de otra familia'; end if;

  v_txt := public.request_family_link('99123456', '2015-03-11');
  if v_txt <> 'not_found' then raise exception 'FALLO 23: cédula correcta con fecha incorrecta devolvió %', v_txt; end if;
  v_txt := public.request_family_link('99.123.456', '2015-03-10');
  if v_txt <> 'pending' then raise exception 'FALLO 24: sin Gmail en la ficha debía quedar pendiente y devolvió %', v_txt; end if;

  v_json := public.portal_overview();
  if jsonb_array_length(v_json -> 'children') <> 0 or jsonb_array_length(v_json -> 'families') <> 0 then
    raise exception 'FALLO 25: una solicitud pendiente ya muestra datos de la familia';
  end if;
  if v_json -> 'links' -> 0 ->> 'status' <> 'pending' then
    raise exception 'FALLO 26: el portal no informa la solicitud pendiente';
  end if;
  v_checks := v_checks + 14;

  -- -------------------------------------------------------------------------
  -- Como TUTOR cuyo Gmail está en la ficha de la familia
  -- -------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_tutor_a, 'role', 'authenticated', 'email', 'prueba.papa@gmail.com')::text, true);
  set local role authenticated;

  v_txt := public.request_family_link('99123457', '2017-07-20');
  if v_txt <> 'approved' then raise exception 'FALLO 27: con el Gmail en la ficha debía aprobarse sola y devolvió %', v_txt; end if;

  v_json := public.portal_overview();
  if jsonb_array_length(v_json -> 'children') <> 2 then
    raise exception 'FALLO 28: el tutor vinculado debía ver a sus 2 hijos';
  end if;
  if v_json::text ~ '99123456|99123457' or v_json::text like '%"ci"%' then
    raise exception 'FALLO 29: el portal está devolviendo cédulas';
  end if;
  if (select count(*) from public.students) <> 0 then
    raise exception 'FALLO 30: el tutor vinculado puede leer la tabla de alumnos directo';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'payment-receipts') <> 1 then
    raise exception 'FALLO 31: el tutor vinculado no ve el comprobante de su familia';
  end if;
  if (select count(*) from storage.objects where bucket_id = 'student-documents') <> 0 then
    raise exception 'FALLO 32: el tutor vinculado ve cédulas o fichas médicas';
  end if;

  v_pay := public.portal_submit_payment(v_family, array[v_fee2], private.today(), v_receipt, 'Transferencia de prueba');
  reset role;
  if (select state from public.fee_balances where id = v_fee2) <> 'in_review' then
    raise exception 'FALLO 33: la cuota informada debía quedar en revisión';
  end if;
  if (select balance from public.fee_balances where id = v_fee2) <> 150000 then
    raise exception 'FALLO 34: un pago sin confirmar descontó saldo';
  end if;

  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_tutor_a, 'role', 'authenticated', 'email', 'prueba.papa@gmail.com')::text, true);
  set local role authenticated;
  v_ok := false;
  begin
    perform public.portal_submit_payment(v_family, array[v_fee2], private.today(), v_receipt);
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 35: dejó informar dos veces la misma cuota'; end if;
  v_checks := v_checks + 9;

  -- -------------------------------------------------------------------------
  -- De nuevo como ADMINISTRACIÓN: confirmar, aprobar, revocar, dar de baja
  -- -------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'role', 'authenticated', 'email', 'prueba.admin@gmail.com')::text, true);
  set local role authenticated;

  if public.review_payment(v_pay, true) <> 'confirmed' then
    raise exception 'FALLO 36: no confirmó el pago';
  end if;
  if (select state from public.fee_balances where id = v_fee2) <> 'paid' then
    raise exception 'FALLO 37: la cuota confirmada debía quedar pagada';
  end if;
  if (public.admin_dashboard() ->> 'links_to_review')::int <> 1 then
    raise exception 'FALLO 38: el panel no cuenta la vinculación pendiente';
  end if;

  select id into v_link from public.family_links where user_id = v_tutor_b;
  perform public.set_family_link_status(v_link, 'approved');

  perform public.withdraw_student(v_s2, private.today(), 'Mudanza', 'Prueba');
  v_n := public.generate_monthly_fees(v_next_year, v_next_month);
  if v_n <> 1 then
    raise exception 'FALLO 39: el mes siguiente a la baja debía generar 1 cuota y generó %', v_n;
  end if;
  if (select count(*) from public.fees where student_id = v_s2 and concept = 'monthly') <> 1 then
    raise exception 'FALLO 40: la baja borró o duplicó la cuota del mes en que se comunicó';
  end if;

  v_ok := false;
  begin
    delete from public.admin_allowlist where email = 'prueba.admin@gmail.com';
  exception when others then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 41: un admin pudo quitarse a sí mismo'; end if;

  v_ok := false;
  begin
    update public.student_notes set body = 'x' where false;
    delete from public.audit_log where true;
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 42: se puede editar el seguimiento o borrar la auditoría'; end if;
  v_checks := v_checks + 7;

  -- El tutor B ahora aprobado ve a la familia; al revocarlo deja de verla
  reset role;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_tutor_b, 'role', 'authenticated', 'email', 'prueba.curioso@gmail.com')::text, true);
  set local role authenticated;
  if jsonb_array_length(public.portal_overview() -> 'children') <> 2 then
    raise exception 'FALLO 43: el tutor aprobado por administración no ve a los hijos';
  end if;

  reset role;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_admin, 'role', 'authenticated', 'email', 'prueba.admin@gmail.com')::text, true);
  set local role authenticated;
  perform public.set_family_link_status(v_link, 'revoked');

  reset role;
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', v_tutor_b, 'role', 'authenticated', 'email', 'prueba.curioso@gmail.com')::text, true);
  set local role authenticated;
  if jsonb_array_length(public.portal_overview() -> 'children') <> 0 then
    raise exception 'FALLO 44: un acceso revocado sigue viendo a la familia';
  end if;
  v_checks := v_checks + 2;

  -- -------------------------------------------------------------------------
  -- Sin sesión (anon): no puede tocar nada
  -- -------------------------------------------------------------------------
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;

  v_ok := false;
  begin
    perform count(*) from public.students;
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 45: sin sesión se puede leer alumnos'; end if;

  v_ok := false;
  begin
    perform public.portal_overview();
  exception when insufficient_privilege then v_ok := true;
  end;
  if not v_ok then raise exception 'FALLO 46: sin sesión se puede llamar al portal'; end if;
  v_checks := v_checks + 2;

  reset role;
  raise exception 'OK: % verificaciones pasaron. No quedó ningún dato de prueba en la base.', v_checks;
end $$;
