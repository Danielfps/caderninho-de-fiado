export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? ""));
}

export function lerReferencia(ref) {
  const texto = String(ref ?? "");
  const separador = texto.indexOf(":");
  if (separador < 0) return null;
  const plano = texto.slice(0, separador);
  const userId = texto.slice(separador + 1);
  if ((plano !== "mensal" && plano !== "anual") || !isUuid(userId)) return null;
  return { plano, userId };
}

export function referenciaDaConta(ref, userId) {
  const referencia = lerReferencia(ref);
  return referencia?.userId === String(userId ?? "") ? referencia : null;
}

export function pagamentoValido(pagamento, { mensalMinimo = 0, anual = 0 } = {}) {
  const referencia = lerReferencia(pagamento?.external_reference);
  if (!referencia || String(pagamento?.currency_id ?? "").toUpperCase() !== "BRL") {
    return { valido: false, aprovado: false, estornado: false, ...referencia };
  }
  const status = String(pagamento?.status ?? "").toLowerCase();
  if (["refunded", "charged_back", "cancelled", "canceled"].includes(status)) {
    return { valido: true, aprovado: false, estornado: true, ...referencia };
  }
  if (status !== "approved") {
    return { valido: false, aprovado: false, estornado: false, ...referencia };
  }
  const minimo = Number(referencia.plano === "mensal" ? mensalMinimo : anual);
  const valor = Number(pagamento?.transaction_amount);
  const aprovado = Number.isFinite(minimo) && minimo > 0 && Number.isFinite(valor) && valor >= minimo;
  return { valido: aprovado, aprovado, estornado: false, ...referencia };
}

export function lerNotificacaoPagamento(url, corpo = {}) {
  const endereco = url instanceof URL ? url : new URL(String(url), "https://caderninho.invalid");
  const id = endereco.searchParams.get("data.id") ?? endereco.searchParams.get("id")
    ?? corpo?.data?.id ?? corpo?.["data.id"] ?? corpo?.id ?? "";
  const tipo = endereco.searchParams.get("type") ?? endereco.searchParams.get("topic")
    ?? corpo?.type ?? corpo?.topic ?? "";
  return { id: String(id), tipo: String(tipo) };
}
