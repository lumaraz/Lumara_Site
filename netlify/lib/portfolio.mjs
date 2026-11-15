/* Projetos publicados: os editados no painel (banco) ou os padrões do site (js/portfolio.js). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { lerConfig } from "./lib.mjs";

export function arquivo(rel) {
  const tentativas = [path.join(process.cwd(), rel), path.join(path.dirname(new URL(import.meta.url).pathname), "../../", rel)];
  const a = tentativas.find((p) => fs.existsSync(p));
  return a ? fs.readFileSync(a, "utf8") : null;
}
let _padrao = null;
function padrao() {
  if (_padrao) return _padrao;
  const ctx = { window: {}, localStorage: { getItem: () => null, setItem() {} } };
  const src = arquivo("js/portfolio.js");
  if (src) vm.runInNewContext(src, ctx);
  _padrao = ctx.window.PORTFOLIO ? ctx.window.PORTFOLIO.carregar() : [];
  return _padrao;
}
export async function projetos() {
  let l = null;
  try { l = await lerConfig("portfolio"); } catch (e) { console.error("portfolio:", e.message); }
  return (Array.isArray(l) && l.length ? l : padrao()).filter((p) => p.publicado && p.slug);
}
