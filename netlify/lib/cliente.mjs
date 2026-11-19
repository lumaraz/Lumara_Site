/* Descobre a quem pertence um link (cliente, proposta ou recibo) e monta só os dados dessa pessoa. */
import { db, registrosDoCliente, lerConfig } from "./lib.mjs";

const TIPOS = ["clientes", "orcamentos", "projetos", "caixa", "posts"];

export async function donoDoId(id) {
  if (!id || !/^[A-Za-z0-9_-]{4,64}$/.test(id)) return null;
  const l = await db(`registros?id=eq.${encodeURIComponent(id)}&tipo=in.(clientes,orcamentos,caixa,projetos,posts)&select=tipo,dados`);
  const r = l && l[0];
  if (!r) return null;
  return r.tipo === "clientes" ? id : r.dados.cliente || null;
}

export async function pendentes(cid) {
  const l = await db(`eventos?processado=is.null&dados->>cliente=eq.${encodeURIComponent(cid)}&order=id&select=tipo,dados,criado`);
  return l.map((e) => ({ ...e.dados, tipo: e.tipo, quando: e.dados.quando || e.criado }));
}

export async function dadosDoCliente(cid) {
  const linhas = await registrosDoCliente(cid);
  const S = { v: 4, clientes: [], orcamentos: [], projetos: [], caixa: [], posts: [], pedidos: [], equipe: [] };
  const [cli] = await db(`registros?tipo=eq.clientes&id=eq.${encodeURIComponent(cid)}&select=dados`);
  if (!cli) return null;
  S.clientes.push(cli.dados);
  for (const r of linhas) if (TIPOS.includes(r.tipo) && r.tipo !== "clientes") S[r.tipo].push(r.dados);
  const geral = (await lerConfig("geral")) || {};
  S.contratoModelo = geral.contratoModelo || null;
  S.contratoSocial = geral.contratoSocial || null;
  const ev = await pendentes(cid);
  const pagoParcela = (id) => ev.some((x) => x.tipo === "parcela" && x.lanc === id);
  // O que é interno da equipe não sai daqui
  S.projetos = S.projetos.map((p) => {
    const devendo = S.caixa.some((l) => l.tipo === "entrada" && !l.pago && !pagoParcela(l.id) && ((p.orc && l.orc === p.orc) || l.projeto === p.id));
    return {
      id: p.id, orc: p.orc, titulo: p.titulo, cliente: p.cliente, etapa: p.etapa, prazo: p.prazo, servico: p.servico,
      check: p.check || [],
      entregas: (p.entregas || []).map((e) => (e.tipo === "final" && devendo ? { ...e, url: "" } : e)),
    };
  });
  S.caixa = S.caixa.filter((l) => l.tipo === "entrada");
  S.orcamentos = S.orcamentos.map((o) => { const { notas, ...resto } = o; return resto; });
  return { S, eventos: ev };
}
