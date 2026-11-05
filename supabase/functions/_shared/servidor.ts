import { isUuid } from "./assinatura.mjs";

export type Config = {
  supabaseUrl: string;
  anonKey: string;
  serviceKey: string;
  mpToken: string;
  appUrls: URL[];
};

export class MercadoPagoError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "MercadoPagoError";
  }
}
/* conta com proteção em 2 etapas, mas o token ainda não passou pelo código (aal1) */
export class CodigoPendenteError extends Error {}

function lerAal(token: string) {
  try {
    const parte = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(parte.padEnd(parte.length + ((4 - (parte.length % 4)) % 4), "=")));
    return typeof payload?.aal === "string" ? payload.aal : "aal1";
  } catch {
    return "aal1";
  }
}

export function carregarConfig(): Config | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
  const appUrls = (Deno.env.get("APP_URLS") ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      try { return new URL(item); } catch { return null; }
    })
    .filter((item): item is URL => item !== null);
  if (!supabaseUrl || !anonKey || !serviceKey || !mpToken || appUrls.length === 0) return null;
  return { supabaseUrl, anonKey, serviceKey, mpToken, appUrls };
}

export function responderJson(req: Request, config: Config | null, status: number, body: unknown) {
  const origin = req.headers.get("origin");
  const allowed = origin && config?.appUrls.some((url) => url.origin === origin);
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  if (allowed) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, x-client-info, content-type");
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  }
  const responseBody = status === 204 || status === 304 ? null : JSON.stringify(body);
  return new Response(responseBody, { status, headers });
}

export function responderOptions(req: Request, config: Config | null) {
  const origin = req.headers.get("origin");
  if (!origin || !config?.appUrls.some((url) => url.origin === origin)) {
    return responderJson(req, config, 403, { erro: "pedido" });
  }
  return responderJson(req, config, 204, null);
}

export async function autenticar(req: Request, config: Config) {
  const authorization = req.headers.get("authorization") ?? "";
  if (!/^Bearer\s+\S+$/i.test(authorization)) return null;
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: config.anonKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!isUuid(user?.id) || typeof user?.email !== "string") return null;
  // O token já foi conferido pelo /auth/v1/user acima; aqui só se lê o nível dele.
  const temCodigo = Array.isArray(user?.factors) && user.factors.some((f: any) => f?.status === "verified");
  if (temCodigo && lerAal(authorization.replace(/^Bearer\s+/i, "")) !== "aal2") throw new CodigoPendenteError();
  return { id: user.id as string, email: user.email as string, authorization };
}

export async function chamarMercadoPago(config: Config, path: string, init: RequestInit = {}) {
  try {
    const response = await fetch(`https://api.mercadopago.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.mpToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const raw = await response.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* resposta fora de JSON */ }
    if (!response.ok) {
      const causas = Array.isArray(data?.cause) ? data.cause.map((c: any) => c?.description ?? c?.code) : [];
      const motivo = [data?.message, data?.error, ...causas].filter(Boolean).join(" | ").slice(0, 300);
      throw new MercadoPagoError(`Mercado Pago respondeu ${response.status} em ${path.split("?")[0]}: ${motivo}`, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof MercadoPagoError) throw error;
    throw new MercadoPagoError("Falha de comunicação com o Mercado Pago");
  }
}

export async function minhaSituacao(config: Config, authorization: string) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/minha_situacao`, {
    method: "POST",
    headers: {
      apikey: config.anonKey,
      Authorization: authorization,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (!response.ok) throw new Error("Falha ao consultar situação");
  return await response.json();
}

export function urlDeVolta(config: Config, candidata: unknown) {
  const primeira = config.appUrls[0].href;
  if (typeof candidata !== "string") return primeira;
  try {
    const url = new URL(candidata);
    return config.appUrls.some((permitida) => permitida.href === url.href) ? url.href : primeira;
  } catch {
    return primeira;
  }
}

export async function pegarPrecos(config: Config) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/planos?select=id,valor&ativo=eq.true&id=in.(mensal,mensal_promo,anual)`, {
    headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}` },
  });
  if (!response.ok) throw new Error("Falha ao ler preços dos planos");
  const linhas = await response.json();
  const porId = new Map((Array.isArray(linhas) ? linhas : []).map((linha: any) => [String(linha.id), Number(linha.valor)]));
  const ler = (id: string) => {
    const valor = porId.get(id);
    return Number.isFinite(valor) && valor > 0 ? valor : null;
  };
  return { mensal: ler("mensal"), promo: ler("mensal_promo"), anual: ler("anual") };
}

export async function registrarCompra(config: Config, pagamentoId: string, userId: string, valor: number, aprovado: boolean, plano: "mensal" | "anual") {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/registrar_compra`, {
    method: "POST",
    headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_payment_id: pagamentoId, p_user: userId, p_valor: valor, p_aprovado: aprovado, p_plano: plano }),
  });
  if (!response.ok) throw new Error("Falha ao registrar compra");
  return await response.json();
}
