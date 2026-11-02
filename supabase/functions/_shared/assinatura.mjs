export function mapearStatusMercadoPago(status) {
  switch (String(status ?? "").toLowerCase()) {
    case "authorized": return "ativa";
    case "paused": return "pausada";
    case "cancelled":
    case "canceled": return "cancelada";
    case "pending": return "pendente";
    default: return null;
  }
}

export function calcularLiberadoAte({ testeAte, assinatura, validoAte, anualAte }) {
  const datas = [testeAte];
  if (validoAte && assinatura === "ativa") {
    datas.push(new Date(new Date(validoAte).getTime() + 3 * 86400000));
  } else if (validoAte && (assinatura === "pausada" || assinatura === "cancelada" || assinatura === "pendente")) {
    datas.push(new Date(validoAte));
  }
  if (anualAte) datas.push(anualAte);
  return new Date(Math.max(...datas.map((d) => new Date(d).getTime()))).toISOString();
}

export function precoParaCriar({ plano = 'mensal', precoMensal = 19.9, precoPromo = 14.9, precoAnual = 149.9, promoConsumida = false }) {
  if (plano === 'anual') return { valor: precoAnual, promocional: false };
  const promocional = !promoConsumida && Number.isFinite(Number(precoPromo)) && Number(precoPromo) > 0;
  return { valor: promocional ? Number(precoPromo) : precoMensal, promocional };
}

export function pagamentoAnualValido(pagamento, precoAnual = 149.9) {
  const referencia = String(pagamento?.external_reference ?? '');
  const id = referencia.startsWith('anual:') ? referencia.slice(6) : '';
  if (!isUuid(id)) return { valido: false, userId: null, aprovado: false };
  const status = String(pagamento?.status ?? '').toLowerCase();
  if (['refunded', 'charged_back', 'cancelled', 'canceled'].includes(status)) {
    return { valido: true, userId: id, aprovado: false };
  }
  const aprovado = status === 'approved' && String(pagamento?.currency_id ?? '').toUpperCase() === 'BRL'
    && Number(pagamento?.transaction_amount) >= Number(precoAnual) - 0.01;
  return { valido: aprovado, userId: id, aprovado };
}

export function cobrancaAprovada({ preapproval, pagamento, precoMensal = 19.9 }) {
  return Number(preapproval?.auto_recurring?.transaction_amount) < Number(precoMensal)
    && (Number(preapproval?.summary?.charged_quantity) >= 1
      || (pagamento?.status === 'processed' && pagamento?.payment?.status === 'approved'));
}

export function novaValidadeAnual({ agora = new Date(), validadeAtual = null }) {
  const base = Math.max(new Date(agora).getTime(), validadeAtual ? new Date(validadeAtual).getTime() : 0);
  return new Date(base + 365 * 86400000).toISOString();
}

export function criarManifestoWebhook({ id, requestId, ts }) {
  const idAssinado = /^[a-z0-9]+$/i.test(String(id)) ? String(id).toLowerCase() : String(id);
  return `id:${idAssinado};request-id:${requestId};ts:${ts};`;
}

export function isUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(valor ?? ""));
}

export function validadeNaoEncurtada(status, anterior, nova) {
  if (status === "pendente") return anterior ?? null;
  if (!nova) return anterior ?? null;
  if ((status === "pausada" || status === "cancelada") && anterior) {
    return new Date(anterior) > new Date(nova) ? anterior : nova;
  }
  return nova;
}

const autorizada = (p) => String(p?.status ?? "").toLowerCase() === "authorized";
const criadaEm = (p) => Date.parse(p?.date_created ?? "") || 0;

/* Entre as assinaturas autorizadas da mesma conta, fica a MAIS ANTIGA (a primeira paga); as outras são duplicadas.
   A regra é a mesma em todo lugar (conferir e webhook), então dois avisos ao mesmo tempo nunca cancelam as duas. */
export function separarDuplicadas(lista) {
  const autorizadas = [...(lista ?? [])].filter((p) => p && p.id && autorizada(p))
    .sort((a, b) => criadaEm(a) - criadaEm(b) || String(a.id).localeCompare(String(b.id)));
  return { manter: autorizadas[0] ?? null, duplicadas: autorizadas.slice(1) };
}

/* Qual assinatura vale para a conta: a autorizada que fica (separarDuplicadas); sem nenhuma autorizada, a mais recente.
   Quem abre o pagamento duas vezes e paga pelo primeiro link continua sendo reconhecido. */
export function escolherPreapproval(lista) {
  const { manter } = separarDuplicadas(lista);
  if (manter) return manter;
  const quando = (p) => Date.parse(p?.last_modified ?? p?.date_created ?? "") || 0;
  return [...(lista ?? [])].filter((p) => p && p.id).sort((a, b) => quando(b) - quando(a))[0] ?? null;
}
