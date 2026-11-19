/* Mapa do site para o Google, com um endereço por projeto publicado. */
import { SITE_URL } from "../lib/lib.mjs";
import { projetos } from "../lib/portfolio.mjs";

export default async () => {
  const fixas = ["/", "/orcamento", "/links", "/privacidade"];
  const l = await projetos();
  const urls = fixas.map((u) => SITE_URL + u).concat(l.map((p) => `${SITE_URL}/projetos/${encodeURIComponent(p.slug)}`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Netlify-CDN-Cache-Control": "public, s-maxage=3600" } });
};
export const config = { path: "/sitemap.xml" };
