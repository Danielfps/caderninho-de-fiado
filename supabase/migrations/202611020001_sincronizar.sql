create table if not exists public.sync_contas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rev bigint not null default 0,
  atualizado_em timestamptz not null default pg_catalog.now()
);

create table if not exists public.registros (
  user_id uuid not null references auth.users(id) on delete cascade,
  colecao text not null check (colecao in ('produtos','clientes','lanc','contas','materiais','receitas','config')),
  id text not null,
  dados jsonb,
  apagado boolean not null default false,
  rev bigint not null,
  aparelho text,
  atualizado_em timestamptz not null default pg_catalog.now(),
  primary key (user_id, colecao, id)
);
create index if not exists registros_user_rev_idx on public.registros(user_id, rev);

alter table public.sync_contas enable row level security;
alter table public.registros enable row level security;
revoke all on public.sync_contas, public.registros from public, anon, authenticated;
grant all on public.sync_contas, public.registros to service_role;

create or replace function public.sincronizar(
  desde bigint default 0,
  mudancas jsonb default '[]'::jsonb,
  aparelho text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_c text;
  v_id text;
  v_x boolean;
  v_d jsonb;
  v_rev bigint;
  v_out_rev bigint := coalesce(desde, 0);
  v_mais boolean := false;
  v_count integer;
  v_bytes bigint := 0;
  v_group_count integer;
  v_group_bytes bigint;
  v_total bigint;
  v_agora timestamptz := pg_catalog.now();
  v_out jsonb := '[]'::jsonb;
begin
  if v_user is null then raise exception 'sem_login'; end if;
  if not public.mfa_ok() then raise exception 'insufficient_aal'; end if;
  if mudancas is null or pg_catalog.jsonb_typeof(mudancas) <> 'array'
     or pg_catalog.jsonb_array_length(mudancas) > 500 then
    raise exception 'mudancas_invalidas';
  end if;

  for v_item in select e.value from pg_catalog.jsonb_array_elements(mudancas) as e(value) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object'
       or pg_catalog.jsonb_typeof(v_item -> 'c') <> 'string'
       or pg_catalog.jsonb_typeof(v_item -> 'id') <> 'string'
       or (v_item ? 'x' and pg_catalog.jsonb_typeof(v_item -> 'x') <> 'boolean') then
      raise exception 'mudancas_invalidas';
    end if;
    v_c := v_item ->> 'c'; v_id := v_item ->> 'id';
    v_x := coalesce((v_item ->> 'x')::boolean, false); v_d := v_item -> 'd';
    if v_c not in ('produtos','clientes','lanc','contas','materiais','receitas','config')
       or pg_catalog.char_length(v_id) not between 1 and 80
       or (v_x and v_d is not null and v_d <> 'null'::jsonb)
       or (not v_x and (v_d is null or pg_catalog.jsonb_typeof(v_d) <> 'object')) then
      raise exception 'mudancas_invalidas';
    end if;
    if not v_x and pg_catalog.octet_length(v_d::text) > 1048576 then raise exception 'registro_grande'; end if;
  end loop;

  -- A linha da conta serializa a atribuição de revisões entre chamadas concorrentes.
  insert into public.sync_contas(user_id) values (v_user) on conflict (user_id) do nothing;
  select s.rev into v_rev from public.sync_contas s where s.user_id = v_user for update;

  if pg_catalog.jsonb_array_length(mudancas) > 0 then
    select pg_catalog.count(*) into v_total from public.registros r where r.user_id = v_user;
    select v_total + pg_catalog.count(*) into v_total
    from (
      select distinct e.value ->> 'c' as c, e.value ->> 'id' as id
      from pg_catalog.jsonb_array_elements(mudancas) e(value)
      where not exists (
        select 1 from public.registros r where r.user_id = v_user
          and r.colecao = e.value ->> 'c' and r.id = e.value ->> 'id'
      )
    ) novos;
    if v_total > 100000 then raise exception 'muitos_registros'; end if;

    v_rev := v_rev + 1;
    for v_item in
      select e.value from pg_catalog.jsonb_array_elements(mudancas) with ordinality e(value, ord)
      where not exists (
        select 1 from pg_catalog.jsonb_array_elements(mudancas) with ordinality later(value, ord)
        where later.ord > e.ord and later.value ->> 'c' = e.value ->> 'c' and later.value ->> 'id' = e.value ->> 'id'
      ) order by e.ord
    loop
      v_c := v_item ->> 'c'; v_id := v_item ->> 'id';
      v_x := coalesce((v_item ->> 'x')::boolean, false);
      insert into public.registros(user_id,colecao,id,dados,apagado,rev,aparelho,atualizado_em)
      values(v_user,v_c,v_id,case when v_x then null else v_item -> 'd' end,v_x,v_rev,aparelho,v_agora)
      on conflict(user_id,colecao,id) do update set dados=excluded.dados,apagado=excluded.apagado,
        rev=excluded.rev,aparelho=excluded.aparelho,atualizado_em=excluded.atualizado_em;
    end loop;
    update public.sync_contas set rev=v_rev, atualizado_em=v_agora where user_id=v_user;
  end if;

  for v_rev in
    select distinct r.rev from public.registros r where r.user_id=v_user and r.rev > coalesce(desde,0) order by r.rev
  loop
    select pg_catalog.count(*), coalesce(pg_catalog.sum(
      pg_catalog.octet_length(pg_catalog.jsonb_build_object('c',r.colecao,'id',r.id,'d',r.dados,'x',r.apagado)::text)
    ),0) into v_group_count,v_group_bytes
    from public.registros r where r.user_id=v_user and r.rev=v_rev;
    if pg_catalog.jsonb_array_length(v_out) > 0 and
      (pg_catalog.jsonb_array_length(v_out)+v_group_count > 1000 or v_bytes+v_group_bytes > 3145728) then
      v_mais := true; exit;
    end if;
    select v_out || coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'c',r.colecao,'id',r.id,'d',r.dados,'x',r.apagado) order by r.colecao,r.id),'[]'::jsonb)
      into v_out from public.registros r where r.user_id=v_user and r.rev=v_rev;
    v_bytes := v_bytes+v_group_bytes;
    v_out_rev := v_rev;
  end loop;
  if exists(select 1 from public.registros r where r.user_id=v_user and r.rev>v_out_rev) then v_mais:=true; end if;
  if not v_mais then select s.rev into v_out_rev from public.sync_contas s where s.user_id=v_user; end if;
  return pg_catalog.jsonb_build_object('rev',v_out_rev,'mudancas',v_out,'mais',v_mais,'agora',v_agora);
end;
$$;
revoke all on function public.sincronizar(bigint,jsonb,text) from public,anon;
grant execute on function public.sincronizar(bigint,jsonb,text) to authenticated;
