/* /projetos/<nome>: a página do projeto já com título, descrição e imagem próprios,
   para o Google e para a prévia no WhatsApp e no Instagram. */
import { SITE_URL } from "../lib/lib.mjs";
import { projetos, arquivo } from "../lib/portfolio.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const resumo = (t) => { const s = String(t || "").replace(/\s+/g, " ").trim(); return s.length > 158 ? s.slice(0, 155).replace(/\s\S*$/, "") + "…" : s; };

export default async (req) => {
  const slug = decodeURIComponent(new URL(req.url).pathname.replace(/^\/projetos\/?/, "").replace(/\/$/, ""));
  let html = arquivo("projeto.html") || "";
  const l = await projetos();
  const p = l.find((x) => x.slug === slug);
  if (p) {
    const url = `${SITE_URL}/projetos/${encodeURIComponent(p.slug)}`;
    const titulo = `${p.nome} — Lumara Silva`;
    const desc = resumo(p.texto) || `Projeto de ${p.nome} por Lumara Silva, designer de marca e visual.`;
    let img = `${SITE_URL}/og-image.jpg`;
    if (/^https?:\/\//.test(p.capa || "")) img = p.capa;
    else if (/^img\/projetos\/[^/]+\/capa\.webp$/.test(p.capa || "")) img = `${SITE_URL}/${p.capa.replace("capa.webp", "og.jpg")}`;
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`)
      .replace(/(<link rel="canonical" href=")[^"]*/, `$1${esc(url)}`)
      .replace(/(<meta property="og:title" content=")[^"]*/, `$1${esc(titulo)}`)
      .replace(/(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`)
      .replace(/(<meta property="og:url" content=")[^"]*/, `$1${esc(url)}`)
      .replace(/(<meta property="og:image" content=")[^"]*/, `$1${esc(img)}`);
  }
  return new Response(html, {
    status: p ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate", "Netlify-CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
};
export const config = { path: ["/projetos/*"] };
