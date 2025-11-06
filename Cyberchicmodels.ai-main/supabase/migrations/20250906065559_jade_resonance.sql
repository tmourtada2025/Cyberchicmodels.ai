do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='model_photos'
      and policyname='Enable all operations for authenticated users'
  ) then
    execute $sql$
      create policy "Enable all operations for authenticated users"
      on public.model_photos
      for all
      to authenticated
      using (true)
      with check (true)
    $sql$;
  else
    -- optional: ensure semantics match
    execute $sql$
      alter policy "Enable all operations for authenticated users"
      on public.model_photos
      for all
      to authenticated
      using (true)
      with check (true)
    $sql$;
  end if;
end$$;
