/* A área da equipe pede para enviar agora os e-mails que acabaram de entrar na fila. */
import { json, daEquipe, enviarPendentes } from "../lib/lib.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  const quem = await daEquipe(req).catch(() => null);
  if (!quem) return json({ erro: "acesso" }, 401);
  try {
    return json(await enviarPendentes(20));
  } catch (e) {
    console.error("enviar:", e.message);
    return json({ erro: e.message }, 500);
  }
};
export const config = { path: "/api/enviar" };
