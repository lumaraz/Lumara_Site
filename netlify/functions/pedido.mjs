/* Pedido de orçamento enviado pelo formulário do site. */
import { novoEvento, json, limpar, modelo, preencher, mandar, primeiroNome, subirArquivo, idForte, SITE_URL } from "../lib/lib.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ erro: "dados" }, 400); }
  if (!b || typeof b !== "object") return json({ erro: "dados" }, 400);
  if (b.site_web) return json({ ok: true }); // armadilha para robôs
  const email = limpar(b.email, 200).toLowerCase();
  if (!limpar(b.nome) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erro: "campos" }, 400);

  const d = {};
  for (const [k, v] of Object.entries(b).slice(0, 60)) {
    if (["imagens", "fotos", "site_web"].includes(k)) continue;
    if (typeof v === "string") d[limpar(k, 40)] = limpar(v, 4000);
  }
  d.email = email;
  d.id = idForte("P");
  d.recebido = new Date().toISOString();
  d.consentimento = d.recebido;
  d.status = "novo";

  // imagens de referência (já reduzidas no navegador)
  d.imagens = [];
  const fotos = Array.isArray(b.fotos) ? b.fotos.slice(0, 6) : [];
  for (const [i, f] of fotos.entries()) {
    try {
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(f.dados || ""));
      if (!m) continue;
      const buf = Buffer.from(m[2], "base64");
      if (buf.length > 1.5e6) continue;
      const url = await subirArquivo(`pedidos/${d.id}/${i + 1}.${m[1] === "jpeg" ? "jpg" : m[1]}`, buf, "image/" + m[1]);
      d.imagens.push({ nome: limpar(f.nome, 120) || `imagem ${i + 1}`, url });
    } catch (e) { console.error("pedido imagem:", e.message); }
  }

  try {
    const m = await modelo("recebido");
    if (m) {
      const v = { nome: primeiroNome(d.nome) };
      d.emailEnviado = await mandar(email, preencher(m.assunto, v), preencher(m.corpo, v));
    }
    await novoEvento("pedido", d);
    const para = process.env.AVISOS_PARA || process.env.GMAIL_USER;
    if (para) await mandar(para, `Novo pedido de orçamento: ${d.nome}`,
      `${d.nome} (${email}) pediu um orçamento${d.servico ? ` de ${d.servico}` : ""}.\n\nVeja na área da equipe: ${SITE_URL}/admin/#pedidos`).catch(() => {});
    return json({ ok: true, id: d.id });
  } catch (e) {
    console.error("pedido:", e.message);
    return json({ erro: "servidor" }, 500);
  }
};
export const config = { path: "/api/pedido" };
