import { carregarConfig, chamarMercadoPago, MercadoPagoError, responderJson } from "../_shared/servidor.ts";
import { processarPagamento } from "../_shared/pagamentos.ts";
import { lerNotificacaoPagamento } from "../_shared/assinatura.mjs";

Deno.serve(async (req) => {
  const config = carregarConfig();
  if (req.method !== "POST") return responderJson(req, config, 400, { erro: "pedido" });
  if (!config) return responderJson(req, config, 500, { erro: "config" });

  let corpo: any = {};
  try { corpo = await req.json(); } catch { /* o aviso pode vir só pela URL */ }
  const { id, tipo } = lerNotificacaoPagamento(new URL(req.url), corpo);
  if (tipo !== "payment") return responderJson(req, config, 200, { ok: true });
  if (!id) return responderJson(req, config, 200, { ok: true });

  // O aviso é só um sinal. Só confiamos no pagamento retornado pelo Mercado Pago com nosso token,
  // conferindo referência, moeda, valor e status; registrar_compra é idempotente. Sem cadastro no painel, não há chave HMAC.
  try {
    const pagamento = await chamarMercadoPago(config, `/v1/payments/${encodeURIComponent(id)}`);
    await processarPagamento(config, pagamento);
    return responderJson(req, config, 200, { ok: true });
  } catch (error) {
    if (error instanceof MercadoPagoError && error.status === 404) {
      return responderJson(req, config, 200, { ok: true });
    }
    console.error("Falha ao processar aviso de pagamento do Mercado Pago", error);
    return responderJson(req, config, 502, { erro: "mp_falhou" });
  }
});
