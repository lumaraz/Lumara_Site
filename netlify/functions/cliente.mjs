/* Dados de uma pessoa cliente, para o portal, a proposta, o contrato e o recibo. */
import { js } from "../lib/lib.mjs";
import { donoDoId, dadosDoCliente } from "../lib/cliente.mjs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  let saida = { admin: null, eventos: [] };
  try {
    const cid = await donoDoId(id);
    if (cid) {
      const d = await dadosDoCliente(cid);
      if (d) saida = { admin: d.S, eventos: d.eventos };
    }
  } catch (e) {
    console.error("cliente:", e.message);
    saida.erro = true;
  }
  return js(`window.NUVEM=Object.assign(window.NUVEM||{},${JSON.stringify(saida)});`);
};
export const config = { path: "/api/cliente" };
