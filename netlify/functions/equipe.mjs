/* Equipe: a administradora convida ou remove pessoas da área da equipe. */
import { db, json, daEquipe, mandar, limpar, primeiroNome, linkDeSenha, apagarLogin } from "../lib/lib.mjs";

const q = encodeURIComponent;

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "método" }, 405);
  const quem = await daEquipe(req).catch(() => null);
  if (!quem) return json({ erro: "acesso" }, 401);
  if (quem.papel !== "admin") return json({ erro: "só a administradora pode mudar a equipe" }, 403);
  let b = {};
  try { b = await req.json(); } catch {}
  const email = limpar(b.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ erro: "e-mail inválido" }, 400);
  try {
    if (b.acao === "convidar") {
      const nome = limpar(b.nome, 120) || email;
      const papel = b.papel === "admin" ? "admin" : "equipe";
      await db("equipe?on_conflict=email", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: [{ email, nome, papel }] });
      const link = await linkDeSenha(email);
      const quemNome = (await db(`equipe?email=eq.${q(quem.email)}&select=nome`))[0]?.nome || "Lumara Silva";
      const enviado = await mandar(email, "Seu acesso à área da equipe",
        `Oi, ${primeiroNome(nome)}!\n\n${primeiroNome(quemNome)} te deu acesso à área da equipe do site lumarasilva.com.br. Para entrar, crie a sua senha pelo botão abaixo:\n${link}\n\nO link vale por 1 hora. Se expirar, é só pedir um novo convite ou usar "Esqueci a senha" na tela de entrar.\n\nDepois, você entra na área da equipe com este e-mail e a senha que criar.\n\nLumara`);
      return json({ ok: true, enviado });
    }
    if (b.acao === "remover") {
      if (email === quem.email) return json({ erro: "você não pode remover a si mesma" }, 400);
      const alvo = (await db(`equipe?email=eq.${q(email)}&select=papel`))[0];
      if (alvo && alvo.papel === "admin") {
        const admins = await db("equipe?papel=eq.admin&select=email");
        if (admins.length <= 1) return json({ erro: "precisa ficar pelo menos uma administradora" }, 400);
      }
      await db(`equipe?email=eq.${q(email)}`, { method: "DELETE", prefer: "return=minimal" });
      await apagarLogin(email).catch(() => {});
      return json({ ok: true });
    }
    return json({ erro: "ação" }, 400);
  } catch (e) {
    console.error("equipe:", e.message);
    return json({ erro: "não foi possível concluir agora" }, 500);
  }
};
export const config = { path: "/api/equipe" };
