/* Todo dia às 9h (Brasília): avisa parcelas que vencem em até 3 dias e as atrasadas,
   e tenta de novo os e-mails que não saíram. */
import { db, lerConfig, salvarConfig, modelo, preencher, mandar, primeiroNome, enviarPendentes, SITE_URL } from "../lib/lib.mjs";

const hojeSP = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
const diasAte = (iso) => { const h = hojeSP(); h.setHours(0, 0, 0, 0); return Math.round((new Date(iso + "T00:00:00") - h) / 864e5); };
const brl = (v) => (+v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async () => {
  const relatorio = { cobranca: 0, atraso: 0 };
  try {
    const linhas = (await db("registros?tipo=eq.caixa&select=dados")).map((r) => r.dados)
      .filter((l) => l.tipo === "entrada" && !l.pago && l.cliente && l.data);
    const ev = await db("eventos?processado=is.null&tipo=in.(pago,parcela)&select=tipo,dados");
    const pagas = new Set(ev.filter((e) => e.tipo === "parcela").map((e) => e.dados.lanc));
    const orcPagos = new Set(ev.filter((e) => e.tipo === "pago").map((e) => e.dados.orc));
    const avisos = (await lerConfig("avisos")) || {};
    const clientes = new Map((await db("registros?tipo=eq.clientes&select=id,dados")).map((r) => [r.id, r.dados]));
    const mCob = await modelo("cobranca"), mAtr = await modelo("atraso");

    for (const l of linhas) {
      if (pagas.has(l.id)) continue;
      if (l.orc && orcPagos.has(l.orc)) {
        const primeira = linhas.filter((x) => x.orc === l.orc).sort((a, b) => a.data.localeCompare(b.data))[0];
        if (primeira && primeira.id === l.id) continue;
      }
      const c = clientes.get(l.cliente);
      if (!c || !c.email) continue;
      const d = diasAte(l.data), a = avisos[l.id] || {};
      const v = {
        nome: primeiroNome(c.nome), valor: brl(l.valor),
        vencimento: new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR"),
        descricao: String(l.desc || "").replace((c.empresa || "") + ", ", ""),
        portal: `${SITE_URL}/cliente.html#${l.cliente}`,
      };
      if (d >= 0 && d <= 3 && !a.cobranca && !l.avisado && mCob) {
        await mandar(c.email, preencher(mCob.assunto, v), preencher(mCob.corpo, v));
        a.cobranca = new Date().toISOString(); relatorio.cobranca++;
      }
      if (d < 0 && !a.atraso && !l.atrasoAvisado && mAtr) {
        await mandar(c.email, preencher(mAtr.assunto, v), preencher(mAtr.corpo, v));
        a.atraso = new Date().toISOString(); relatorio.atraso++;
      }
      if (Object.keys(a).length) avisos[l.id] = a;
    }
    await salvarConfig("avisos", avisos);
    relatorio.fila = await enviarPendentes(60);
  } catch (e) {
    console.error("lembretes:", e.message);
  }
  console.log("lembretes:", JSON.stringify(relatorio));
};
export const config = { schedule: "0 12 * * *" };
