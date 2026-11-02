import assert from "node:assert/strict";
import test from "node:test";
import {
  calcularLiberadoAte,
  criarManifestoWebhook,
  escolherPreapproval,
  separarDuplicadas,
  mapearStatusMercadoPago,
  validadeNaoEncurtada,
  precoParaCriar,
  pagamentoAnualValido,
  cobrancaAprovada,
  novaValidadeAnual,
} from "../supabase/functions/_shared/assinatura.mjs";

test("mapeia estados do Mercado Pago", () => {
  assert.equal(mapearStatusMercadoPago("authorized"), "ativa");
  assert.equal(mapearStatusMercadoPago("paused"), "pausada");
  assert.equal(mapearStatusMercadoPago("cancelled"), "cancelada");
  assert.equal(mapearStatusMercadoPago("canceled"), "cancelada");
  assert.equal(mapearStatusMercadoPago("pending"), "pendente");
  assert.equal(mapearStatusMercadoPago("unknown"), null);
});

test("liberação usa o maior prazo de teste e tolerância", () => {
  const teste = "2026-11-04T12:00:00.000Z";
  const validade = "2026-11-05T12:00:00.000Z";
  assert.equal(calcularLiberadoAte({ testeAte: teste, assinatura: "ativa", validoAte: validade }), "2026-11-08T12:00:00.000Z");
  assert.equal(calcularLiberadoAte({ testeAte: teste, assinatura: "cancelada", validoAte: validade }), validade);
  assert.equal(calcularLiberadoAte({ testeAte: teste, assinatura: "pendente", validoAte: validade }), validade);
  assert.equal(calcularLiberadoAte({ testeAte: teste, assinatura: "pendente", validoAte: null }), teste);
});

test("manifesto normaliza ID alfanumérico e mantém hífen", () => {
  assert.equal(criarManifestoWebhook({ id: "ABcd123", requestId: "req-1", ts: "123" }), "id:abcd123;request-id:req-1;ts:123;");
  assert.equal(criarManifestoWebhook({ id: "AB-CD", requestId: "req-1", ts: "123" }), "id:AB-CD;request-id:req-1;ts:123;");
});

test("pausar ou cancelar preserva a validade paga", () => {
  const anterior = "2026-12-01T00:00:00.000Z";
  assert.equal(validadeNaoEncurtada("cancelada", anterior, "2026-11-01T00:00:00.000Z"), anterior);
  assert.equal(validadeNaoEncurtada("pausada", anterior, null), anterior);
});

test("evento pendente não altera a validade que já existia", () => {
  const anterior = "2026-12-01T00:00:00.000Z";
  assert.equal(validadeNaoEncurtada("pendente", anterior, "2026-11-01T00:00:00.000Z"), anterior);
  assert.equal(validadeNaoEncurtada("pendente", null, "2026-11-01T00:00:00.000Z"), null);
});

test("escolhe a assinatura autorizada mesmo se não for o último link aberto", () => {
  const lista = [
    { id: "b", status: "pending", last_modified: "2026-10-31T12:10:00.000-03:00" },
    { id: "a", status: "authorized", last_modified: "2026-10-31T12:05:00.000-03:00" },
    { id: "c", status: "cancelled", last_modified: "2026-09-01T10:00:00.000-03:00" },
  ];
  assert.equal(escolherPreapproval(lista).id, "a");
  assert.equal(escolherPreapproval(lista.filter((p) => p.id !== "a")).id, "b");
  assert.equal(escolherPreapproval([]), null);
});

test("duas autorizadas: fica a mais antiga e a outra é duplicada", () => {
  const lista = [
    { id: "nova", status: "authorized", date_created: "2026-10-31T12:10:00.000-03:00" },
    { id: "velha", status: "authorized", date_created: "2026-10-31T12:00:00.000-03:00" },
    { id: "pend", status: "pending", date_created: "2026-10-31T12:20:00.000-03:00" },
  ];
  const { manter, duplicadas } = separarDuplicadas(lista);
  assert.equal(manter.id, "velha");
  assert.deepEqual(duplicadas.map((p) => p.id), ["nova"]);
  assert.equal(escolherPreapproval(lista).id, "velha");
  assert.deepEqual(separarDuplicadas([{ id: "x", status: "pending" }]), { manter: null, duplicadas: [] });
});

test('preço mensal aplica a promoção uma vez e anual usa seu próprio preço',()=>{
  assert.deepEqual(precoParaCriar({}),{valor:14.9,promocional:true});
  assert.deepEqual(precoParaCriar({promoConsumida:true}),{valor:19.9,promocional:false});
  assert.deepEqual(precoParaCriar({plano:'anual'}),{valor:149.9,promocional:false});
});

test('pagamento anual só aceita referência da conta, aprovado em BRL e valor mínimo',()=>{
  const base={external_reference:'anual:11111111-1111-4111-8111-111111111111',currency_id:'BRL',transaction_amount:149.9,status:'approved'};
  assert.deepEqual(pagamentoAnualValido(base),{valido:true,userId:'11111111-1111-4111-8111-111111111111',aprovado:true});
  assert.equal(pagamentoAnualValido({...base,currency_id:'USD'}).valido,false);
  assert.equal(pagamentoAnualValido({...base,transaction_amount:149.88}).valido,false);
  assert.deepEqual(pagamentoAnualValido({...base,status:'refunded'}),{valido:true,userId:'11111111-1111-4111-8111-111111111111',aprovado:false});
});

test('promoção só termina depois de prova de cobrança aprovada e validade anual soma 365 dias',()=>{
  assert.equal(cobrancaAprovada({preapproval:{auto_recurring:{transaction_amount:14.9}}}),false);
  assert.equal(cobrancaAprovada({preapproval:{auto_recurring:{transaction_amount:14.9},summary:{charged_quantity:1}}}),true);
  assert.equal(cobrancaAprovada({preapproval:{auto_recurring:{transaction_amount:14.9}},pagamento:{status:'processed',payment:{status:'approved'}}}),true);
  assert.equal(novaValidadeAnual({agora:'2026-01-01T00:00:00Z'}),'2027-01-01T00:00:00.000Z');
  assert.equal(calcularLiberadoAte({testeAte:'2026-01-02T00:00:00Z',anualAte:'2027-01-01T00:00:00Z'}),'2027-01-01T00:00:00.000Z');
});
