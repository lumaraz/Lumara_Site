/* Conta uma visita: só a página, o dia e de onde veio. Nada que identifique a pessoa. */
import { db } from "../lib/lib.mjs";

const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp\/|curl|wget|python/i;
function origem(ref, host) {
  if (!ref) return "direto";
  let h = "";
  try { h = new URL(ref).hostname.replace(/^www\./, ""); } catch { return "direto"; }
  if (!h || h === host || h.endsWith("." + host)) return "interno";
  if (/instagram\.com$/.test(h)) return "Instagram";
  if (/(^|\.)google\./.test(h)) return "Google";
  if (/whatsapp\.com$|wa\.me$/.test(h)) return "WhatsApp";
  if (/facebook\.com$|fb\.com$/.test(h)) return "Facebook";
  if (/linkedin\.com$|lnkd\.in$/.test(h)) return "LinkedIn";
  if (/behance\.net$/.test(h)) return "Behance";
  if (/bing\.com$|duckduckgo\.com$|yahoo\./.test(h)) return "Outras buscas";
  return h.slice(0, 40);
}
function pagina(p) {
  const u = String(p || "/").slice(0, 200);
  const [caminho, hash = ""] = u.split("#");
  const c = caminho.replace(/\/index\.html$/, "/").replace(/\.html$/, "") || "/";
  const pj = /^\/projetos\/([^/]+)/.exec(c);
  if (pj) return "projeto:" + decodeURIComponent(pj[1]).replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  if (c === "/projeto") return "projeto:" + hash.replace(/[^a-z0-9-]/gi, "").slice(0, 60);
  if (c === "/") return "início";
  return c.replace(/^\//, "");
}

export default async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 204 });
  if (ROBO.test(req.headers.get("user-agent") || "")) return new Response(null, { status: 204 });
  let b = {};
  try { b = JSON.parse(await req.text()); } catch {}
  const host = new URL(req.url).hostname.replace(/^www\./, "");
  try {
    await db("rpc/registrar_visita", { method: "POST", prefer: "return=minimal", body: { p_pagina: pagina(b.p), p_origem: origem(b.r, host) } });
  } catch (e) { console.error("visita:", e.message); }
  return new Response(null, { status: 204 });
};
export const config = { path: "/api/visita" };
