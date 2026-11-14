/* Volta da página de pagamento: confirma na hora, sem esperar o webhook. */
import { json } from "../lib/lib.mjs";
import { confirmar } from "../lib/pagamento.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    return json(await confirmar(b));
  } catch (e) {
    console.error("confirmar:", e.message);
    return json({ ok: false }, 500);
  }
};
export const config = { path: "/api/confirmar" };
