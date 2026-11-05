alter table public.compras drop constraint if exists compras_plano_check;
alter table public.compras add constraint compras_plano_check check (plano in ('mensal', 'anual'));

drop function if exists public.registrar_compra(text, uuid, numeric, boolean);
create or replace function public.registrar_compra(
  p_payment_id text,
  p_user uuid,
  p_valor numeric,
  p_aprovado boolean,
  p_plano text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_linha public.compras%rowtype;
  v_inicio timestamptz;
  v_teste_ate timestamptz;
  v_duracao interval;
begin
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role' then
    raise exception 'permissao_negada' using errcode = '42501';
  end if;
  if p_payment_id is null or p_payment_id = '' or p_user is null or p_valor is null
     or p_valor < 0 or p_aprovado is null or p_plano is null or p_plano not in ('mensal', 'anual') then
    raise exception 'parametros_invalidos';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text, 0));
  if p_aprovado then
    select u.created_at + interval '3 days',
      greatest(pg_catalog.now(), u.created_at + interval '3 days',
        coalesce(pg_catalog.max(c.valido_ate), pg_catalog.now()))
      into v_teste_ate, v_inicio
    from auth.users u
    left join public.compras c on c.user_id = u.id and c.status = 'aprovada'
    where u.id = p_user
    group by u.created_at;
    if not found then raise exception 'conta_nao_encontrada'; end if;

    v_duracao := case p_plano when 'mensal' then interval '30 days' else interval '365 days' end;
    insert into public.compras(mp_payment_id, user_id, plano, valor, status, valido_de, valido_ate)
      values(p_payment_id, p_user, p_plano, p_valor, 'aprovada', v_inicio, v_inicio + v_duracao)
      on conflict(mp_payment_id) do nothing;
  else
    update public.compras
      set status = 'estornada', atualizado_em = pg_catalog.now()
      where mp_payment_id = p_payment_id and user_id = p_user;
  end if;

  select * into v_linha from public.compras c where c.mp_payment_id = p_payment_id;
  if not found then return null; end if;
  return pg_catalog.to_jsonb(v_linha);
end;
$$;
revoke all on function public.registrar_compra(text, uuid, numeric, boolean, text) from public, anon, authenticated;
grant execute on function public.registrar_compra(text, uuid, numeric, boolean, text) to service_role;

create or replace function public.minha_situacao()
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with conta as (
    select u.created_at
    from auth.users u
    where u.id = auth.uid() and public.mfa_ok()
  ), valores as (
    select
      pg_catalog.now() as agora,
      c.created_at + interval '3 days' as teste_ate,
      (select pg_catalog.max(x.valido_ate) from public.compras x
        where x.user_id = auth.uid() and x.status = 'aprovada') as pago_ate,
      (select x.plano from public.compras x
        where x.user_id = auth.uid() and x.status = 'aprovada'
        order by x.valido_ate desc, x.criado_em desc, x.mp_payment_id desc limit 1) as plano,
      (select p.valor from public.planos p where p.id = 'mensal' and p.ativo) as preco,
      (select p.valor from public.planos p where p.id = 'mensal_promo' and p.ativo
        and not exists(select 1 from public.compras x where x.user_id = auth.uid()
          and x.plano = 'mensal' and x.status = 'aprovada')) as preco_promo,
      (select p.valor from public.planos p where p.id = 'anual' and p.ativo) as preco_anual
    from conta c
  )
  select pg_catalog.jsonb_build_object(
    'agora', v.agora,
    'teste_ate', v.teste_ate,
    'pago_ate', v.pago_ate,
    'plano', v.plano,
    'liberado_ate', greatest(v.teste_ate, coalesce(v.pago_ate, v.teste_ate)),
    'preco', v.preco,
    'preco_promo', v.preco_promo,
    'preco_anual', v.preco_anual
  )
  from valores v;
$$;
revoke all on function public.minha_situacao() from public, anon;
grant execute on function public.minha_situacao() to authenticated;
