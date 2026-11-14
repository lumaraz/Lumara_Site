/* O que a pessoa cliente faz pelos links: aprovar proposta, assinar contrato, aprovar arte ou post. */
import { registro, novoEvento, json, limpar, mandar, modelo, preencher, primeiroNome, SITE_URL } from "../lib/lib.mjs";

const FORMAS = ["Pix", "Cartão de crédito", "Cartão em 3x", "Pix mensal", "Cartão mensal", "Pix Automático", "Cartão recorrente"];
const avisar = (assunto, corpo) => {
  const para = process.env.AVISOS_PARA || process.env.GMAIL_USER;
  return para ? mandar(para, assunto, corpo + `\n\nAbra a área da equipe: ${SITE_URL}/admin/`).catch(() => {}) : null;
};

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ erro: "dados" }, 400); }
  const tipo = b && b.tipo;
  try {
    if (tipo === "aprovado" || tipo === "contrato") {
      const o = await registro("orcamentos", String(b.orc || ""));
      if (!o || o.status === "rascunho" || o.status === "recusado") return json({ erro: "proposta" }, 404);
      const c = (await registro("clientes", o.cliente)) || {};
      if (tipo === "aprovado") {
        const forma = FORMAS.includes(b.forma) ? b.forma : FORMAS[0];
        const m = await modelo("contrato");
        let emailContrato = false;
        if (m && c.email) emailContrato = await mandar(c.email, preencher(m.assunto, { nome: primeiroNome(c.nome), link: `${SITE_URL}/contrato.html#${o.id}` }), preencher(m.corpo, { nome: primeiroNome(c.nome), link: `${SITE_URL}/contrato.html#${o.id}` }));
        await novoEvento("aprovado", { orc: o.id, forma, cliente: o.cliente, emailContrato, quando: new Date().toISOString() });
        await avisar(`${c.empresa || c.nome || "Cliente"} aprovou a proposta ${o.num}`, `A proposta ${o.num} foi aprovada pelo link. Forma escolhida: ${forma}.`);
      } else {
        const a = b.assinatura || {};
        const assinatura = {
          nome: limpar(a.nome, 200), doc: limpar(a.doc, 40), endereco: limpar(a.endereco, 300),
          quando: new Date().toISOString(),
          ip: req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "",
          navegador: limpar(req.headers.get("user-agent"), 300),
        };
        for (const k of Object.keys(a)) if (!(k in assinatura) && typeof a[k] !== "object") assinatura[k] = limpar(a[k], 300);
        if (!assinatura.nome || !assinatura.doc) return json({ erro: "assinatura" }, 400);
        await novoEvento("contrato", { orc: o.id, assinatura, cliente: o.cliente, quando: assinatura.quando });
        await avisar(`${c.empresa || c.nome || "Cliente"} assinou o contrato`, `Contrato da proposta ${o.num} assinado por ${assinatura.nome} (${assinatura.doc}).`);
      }
      return json({ ok: true });
    }
    if (tipo === "arte") {
      const p = await registro("projetos", String(b.projeto || ""));
      const en = p && (p.entregas || []).find((x) => x.id === b.entrega && x.tipo === "aprovacao");
      if (!en) return json({ erro: "arte" }, 404);
      const status = b.status === "ajustes" ? "ajustes" : "aprovado";
      const comentario = limpar(b.comentario, 2000);
      await novoEvento("arte", { projeto: p.id, entrega: en.id, status, comentario, cliente: p.cliente, quando: new Date().toISOString() });
      await avisar(`${status === "aprovado" ? "Arte aprovada" : "Pedido de ajustes"}: ${en.titulo}`, `Projeto: ${p.titulo}\n${status === "aprovado" ? "A arte foi aprovada." : "Ajustes pedidos:\n" + comentario}`);
      return json({ ok: true });
    }
    if (tipo === "post") {
      const pt = await registro("posts", String(b.post || ""));
      if (!pt) return json({ erro: "post" }, 404);
      const status = b.status === "ajustes" ? "ajustes" : "aprovado";
      const comentario = limpar(b.comentario, 2000);
      await novoEvento("post", { post: pt.id, status, comentario, cliente: pt.cliente, quando: new Date().toISOString() });
      await avisar(`${status === "aprovado" ? "Post aprovado" : "Ajustes no post"}: ${pt.tema}`, status === "aprovado" ? "O post foi aprovado." : "Ajustes pedidos:\n" + comentario);
      return json({ ok: true });
    }
    return json({ erro: "tipo" }, 400);
  } catch (e) {
    console.error("evento:", e.message);
    return json({ erro: "servidor" }, 500);
  }
};
export const config = { path: "/api/evento" };
