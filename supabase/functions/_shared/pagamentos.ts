import { chamarMercadoPago, pegarPrecoPlano, registrarCompra, type Config } from "./servidor.ts";
import { cobrancaAprovada, isUuid, pagamentoAnualValido } from "./assinatura.mjs";

export async function processarPagamentoAnual(config: Config, pagamento: any) {
  const ref = String(pagamento?.external_reference ?? "");
  if (!ref.startsWith("anual:")) return;
  const userId = ref.slice(6);
  if (!isUuid(userId) || !/^\d+$/.test(String(pagamento?.id ?? ""))) return;
  const estado = String(pagamento?.status ?? "").toLowerCase();
  if (!["approved", "refunded", "charged_back", "cancelled", "canceled"].includes(estado)) return;
  const preco = await pegarPrecoPlano(config, "anual");
  const validacao = pagamentoAnualValido(pagamento, preco);
  // Estornos só afetam compras que já existem; pagamento aprovado fora do valor ou moeda é ignorado.
  if (estado === "approved" && !validacao.aprovado) return;
  if (!validacao.userId) return;
  await registrarCompra(config, String(pagamento.id), validacao.userId, Number(pagamento.transaction_amount ?? preco), estado === "approved");
}

export async function consultarPagamentosAnuais(config: Config, userId: string, pagamentoId?: unknown) {
  const referencia = `anual:${userId}`;
  const id = typeof pagamentoId === "string" || (typeof pagamentoId === "number" && Number.isSafeInteger(pagamentoId))
    ? String(pagamentoId) : "";
  if (/^\d+$/.test(id)) {
    const pagamento = await chamarMercadoPago(config, `/v1/payments/${encodeURIComponent(id)}`);
    if (pagamento?.external_reference === referencia) await processarPagamentoAnual(config, pagamento);
  }
  const busca = await chamarMercadoPago(config, `/v1/payments/search?external_reference=${encodeURIComponent(referencia)}&sort=date_created&criteria=desc`);
  for (const pagamento of Array.isArray(busca?.results) ? busca.results : []) {
    if (pagamento?.external_reference === referencia) await processarPagamentoAnual(config, pagamento);
  }
}

export async function consumirPromocao(config: Config, preapproval: any, pagamento?: any, gravar?: (dados: Record<string, unknown>) => Promise<unknown>, promoConsumida = false) {
  const userId = String(preapproval?.external_reference ?? "");
  const id = String(preapproval?.id ?? "");
  if (!isUuid(userId) || !id || !gravar) return;
  const mensal = await pegarPrecoPlano(config, "mensal");
  const valorAtual = Number(preapproval?.auto_recurring?.transaction_amount);
  if (!(valorAtual > 0 && valorAtual < mensal)) return;
  if (!cobrancaAprovada({ preapproval, pagamento, precoMensal: mensal })) return;
  if (!promoConsumida) await gravar({ promo_consumida_em: new Date().toISOString() });
  try {
    const atualizado = await chamarMercadoPago(config, `/preapproval/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ auto_recurring: { transaction_amount: mensal, currency_id: "BRL" }, reason: `Caderninho de Fiado: assinatura mensal R$ ${mensal.toFixed(2).replace(".", ",")}` }),
    });
    let valorConfirmado = Number(atualizado?.auto_recurring?.transaction_amount);
    if (valorConfirmado !== mensal) {
      const relido = await chamarMercadoPago(config, `/preapproval/${encodeURIComponent(id)}`);
      valorConfirmado = Number(relido?.auto_recurring?.transaction_amount);
    }
    if (valorConfirmado === mensal) await gravar({ valor: mensal, atualizado_em: new Date().toISOString() });
    else console.error("Mercado Pago não confirmou o novo valor mensal", id);
  } catch (error) {
    console.error("Falha ao atualizar o valor mensal após a promoção; será tentado novamente", id, error);
  }
}
