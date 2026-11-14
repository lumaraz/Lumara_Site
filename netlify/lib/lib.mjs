/* Ferramentas comuns das funções: banco (Supabase), e-mail (Gmail) e modelos de mensagem. */
import nodemailer from "nodemailer";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const DB = (process.env.SUPABASE_URL || "https://dscgadlvnliuyiwypyqm.supabase.co").replace(/\/+$/, "");
const SEGREDO = process.env.SUPABASE_SECRET_KEY || "";
export const SITE_URL = (process.env.URL || "https://lumarasilva.com.br").replace(/\/+$/, "");

function cabecalhos(extra = {}) {
  const h = { apikey: SEGREDO, "Content-Type": "application/json", ...extra };
  if (SEGREDO.startsWith("eyJ")) h.Authorization = "Bearer " + SEGREDO; // chave antiga (service_role)
  return h;
}

export async function db(caminho, { method = "GET", body, prefer } = {}) {
  if (!SEGREDO) throw new Error("SUPABASE_SECRET_KEY não configurada no Netlify");
  const r = await fetch(`${DB}/rest/v1/${caminho}`, {
    method,
    headers: cabecalhos(prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`Banco ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const q = encodeURIComponent;

export async function registro(tipo, id) {
  const l = await db(`registros?tipo=eq.${q(tipo)}&id=eq.${q(id)}&select=dados`);
  return l && l[0] ? l[0].dados : null;
}
export async function salvarRegistro(tipo, id, dados) {
  await db("registros?on_conflict=tipo,id", {
    method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
    body: [{ tipo, id, dados, atualizado: new Date().toISOString() }],
  });
}
export async function registrosDoCliente(cid) {
  return db(`registros?dados->>cliente=eq.${q(cid)}&select=tipo,id,dados`);
}
export async function lerConfig(chave) {
  const l = await db(`config?chave=eq.${q(chave)}&select=dados`);
  return l && l[0] ? l[0].dados : null;
}
export async function salvarConfig(chave, dados) {
  await db("config?on_conflict=chave", {
    method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
    body: [{ chave, dados, atualizado: new Date().toISOString() }],
  });
}
export async function novoEvento(tipo, dados) {
  await db("eventos", { method: "POST", prefer: "return=minimal", body: [{ tipo, dados }] });
}

/* Padrões do site (mesmo arquivo usado pelo navegador) */
let _ex = null;
export function exemplo() {
  if (_ex) return _ex;
  const tentativas = [
    path.join(process.cwd(), "js/exemplo.js"),
    path.join(path.dirname(new URL(import.meta.url).pathname), "../../js/exemplo.js"),
  ];
  const arq = tentativas.find((p) => fs.existsSync(p));
  const ctx = { window: {} };
  if (arq) vm.runInNewContext(fs.readFileSync(arq, "utf8"), ctx);
  _ex = ctx.window.EXEMPLO || null;
  return _ex;
}

/* Modelos de e-mail: os editados pela Lumara na área da equipe, ou os padrões */
export async function modelo(tipo) {
  const em = (await lerConfig("emails")) || (exemplo() && exemplo().emailsPadrao());
  const m = em && em.modelos && em.modelos[tipo];
  return m && m.ativo ? m : null;
}
export const preencher = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

/* E-mail pelo Google Workspace (senha de app) */
let _correio = null;
function correio() {
  if (_correio) return _correio;
  if (process.env.EMAIL_TESTE) return (_correio = nodemailer.createTransport({ jsonTransport: true }));
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
  _correio = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "") },
  });
  return _correio;
}
const escH = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function corpoHTML(texto) {
  const p = escH(texto).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#462D26">$1</a>').split(/\n{2,}/).map((x) => `<p style="margin:0 0 14px">${x.replace(/\n/g, "<br>")}</p>`).join("");
  return `<div style="font-family:Verdana,Arial,sans-serif;font-size:14px;line-height:1.6;color:#2D2D2D;max-width:560px">${p}<p style="margin:24px 0 0;color:#5E5A55;font-size:12px">Lumara Silva · Designer de marca e visual · lumarasilva.com.br</p></div>`;
}
export async function enviarEmail(para, assunto, corpo) {
  const c = correio();
  if (!c) throw new Error("E-mail não configurado (GMAIL_USER e GMAIL_APP_PASSWORD)");
  await c.sendMail({
    from: `"Lumara Silva" <${process.env.GMAIL_USER || "teste@exemplo.com"}>`,
    to: para, subject: assunto, text: corpo, html: corpoHTML(corpo),
  });
}
/* Coloca na fila e tenta enviar na hora; se falhar, o lembrete diário tenta de novo */
export async function mandar(para, assunto, corpo) {
  const [row] = await db("envios", { method: "POST", prefer: "return=representation", body: [{ para, assunto, corpo }] });
  try {
    await enviarEmail(para, assunto, corpo);
    await db(`envios?id=eq.${row.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "enviado", enviado: new Date().toISOString() } });
    return true;
  } catch (e) {
    await db(`envios?id=eq.${row.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "erro", erro: String(e.message || e).slice(0, 500) } });
    return false;
  }
}
export async function enviarPendentes(limite = 40) {
  const l = await db(`envios?status=in.(pendente,erro)&canal=eq.email&order=id&limit=${limite}&select=id,para,assunto,corpo`);
  let ok = 0;
  for (const m of l) {
    try {
      await enviarEmail(m.para, m.assunto, m.corpo);
      await db(`envios?id=eq.${m.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "enviado", enviado: new Date().toISOString(), erro: null } });
      ok++;
    } catch (e) {
      await db(`envios?id=eq.${m.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "erro", erro: String(e.message || e).slice(0, 500) } });
    }
  }
  return { total: l.length, enviados: ok };
}

/* Confere se quem chamou é da equipe (token do login do Supabase) */
export async function daEquipe(req) {
  const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!tok) return null;
  const r = await fetch(`${DB}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_L8CadGWeIuaUKHsPcbfAYw_gSBoU_tr", Authorization: "Bearer " + tok } });
  if (!r.ok) return null;
  const u = await r.json();
  const l = await db(`equipe?email=eq.${q(String(u.email || "").toLowerCase())}&select=email,papel`);
  return l[0] || null;
}

export const json = (dados, status = 200, extra = {}) =>
  new Response(JSON.stringify(dados), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra } });
export const js = (codigo, cache = "no-store") =>
  new Response(codigo, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": cache } });
export const limpar = (s, n = 2000) => String(s ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n);
export const primeiroNome = (n) => String(n || "").trim().split(/\s+/)[0] || "";

/* Guarda um arquivo no Storage (pasta pública "arquivos") e devolve o endereço */
export async function subirArquivo(caminho, buffer, tipo = "image/jpeg") {
  const h = { apikey: SEGREDO, "Content-Type": tipo, "x-upsert": "true" };
  if (SEGREDO.startsWith("eyJ")) h.Authorization = "Bearer " + SEGREDO;
  const r = await fetch(`${DB}/storage/v1/object/arquivos/${caminho}`, { method: "POST", headers: h, body: buffer });
  if (!r.ok) throw new Error(`Storage ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return `${DB}/storage/v1/object/public/arquivos/${caminho}`;
}
export const idForte = (p = "") => p + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
