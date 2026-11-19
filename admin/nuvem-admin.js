/* Área da equipe no site publicado: login (Supabase Auth), carregar e salvar no banco,
   receber o que chega dos clientes, enviar e-mails e guardar imagens no Storage.
   O app (app.js) continua trabalhando com os mesmos dados de antes; esta camada só
   faz a ponte entre ele e o banco. */
(function () {
  "use strict";
  const BASE = window.NUVEM_CONFIG.url, KEY = window.NUVEM_CONFIG.chave;
  const SK = "lumara_sessao";
  const TIPOS = ["clientes", "pedidos", "orcamentos", "projetos", "caixa", "posts"];
  const LUMARA = { id: "lumara", nome: "Lumara Silva", papel: "Administradora", cor: "#2E5E7A", acesso: "Tudo, incluindo caixa e valores" };
  const setOrig = Storage.prototype.setItem;
  let sessao = null;
  let base = {}, baseCfg = {};
  let pendEv = [], pendPed = [], marcarEv = false, ultimoEv = 0;
  let pendente = null, salvando = false, timer = null, falhas = 0;
  let visto = "";

  /* ---------- sessão ---------- */
  function lerSessao() { try { return JSON.parse(localStorage.getItem(SK)); } catch (e) { return null; } }
  function gravarSessao(s) { sessao = s; try { s ? setOrig.call(localStorage, SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) {} }
  async function auth(caminho, corpo, metodo = "POST", tok) {
    const h = { apikey: KEY, "Content-Type": "application/json" };
    if (tok) h.Authorization = "Bearer " + tok;
    const r = await fetch(BASE + "/auth/v1/" + caminho, { method: metodo, headers: h, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error_description || j.msg || j.message || "erro"); e.status = r.status; e.codigo = j.error_code || j.error; throw e; }
    return j;
  }
  function guardar(j) {
    gravarSessao({
      access_token: j.access_token, refresh_token: j.refresh_token,
      expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (+j.expires_in || 3600),
      email: (j.user && j.user.email) || (sessao && sessao.email) || "",
    });
  }
  async function token() {
    if (!sessao) throw new Error("sem sessão");
    if (sessao.expires_at - 60 < Date.now() / 1000) {
      try { guardar(await auth("token?grant_type=refresh_token", { refresh_token: sessao.refresh_token })); }
      catch (e) { if (e.status >= 400 && e.status < 500) { gravarSessao(null); mostrarLogin("Sua sessão terminou. Entre de novo."); } throw e; }
    }
    return sessao.access_token;
  }
  async function rest(caminho, { method = "GET", body, prefer, headers = {} } = {}) {
    const t = await token();
    const r = await fetch(BASE + "/rest/v1/" + caminho, {
      method,
      headers: Object.assign({ apikey: KEY, Authorization: "Bearer " + t, "Content-Type": "application/json" }, prefer ? { Prefer: prefer } : {}, headers),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const tx = await r.text();
    if (!r.ok) throw new Error("Banco " + r.status + ": " + tx.slice(0, 200));
    return tx ? JSON.parse(tx) : null;
  }
  async function tudo(caminho) {
    let out = [], de = 0;
    for (;;) {
      const l = await rest(caminho, { headers: { Range: `${de}-${de + 999}`, "Range-Unit": "items" } });
      out = out.concat(l);
      if (l.length < 1000) return out;
      de += 1000;
    }
  }

  /* ---------- tela de login ---------- */
  const CSS = `.login{position:fixed;inset:0;background:#F2EEE9;display:grid;place-items:center;z-index:1000;padding:1.2rem;font-family:Verdana,Geneva,sans-serif}
  .login form{background:#fff;border:1px solid #D9D2C9;border-radius:16px;padding:2rem 1.6rem;width:min(400px,100%);display:grid;gap:.9rem}
  .login img{height:30px;width:auto;margin-bottom:.4rem}
  .login h1{font-size:1.15rem;margin:0;color:#2D2D2D}.login p{margin:0;color:#5E5A55;font-size:.88rem;line-height:1.5}
  .login label{display:grid;gap:.3rem;font-size:.85rem;color:#2D2D2D}
  .login input{font:inherit;font-size:1rem;padding:.7rem .8rem;border:1px solid #9E968B;border-radius:10px;background:#fff}
  .login input:focus-visible,.login button:focus-visible{outline:3px solid #86BBD8;outline-offset:2px}
  .login .entrar{font:inherit;background:#2D2D2D;color:#fff;border:0;border-radius:999px;padding:.8rem 1rem;cursor:pointer;font-size:.95rem}
  .login .entrar[disabled]{opacity:.6;cursor:wait}
  .login .link{background:none;border:0;color:#23446A;text-decoration:underline;cursor:pointer;font:inherit;font-size:.85rem;justify-self:start;padding:0}
  .login .erro{color:#9b2c1f}.login .ok{color:#2F6B4F}`;
  function mostrarLogin(msg, modo = "entrar") {
    let el = document.getElementById("login");
    if (!el) {
      document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
      el = document.createElement("div"); el.className = "login"; el.id = "login";
      document.body.appendChild(el);
    }
    const nova = modo === "nova";
    el.innerHTML = `<form novalidate>
      <img src="../img/logo-azul.svg" alt="Lumara Silva">
      <h1>${nova ? "Crie sua nova senha" : modo === "esqueci" ? "Recuperar a senha" : "Área da equipe"}</h1>
      ${modo === "esqueci" ? `<p>Digite seu e-mail. Você vai receber um link para criar uma senha nova.</p>` : ""}
      ${nova ? "" : `<label>E-mail<input type="email" name="email" autocomplete="username" required value="${(sessao && sessao.email) || ""}"></label>`}
      ${modo === "esqueci" ? "" : `<label>${nova ? "Nova senha (mínimo 8 caracteres)" : "Senha"}<input type="password" name="senha" autocomplete="${nova ? "new-password" : "current-password"}" required minlength="${nova ? 8 : 1}"></label>`}
      <p class="msg" role="alert">${msg || ""}</p>
      <button class="entrar" type="submit">${nova ? "Salvar senha e entrar" : modo === "esqueci" ? "Enviar link" : "Entrar"}</button>
      ${modo === "entrar" ? `<button class="link" type="button" data-modo="esqueci">Esqueci a senha</button>` : nova ? "" : `<button class="link" type="button" data-modo="entrar">Voltar</button>`}
    </form>`;
    const f = el.querySelector("form"), m = el.querySelector(".msg");
    m.className = "msg" + (msg ? " erro" : "");
    el.querySelectorAll("[data-modo]").forEach((b) => (b.onclick = () => mostrarLogin("", b.dataset.modo)));
    (f.querySelector("input") || f.querySelector("button")).focus();
    f.onsubmit = async (ev) => {
      ev.preventDefault();
      const bt = f.querySelector(".entrar"), email = f.email && f.email.value.trim(), senha = f.senha && f.senha.value;
      m.className = "msg erro";
      if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { m.textContent = "Digite um e-mail válido."; f.email.focus(); return; }
      if (f.senha && (!senha || (nova && senha.length < 8))) { m.textContent = nova ? "A senha precisa ter pelo menos 8 caracteres." : "Digite a senha."; f.senha.focus(); return; }
      bt.disabled = true; m.textContent = "";
      try {
        if (modo === "esqueci") {
          await auth("recover?redirect_to=" + encodeURIComponent(location.origin + location.pathname), { email });
          m.className = "msg ok"; m.textContent = "Se esse e-mail tiver acesso, o link chega em alguns minutos. Confira também o spam.";
          bt.disabled = false; return;
        }
        if (nova) await auth("user", { password: senha }, "PUT", sessao.access_token);
        else guardar(await auth("token?grant_type=password", { email, password: senha }));
        await iniciar();
      } catch (e) {
        bt.disabled = false;
        m.textContent = e.status === 400 && !nova ? "E-mail ou senha incorretos." : e.codigo === "same_password" ? "Escolha uma senha diferente da anterior." : e.status === 422 ? "Essa senha não foi aceita. Tente uma mais longa." : "Não foi possível entrar agora. Confira a conexão e tente de novo.";
      }
    };
  }
  function esconderLogin() { const el = document.getElementById("login"); if (el) el.remove(); }

  /* ---------- carregar do banco ---------- */
  function vazio() {
    const S = { v: 4, seq: 1, equipe: [LUMARA], emails: EXEMPLO.emailsPadrao(), catalogo: EXEMPLO.catalogoPadrao() };
    TIPOS.forEach((t) => (S[t] = []));
    S.emails.historico = [];
    return S;
  }
  function geralDe(S) {
    const g = {};
    Object.keys(S).forEach((k) => { if (!TIPOS.includes(k) && k !== "emails" && k !== "catalogo") g[k] = S[k]; });
    return g;
  }
  async function hidratar() {
    const [regs, cfgs, evs] = await Promise.all([
      tudo("registros?select=tipo,id,dados,atualizado"),
      rest("config?select=chave,dados,atualizado"),
      tudo("eventos?processado=is.null&select=id,tipo,dados&order=id"),
    ]);
    const C = {}; cfgs.forEach((c) => (C[c.chave] = c.dados));
    const S = vazio();
    Object.assign(S, C.geral || {});
    if (!S.equipe || !S.equipe.length) S.equipe = [LUMARA];
    if (C.emails) S.emails = C.emails;
    if (!S.emails.historico) S.emails.historico = [];
    if (C.catalogo) S.catalogo = C.catalogo;
    TIPOS.forEach((t) => (S[t] = []));
    regs.sort((a, b) => ((a.dados._o ?? 1e9) - (b.dados._o ?? 1e9)));
    regs.forEach((r) => { if (S[r.tipo]) { const d = r.dados; delete d._o; S[r.tipo].push(d); } });
    // linha de base para saber o que mudou
    base = {}; TIPOS.forEach((t) => { base[t] = new Map(); S[t].forEach((x, i) => base[t].set(x.id, JSON.stringify(Object.assign({}, x, { _o: i })))); });
    baseCfg = { geral: JSON.stringify(geralDe(S)), emails: JSON.stringify(S.emails), catalogo: JSON.stringify(S.catalogo),
      site: C.site ? JSON.stringify(C.site) : null, portfolio: C.portfolio ? JSON.stringify(C.portfolio) : null };

    setOrig.call(localStorage, "lumara_admin", JSON.stringify(S));
    if (C.site) setOrig.call(localStorage, "lumara_site", JSON.stringify(C.site)); else localStorage.removeItem("lumara_site");
    if (C.portfolio) setOrig.call(localStorage, "lumara_portfolio_v4", JSON.stringify(C.portfolio)); else localStorage.removeItem("lumara_portfolio_v4");
    const ped = evs.filter((e) => e.tipo === "pedido"), outros = evs.filter((e) => e.tipo !== "pedido" && podeProcessar(e.tipo));
    setOrig.call(localStorage, "lumara_pedidos", JSON.stringify(ped.map((e) => e.dados)));
    setOrig.call(localStorage, "lumara_eventos", JSON.stringify(outros.map((e) => Object.assign({}, e.dados, { tipo: e.tipo }))));
    pendPed = ped.map((e) => ({ ev: e.id, id: e.dados.id }));
    pendEv = outros.map((e) => e.id);
    ultimoEv = evs.reduce((m, e) => Math.max(m, e.id), 0);
    if (!ultimoEv) { const u = await rest("eventos?select=id&order=id.desc&limit=1"); ultimoEv = u[0] ? u[0].id : 0; }
    visto = [...regs.map((r) => r.atualizado || ""), ...cfgs.map((c) => c.atualizado || "")].reduce((a, b) => (b > a ? b : a), "");
  }

  /* quem é "Equipe" não mexe em dinheiro: aprovação e pagamentos ficam para a administradora */
  const ehAdmin = () => window.NUVEM_ADMIN && window.NUVEM_ADMIN.papel === "admin";
  const podeProcessar = (tipo) => ehAdmin() || !["aprovado", "pago", "parcela"].includes(tipo);

  /* ---------- salvar no banco ---------- */
  function sinc(txt, erro) { const el = document.getElementById("sinc"); if (el) { el.textContent = txt; el.style.color = erro ? "#9b2c1f" : ""; } }
  function agendar(S) { pendente = S; clearTimeout(timer); timer = setTimeout(salvarAgora, 600); sinc("Salvando…"); }
  async function salvarAgora() {
    if (salvando) { clearTimeout(timer); timer = setTimeout(salvarAgora, 400); return; }
    if (!pendente) return;
    const S = pendente; pendente = null; salvando = true;
    const agora = new Date().toISOString(), up = [], dels = [], novo = {};
    try {
      TIPOS.forEach((t) => {
        if (t === "caixa" && !ehAdmin()) { novo[t] = base[t] || new Map(); return; }
        const atual = new Map();
        (S[t] || []).forEach((x, i) => {
          if (!x || !x.id) return;
          const d = Object.assign({}, x, { _o: i }), j = JSON.stringify(d);
          atual.set(x.id, j);
          if (!base[t] || base[t].get(x.id) !== j) up.push({ tipo: t, id: x.id, dados: d, atualizado: agora });
        });
        (base[t] || new Map()).forEach((_, id) => { if (!atual.has(id)) dels.push([t, id]); });
        novo[t] = atual;
      });
      const cfg = [];
      const g = JSON.stringify(geralDe(S)), em = JSON.stringify(S.emails), ca = JSON.stringify(S.catalogo);
      if (g !== baseCfg.geral) cfg.push({ chave: "geral", dados: JSON.parse(g), atualizado: agora });
      if (em !== baseCfg.emails) cfg.push({ chave: "emails", dados: S.emails, atualizado: agora });
      if (ca !== baseCfg.catalogo) cfg.push({ chave: "catalogo", dados: S.catalogo, atualizado: agora });
      for (let i = 0; i < up.length; i += 200)
        await rest("registros?on_conflict=tipo,id", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: up.slice(i, i + 200) });
      const porTipo = {};
      dels.forEach(([t, id]) => (porTipo[t] = porTipo[t] || []).push(id));
      for (const t in porTipo)
        await rest(`registros?tipo=eq.${t}&id=in.(${porTipo[t].map((x) => `"${String(x).replace(/"/g, "")}"`).join(",")})`, { method: "DELETE", prefer: "return=minimal" });
      if (cfg.length) await rest("config?on_conflict=chave", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: cfg });
      base = novo; baseCfg.geral = g; baseCfg.emails = em; baseCfg.catalogo = ca;
      // o que chegou de fora já foi aplicado e salvo: pode sair da fila
      const ids = [];
      if (marcarEv) { ids.push(...pendEv); pendEv = []; marcarEv = false; }
      const feitos = pendPed.filter((p) => (S.pedidos || []).some((x) => x.id === p.id));
      ids.push(...feitos.map((p) => p.ev)); pendPed = pendPed.filter((p) => !feitos.includes(p));
      if (ids.length) {
        await rest(`eventos?id=in.(${ids.join(",")})`, { method: "PATCH", prefer: "return=minimal", body: { processado: agora } });
        setOrig.call(localStorage, "lumara_pedidos", "[]");
      }
      falhas = 0; salvando = false;
      sinc(pendente ? "Salvando…" : "Tudo salvo");
      if (pendente) salvarAgora();
    } catch (e) {
      console.error(e); salvando = false; falhas++;
      if (!pendente) pendente = S;
      const recusado = /Banco 4(0[0-9]|2[0-9])/.test(e.message) && !/Banco 40[18]/.test(e.message);
      sinc(recusado ? "O banco recusou a alteração. Tentando de novo…" : "Sem conexão. Tentando salvar de novo…", true);
      if (falhas === 1 && typeof toast === "function")
        toast(recusado ? "Não foi possível salvar a última alteração (o banco recusou). Recarregue a página; se continuar, avise a administradora." : "Sem conexão: a alteração fica guardada e será salva assim que a internet voltar.");
      clearTimeout(timer); timer = setTimeout(salvarAgora, Math.min(30000, 3000 * falhas));
    }
  }
  async function salvarConfig(chave, valor) {
    const j = valor; if (j === baseCfg[chave]) return;
    sinc("Salvando…");
    try {
      await rest("config?on_conflict=chave", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: [{ chave, dados: JSON.parse(j), atualizado: new Date().toISOString() }] });
      baseCfg[chave] = j; sinc("Tudo salvo");
    } catch (e) {
      console.error(e); sinc("Não foi possível publicar. Tente salvar de novo.", true);
      if (typeof toast === "function") toast("Não foi possível publicar no site. Confira a conexão e salve de novo.");
    }
  }
  function ligarGravacao() {
    Storage.prototype.setItem = function (k, v) {
      setOrig.call(this, k, v);
      if (this !== localStorage) return;
      if (k === "lumara_admin") { try { agendar(JSON.parse(v)); } catch (e) {} }
      else if (k === "lumara_site") salvarConfig("site", v);
      else if (k === "lumara_portfolio_v4") salvarConfig("portfolio", v);
      else if (k === "lumara_eventos" && v === "[]") marcarEv = true;
    };
    addEventListener("beforeunload", (e) => { if (pendente || salvando) { e.preventDefault(); e.returnValue = ""; } });
  }

  /* ---------- e-mails ---------- */
  let filaEmail = Promise.resolve(), disparo = null;
  function email(para, assunto, corpo) {
    filaEmail = filaEmail.then(() => rest("envios", { method: "POST", prefer: "return=minimal", body: [{ para, assunto, corpo }] }))
      .catch((e) => { console.error(e); if (typeof toast === "function") toast("Um e-mail não entrou na fila de envio. Confira a conexão."); });
    clearTimeout(disparo);
    disparo = setTimeout(() => filaEmail.then(async () => {
      try { await fetch("/api/enviar", { method: "POST", headers: { Authorization: "Bearer " + (await token()) } }); } catch (e) {}
    }), 1500);
  }

  /* ---------- imagens no Storage ---------- */
  async function subir(dataUrl) {
    if (!/^data:image\//.test(dataUrl)) return dataUrl;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const nome = `admin/${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const r = await fetch(`${BASE}/storage/v1/object/arquivos/${nome}`, {
        method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + (await token()), "Content-Type": blob.type || "image/jpeg" }, body: blob,
      });
      if (!r.ok) throw new Error("Storage " + r.status);
      return `${BASE}/storage/v1/object/public/arquivos/${nome}`;
    } catch (e) {
      console.error(e);
      if (typeof toast === "function") toast("A imagem não foi enviada ao servidor. Confira a conexão e tente de novo.");
      throw e;
    }
  }

  /* ---------- novidades enquanto a página está aberta ---------- */
  async function buscarNovos() {
    if (document.hidden || !sessao) return;
    try {
      const evs = await rest(`eventos?processado=is.null&id=gt.${ultimoEv}&select=id,tipo,dados&order=id`);
      if (!evs.length) return;
      ultimoEv = evs[evs.length - 1].id;
      const ped = evs.filter((e) => e.tipo === "pedido"), outros = evs.filter((e) => e.tipo !== "pedido" && podeProcessar(e.tipo));
      ped.forEach((e) => {
        const p = e.dados; pendPed.push({ ev: e.id, id: p.id });
        if (!S.pedidos.find((x) => x.id === p.id)) {
          S.pedidos.push(p);
          window.SEM_ENVIO = !!p.emailEnviado; registrarEmail("recebido", p.email, { nome: (p.nome || "").split(" ")[0] }); window.SEM_ENVIO = false;
          notas.push(`Novo pedido de orçamento: ${p.nome}.`);
        }
      });
      if (outros.length) {
        pendEv.push(...outros.map((e) => e.id));
        let l = []; try { l = JSON.parse(localStorage.getItem("lumara_eventos") || "[]"); } catch (x) {}
        setOrig.call(localStorage, "lumara_eventos", JSON.stringify(l.concat(outros.map((e) => Object.assign({}, e.dados, { tipo: e.tipo })))));
        processarEventos();
      }
      salvar(); render();
      if (notas.length) { toast(notas.join(" ")); notas = []; }
    } catch (e) { console.error(e); }
  }

  /* ---------- mudanças feitas em outro aparelho ---------- */
  let avisoOutro = false;
  async function conferirOutroAparelho() {
    if (document.hidden || !sessao || !visto || pendente || salvando) return;
    try {
      const [rg, cf] = await Promise.all([
        rest(`registros?atualizado=gt.${encodeURIComponent(visto)}&select=tipo,id,dados,atualizado&limit=200`),
        rest(`config?atualizado=gt.${encodeURIComponent(visto)}&select=chave,dados,atualizado`),
      ]);
      if (!rg.length && !cf.length) return;
      const novoVisto = [...rg, ...cf].map((x) => x.atualizado).reduce((a, b) => (b > a ? b : a), visto);
      // o que eu mesma salvei volta igual ao que tenho: não conta
      const mesmo = (a, b) => JSON.stringify(ordenar(a)) === JSON.stringify(ordenar(b));
      const deFora = rg.some((r) => !(base[r.tipo] && base[r.tipo].has(r.id) && mesmo(r.dados, JSON.parse(base[r.tipo].get(r.id)))))
        || cf.some((c) => ["geral", "emails", "catalogo", "site", "portfolio"].includes(c.chave) && !(baseCfg[c.chave] && mesmo(c.dados, JSON.parse(baseCfg[c.chave]))));
      if (!deFora) { visto = novoVisto; return; }
      const ocupada = document.getElementById("gaveta")?.classList.contains("on") || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "");
      if (!ocupada) { location.reload(); return; }
      if (!avisoOutro) { avisoOutro = true; sinc("Há mudanças feitas em outro aparelho. Ao fechar o que está editando, a página se atualiza.", false); }
    } catch (e) { console.error(e); }
  }
  function ordenar(v) {
    if (Array.isArray(v)) return v.map(ordenar);
    if (v && typeof v === "object") return Object.keys(v).sort().reduce((o, k) => ((o[k] = ordenar(v[k])), o), {});
    return v;
  }

  /* ---------- início ---------- */
  async function iniciar() {
    if (!sessao.email) { // volta de convite ou recuperação: descobre o e-mail pelo próprio login
      const r = await fetch(BASE + "/auth/v1/user", { headers: { apikey: KEY, Authorization: "Bearer " + (await token()) } });
      const u = await r.json().catch(() => ({}));
      sessao.email = u.email || ""; gravarSessao(sessao);
    }
    const quem = await rest("equipe?select=email,papel,nome");
    if (!quem.some((x) => x.email === String(sessao.email).toLowerCase())) { gravarSessao(null); mostrarLogin("Este e-mail não tem acesso à área da equipe."); return; }
    // quem está usando: o papel decide o que ela carrega e salva
    const email = String(sessao.email || "").toLowerCase();
    const minha = quem.find((x) => x.email === email);
    window.NUVEM_ADMIN.papel = minha.papel;
    sinc("Carregando…");
    await hidratar();
    try {
      const S0 = JSON.parse(localStorage.getItem("lumara_admin"));
      let p = S0.equipe.find((x) => (x.email || "").toLowerCase() === email)
        || (minha.papel === "admin" && S0.equipe.find((x) => x.id === "lumara" && !x.email));
      if (!p) { p = { id: "p" + Math.random().toString(36).slice(2, 9), nome: minha.nome || email, cor: "#86BBD8" }; S0.equipe.push(p); }
      p.email = email;
      if (p.convite || !p.aceito) { delete p.convite; delete p.removido; p.aceito = p.aceito || new Date().toISOString(); window.NUVEM_ADMIN.salvarAoAbrir = true; }
      if (minha.papel === "admin") { p.papel = "Administradora"; p.acesso = "Tudo, incluindo caixa e valores"; }
      else { p.papel = "Equipe"; p.acesso = "Pedidos, projetos, calendário e clientes, sem valores"; }
      window.NUVEM_ADMIN.eu = p.id;
      setOrig.call(localStorage, "lumara_admin", JSON.stringify(S0));
    } catch (e) { console.error(e); }
    ligarGravacao();
    esconderLogin();
    const q = document.getElementById("quem"); if (q) q.textContent = sessao.email || quem[0].email;
    const s = document.createElement("script"); s.src = "app.js?v=1"; document.body.appendChild(s);
  }
  async function comecar() {
    // volta do link de recuperação de senha ou de convite
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("access_token")) {
      guardar({ access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: h.get("expires_in") });
      history.replaceState(null, "", location.pathname);
      if (["recovery", "invite", "signup"].includes(h.get("type"))) return mostrarLogin("", "nova");
    } else if (h.get("error_description")) {
      history.replaceState(null, "", location.pathname);
      return mostrarLogin("O link expirou ou já foi usado. Peça um novo em “Esqueci a senha”.");
    }
    sessao = sessao || lerSessao();
    if (!sessao) return mostrarLogin("");
    try { await iniciar(); }
    catch (e) { console.error(e); if (!document.getElementById("login")) mostrarLogin(sessao ? "Não foi possível carregar os dados. Confira a conexão e entre de novo." : ""); }
  }

  async function api(rota, corpo) {
    const r = await fetch("/api/" + rota, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (await token()) }, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.erro || "erro");
    return j;
  }
  window.NUVEM_ADMIN = {
    vazio, email, api, papel: "admin", eu: "lumara",
    equipeBanco: () => rest("equipe?select=email,nome,papel&order=nome"),
    visitas: (desde) => tudo(`visitas?dia=gte.${desde}&select=dia,pagina,origem,n`),
    falhasEmail: (desde) => rest(`envios?status=eq.erro&criado=gte.${desde}&select=id,para,assunto,erro,criado&order=id.desc&limit=50`),
    reenviar: async () => { const r = await fetch("/api/enviar", { method: "POST", headers: { Authorization: "Bearer " + (await token()) } }); return r.json().catch(() => ({})); },
    antes() {
      const orig = window.reduzir;
      if (typeof orig === "function") window.reduzir = async (...a) => subir(await orig(...a));
    },
    depois() {
      if (window.NUVEM_ADMIN.salvarAoAbrir) { window.NUVEM_ADMIN.salvarAoAbrir = false; try { salvar(); } catch (e) {} }
      setInterval(() => { buscarNovos(); conferirOutroAparelho(); }, 45000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) { buscarNovos(); conferirOutroAparelho(); } });
      document.addEventListener("click", () => { if (avisoOutro) setTimeout(conferirOutroAparelho, 400); });
      sinc("Tudo salvo");
    },
    async sair() {
      sinc("Salvando antes de sair…");
      for (let i = 0; i < 40 && (pendente || salvando); i++) { if (pendente && !salvando) salvarAgora(); await new Promise((r) => setTimeout(r, 250)); }
      const t = sessao && sessao.access_token;
      if (t) fetch(BASE + "/auth/v1/logout", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + t } }).catch(() => {});
      gravarSessao(null);
      ["lumara_admin", "lumara_site", "lumara_portfolio_v4", "lumara_eventos", "lumara_pedidos"].forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} });
      location.replace(location.pathname);
    },
  };
  document.addEventListener("click", (e) => { if (e.target.closest("#sair")) window.NUVEM_ADMIN.sair(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", comecar); else comecar();
})();
