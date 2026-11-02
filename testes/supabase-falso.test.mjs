import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { criarSupabaseFalso } from './supabase-falso.mjs';

test('servidor falso via HTTP: conta, login, rotação de token, RPC, expiração e indisponibilidade',async t=>{
  const falso=await criarSupabaseFalso();const server=createServer((req,res)=>falso.tratar(req,res,req.url.split('?')[0].replace(/^\//,'')));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;t.after(async()=>{await new Promise(r=>server.close(r));await falso.fechar();});
  const chamada=async(path,{method='GET',body,token,apikey=falso.chave}={})=>{const r=await fetch(`${base}/${path}`,{method,headers:{apikey,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:r.status===204?null:await r.json()};};
  const criado=await chamada('auth/v1/signup',{method:'POST',body:{email:'a@teste.local',password:'segredo',data:{nome:'Ana'}}});
  assert.equal(criado.status,200);const sessao=criado.body;
  assert.equal((await chamada('auth/v1/signup',{method:'POST',body:{email:'a@teste.local',password:'x'}})).body.error_code,'user_already_exists');
  const login=await chamada('auth/v1/token?grant_type=password',{method:'POST',body:{email:'a@teste.local',password:'segredo'}});assert.equal(login.status,200);
  const renovado=await chamada('auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:sessao.refresh_token}});assert.equal(renovado.status,200);
  const reuso=await chamada('auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:sessao.refresh_token}});assert.equal(reuso.body.access_token,renovado.body.access_token);
  const rpc=await chamada('rest/v1/rpc/sincronizar',{method:'POST',token:renovado.body.access_token,body:{desde:0,mudancas:[{c:'clientes',id:'c1',d:{nome:'Ana'}}],aparelho:'http'}});
  assert.equal(rpc.status,200);assert.equal(rpc.body.rev,1);
  const situacao=await chamada('functions/v1/assinatura',{method:'POST',token:renovado.body.access_token,body:{acao:'conferir'}});assert.equal(situacao.status,200);assert.equal(situacao.body.situacao.preco,19.9);
  falso.duracaoToken=1;falso.relogio.avancar((renovado.body.expires_at*1000-falso.relogio.agora)+2000);
  const expirado=await chamada('rest/v1/rpc/sincronizar',{method:'POST',token:renovado.body.access_token,body:{desde:0,mudancas:[]}});assert.equal(expirado.status,401);assert.equal(expirado.body.code,'PGRST303');
  falso.fora=true;assert.equal((await chamada('auth/v1/recover',{method:'POST',body:{email:'a'}})).status,503);falso.fora=false;
  assert.ok(falso.pedidos.length>=8);assert.ok(falso.pedidos.every(p=>p.status>0),JSON.stringify(falso.pedidos));
});
