/* Toda segunda às 9h (Brasília): cópia de segurança de todo o sistema, por e-mail, em um arquivo .json. */
import { db, enviarEmail } from "../lib/lib.mjs";

async function tudo(tabela, filtro = "") {
  let out = [], de = 0;
  for (;;) {
    const l = await db(`${tabela}?select=*${filtro}&order=${tabela === "config" ? "chave" : tabela === "equipe" ? "email" : tabela === "registros" ? "tipo,id" : "id"}&offset=${de}&limit=1000`);
    out = out.concat(l);
    if (l.length < 1000) return out;
    de += 1000;
  }
}

export default async () => {
  const para = process.env.AVISOS_PARA || process.env.GMAIL_USER;
  if (!para) return;
  try {
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const dados = {
      gerado: new Date().toISOString(),
      registros: await tudo("registros"),
      config: await tudo("config"),
      equipe: await tudo("equipe"),
      eventos_pendentes: await tudo("eventos", "&processado=is.null"),
    };
    const n = (t) => dados.registros.filter((r) => r.tipo === t).length;
    const corpo = `Oi, Lumara!\n\nSegue em anexo a cópia de segurança semanal do sistema (${hoje}).\n\nNela estão ${n("clientes")} clientes, ${n("orcamentos")} propostas, ${n("projetos")} projetos e ${n("caixa")} lançamentos do caixa, além dos textos do site e do portfólio.\n\nNão precisa fazer nada: só guarde este e-mail. Se algum dia algo for apagado por engano, é com este arquivo que tudo volta.\n\nLumara`;
    await enviarEmail(para, `Backup semanal do sistema (${hoje})`, corpo, [
      { filename: `backup-lumara-${hoje}.json`, content: JSON.stringify(dados), contentType: "application/json" },
    ]);
    console.log("backup enviado:", dados.registros.length, "registros");
  } catch (e) {
    console.error("backup:", e.message);
  }
};
export const config = { schedule: "0 12 * * 1" };
