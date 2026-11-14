/* Conteúdo público do site (textos, serviços, links, portfólio), editado na área da equipe. */
import { lerConfig } from "../lib/lib.mjs";

export default async () => {
  let dados = {};
  try {
    const [site, portfolio] = await Promise.all([lerConfig("site"), lerConfig("portfolio")]);
    if (site) dados.site = site;
    if (portfolio) dados.portfolio = portfolio;
  } catch (e) {
    console.error("publico:", e.message);
  }
  return new Response(`window.NUVEM=Object.assign(window.NUVEM||{},${JSON.stringify(dados)});`, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Netlify-CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
    },
  });
};
export const config = { path: "/api/publico" };
