import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import { PGlite } from './node_modules/@electric-sql/pglite/dist/index.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const usuarios = {
  ana: '11111111-1111-4111-8111-111111111111',
  bia: '22222222-2222-4222-8222-222222222222',
};

async function criarBanco() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,created_at timestamptz default now());
    create table auth.mfa_factors(id uuid default gen_random_uuid(),user_id uuid,status text,factor_type text default 'totp');
    create or replace function auth.uid() returns uuid language sql stable as $$
      select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
    $$;
    create or replace function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
    $$;
    grant usage on schema auth to anon,authenticated,service_role;
    grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;`);
  await db.query('insert into auth.users(id,email) values ($1,$2),($3,$4)', [usuarios.ana,'ana@example.test',usuarios.bia,'bia@example.test']);
  const files = (await readdir(path.join(raiz,'supabase/migrations'))).filter(x=>x.endsWith('.sql')).sort();
  for (const file of files) await db.exec(await readFile(path.join(raiz,'supabase/migrations',file),'utf8'));
  return db;
}
async function como(db, user, fn, { aal='aal1', role='authenticated' }={}) {
  await db.query('select set_config($1,$2,false)', ['request.jwt.claims', JSON.stringify({sub:user,role,aal})]);
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
async function rpc(db, user, desde=0, mudancas=[], opts={}) {
  return como(db,user,async()=> (await db.query('select public.sincronizar($1,$2::jsonb,$3) as r',[desde,JSON.stringify(mudancas),'teste'])).rows[0].r,opts);
}

test('migrações reais: dois aparelhos, lápide, repetição e isolamento por conta', async t => {
  const db=await criarBanco(); t.after(()=>db.close());
  const item={c:'clientes',id:'abc',d:{nome:'Ana'}};
  const subiu=await rpc(db,usuarios.ana,0,[item]);
  assert.equal(subiu.rev,1); assert.equal(subiu.mudancas[0].d.nome,'Ana');
  const outro=await rpc(db,usuarios.ana,0,[]);
  assert.deepEqual(outro.mudancas,subiu.mudancas);
  const tomb=await rpc(db,usuarios.ana,1,[{c:'clientes',id:'abc',x:true}]);
  assert.equal(tomb.rev,2); assert.equal(tomb.mudancas[0].x,true); assert.equal(tomb.mudancas[0].d,null);
  const repetido=await rpc(db,usuarios.ana,2,[{c:'produtos',id:'p',d:{nome:'velho'}},{c:'produtos',id:'p',d:{nome:'novo'}}]);
  assert.equal(repetido.rev,3); assert.equal(repetido.mudancas.length,1); assert.equal(repetido.mudancas[0].d.nome,'novo');
  assert.deepEqual((await rpc(db,usuarios.bia)).mudancas,[]);
  await assert.rejects(()=>como(db,usuarios.ana,()=>db.query('select * from public.registros')),/permission denied/);
  await assert.rejects(()=>como(db,null,()=>db.query('select public.sincronizar()')),/sem_login/);
  await assert.rejects(()=>como(db,usuarios.ana,()=>db.query('select public.sincronizar()'),{role:'anon'}),/permission denied/);
});

test('migrações reais: validações, limites de tamanho e MFA', async t => {
  const db=await criarBanco(); t.after(()=>db.close());
  await assert.rejects(()=>rpc(db,usuarios.ana,0,Array.from({length:501},(_,i)=>({c:'clientes',id:String(i),d:{}}))),/mudancas_invalidas/);
  await assert.rejects(()=>rpc(db,usuarios.ana,0,[{c:'errada',id:'x',d:{}}]),/mudancas_invalidas/);
  await assert.rejects(()=>rpc(db,usuarios.ana,0,[{c:'clientes',id:'',d:{}}]),/mudancas_invalidas/);
  await assert.rejects(()=>rpc(db,usuarios.ana,0,[{c:'clientes',id:'x',d:{texto:'x'.repeat(1048580)}}]),/registro_grande/);
  await db.query("insert into auth.mfa_factors(user_id,status) values ($1,'verified')",[usuarios.ana]);
  await assert.rejects(()=>rpc(db,usuarios.ana),/insufficient_aal/);
  const ok=await rpc(db,usuarios.ana,0,[],{aal:'aal2'}); assert.equal(ok.rev,0);
  const situacao=await como(db,usuarios.ana,()=>db.query('select public.minha_situacao() as s'),{aal:'aal2'});
  assert.equal(situacao.rows[0].s.preco,19.9);
});

test('migrações reais: páginas respeitam revisão e cursor sem perda nem repetição', async t => {
  const db=await criarBanco(); t.after(()=>db.close());
  // Três revisões cheias: cada pedido admite até 500 alterações.
  for(let lote=0;lote<3;lote++) {
    const arr=Array.from({length:500},(_,i)=>({c:'clientes',id:`${lote}-${i}`,d:{nome:`${lote}-${i}`}}));
    await rpc(db,usuarios.ana,0,arr);
  }
  let cursor=0, recebidos=[];
  for(let pagina=0;pagina<5;pagina++) {
    const resposta=await rpc(db,usuarios.ana,cursor,[]);
    recebidos.push(...resposta.mudancas.map(x=>x.id));
    if(!resposta.mais) { assert.equal(resposta.rev,3); break; }
    assert.ok(resposta.rev>cursor); cursor=resposta.rev;
  }
  assert.equal(recebidos.length,1500); assert.equal(new Set(recebidos).size,1500);
});

test('migrações reais: situação, compra anual idempotente, extensões e estorno', async t => {
  const db=await criarBanco(); t.after(()=>db.close());
  const su=()=>como(db,usuarios.ana,()=>db.query('select public.minha_situacao() as s'));
  let situacao=(await su()).rows[0].s;
  assert.equal(situacao.preco_promo,14.9); assert.equal(situacao.preco_anual,149.9); assert.equal(situacao.plano,null);
  const comprar=(id,ok=true)=>como(db,usuarios.ana,()=>db.query('select public.registrar_compra($1,$2,$3,$4) as r',[id,usuarios.ana,149.9,ok]),{role:'service_role'});
  await assert.rejects(()=>como(db,usuarios.ana,()=>db.query('select public.registrar_compra($1,$2,$3,true)',['negado',usuarios.ana,149.9]),{role:'authenticated'}),/permission denied/);
  const primeira=(await comprar('pay-1')).rows[0].r;
  await comprar('pay-1');
  const segunda=(await comprar('pay-2')).rows[0].r;
  assert.equal(new Date(segunda.valido_ate).getTime()-new Date(primeira.valido_ate).getTime(),365*86400000);
  situacao=(await su()).rows[0].s; assert.equal(situacao.plano,'anual'); assert.equal(situacao.preco_promo,14.9);
  await comprar('pay-1',false);
  situacao=(await su()).rows[0].s; assert.equal(situacao.anual_ate,segunda.valido_ate);
  const comprasAna=await como(db,usuarios.ana,()=>db.query('select count(*)::int n from public.compras'));
  const comprasBia=await como(db,usuarios.bia,()=>db.query('select count(*)::int n from public.compras'));
  assert.equal(comprasAna.rows[0].n,2); assert.equal(comprasBia.rows[0].n,0);
  await db.query('insert into public.assinaturas(user_id,status,valido_ate,promo_consumida_em) values($1,$2,now()+interval \'2 days\',now())',[usuarios.ana,'ativa']);
  situacao=(await su()).rows[0].s; assert.equal(situacao.preco_promo,null); assert.equal(situacao.plano,'anual');
});
