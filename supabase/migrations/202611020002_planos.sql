insert into public.planos(id,nome,valor,ativo) values
  ('mensal','Caderninho de Fiado: assinatura mensal',19.90,true),
  ('mensal_promo','Caderninho de Fiado: 1º mês promocional',14.90,true),
  ('anual','Caderninho de Fiado: plano anual (12 meses)',149.90,true)
on conflict(id) do update set nome=excluded.nome,valor=excluded.valor,ativo=excluded.ativo;

alter table public.assinaturas add column if not exists promo_consumida_em timestamptz;
alter table public.assinaturas add column if not exists valor numeric(10,2);

create table if not exists public.compras(
  mp_payment_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plano text not null check(plano='anual'),
  valor numeric(10,2) not null,
  status text not null check(status in ('aprovada','estornada')),
  valido_de timestamptz not null,
  valido_ate timestamptz not null,
  criado_em timestamptz not null default pg_catalog.now(),
  atualizado_em timestamptz not null default pg_catalog.now()
);
create index if not exists compras_user_validade_idx on public.compras(user_id,valido_ate desc) where status='aprovada';
alter table public.compras enable row level security;
drop policy if exists compras_leitura_propria on public.compras;
create policy compras_leitura_propria on public.compras for select to authenticated
  using(user_id=auth.uid() and public.mfa_ok());
revoke all on public.compras from public,anon,authenticated;
grant select on public.compras to authenticated;
grant all on public.compras to service_role;

create or replace function public.registrar_compra(
  p_payment_id text,p_user uuid,p_valor numeric,p_aprovado boolean
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_linha public.compras%rowtype;
  v_inicio timestamptz;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'permissao_negada' using errcode='42501'; end if;
  if p_payment_id is null or p_payment_id='' or p_user is null or p_valor is null or p_valor<0 or p_aprovado is null then
    raise exception 'parametros_invalidos';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user::text,0));
  if p_aprovado then
    select greatest(pg_catalog.now(),coalesce(pg_catalog.max(c.valido_ate),pg_catalog.now()))
      into v_inicio from public.compras c where c.user_id=p_user and c.status='aprovada';
    insert into public.compras(mp_payment_id,user_id,plano,valor,status,valido_de,valido_ate)
      values(p_payment_id,p_user,'anual',p_valor,'aprovada',v_inicio,v_inicio+interval '365 days')
      on conflict(mp_payment_id) do nothing;
  else
    update public.compras set status='estornada',atualizado_em=pg_catalog.now()
      where mp_payment_id=p_payment_id and user_id=p_user;
  end if;
  select * into v_linha from public.compras c where c.mp_payment_id=p_payment_id;
  if not found then return null; end if;
  return pg_catalog.to_jsonb(v_linha);
end;
$$;
revoke all on function public.registrar_compra(text,uuid,numeric,boolean) from public,anon,authenticated;
grant execute on function public.registrar_compra(text,uuid,numeric,boolean) to service_role;

create or replace function public.minha_situacao()
returns jsonb language sql stable security definer set search_path=''
as $$
  with conta as (
    select u.created_at from auth.users u where u.id=auth.uid() and public.mfa_ok()
  ), estado as (
    select a.status,a.valido_ate,a.promo_consumida_em from public.assinaturas a where a.user_id=auth.uid()
  ), precos as (
    select max(valor) filter(where id='mensal' and ativo) mensal,
      max(valor) filter(where id='mensal_promo' and ativo) promo,
      max(valor) filter(where id='anual' and ativo) anual from public.planos
  ), anual as (
    select max(c.valido_ate) filter(where c.status='aprovada') ate from public.compras c where c.user_id=auth.uid()
  ), dados as (
    select pg_catalog.now() agora, c.created_at+interval '3 days' teste_ate,
      e.status assinatura,e.valido_ate,e.promo_consumida_em,p.mensal,p.promo,p.anual,a.ate anual_ate,
      greatest(c.created_at+interval '3 days',
        case e.status when 'ativa' then e.valido_ate+interval '3 days'
          when 'pausada' then e.valido_ate when 'cancelada' then e.valido_ate
          when 'pendente' then e.valido_ate else null end,a.ate) liberado_ate
    from conta c left join estado e on true cross join precos p cross join anual a
  )
  select pg_catalog.jsonb_build_object(
    'agora',d.agora,'teste_ate',d.teste_ate,'assinatura',d.assinatura,'valido_ate',d.valido_ate,
    'liberado_ate',d.liberado_ate,'preco',d.mensal,
    'preco_promo',case when d.promo_consumida_em is null then d.promo else null end,
    'preco_anual',d.anual,'anual_ate',d.anual_ate,
    'plano',case when d.anual_ate>d.agora then 'anual' when d.assinatura is not null then 'mensal' else null end
  ) from dados d;
$$;
revoke all on function public.minha_situacao() from public,anon;
grant execute on function public.minha_situacao() to authenticated;
