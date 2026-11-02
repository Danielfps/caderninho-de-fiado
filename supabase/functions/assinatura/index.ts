import {
  autenticar,
  carregarConfig,
  chamarMercadoPago,
  gravarAssinatura,
  lerAssinatura,
  minhaSituacao,
  pegarPreco,
  pegarPrecoPlano,
  responderJson,
  responderOptions,
  urlDeVolta,
  MercadoPagoError,
  CodigoPendenteError,
  buscarPreapprovals,
  cancelarDuplicadas,
} from "../_shared/servidor.ts";
import { escolherPreapproval, mapearStatusMercadoPago, validadeNaoEncurtada } from "../_shared/assinatura.mjs";
import { precoParaCriar } from "../_shared/assinatura.mjs";
import { consultarPagamentosAnuais, consumirPromocao } from "../_shared/pagamentos.ts";

Deno.serve(async (req) => {
  const config = carregarConfig();
  if (req.method === "OPTIONS") return responderOptions(req, config);
  if (req.method !== "POST") return responderJson(req, config, 400, { erro: "pedido" });
  if (!config) return responderJson(req, config, 500, { erro: "config" });

  let entrada: any;
  try { entrada = await req.json(); } catch { return responderJson(req, config, 400, { erro: "pedido" }); }
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
    return responderJson(req, config, 400, { erro: "pedido" });
  }
  if (entrada.acao !== "criar" && entrada.acao !== "conferir") {
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
      const atual = await lerAssinatura(config, user.id);
      if (atual?.status === "ativa" && atual.valido_ate && new Date(atual.valido_ate) > new Date()) {
        return responderJson(req, config, 409, { erro: "ja_ativa" });
      }
      const plano = entrada.plano === undefined ? "mensal" : entrada.plano;
      if (plano !== "mensal" && plano !== "anual") return responderJson(req, config, 400, { erro: "pedido" });
      const emailPagador = typeof entrada.email_pagador === "string" && entrada.email_pagador.trim()
        ? entrada.email_pagador.trim()
        : user.email;
      if (!emailPagador || emailPagador.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPagador)) {
        return responderJson(req, config, 400, { erro: "pedido" });
      }
      if (plano === "anual") {
        const situacao = await minhaSituacao(config, user.authorization);
        if (situacao?.anual_ate && new Date(situacao.anual_ate).getTime() > Date.now() + 7 * 86400000) {
          return responderJson(req, config, 409, { erro: "ja_paga" });
        }
        const preco = await pegarPrecoPlano(config, "anual");
        const volta = urlDeVolta(config, entrada.volta);
        const retorno = new URL(volta);
        const payload: Record<string, unknown> = {
          items: [{ id: "anual", title: "Caderninho de Fiado - Plano anual (12 meses)", quantity: 1, currency_id: "BRL", unit_price: preco }],
          payer: { email: emailPagador }, external_reference: `anual:${user.id}`,
          back_urls: { success: retorno.href, pending: retorno.href, failure: retorno.href },
          payment_methods: { excluded_payment_types: [{ id: "ticket" }], installments: 12, default_installments: 1 },
          // horário de Brasília com o fuso escrito (-03:00), como nos exemplos do Mercado Pago
          expires: true, expiration_date_to: new Date(Date.now() + 3 * 86400000 - 3 * 3600000).toISOString().replace("Z", "-03:00"), statement_descriptor: "CADERNINHO",
        };
        if (retorno.protocol === "https:") payload.auto_return = "approved";
        const resultado = await chamarMercadoPago(config, "/checkout/preferences", { method: "POST", body: JSON.stringify(payload) });
        if (typeof resultado?.init_point !== "string") throw new Error("Resposta inválida do Mercado Pago");
        return responderJson(req, config, 200, { init_point: resultado.init_point });
      }
      const situacaoAtual = await minhaSituacao(config, user.authorization);
      if (situacaoAtual?.anual_ate && new Date(situacaoAtual.anual_ate).getTime() > Date.now() + 7 * 86400000) {
        return responderJson(req, config, 409, { erro: "ja_paga" });
      }
      // Promoção desligada na tabela (ativo = false) ou apagada: segue sem promoção, sem travar a assinatura.
      const [preco, precoPromo] = await Promise.all([pegarPreco(config), pegarPrecoPlano(config, "mensal_promo").catch(() => 0)]);
      const escolha = precoParaCriar({ precoMensal: preco, precoPromo, promoConsumida: !!atual?.promo_consumida_em });
      const valor = escolha.valor;
      // O texto que a pessoa vê no Mercado Pago sai dos preços da tabela planos (mudou o preço, muda o texto).
      const reais = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
      const motivo = escolha.promocional
        ? `Caderninho de Fiado: 1º mês ${reais(valor)}, depois ${reais(preco)}/mês`
        : `Caderninho de Fiado: assinatura mensal ${reais(preco)}`;
      // Já existe um link guardado? Autorizado: avisa que está ativa (o app confere). Pendente com o mesmo preço e
      // e-mail: devolve o mesmo link em vez de abrir outro (menos chance de duas cobranças).
      if (atual?.mp_preapproval_id) {
        try {
          const guardada = await chamarMercadoPago(config, `/preapproval/${encodeURIComponent(atual.mp_preapproval_id)}`);
          const st = String(guardada?.status ?? "").toLowerCase();
          if (guardada?.external_reference === user.id && st === "authorized") {
            return responderJson(req, config, 409, { erro: "ja_ativa" });
          }
          if (
            guardada?.external_reference === user.id && st === "pending" && typeof guardada.init_point === "string" &&
            Number(guardada?.auto_recurring?.transaction_amount) === valor &&
            String(guardada?.payer_email ?? "").toLowerCase() === emailPagador.toLowerCase()
          ) {
            return responderJson(req, config, 200, { init_point: guardada.init_point });
          }
        } catch { /* não deu para ler o link guardado: cria um novo */ }
      }
      const resultado = await chamarMercadoPago(config, "/preapproval", {
        method: "POST",
        body: JSON.stringify({
          reason: motivo,
          external_reference: user.id,
          payer_email: emailPagador,
          auto_recurring: { frequency: 1, frequency_type: "months", transaction_amount: valor, currency_id: "BRL" },
          back_url: urlDeVolta(config, entrada.volta),
          status: "pending",
        }),
      });
      if (!resultado?.id || typeof resultado.init_point !== "string") throw new Error("Resposta inválida do Mercado Pago");

      // Link novo não tira os dias já pagos: ativa, pausada ou cancelada com validade no futuro continuam como estão.
      const aindaVale = atual?.valido_ate && new Date(atual.valido_ate) > new Date();
      const statusAtual = atual?.status === "ativa" || (aindaVale && atual.status !== "pendente") ? atual.status : "pendente";
      await gravarAssinatura(config, user.id, {
        status: statusAtual,
        valido_ate: atual?.valido_ate ?? null,
        mp_preapproval_id: String(resultado.id),
        valor,
        atualizado_em: new Date().toISOString(),
      });
      return responderJson(req, config, 200, { init_point: resultado.init_point });
    }

    const atual = await lerAssinatura(config, user.id);
    // Plano anual: confere os pagamentos. Se o Mercado Pago falhar aqui, a conferência da mensal continua.
    try {
      await consultarPagamentosAnuais(config, user.id, entrada.pagamento_id);
    } catch (error) {
      console.error("Não consegui conferir os pagamentos do plano anual", error);
    }
    // Procura todas as assinaturas dessa conta no Mercado Pago (não só o último link guardado) e fica com a que vale.
    // Se houver duas autorizadas (duas cobranças), cancela a duplicada.
    let candidatos: any[] = [];
    try {
      candidatos = await buscarPreapprovals(config, user.id);
    } catch (error) {
      if (!atual?.mp_preapproval_id) throw error;
    }
    if (atual?.mp_preapproval_id && !candidatos.some((item) => String(item?.id) === String(atual.mp_preapproval_id))) {
      try {
        const guardada = await chamarMercadoPago(config, `/preapproval/${encodeURIComponent(atual.mp_preapproval_id)}`);
        if (guardada?.external_reference === user.id) candidatos.push(guardada);
      } catch { /* a busca já basta */ }
    }
    await cancelarDuplicadas(config, candidatos);
    const preapproval = escolherPreapproval(candidatos);
    if (preapproval) {
      const status = mapearStatusMercadoPago(preapproval.status);
      if (status) {
        const antes = await lerAssinatura(config, user.id);
        const validade = validadeNaoEncurtada(status, antes?.valido_ate, preapproval.next_payment_date ?? null);
        await gravarAssinatura(config, user.id, {
          status: antes?.status === "ativa" && status === "pendente" ? "ativa" : status,
          valido_ate: validade,
          mp_preapproval_id: String(preapproval.id),
          atualizado_em: new Date().toISOString(),
        });
        await consumirPromocao(config, preapproval, undefined, (dados) =>
          gravarAssinatura(config, user.id, { ...dados, mp_preapproval_id: String(preapproval.id), ...(status === "ativa" ? { status: "ativa" } : {}) }),
          !!antes?.promo_consumida_em);
      }
    }
    const situacao = await minhaSituacao(config, user.authorization);
    return responderJson(req, config, 200, { situacao });
  } catch (error) {
    console.error("Falha na função assinatura", error);
    const mpFalhou = error instanceof MercadoPagoError;
    return responderJson(req, config, mpFalhou ? 502 : 500, { erro: mpFalhou ? "mp_falhou" : "config" });
  }
});
