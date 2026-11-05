import {
  autenticar,
  carregarConfig,
  chamarMercadoPago,
  minhaSituacao,
  responderJson,
  responderOptions,
  urlDeVolta,
  MercadoPagoError,
  CodigoPendenteError,
} from "../_shared/servidor.ts";
import { consultarPagamentos } from "../_shared/pagamentos.ts";

Deno.serve(async (req) => {
  const config = carregarConfig();
  if (req.method === "OPTIONS") return responderOptions(req, config);
  if (req.method !== "POST") return responderJson(req, config, 400, { erro: "pedido" });
  if (!config) return responderJson(req, config, 500, { erro: "config" });

  let entrada: any;
  try { entrada = await req.json(); } catch { return responderJson(req, config, 400, { erro: "pedido" }); }
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)
      || (entrada.acao !== "criar" && entrada.acao !== "conferir")) {
    return responderJson(req, config, 400, { erro: "pedido" });
  }

  let user;
  try {
    user = await autenticar(req, config);
  } catch (error) {
    if (error instanceof CodigoPendenteError) return responderJson(req, config, 403, { erro: "insufficient_aal" });
    return responderJson(req, config, 401, { erro: "sem_login" });
  }
  if (!user) return responderJson(req, config, 401, { erro: "sem_login" });

  try {
    if (entrada.acao === "criar") {
      const plano = entrada.plano;
      if (plano !== "mensal" && plano !== "anual") return responderJson(req, config, 400, { erro: "pedido" });

      const situacao = await minhaSituacao(config, user.authorization);
      const agora = Date.parse(String(situacao?.agora ?? "")) || Date.now();
      const pagoAte = Date.parse(String(situacao?.pago_ate ?? "")) || 0;
      if (pagoAte > agora + 7 * 86400000) return responderJson(req, config, 409, { erro: "ja_paga" });

      const valor = Number(plano === "anual" ? situacao?.preco_anual
        : situacao?.preco_promo ?? situacao?.preco);
      if (!Number.isFinite(valor) || valor <= 0) return responderJson(req, config, 500, { erro: "config" });

      const volta = urlDeVolta(config, entrada.volta);
      const retorno = new URL(volta);
      const titulo = plano === "mensal"
        ? "Caderninho de Fiado - Plano mensal (30 dias)"
        : "Caderninho de Fiado - Plano anual (12 meses)";
      const payload: Record<string, unknown> = {
        items: [{ id: plano, title: titulo, quantity: 1, currency_id: "BRL", unit_price: valor }],
        external_reference: `${plano}:${user.id}`,
        back_urls: { success: retorno.href, pending: retorno.href, failure: retorno.href },
        notification_url: `${config.supabaseUrl}/functions/v1/mp-webhook`,
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }],
          installments: plano === "anual" ? 12 : 1,
          default_installments: 1,
        },
        statement_descriptor: "CADERNINHO",
        expires: true,
        expiration_date_to: new Date(Date.now() + 3 * 86400000 - 3 * 3600000).toISOString().replace("Z", "-03:00"),
      };
      if (retorno.protocol === "https:") payload.auto_return = "approved";

      const resultado = await chamarMercadoPago(config, "/checkout/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (typeof resultado?.init_point !== "string") throw new Error("Resposta inválida do Mercado Pago");
      return responderJson(req, config, 200, { init_point: resultado.init_point });
    }

    try { await consultarPagamentos(config, user.id, entrada.pagamento_id); }
    catch (error) { console.error("Não consegui conferir pagamentos no Mercado Pago", error); }
    const situacao = await minhaSituacao(config, user.authorization);
    return responderJson(req, config, 200, { situacao });
  } catch (error) {
    console.error("Falha na função assinatura", error);
    const mpFalhou = error instanceof MercadoPagoError;
    return responderJson(req, config, mpFalhou ? 502 : 500, { erro: mpFalhou ? "mp_falhou" : "config" });
  }
});
