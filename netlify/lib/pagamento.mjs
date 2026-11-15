/* Pagamentos pela InfinitePay (Checkout Integrado). */
import { db, registro, lerConfig, novoEvento, modelo, preencher, mandar, primeiroNome, SITE_URL } from "./lib.mjs";

const API = process.env.INFINITEPAY_API || "https://api.checkout.infinitepay.io";
export const FORMAS = ["Pix", "Cartão de crédito", "Cartão em 3x", "Pix mensal", "Cartão mensal", "Pix Automático", "Cartão recorrente"];

export async function handle() {
  const site = (await lerConfig("site")) || {};
  const tag = (process.env.INFINITEPAY_HANDLE || (site.integracoes && site.integracoes.infiniteTag) || "lumaradesign").replace(/^[$@]/, "");
  return { tag, desconto: ((site.integracoes && site.integracoes.descontoVista) ?? 5) / 100 };
}

/* Mesma conta da página da proposta */
export function valorAgora(o, forma, desconto) {
  const total = (o.itens || []).reduce((a, i) => a + (+i.v || 0), 0);
  const p = o.pagamento || "";
  if (p.startsWith("À vista")) return /Pix/.test(forma) ? total * (1 - desconto) : total;
  if (p.startsWith("50%")) return total / 2;
  if (p.startsWith("3 ")) return /Cartão/.test(forma) ? total : total / 3;
  return total;
}

function telefone(t) {
  const d = String(t || "").replace(/\D/g, "");
  if (d.length < 10) return undefined;
  return "+" + (d.length <= 11 ? "55" + d : d);
}

export async function criarLink({ nsu, descricao, centavos, cliente, voltar }) {
  const { tag } = await handle();
  const corpo = {
    handle: tag,
    order_nsu: nsu,
    items: [{ quantity: 1, price: centavos, description: descricao.slice(0, 120) }],
    redirect_url: voltar,
    webhook: { url: `${SITE_URL}/api/infinitepay`, events: ["paid"] },
  };
  if (cliente && cliente.email) corpo.customer = { name: cliente.nome || cliente.empresa || "", email: cliente.email, phone_number: telefone(cliente.whats) };
  const r = await fetch(`${API}/links`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const t = await r.text();
  if (!r.ok) {
    let codigo = "http_" + r.status;
    try { const j = JSON.parse(t); codigo = j.code || j.error_code || j.error || (j.errors && JSON.stringify(j.errors).slice(0, 80)) || codigo; } catch {}
    const e = new Error(`InfinitePay ${r.status}: ${t.slice(0, 300)}`); e.codigo = String(codigo).slice(0, 80); throw e;
  }
  const j = JSON.parse(t);
  const url = j.url || j.link || j.checkout_url || Object.values(j).find((v) => typeof v === "string" && /^https:\/\//.test(v));
  if (!url) throw new Error("InfinitePay não devolveu o link: " + t.slice(0, 200));
  return url;
}

/* Confere com a InfinitePay se o pagamento foi feito de verdade e registra uma única vez */
export async function confirmar({ order_nsu, transaction_nsu, slug, receipt_url }) {
  if (!order_nsu || !transaction_nsu || !slug) return { ok: false, motivo: "dados" };
  const ja = await db(`eventos?dados->>transaction_nsu=eq.${encodeURIComponent(transaction_nsu)}&select=id`);
  if (ja.length) return { ok: true, repetido: true };
  const { tag } = await handle();
  const r = await fetch(`${API}/payment_check`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: tag, order_nsu, transaction_nsu, slug }),
  });
  const c = await r.json().catch(() => ({}));
  if (!r.ok || !c.success || !c.paid) return { ok: false, motivo: "não pago" };

  const [tipo, id, n] = String(order_nsu).split("-");
  const metodo = c.capture_method === "pix" ? "Pix" : "Cartão de crédito";
  const base = { transaction_nsu, slug, receipt_url: receipt_url || "", valor: (c.paid_amount ?? c.amount) / 100, parcelas: c.installments || 1, metodo, quando: new Date().toISOString() };

  if (tipo === "o") {
    const o = await registro("orcamentos", id);
    if (!o) return { ok: false, motivo: "proposta" };
    const c2 = (await registro("clientes", o.cliente)) || {};
    const forma = FORMAS[+n] || metodo;
    /* desconto do Pix pago no cartão: a diferença vira uma parcela a pagar */
    let difDesconto = 0;
    if (forma === "Pix" && metodo !== "Pix" && String(o.pagamento || "").startsWith("À vista")) {
      const total = (o.itens || []).reduce((a, i) => a + (+i.v || 0), 0);
      difDesconto = Math.round((total - base.valor) * 100) / 100;
      if (difDesconto < 1) difDesconto = 0;
    }
    await novoEvento("pago", { difDesconto, ...base, orc: o.id, forma: (metodo === "Pix") === /Pix/.test(forma) ? forma : metodo, cliente: o.cliente, emailEnviado: true });
    const m = await modelo("pago");
    const site = (await lerConfig("site")) || {};
    if (m && c2.email) {
      const v = { nome: primeiroNome(c2.nome), agenda: (site.integracoes && site.integracoes.agenda) || "", portal: `${SITE_URL}/cliente.html#${o.cliente}` };
      await mandar(c2.email, preencher(m.assunto, v), preencher(m.corpo, v));
    }
    if (difDesconto && c2.email) await mandar(c2.email, "Pagamento recebido: diferença do desconto",
      `Olá, ${primeiroNome(c2.nome)}!\n\nRecebemos o seu pagamento, obrigada! Como ele foi feito no cartão, o desconto do Pix não se aplica, e ficou uma diferença de ${brl(difDesconto)}.\n\nEla aparece no seu portal para pagar quando for melhor para você (vence em 3 dias):\n${SITE_URL}/cliente.html#${o.cliente}`);
    await avisarEquipe(`Pagamento recebido: ${c2.empresa || c2.nome || "cliente"}`, `Entrou ${brl(base.valor)} por ${metodo}${base.parcelas > 1 ? ` em ${base.parcelas}x` : ""}, referente à proposta ${o.num}.${forma.startsWith("Pix") && metodo !== "Pix" ? "\n\nAtenção: a pessoa escolheu Pix na proposta, mas pagou com cartão." : ""}${base.receipt_url ? `\nComprovante: ${base.receipt_url}` : ""}`);
    return { ok: true };
  }
  if (tipo === "l") {
    const l = await registro("caixa", id);
    if (!l) return { ok: false, motivo: "lançamento" };
    const c2 = (await registro("clientes", l.cliente)) || {};
    await novoEvento("parcela", { ...base, lanc: l.id, forma: metodo, cliente: l.cliente });
    if (c2.email) await mandar(c2.email, "Pagamento recebido", `Olá, ${primeiroNome(c2.nome)}!\n\nRecebemos ${brl(base.valor)} referente a ${l.desc}. Obrigada!\n\nO recibo fica no seu portal: ${SITE_URL}/cliente.html#${l.cliente}`);
    await avisarEquipe(`Pagamento recebido: ${c2.empresa || c2.nome || "cliente"}`, `Entrou ${brl(base.valor)} por ${metodo}: ${l.desc}.`);
    return { ok: true };
  }
  return { ok: false, motivo: "pedido" };
}
const brl = (v) => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function avisarEquipe(assunto, corpo) {
  const para = process.env.AVISOS_PARA || process.env.GMAIL_USER;
  return para ? mandar(para, assunto, corpo).catch(() => {}) : null;
}
