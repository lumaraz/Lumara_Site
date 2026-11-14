/* Cria o link de pagamento da InfinitePay para uma proposta ou parcela. */
import { db, registro, json } from "../lib/lib.mjs";
import { FORMAS, handle, valorAgora, criarLink } from "../lib/pagamento.mjs";
import { SITE_URL } from "../lib/lib.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ erro: "dados" }, 400); }
  try {
    if (b.orc) {
      const o = await registro("orcamentos", String(b.orc));
      if (!o || o.status === "rascunho" || o.status === "recusado") return json({ erro: "proposta" }, 404);
      const pago = await db(`eventos?tipo=eq.pago&dados->>orc=eq.${encodeURIComponent(o.id)}&select=id`);
      if (pago.length) return json({ erro: "pago" }, 409);
      const n = Math.max(0, FORMAS.indexOf(b.forma));
      const { desconto } = await handle();
      const centavos = Math.round(valorAgora(o, FORMAS[n], desconto) * 100);
      if (centavos < 100) return json({ erro: "valor" }, 400);
      const c = (await registro("clientes", o.cliente)) || {};
      const url = await criarLink({
        nsu: `o-${o.id}-${n}`, centavos, cliente: c,
        descricao: `Lumara Silva, proposta ${o.num}: ${(o.itens && o.itens[0] && o.itens[0].s) || "design"}`,
        voltar: `${SITE_URL}/proposta.html?id=${encodeURIComponent(o.id)}&retorno=1`,
      });
      return json({ url });
    }
    if (b.lanc) {
      const l = await registro("caixa", String(b.lanc));
      if (!l || l.tipo !== "entrada" || l.pago) return json({ erro: "parcela" }, 404);
      const c = (await registro("clientes", l.cliente)) || {};
      const url = await criarLink({
        nsu: `l-${l.id}-0`, centavos: Math.round(l.valor * 100), cliente: c,
        descricao: `Lumara Silva: ${l.desc}`,
        voltar: `${SITE_URL}/cliente.html?id=${encodeURIComponent(l.cliente)}&retorno=1`,
      });
      return json({ url });
    }
    return json({ erro: "dados" }, 400);
  } catch (e) {
    console.error("pagar:", e.message);
    return json({ erro: "servidor" }, 502);
  }
};
export const config = { path: "/api/pagar" };
