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
/* E-mail em HTML com a identidade do site (tabelas e estilos inline, para funcionar no Gmail e no Outlook) */
const BOTOES = [
  [/\/auth\/v1\/verify/, "Criar minha senha"],
  [/\/contrato\.html/, "Ler e assinar o contrato"],
  [/\/proposta\.html/, "Ver a proposta"],
  [/\/cliente\.html/, "Abrir meu portal"],
  [/calendar\.app\.google|calendar\.google|\/calendar\//, "Escolher o horário da reunião"],
  [/\/admin\//, "Abrir a área da equipe"],
  [/\/orcamento\.html/, "Pedir orçamento"],
];
const rotulo = (u) => (BOTOES.find(([r]) => r.test(u)) || [, "Abrir o link"])[1];
const linkInline = (t) => t.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:#2D2D2D;text-decoration:underline">${rotulo(u).toLowerCase()}</a>`);
function botao(u) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px"><tr><td style="border-radius:999px;background:#2D2D2D">
    <a href="${u}" style="display:inline-block;padding:13px 26px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#FAFAFF;text-decoration:none;border-radius:999px">${rotulo(u)}</a></td></tr></table>`;
}
function corpoHTML(texto, assunto = "") {
  const img = (n) => `${SITE_URL}/img/${n}`;
  const linhas = String(texto || "").replace(/\r/g, "").split("\n");
  // assinatura: a última linha "Lumara" vira o bloco com foto
  let fim = linhas.length - 1;
  while (fim >= 0 && !linhas[fim].trim()) fim--;
  const temAssinatura = fim >= 0 && /^lumara( silva)?$/i.test(linhas[fim].trim());
  if (temAssinatura) linhas.splice(fim, 1);
  const blocos = linhas.join("\n").trim().split(/\n{2,}/);
  let html = "", primeiro = true, preheader = "";
  for (const b of blocos) {
    const ls = b.split("\n");
    let par = [];
    const fecharPar = () => {
      if (!par.length) return;
      const t = par.join("<br>");
      if (primeiro && /^(oi|olá|ola|hi|hello)\b/i.test(par[0])) {
        html += `<p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:22px;line-height:1.3;font-weight:bold;color:#2D2D2D">${t}</p>`;
      } else {
        if (!preheader) preheader = par.join(" ").replace(/<[^>]+>/g, "");
        html += `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#2D2D2D">${t}</p>`;
      }
      primeiro = false; par = [];
    };
    for (const l of ls) {
      const so = l.trim();
      const m = /^(.*?:)?\s*(https?:\/\/\S+)$/.exec(so);
      if (m && (!m[1] || m[1].length < 60)) { // linha que termina num link: vira botão
        if (m[1]) par.push(linkInline(escH(m[1])));
        fecharPar(); html += botao(m[2]); primeiro = false;
      } else par.push(linkInline(escH(l)));
    }
    fecharPar();
  }
  const assinatura = temAssinatura ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px"><tr>
      <td style="padding-right:12px;vertical-align:middle"><img src="${img("avatar-email.jpg")}" width="44" height="44" alt="" style="display:block;border-radius:50%;border:0"></td>
      <td style="vertical-align:middle;font-family:Helvetica,Arial,sans-serif"><div style="font-size:15px;font-weight:bold;color:#2D2D2D">Lumara Silva</div><div style="font-size:13px;color:#2D2D2D">Designer de marca e visual</div></td></tr></table>` : "";
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escH(assunto)}</title></head>
<body style="margin:0;padding:0;background:#F2EFE9">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#F2EFE9">${escH(preheader).slice(0, 140)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2EFE9"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td style="padding:0 6px 18px"><a href="${SITE_URL}"><img src="${img("logo-azul.png")}" width="132" height="22" alt="Lumara Silva" style="display:block;border:0;height:22px;width:132px"></a></td></tr>
    <tr><td style="background:#FAFAFF;border:1px solid #CCCCCC;border-radius:18px;padding:34px 30px 30px">${html}${assinatura}</td></tr>
    <tr><td style="padding:20px 6px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#2D2D2D">
      <a href="${SITE_URL}" style="color:#2D2D2D">lumarasilva.com.br</a> &nbsp;·&nbsp; <a href="https://wa.me/5521989967803" style="color:#2D2D2D">WhatsApp (21) 98996-7803</a><br>
      Dúvidas? É só responder este e-mail.</td></tr>
  </table>
</td></tr></table></body></html>`;
}
export async function enviarEmail(para, assunto, corpo) {
  const c = correio();
  if (!c) throw new Error("E-mail não configurado (GMAIL_USER e GMAIL_APP_PASSWORD)");
  await c.sendMail({
    from: `"Lumara Silva" <${process.env.GMAIL_USER || "teste@exemplo.com"}>`,
    to: para, subject: assunto, text: corpo, html: corpoHTML(corpo, assunto),
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

/* Login (Supabase Auth): convite ou recuperação, com link para criar a senha */
export async function linkDeSenha(email) {
  const pedir = async (type) => {
    const r = await fetch(`${DB}/auth/v1/admin/generate_link`, { method: "POST", headers: cabecalhos(),
      body: JSON.stringify({ type, email, redirect_to: `${SITE_URL}/admin/` }) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  };
  let { ok, j } = await pedir("invite");
  if (!ok) ({ ok, j } = await pedir("recovery")); // a pessoa já tinha login
  const link = j.action_link || (j.properties && j.properties.action_link);
  if (!ok || !link) throw new Error("Auth: " + JSON.stringify(j).slice(0, 200));
  return link;
}
export async function apagarLogin(email) {
  const r = await fetch(`${DB}/auth/v1/admin/users?page=1&per_page=1000`, { headers: cabecalhos() });
  const j = await r.json().catch(() => ({}));
  const u = (j.users || []).find((x) => String(x.email || "").toLowerCase() === email);
  if (u) await fetch(`${DB}/auth/v1/admin/users/${u.id}`, { method: "DELETE", headers: cabecalhos() });
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
export { corpoHTML };
