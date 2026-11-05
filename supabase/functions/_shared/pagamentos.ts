import { chamarMercadoPago, pegarPrecos, registrarCompra, type Config, MercadoPagoError } from "./servidor.ts";
import { lerReferencia, pagamentoValido, referenciaDaConta } from "./assinatura.mjs";

const estadosDeEstorno = new Set(["refunded", "charged_back", "cancelled", "canceled"]);

export async function processarPagamento(config: Config, pagamento: any) {
  const referencia = lerReferencia(pagamento?.external_reference);
  const pagamentoId = String(pagamento?.id ?? "");
  if (!referencia || !/^\d+$/.test(pagamentoId)) return false;

  const estado = String(pagamento?.status ?? "").toLowerCase();
  let validacao;
  if (estadosDeEstorno.has(estado)) {
    validacao = pagamentoValido(pagamento);
  } else if (estado === "approved") {
    const precos = await pegarPrecos(config);
    const mensalMinimo = precos.mensal == null
      ? 0
      : precos.promo == null ? precos.mensal : Math.min(precos.mensal, precos.promo);
    validacao = pagamentoValido(pagamento, { mensalMinimo, anual: precos.anual ?? 0 });
  } else {
    return false;
  }
  if (!validacao.valido) return false;

  const valor = Number(pagamento?.transaction_amount);
  await registrarCompra(config, pagamentoId, validacao.userId!, Number.isFinite(valor) ? valor : 0, validacao.aprovado, validacao.plano!);
  return true;
}

async function buscarPagamento(config: Config, id: string) {
  try {
    return await chamarMercadoPago(config, `/v1/payments/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof MercadoPagoError && error.status === 404) return null;
    throw error;
  }
}

export async function consultarPagamentos(config: Config, userId: string, pagamentoId?: unknown) {
  const referencias = [`mensal:${userId}`, `anual:${userId}`];
  const id = typeof pagamentoId === "string" || (typeof pagamentoId === "number" && Number.isSafeInteger(pagamentoId))
    ? String(pagamentoId) : "";

  if (/^\d+$/.test(id)) {
    try {
      const pagamento = await buscarPagamento(config, id);
      if (pagamento && referenciaDaConta(pagamento.external_reference, userId)) await processarPagamento(config, pagamento);
    } catch (error) { console.error("Falha ao consultar o pagamento informado", error); }
  }

  for (const referencia of referencias) {
    try {
      const busca = await chamarMercadoPago(config,
        `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`);
      for (const pagamento of Array.isArray(busca?.results) ? busca.results : []) {
        if (String(pagamento?.external_reference ?? "") === referencia) await processarPagamento(config, pagamento);
      }
    } catch (error) { console.error(`Falha ao buscar pagamentos com referência ${referencia}`, error); }
  }
}
