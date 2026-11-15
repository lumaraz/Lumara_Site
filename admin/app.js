/* ============ utilidades ============ */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const brl=v=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const HOJE=new Date(); HOJE.setHours(0,0,0,0);
const dia=n=>{const d=new Date(HOJE);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const dt=iso=>new Date(iso+"T00:00:00");
const fmt=iso=>dt(iso).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
const fmtLongo=iso=>dt(iso).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"2-digit"});
const diasAte=iso=>Math.round((dt(iso)-HOJE)/864e5);
function uteis(iso,n){const d=new Date(iso.slice(0,10)+"T00:00:00");while(n>0){d.setDate(d.getDate()+1);if(d.getDay()%6)n--}return d.toISOString().slice(0,10)}
const uid=p=>p+Array.from(crypto.getRandomValues(new Uint8Array(10)),b=>"abcdefghijkmnpqrstuvwxyz23456789"[b%32]).join("");
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),4200)}

const SERV={"Identidade visual":"#3A6EA5","Social media":"#462D26","Alinhamento visual":"#86BBD8","Editorial":"#2D2D2D","UX/UI":"#B9772A","Não sei ainda":"#A39C94"};
const ETAPAS=["Briefing","Criação","Apresentação","Ajustes","Entrega final","Concluído"];
const CAT_E=["Projeto","Social media mensal","Outros"];
const CAT_S=["Ferramentas e assinaturas","Impostos (DAS)","Freelancers","Equipamento","Marketing","Banco de imagens e fontes","Outros"];

/* ============ dados de exemplo ============ */
const exemplo=()=>EXEMPLO.exemplo();
/* ============ estado ============ */
let S;
const catalogoPadrao=()=>EXEMPLO.catalogoPadrao(), emailsPadrao=()=>EXEMPLO.emailsPadrao();
function linkProposta(o){return new URL("../proposta.html#"+o.id,location.href).href}
function linkPortal(c){return new URL("../cliente.html#"+c.id,location.href).href}
function linkContrato(o){return new URL("../contrato.html#"+o.id,location.href).href}
function zapLink(num,txt){const d=String(num||"").replace(/\D/g,"");return d?`https://wa.me/${d.length<=11?"55"+d:d}${txt?"?text="+encodeURIComponent(txt):""}`:""}
/* registra o envio no histórico; com o WhatsApp ligado, a mensagem também sai pela API da Meta */
function registrarEmail(tipo,para,vars){
  const m=S.emails.modelos[tipo]; if(!m||!m.ativo||!para) return;
  const preencher=t=>t.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??"");
  const quando=new Date().toISOString(), assunto=preencher(m.assunto), corpo=preencher(m.corpo);
  S.emails.historico.unshift({id:uid("E"),tipo,para,assunto,corpo,quando,canal:"E-mail"});
  if(S.emails.historico.length>400) S.emails.historico.length=400;
  if(!window.SEM_ENVIO&&window.NUVEM_ADMIN) NUVEM_ADMIN.email(para,assunto,corpo);
  const zap=SITE.carregar().integracoes.whatsapp, c=S.clientes.find(x=>x.email===para);
  if(zap&&zap.ativo&&m.whats&&c&&c.whats) S.emails.historico.unshift({id:uid("E"),tipo,para:c.whats,assunto,corpo,quando,canal:"WhatsApp"});
}
function processarEventos(){
  let ev=LS.fila();
  if(!ev.length) return false;
  ev.forEach(x=>{
    if(x.tipo==="aprovado"||x.tipo==="pago"||x.tipo==="contrato"){
      const o=S.orcamentos.find(y=>y.id===x.orc); if(!o) return; const c=cli(o.cliente);
      if(x.tipo==="aprovado"&&o.status!=="aprovado") aprovarOrc(o,{forma:x.forma,viaCliente:true,semEmail:x.emailContrato});
      if(x.tipo==="pago"){
        if(o.status!=="aprovado") aprovarOrc(o,{forma:x.forma,viaCliente:true,semEmail:LS.fila().some(y=>y.tipo==="aprovado"&&y.orc===o.id&&y.emailContrato)});
        const l=S.caixa.filter(y=>y.orc===o.id&&y.tipo==="entrada"&&!y.pago).sort((a,b)=>a.data.localeCompare(b.data))[0];
        if(l){l.pago=true;l.data=dia(0);l.desc+=` (${x.forma})`}
        const pj=S.projetos.find(y=>y.orc===o.id); if(pj){const ck=pj.check.find(k=>/pagamento/i.test(k[0]));if(ck)ck[1]=1}
        window.SEM_ENVIO=!!x.emailEnviado; registrarEmail("pago",c.email,{nome:c.nome.split(" ")[0],agenda:SITE.carregar().integracoes.agenda||"(link de agendamento)",portal:linkPortal(c)}); window.SEM_ENVIO=false;
        if(x.receipt_url&&l) l.comprovante=x.receipt_url;
        notas.push(`${c.empresa} pagou a entrada por ${x.forma}.`);
      }
      if(x.tipo==="contrato"){
        if(x.assinatura){c.doc=x.assinatura.doc;c.endereco=x.assinatura.endereco}
        o.contrato=Object.assign(o.contrato||{},{status:"assinado",assinatura:x.assinatura,modelo:(o.contrato&&o.contrato.modelo)||S.contratoModelo||LS.MODELO_CONTRATO});
        const pj=S.projetos.find(y=>y.orc===o.id); if(pj){const ck=pj.check.find(k=>/contrato/i.test(k[0]));if(ck)ck[1]=1}
        notas.push(`${c.empresa} assinou o contrato da proposta ${o.num}.`);
      }
    }
    if(x.tipo==="arte"){
      const p=S.projetos.find(y=>y.id===x.projeto), en=p&&(p.entregas||[]).find(y=>y.id===x.entrega); if(!en) return; const c=cli(p.cliente);
      en.status=x.status; en.comentario=x.comentario||"";
      p.comentarios.push({autor:"cliente",texto:(x.status==="aprovado"?`Aprovou "${en.titulo}".`:`Pediu ajustes em "${en.titulo}": ${x.comentario}`),quando:x.quando});
      if(x.status==="ajustes"&&p.etapa==="Apresentação") p.etapa="Ajustes";
      notas.push(`${c.empresa} ${x.status==="aprovado"?"aprovou":"pediu ajustes em"} "${en.titulo}".`);
    }
    if(x.tipo==="post"){
      const pt=(S.posts||[]).find(y=>y.id===x.post); if(!pt) return;
      pt.status=x.status; if(x.comentario) pt.comentario=x.comentario;
      notas.push(`${cli(pt.cliente).empresa} ${x.status==="aprovado"?"aprovou":"pediu ajustes no"} post "${pt.tema}".`);
    }
    if(x.tipo==="parcela"){
      const l=S.caixa.find(y=>y.id===x.lanc); if(!l||l.pago) return;
      l.pago=true; l.pagoEm=dia(0); l.desc+=` (${x.forma})`; if(x.receipt_url) l.comprovante=x.receipt_url;
      notas.push(`${cli(l.cliente).empresa} pagou ${brl(l.valor)} pelo portal.`);
    }
  });
  try{localStorage.setItem("lumara_eventos","[]")}catch(e){}
  return true;
}
/* avisos de parcelas: 3 dias antes do vencimento e no dia seguinte, se não foi paga */
function cobrancasAutomaticas(){
  if(window.NUVEM_ADMIN) return; /* no site publicado, os lembretes saem todo dia pelo servidor */
  S.caixa.filter(l=>l.tipo==="entrada"&&!l.pago&&l.cliente).forEach(l=>{
    const c=cli(l.cliente), d=diasAte(l.data), v={nome:(c.nome||"").split(" ")[0],valor:brl(l.valor),vencimento:dt(l.data).toLocaleDateString("pt-BR"),descricao:l.desc.replace(c.empresa+", ",""),portal:linkPortal(c)};
    if(d>=0&&d<=3&&!l.avisado){registrarEmail("cobranca",c.email,v);l.avisado=true}
    if(d<0&&!l.atrasoAvisado){registrarEmail("atraso",c.email,v);l.atrasoAvisado=true}
  });
}
let notas=[];
function carregar(){
  try{S=JSON.parse(localStorage.getItem("lumara_admin"))}catch(e){S=null}
  if(!S||S.v!==4) S=window.NUVEM_ADMIN?NUVEM_ADMIN.vazio():exemplo();
  if(!S.posts) S.posts=[];
  S.projetos.forEach(p=>{p.etiquetas=p.etiquetas||[];p.comentarios=p.comentarios||[];p.anexos=p.anexos||[];p.entregas=p.entregas||[]});
  if(!S.emails) S.emails=emailsPadrao();
  if(!S.catalogo) S.catalogo=catalogoPadrao();
  // pedidos vindos do formulário do site (mesmo navegador)
  try{
    const novos=JSON.parse(localStorage.getItem("lumara_pedidos")||"[]");
    novos.forEach(p=>{if(!S.pedidos.find(x=>x.id===p.id)){S.pedidos.push(p);window.SEM_ENVIO=!!p.emailEnviado;registrarEmail("recebido",p.email,{nome:(p.nome||"").split(" ")[0]});window.SEM_ENVIO=false}});
  }catch(e){}
  processarEventos(); cobrancasAutomaticas(); salvar();
}
addEventListener("storage",e=>{if(e.key==="lumara_eventos"&&processarEventos()){salvar();render();if(notas.length){toast(notas.join(" "));notas=[]}}});
function salvar(){try{localStorage.setItem("lumara_admin",JSON.stringify(S))}catch(e){}}
let usuario=window.NUVEM_ADMIN?NUVEM_ADMIN.eu:"lumara";
const admin=()=>window.NUVEM_ADMIN?NUVEM_ADMIN.papel==="admin":usuario==="lumara";
const cli=id=>S.clientes.find(c=>c.id===id)||{};
const pessoa=id=>S.equipe.find(p=>p.id===id)||{};
const totalOrc=o=>o.itens.reduce((a,i)=>a+(+i.v||0),0);
const iniciais=n=>n.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();

/* ============ navegação ============ */
const VIEWS=[
  {id:"inicio",nome:"Início"},
  {id:"pedidos",nome:"Pedidos"},
  {id:"orcamentos",nome:"Orçamentos"},
  {id:"contratos",nome:"Contratos",admin:true},
  {id:"projetos",nome:"Projetos"},
  {id:"calendario",nome:"Calendário"},
  {id:"portfolio",nome:"Portfólio do site"},
  {id:"clientes",nome:"Clientes"},
  {id:"caixa",nome:"Caixa",admin:true},
  {id:"conteudo",nome:"Conteúdo do site",admin:true},
  {id:"emails",nome:"Mensagens automáticas",admin:true},
  {id:"equipe",nome:"Equipe",admin:true}
];
let view="inicio", orcAberto=null, filtroPed="abertos", filtroCx="todos", mesCx=0;
function rota(){
  let h=location.hash.slice(1)||"inicio";
  const v=VIEWS.find(x=>x.id===h);
  if(!v||(v.admin&&!admin())) h="inicio";
  if(h!=="orcamentos") orcAberto=null;
  view=h; render();
}
function menu(){
  const novos=S.pedidos.filter(p=>p.status==="novo").length;
  $("#menu").innerHTML=VIEWS.filter(v=>!v.admin||admin()).map(v=>
    `<li><a href="#${v.id}" ${v.id===view?'aria-current="page"':""}>${v.nome}${v.id==="pedidos"&&novos?`<span class="cont" aria-label="${novos} novos">${novos}</span>`:""}</a></li>`).join("");
}
function render(){
  menu();
  const m=$("#conteudo");
  m.innerHTML=({inicio,pedidos,orcamentos,contratos,projetos,calendario,portfolio,clientes,caixa,conteudo,emails,equipe})[view]();
  m.querySelectorAll(".tabela").forEach(t=>{const h=[...t.querySelectorAll("thead th")].map(x=>x.textContent);t.querySelectorAll("tbody tr").forEach(r=>[...r.children].forEach((td,i)=>td.setAttribute("data-label",h[i]||"")))});
  if(view==="projetos") ligarKanban();
  if(view==="orcamentos"&&orcAberto) ligarEditor();
  fecharMenu();
}
window.addEventListener("hashchange",()=>{if($("#gaveta").classList.contains("on"))fechar();rota()});

/* ============ gaveta ============ */
let ultimoFoco=null;
function abrir(tit,sub,corpo,pe,acoes){
  ultimoFoco=document.activeElement;
  $("#gav-corpo").onclick=null;
  $("#gav-tit").textContent=tit; $("#gav-sub").innerHTML=sub||""; $("#gav-corpo").innerHTML=corpo; $("#gav-pe").innerHTML=pe||""; $("#gav-acoes").innerHTML=acoes||"";
  $("#gaveta").classList.add("on"); $("#fundo").classList.add("on"); $("#fechar").focus();
}
function fechar(){$("#gaveta").classList.remove("on");$("#fundo").classList.remove("on"); if(ultimoFoco&&ultimoFoco.focus) ultimoFoco.focus()}
$("#fechar").onclick=fechar; $("#fundo").onclick=fechar;
document.addEventListener("keydown",e=>{
  const g=$("#gaveta"); if(!g.classList.contains("on")) return;
  if(e.key==="Escape") return fechar();
  if(e.key==="Tab"){const f=[...g.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null);
    if(!f.length) return; const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()} else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}
});

/* ============ INÍCIO ============ */
function inicio(){
  const novos=S.pedidos.filter(p=>p.status==="novo").sort((a,b)=>a.recebido.localeCompare(b.recebido));
  const semana=S.projetos.filter(p=>p.etapa!=="Concluído"&&diasAte(p.prazo)<=7).sort((a,b)=>a.prazo.localeCompare(b.prazo));
  const mes=resumoMes(0);
  const receber=S.caixa.filter(l=>l.tipo==="entrada"&&!l.pago&&diasAte(l.data)<=30).reduce((a,l)=>a+l.valor,0);
  const hora=new Date().getHours(), oi=hora<12?"Bom dia":hora<18?"Boa tarde":"Boa noite";
  return `<div class="cab"><div><h1>${oi}, ${esc(pessoa(usuario).nome.split(" ")[0])}</h1><p>${HOJE.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</p></div></div>
  <dl class="numeros">
    <div class="num"><dt>Pedidos para responder</dt><dd>${novos.length}</dd></div>
    <div class="num"><dt>Projetos em andamento</dt><dd>${S.projetos.filter(p=>p.etapa!=="Concluído").length}</dd></div>
    ${admin()?`<div class="num"><dt>Saldo do mês</dt><dd class="${mes.saldo>=0?"pos":"neg"}">${brl(mes.saldo)}</dd></div>
    <div class="num"><dt>A receber em 30 dias</dt><dd>${brl(receber)}</dd></div>`:""}
  </dl>
  <div class="grade2">
    <section class="painel"><h2>Pedidos aguardando orçamento</h2>
      ${novos.length?novos.map(p=>{const lim=uteis(p.recebido,2),d=diasAte(lim);return `<div class="item-lista"><div><strong>${esc(p.nome)}</strong><div class="sub">${esc(p.servico)}</div></div>
        <div style="text-align:right"><span class="tag ${d<=0?"st-atrasado":"st-pendente"}">${d<0?"Atrasado":d===0?"Responder hoje":"Responder até "+fmtLongo(lim)}</span><div><button class="btn peq sec" style="margin-top:.35rem" onclick="verPedido('${p.id}')">Abrir</button></div></div></div>`}).join(""):`<p class="vazio">Nenhum pedido esperando. Tudo respondido.</p>`}
    </section>
    ${admin()?(()=>{const nf=notasPendentes();return nf.length?`<section class="painel"><h2>Notas fiscais para emitir</h2>${nf.map(l=>{const t=nfTomador(l);return `<div class="item-lista"><div><strong>${esc(cli(l.cliente).empresa)}</strong><div class="sub">${brl(l.valor)} · pago em ${fmt(l.pagoEm||l.data)} · ${t.exigida==="sim"?"obrigatória (CNPJ)":t.exigida==="opcional"?"pessoa física: opcional":"confirme se é CNPJ"}</div></div><button class="btn peq" onclick="emitirNota('${l.id}')">Emitir nota</button></div>`}).join("")}</section>`:""})():""}
    <section class="painel"><h2>Prazos dos próximos 7 dias</h2>
      ${semana.length?semana.map(p=>{const d=diasAte(p.prazo);return `<div class="item-lista"><div><strong>${esc(p.titulo)}</strong><div class="sub">${esc(cli(p.cliente).empresa)} · ${p.etapa}</div></div>
        <span class="tag ${d<0?"st-atrasado":d<=2?"st-pendente":"st-andamento"}">${d<0?`Atrasado ${-d} dia${d<-1?"s":""}`:d===0?"Hoje":fmtLongo(p.prazo)}</span></div>`}).join(""):`<p class="vazio">Nenhum prazo nesta semana.</p>`}
    </section>
  </div>`;
}

/* ============ PEDIDOS ============ */
const ST_PED={novo:["Novo","st-novo"],enviado:["Orçamento enviado","st-enviado"],aprovado:["Aprovado","st-aprovado"],recusado:["Recusado","st-recusado"]};
function pedidos(){
  const l=S.pedidos.filter(p=>filtroPed==="todos"||(filtroPed==="abertos"?["novo","enviado"].includes(p.status):p.status===filtroPed))
    .sort((a,b)=>b.recebido.localeCompare(a.recebido));
  const f=[["abertos","Em aberto"],["novo","Novos"],["aprovado","Aprovados"],["recusado","Recusados"],["todos","Todos"]];
  return `<div class="cab"><div><h1>Pedidos</h1><p>Respostas do formulário de orçamento do site. O prazo de resposta é de 2 dias úteis.</p></div>
    <a class="btn sec" href="../orcamento.html">Ver formulário do site</a></div>
  <div class="filtros">${f.map(([k,n])=>`<button aria-pressed="${filtroPed===k}" onclick="filtroPed='${k}';render()">${n}</button>`).join("")}</div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Nome</th><th>Serviço</th><th>Recebido</th><th>Responder até</th><th>Status</th></tr></thead><tbody>
  ${l.length?l.map(p=>{const lim=uteis(p.recebido,2),d=diasAte(lim);return `<tr class="clicavel" onclick="verPedido('${p.id}')">
    <td><button class="linha-btn" onclick="event.stopPropagation();verPedido('${p.id}')">${esc(p.nome)}</button><div class="mut">${esc((p.negocio||"").split(/[.,]/)[0])}</div></td>
    <td><span class="srv" style="--c:${SERV[p.servico]||"#888"}">${esc(p.servico)}</span></td>
    <td>${fmt(p.recebido.slice(0,10))}</td>
    <td>${p.status==="novo"?`<span class="${d<=0?"tag st-atrasado":""}">${fmtLongo(lim)}</span>`:"—"}</td>
    <td><span class="tag ${ST_PED[p.status][1]}">${ST_PED[p.status][0]}</span></td></tr>`}).join(""):`<tr><td colspan="5" class="vazio">Nenhum pedido neste filtro.</td></tr>`}
  </tbody></table></div>`;
}
function verPedido(id){
  const p=S.pedidos.find(x=>x.id===id);
  const r=(k,v)=>v?`<div class="resp"><dt>${k}</dt><dd>${esc(Array.isArray(v)?v.join(", "):v)}</dd></div>`:"";
  const corpo=`
    <div class="bloco"><h3>Contato</h3><dl>${r("E-mail",p.email)}${r("Cidade",p.cidade)}${r("Prefere contato por",p.contato)}${r("WhatsApp",p.whatsapp)}</dl></div>
    <div class="bloco"><h3>Negócio</h3><dl>${r("Sobre o negócio",p.negocio)}${r("Papel",p.papel)}${r("Redes e site",p.redes)}${r("Tempo de empresa",p.tempo)}${r("Tipo de negócio",p.porte)}</dl></div>
    <div class="bloco"><h3>Projeto</h3><dl>${r("Serviço",p.servico)}${r("Objetivos e expectativas",p.objetivos)}${r("Sobre o trabalho",p.trabalho)}${r("Prazo ideal",p.prazo)}${r("Referências",p.refs)}${p.imagens&&p.imagens.length?`<div class="resp"><dt>Imagens enviadas</dt><dd>${p.imagens.map(im=>im&&im.url?`<a href="${esc(im.url)}" target="_blank" rel="noopener">${esc(im.nome||"imagem")}</a>`:esc(im)).join(", ")}</dd></div>`:""}${r("Como encontrou",p.origem)}</dl></div>`;
  let pe="";
  if(p.status==="novo") pe=`<button class="btn perigo" onclick="recusarPedido('${id}')">Recusar</button><button class="btn" onclick="criarOrcamento('${id}')">Criar orçamento</button>`;
  if(p.whatsapp) pe=`<a class="btn sec" href="${zapLink(p.whatsapp,`Oi, ${(p.nome||"").split(" ")[0]}! Aqui é a Lumara. Recebi seu pedido de orçamento.`)}" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>`+pe;
  else if(p.orc) pe=`<button class="btn" onclick="fechar();abrirOrc('${p.orc}')">Abrir orçamento</button>`;
  abrir(p.nome,`<span class="tag ${ST_PED[p.status][1]}">${ST_PED[p.status][0]}</span> Recebido em ${fmt(p.recebido.slice(0,10))}`,corpo,pe);
}
function recusarPedido(id){S.pedidos.find(x=>x.id===id).status="recusado";salvar();fechar();render();toast("Pedido marcado como recusado.")}
function criarOrcamento(pid){
  const p=S.pedidos.find(x=>x.id===pid);
  let c=S.clientes.find(x=>x.email===p.email);
  if(!c){c={id:uid("c"),nome:p.nome,empresa:(p.negocio||"").split(/[,.]/)[0].slice(0,60)||p.nome,cidade:p.cidade,email:p.email,whats:p.whatsapp,origem:p.origem,desde:dia(0)};S.clientes.push(c)}
  const o={id:uid("O"),num:HOJE.getFullYear()+"-"+String(S.seq++).padStart(3,"0"),cliente:c.id,pedido:pid,status:"rascunho",criado:dia(0),validade:15,prazoEntrega:p.prazo||"",
    pagamento:"50% na aprovação e 50% na entrega",itens:[(c=>c?{s:c.nome,d:c.descricao,v:c.valor}:{s:p.servico==="Não sei ainda"?"":p.servico,d:"",v:0})((S.catalogo||[]).find(c=>p.servico&&c.nome.toLowerCase().startsWith(p.servico.toLowerCase())))],obs:"Inclui duas rodadas de ajustes."};
  S.orcamentos.push(o); p.orc=o.id; salvar(); fechar(); abrirOrc(o.id);
  toast("Rascunho criado com o serviço do catálogo. Ajuste valores e itens como precisar.");
}

/* ============ ORÇAMENTOS ============ */
const ST_ORC={rascunho:["Rascunho","st-rascunho"],enviado:["Enviado","st-enviado"],aprovado:["Aprovado","st-aprovado"],recusado:["Recusado","st-recusado"]};
function abrirOrc(id){orcAberto=id; if(location.hash!=="#orcamentos") location.hash="orcamentos"; else render()}
function orcamentos(){
  if(orcAberto) return editor();
  const l=[...S.orcamentos].sort((a,b)=>b.num.localeCompare(a.num));
  return `<div class="cab"><div><h1>Orçamentos</h1><p>Monte a proposta, baixe o PDF e acompanhe a resposta do cliente.</p></div>
    <div class="acoes">${admin()?`<button class="btn sec" onclick="editarCatalogo()">Catálogo de serviços</button>`:""}<button class="btn" onclick="novoOrcSemPedido()">Novo orçamento</button></div></div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Nº</th><th>Cliente</th><th>Serviço</th><th>Criado</th>${admin()?'<th class="valor">Valor</th>':""}<th>Status</th></tr></thead><tbody>
  ${l.map(o=>`<tr class="clicavel" onclick="abrirOrc('${o.id}')">
    <td><button class="linha-btn" onclick="event.stopPropagation();abrirOrc('${o.id}')">${o.num}</button></td><td><strong>${esc(cli(o.cliente).empresa)}</strong><div class="mut">${esc(cli(o.cliente).nome)}</div></td>
    <td>${esc(o.itens[0]?.s||"—")}${o.itens.length>1?` <span class="mut">+${o.itens.length-1}</span>`:""}</td><td>${fmt(o.criado)}</td>
    ${admin()?`<td class="valor">${brl(totalOrc(o))}</td>`:""}<td><span class="tag ${ST_ORC[o.status][1]}">${ST_ORC[o.status][0]}</span></td></tr>`).join("")}
  </tbody></table></div>`;
}
function novoOrcSemPedido(){
  const opts=S.clientes.map(c=>`<option value="${c.id}">${esc(c.empresa)} (${esc(c.nome)})</option>`).join("");
  abrir("Novo orçamento","Para um cliente já cadastrado",`<div class="cmp"><label for="nc">Cliente</label><select id="nc">${opts}</select></div>`,
   `<button class="btn" onclick="(()=>{const o={id:uid('O'),num:HOJE.getFullYear()+'-'+String(S.seq++).padStart(3,'0'),cliente:$('#nc').value,status:'rascunho',criado:dia(0),validade:15,prazoEntrega:'',pagamento:'50% na aprovação e 50% na entrega',itens:[{s:'',d:'',v:0}],obs:''};S.orcamentos.push(o);salvar();fechar();abrirOrc(o.id)})()">Criar rascunho</button>`);
}
function editor(){
  const o=S.orcamentos.find(x=>x.id===orcAberto), c=cli(o.cliente), trav=o.status==="aprovado"||o.status==="recusado"||!admin();
  const dis=trav?"disabled":"";
  return `<div class="cab"><div><h1>Orçamento ${o.num}</h1><p>${esc(c.empresa)} · <span class="tag ${ST_ORC[o.status][1]}">${ST_ORC[o.status][0]}</span></p></div>
    <div class="acoes"><button class="btn sec" onclick="orcAberto=null;render()">Voltar à lista</button>
    <button class="btn sec" onclick="baixarPDF()">Baixar PDF</button>
    ${admin()&&o.status!=="rascunho"?`<button class="btn sec" onclick="copiarLink(S.orcamentos.find(x=>x.id==='${o.id}'))">Copiar link da proposta</button><a class="btn sec" href="../proposta.html#${o.id}">Ver como cliente</a>`:""}
    ${o.status==="rascunho"&&admin()?`<button class="btn" onclick="statusOrc('enviado')">Marcar como enviado</button>`:""}
    ${o.status==="enviado"&&admin()?`<button class="btn perigo" onclick="statusOrc('recusado')">Cliente recusou</button><button class="btn" onclick="aprovar()">Cliente aprovou</button>`:""}
    </div></div>
  ${!admin()?`<p class="painel" style="margin-bottom:1rem">Só a administradora pode editar orçamentos e ver valores.</p>`:""}
  <div class="editor">
    <form class="painel" id="ed" onsubmit="return false">
      <h2>Itens</h2>
      <div class="itens" id="itens">${o.itens.map((i,k)=>`<div class="it">
        <input aria-label="Serviço ${k+1}" placeholder="Serviço" list="lista-cat" value="${esc(i.s)}" data-k="${k}" data-c="s" ${dis}>
        <input aria-label="Valor ${k+1}" type="number" min="0" step="50" placeholder="Valor" value="${admin()?i.v||"":""}" data-k="${k}" data-c="v" ${dis}>
        <button type="button" class="rm" aria-label="Remover item ${k+1}" onclick="rmItem(${k})" ${dis||o.itens.length===1?"disabled":""}>×</button>
        <textarea aria-label="Descrição ${k+1}" placeholder="O que está incluído" data-k="${k}" data-c="d" ${dis}>${esc(i.d)}</textarea></div>`).join("")}</div>
      <datalist id="lista-cat">${S.catalogo.map(c=>`<option value="${esc(c.nome)}">`).join("")}</datalist>
      ${trav?"":`<div class="add-itens"><label class="sr-only" for="cat-sel">Adicionar serviço do catálogo</label>
        <select id="cat-sel" onchange="addDoCatalogo(this.value)"><option value="">Adicionar do catálogo…</option>${S.catalogo.map(c=>`<option value="${c.id}">${esc(c.nome)} · ${brl(c.valor)}</option>`).join("")}</select>
        <button type="button" class="btn sec peq" onclick="addItem()">Item em branco</button>
        <button type="button" class="btn sec peq" onclick="editarCatalogo()">Editar catálogo</button></div>
        <p class="mut" style="margin-top:.5rem">Os valores do catálogo entram como sugestão: dá para editar o nome, o valor e a descrição em cada proposta.</p>`}
      <h2 style="margin-top:1.4rem">Condições</h2>
      <div class="cmp"><label for="pz">Prazo de entrega</label><input id="pz" data-f="prazoEntrega" value="${esc(o.prazoEntrega)}" ${dis}></div>
      <div class="cmp"><label for="pg">Pagamento</label><select id="pg" data-f="pagamento" ${dis}>
        ${["À vista, com 5% de desconto","50% na aprovação e 50% na entrega","3 parcelas mensais","Mensal, todo dia 10"].map(x=>`<option ${x===o.pagamento?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="cmp"><label for="vd">Validade da proposta (dias)</label><input id="vd" type="number" min="1" data-f="validade" value="${o.validade}" ${dis}></div>
      <div class="cmp"><label for="ob">Observações</label><textarea id="ob" data-f="obs" ${dis}>${esc(o.obs)}</textarea></div>
    </form>
    <div id="previa">${folha(o)}</div>
  </div>`;
}
function folha(o){
  const c=cli(o.cliente), tot=totalOrc(o), vis=admin();
  let pg=o.pagamento, tt=pg.startsWith("À vista")?tot*(1-(SITE.carregar().integracoes.descontoVista||5)/100):tot;
  return `<article class="folha" aria-label="Prévia do PDF">
    <div class="f-topo"><img class="f-logo" src="../img/logo-escuro.svg" alt="Lumara Silva"><div class="f-num">Proposta<strong>Nº ${o.num}</strong>${dt(o.criado).toLocaleDateString("pt-BR")}</div></div>
    <div class="onda"></div>
    <p class="f-cli">${esc(c.empresa)}</p>
    <p class="f-para">Para ${esc(c.nome)}${c.cidade?", "+esc(c.cidade):""}</p>
    <table><thead><tr><th>Serviço</th><th class="v">Valor</th></tr></thead><tbody>
    ${o.itens.map(i=>`<tr><td><strong>${esc(i.s)||"<span style='color:#aaa'>Serviço</span>"}</strong>${i.d?`<small>${esc(i.d)}</small>`:""}</td><td class="v">${vis?brl(+i.v||0):"—"}</td></tr>`).join("")}
    </tbody></table>
    <div class="total"><span>Total${tt!==tot?" à vista":""}</span><span>${vis?brl(tt):"—"}</span></div>
    <dl class="cond"><div><dt>Prazo de entrega</dt><dd>${esc(o.prazoEntrega)||"A combinar"}</dd></div><div><dt>Pagamento</dt><dd>${esc(pg)}</dd></div>
    <div><dt>Validade</dt><dd>${o.validade} dias, até ${(()=>{const d=dt(o.criado);d.setDate(d.getDate()+ +o.validade);return d.toLocaleDateString("pt-BR")})()}</dd></div></dl>
    ${o.obs?`<p class="obs">${esc(o.obs)}</p>`:""}
    <div class="f-pe"><span>contato@lumarasilva.com.br</span><span>lumarasilva.com.br</span></div>
  </article>`;
}
function ligarEditor(){
  const o=S.orcamentos.find(x=>x.id===orcAberto), ed=$("#ed");
  ed.addEventListener("input",e=>{
    const t=e.target;
    if(t.dataset.k!==undefined){o.itens[t.dataset.k][t.dataset.c]=t.dataset.c==="v"?+t.value:t.value;
      if(t.dataset.c==="s"){const it=o.itens[t.dataset.k],c=S.catalogo.find(x=>x.nome===t.value);
        if(c){if(!it.d){it.d=c.descricao;t.closest(".it").querySelector('[data-c="d"]').value=c.descricao}
              if(!+it.v){it.v=c.valor;t.closest(".it").querySelector('[data-c="v"]').value=c.valor}}}}
    else if(t.dataset.f){o[t.dataset.f]=t.dataset.f==="validade"?+t.value||1:t.value}
    $("#previa").innerHTML=folha(o); salvar();
  });
}
function addDoCatalogo(id){
  if(!id) return; const o=S.orcamentos.find(x=>x.id===orcAberto), c=S.catalogo.find(x=>x.id===id);
  const novo={s:c.nome,d:c.descricao,v:c.valor}, vazio=o.itens.findIndex(i=>!i.d&&!+i.v);
  if(vazio>=0) o.itens[vazio]=novo; else o.itens.push(novo);
  salvar(); render(); toast(`"${c.nome}" adicionado. Você pode ajustar o valor e a descrição.`);
  const ult=document.querySelectorAll('#itens [data-c="v"]'); const alvo=ult[vazio>=0?vazio:ult.length-1]; if(alvo) alvo.focus();
}
function editarCatalogo(){
  const L=JSON.parse(JSON.stringify(S.catalogo));
  const lista=()=>L.map((c,i)=>`<div class="depo-cfg"><div class="linha2"><div class="cmp"><label for="cg-n${i}">Serviço</label><input id="cg-n${i}" data-i="${i}" data-c="nome" value="${esc(c.nome)}"></div>
     <div class="cmp"><label for="cg-v${i}">Valor (R$)</label><input id="cg-v${i}" type="number" min="0" step="50" data-i="${i}" data-c="valor" value="${c.valor||""}"></div></div>
     <div class="cmp"><label for="cg-d${i}">O que está incluído</label><textarea id="cg-d${i}" data-i="${i}" data-c="descricao">${esc(c.descricao)}</textarea></div>
     <div style="text-align:right"><button type="button" class="btn peq perigo" data-rm="${i}">Remover</button></div></div>`).join("")||`<p class="vazio">Nenhum serviço no catálogo.</p>`;
  abrir("Catálogo de serviços","Valores sugeridos ao montar uma proposta",`<div id="cg-lista">${lista()}</div><button type="button" class="btn peq sec" id="cg-add">Adicionar serviço</button>`,`<button class="btn" id="cg-ok">Salvar catálogo</button>`);
  const box=$("#cg-lista");
  box.addEventListener("input",e=>{const t=e.target;if(t.dataset.i===undefined)return;L[t.dataset.i][t.dataset.c]=t.dataset.c==="valor"?+t.value:t.value});
  box.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;L.splice(+b.dataset.rm,1);box.innerHTML=lista()});
  $("#cg-add").onclick=()=>{L.push({id:uid("sv"),nome:"",valor:0,descricao:""});box.innerHTML=lista();box.querySelector(`#cg-n${L.length-1}`).focus()};
  $("#cg-ok").onclick=()=>{S.catalogo=L.filter(c=>c.nome.trim());salvar();fechar();render();toast("Catálogo salvo.")};
}
function addItem(){S.orcamentos.find(x=>x.id===orcAberto).itens.push({s:"",d:"",v:0});salvar();render()}
function rmItem(k){S.orcamentos.find(x=>x.id===orcAberto).itens.splice(k,1);salvar();render()}
function baixarPDF(){
  try{window.print()}catch(e){}
  toast("No sistema publicado, este botão gera o PDF com o nome do cliente. Na prévia o navegador pode bloquear.");
}
function statusOrc(s){
  const o=S.orcamentos.find(x=>x.id===orcAberto); o.status=s;
  const p=S.pedidos.find(x=>x.id===o.pedido); if(p) p.status=s==="enviado"?"enviado":s;
  if(s==="enviado"){o.enviadoEm=dia(0);const c=cli(o.cliente);registrarEmail("enviado",c.email,{nome:c.nome.split(" ")[0],numero:o.num,link:linkProposta(o),validade:validadeOrc(o)})}
  salvar(); render(); toast(s==="enviado"?"Orçamento enviado. O cliente recebe o e-mail com o link da proposta.":"Orçamento marcado como recusado.");
}
function validadeOrc(o){const d=dt(o.enviadoEm||o.criado);d.setDate(d.getDate()+ +o.validade);return d.toLocaleDateString("pt-BR")}
function copiarTexto(t,msg){try{navigator.clipboard.writeText(t).then(()=>toast(msg),()=>toast(t))}catch(e){toast(t)}}
function copiarLink(o){const u=linkProposta(o);try{navigator.clipboard.writeText(u).then(()=>toast("Link da proposta copiado."),()=>toast(u))}catch(e){toast(u)}}
function aprovar(){
  const o=S.orcamentos.find(x=>x.id===orcAberto), n=aprovarOrc(o,{});
  salvar(); render();
  toast(`Aprovado! Projeto criado em Briefing e ${n} ${n>1?"parcelas lançadas":"parcela lançada"} no caixa como a receber.`);
}
function aprovarOrc(o,{forma,viaCliente,semEmail}){
  const c=cli(o.cliente), tot=totalOrc(o), desc=(SITE.carregar().integracoes.descontoVista||5)/100;
  o.status="aprovado"; o.aprovadoEm=dia(0); o.viaCliente=!!viaCliente; if(forma) o.forma=forma;
  const p=S.pedidos.find(x=>x.id===o.pedido); if(p) p.status="aprovado";
  const pjId=uid("J");
  S.projetos.push({id:pjId,orc:o.id,titulo:o.itens[0].s||"Novo projeto",cliente:o.cliente,servico:Object.keys(SERV).find(k=>(o.itens[0].s||"").includes(k.split(" ")[0]))||"Identidade visual",
    etapa:"Briefing",prazo:dia(35),resp:"lumara",valor:tot,check:[["Reunião de briefing",0],["Contrato assinado",0],["Pagamento da 1ª parcela",0]],etiquetas:[],comentarios:[],anexos:[],entregas:[]});
  o.contrato={status:"aguardando",criado:dia(0)};
  const jaAssinou=LS.fila().some(x=>x.tipo==="contrato"&&x.orc===o.id);
  if(!jaAssinou){window.SEM_ENVIO=!!semEmail;registrarEmail("contrato",c.email,{nome:(c.nome||"").split(" ")[0],link:linkContrato(o)});window.SEM_ENVIO=false}
  let parc=[];
  if(o.pagamento.startsWith("À vista")) parc=[[forma&&/cart/i.test(forma)?tot:tot*(1-desc),dia(2),"pagamento à vista"]];
  else if(o.pagamento.startsWith("50%")) parc=[[tot/2,dia(2),"1ª parcela (50%)"],[tot/2,dia(35),"2ª parcela (50%)"]];
  else if(o.pagamento.startsWith("3 ")) parc=[0,1,2].map(i=>[tot/3,dia(2+30*i),`parcela ${i+1} de 3`]);
  else parc=[[tot,dia(10),"1ª mensalidade"]];
  parc.forEach(([v,d,t])=>S.caixa.push({id:uid("L"),orc:o.id,projeto:pjId,desc:`${c.empresa}, ${t}`,tipo:"entrada",cat:o.pagamento.startsWith("Mensal")?"Social media mensal":"Projeto",valor:Math.round(v*100)/100,data:d,pago:false,cliente:c.id}));
  if(viaCliente) notas.push(`${c.empresa} aprovou o orçamento ${o.num} pelo link.`);
  return parc.length;
}

/* ============ PROJETOS (kanban) ============ */
let filtroResp="todos";
function projetos(){
  const vis=S.projetos.filter(p=>filtroResp==="todos"||p.resp===filtroResp);
  return `<div class="cab"><div><h1>Projetos</h1><p>Arraste os cartões entre as etapas, como no Trello. No celular, segure o cartão por um instante antes de arrastar. Abra um cartão para ver etiquetas, comentários, anexos e as artes enviadas ao cliente.</p></div></div>
  <div class="filtros"><button aria-pressed="${filtroResp==="todos"}" onclick="filtroResp='todos';render()">Todos</button>
   ${S.equipe.map(p=>`<button aria-pressed="${filtroResp===p.id}" onclick="filtroResp='${p.id}';render()">${esc(p.nome.split(" ")[0])}</button>`).join("")}</div>
  <div class="kanban" role="list" aria-label="Etapas dos projetos">${ETAPAS.map(et=>{const cs=vis.filter(p=>p.etapa===et);return `<div role="listitem" class="coluna" data-etapa="${et}" aria-labelledby="col-${ETAPAS.indexOf(et)}">
    <h2 class="col-cab" id="col-${ETAPAS.indexOf(et)}">${et}<span aria-label="${cs.length} cartões">${cs.length}</span></h2>
    <div class="cartoes">${cs.map(cartao).join("")}</div>
    ${et!=="Concluído"?`<button class="add-cartao" onclick="novoCartao(this,'${et}')">+ Adicionar cartão</button>`:""}</div>`}).join("")}</div>`;
}
const ETQ={urgente:["Urgente","#A3283A"],cliente:["Aguardando cliente","#9A5F12"],revisao:["Em revisão","#3A6EA5"],grafica:["Gráfica","#462D26"],interno:["Interno","#5E5A55"]};
const icoComent='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>', icoClipe='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12l6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l7-7"/></svg>';
function cartao(p){
  const d=diasAte(p.prazo), fe=p.check.filter(c=>c[1]).length, r=pessoa(p.resp);
  const cls=p.etapa==="Concluído"?"ok":d<=2?"vence":"";
  const pend=(p.entregas||[]).filter(x=>x.tipo==="aprovacao"&&x.status==="aguardando").length;
  return `<div class="cartao" role="button" tabindex="0" draggable="true" aria-label="${esc(p.titulo)}, ${esc(cli(p.cliente).empresa)}, prazo ${fmt(p.prazo)}${(p.etiquetas||[]).map(k=>", "+(ETQ[k]||[k])[0]).join("")}. Abrir para editar ou mudar de etapa" data-id="${p.id}" onclick="verProjeto('${p.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();verProjeto('${p.id}')}" style="--c:${SERV[p.servico]}">
    ${(p.etiquetas||[]).length?`<div class="etqs">${p.etiquetas.map(k=>ETQ[k]?`<span class="etq" style="--c:${ETQ[k][1]}">${ETQ[k][0]}</span>`:"").join("")}</div>`:`<div class="faixa"></div>`}
    <div class="tit">${esc(p.titulo)}</div><div class="cli">${esc(cli(p.cliente).empresa)}</div>
    <div class="meta"><span class="prazo ${cls}">${p.etapa==="Concluído"?"Entregue":d<0?"Atrasado":"Prazo "+fmt(p.prazo)}</span>
    ${pend?`<span title="Artes aguardando o cliente">${pend} p/ aprovar</span>`:""}
    ${p.comentarios&&p.comentarios.length?`<span class="ico" title="Comentários">${icoComent}${p.comentarios.length}</span>`:""}
    ${p.anexos&&p.anexos.length?`<span class="ico" title="Anexos">${icoClipe}${p.anexos.length}</span>`:""}
    ${p.check.length?`<span>${fe}/${p.check.length}</span>`:""}<span class="avatar" style="--c:${r.cor}" title="${esc(r.nome)}">${iniciais(r.nome||"?")}</span></div></div>`;
}
function ligarKanban(){
  let arr=null;
  document.querySelectorAll(".cartao").forEach(c=>{
    c.addEventListener("dragstart",e=>{arr=c.dataset.id;c.classList.add("arrastando");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",arr)});
    c.addEventListener("dragend",()=>c.classList.remove("arrastando"));
    /* toque: segurar o cartão por um instante e arrastar para outra coluna */
    c.addEventListener("touchstart",e=>{
      const t0=e.touches[0]; let fant=null, alvo=null, timer=setTimeout(()=>{
        fant=c.cloneNode(true); fant.classList.add("fantasma"); fant.removeAttribute("id"); document.body.appendChild(fant);
        c.classList.add("arrastando"); if(navigator.vibrate) navigator.vibrate(15); mover(t0)},280);
      const mover=t=>{if(!fant)return; fant.style.left=(t.clientX-125)+"px"; fant.style.top=(t.clientY-30)+"px";
        const el=document.elementFromPoint(t.clientX,t.clientY), col=el&&el.closest(".coluna");
        document.querySelectorAll(".coluna.sobre").forEach(x=>x!==col&&x.classList.remove("sobre")); if(col) col.classList.add("sobre"); alvo=col;
        const k=document.querySelector(".kanban"), r=k.getBoundingClientRect(); if(t.clientX>r.right-40) k.scrollLeft+=12; if(t.clientX<r.left+40) k.scrollLeft-=12};
      const mv=ev=>{const t=ev.touches[0]; if(!fant){if(Math.hypot(t.clientX-t0.clientX,t.clientY-t0.clientY)>8){clearTimeout(timer);fim()}return} ev.preventDefault(); mover(t)};
      const fim=()=>{clearTimeout(timer); c.removeEventListener("touchmove",mv); c.removeEventListener("touchend",solta); c.removeEventListener("touchcancel",fim);
        if(fant){fant.remove();c.classList.remove("arrastando");document.querySelectorAll(".coluna.sobre").forEach(x=>x.classList.remove("sobre"))}};
      const solta=ev=>{const ia=!!fant, col=alvo; fim(); if(ia){ev.preventDefault(); if(col) moverProjeto(c.dataset.id,col.dataset.etapa)}};
      c.addEventListener("touchmove",mv,{passive:false}); c.addEventListener("touchend",solta); c.addEventListener("touchcancel",fim);
    },{passive:true});
  });
  document.querySelectorAll(".coluna").forEach(col=>{
    col.addEventListener("dragover",e=>{e.preventDefault();col.classList.add("sobre")});
    col.addEventListener("dragleave",e=>{if(!col.contains(e.relatedTarget))col.classList.remove("sobre")});
    col.addEventListener("drop",e=>{e.preventDefault();col.classList.remove("sobre");moverProjeto(e.dataTransfer.getData("text/plain")||arr,col.dataset.etapa)});
  });
}
function moverProjeto(id,etapa){
  const p=S.projetos.find(x=>x.id===id); if(!p||p.etapa===etapa) return;
  p.etapa=etapa;
  if(etapa==="Concluído"){const c=cli(p.cliente);registrarEmail("depoimento",c.email,{nome:(c.nome||"").split(" ")[0],projeto:p.titulo})}
  salvar(); render(); toast(`"${p.titulo}" foi para ${etapa}.`+(etapa==="Concluído"&&S.emails.modelos.depoimento.ativo?" O cliente recebe o pedido de depoimento.":""));
}
function novoCartao(btn,etapa){
  const box=document.createElement("div"); box.className="nova-entrada";
  box.innerHTML=`<textarea rows="2" placeholder="Título do cartão" aria-label="Título do novo cartão"></textarea><div class="acoes" style="margin-top:.4rem"><button class="btn peq">Adicionar</button><button class="btn peq sec">Cancelar</button></div>`;
  btn.replaceWith(box); const ta=box.querySelector("textarea"); ta.focus();
  const ok=()=>{if(!ta.value.trim())return render();S.projetos.push({id:uid("J"),titulo:ta.value.trim(),cliente:S.clientes[0].id,servico:"Identidade visual",etapa,prazo:dia(14),resp:usuario,valor:0,check:[],etiquetas:[],comentarios:[],anexos:[],entregas:[]});salvar();render();toast("Cartão criado. Clique nele para escolher cliente e prazo.")};
  box.querySelectorAll("button")[0].onclick=ok; box.querySelectorAll("button")[1].onclick=render;
  ta.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();ok()}if(e.key==="Escape")render()});
}
function verProjeto(id,aba){
  const p=S.projetos.find(x=>x.id===id), c=cli(p.cliente);
  const nomeAutor=a=>a==="cliente"?c.nome||"Cliente":pessoa(a).nome||a;
  const quando=iso=>new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  const stEnt={aguardando:["Aguardando cliente","st-aguardando"],aprovado:["Aprovado","st-aprovado"],ajustes:["Ajustes pedidos","st-ajustes"],ok:["Liberado","st-aprovado"]};
  const corpo=`
  <div class="cmp"><label for="pj-t">Título</label><input id="pj-t" value="${esc(p.titulo)}"></div>
  <div class="linha2">
    <div class="cmp"><label for="pj-e">Etapa</label><select id="pj-e">${ETAPAS.map(e=>`<option ${e===p.etapa?"selected":""}>${e}</option>`).join("")}</select></div>
    <div class="cmp"><label for="pj-p">Prazo</label><input id="pj-p" type="date" value="${p.prazo}"></div>
    <div class="cmp"><label for="pj-c">Cliente</label><select id="pj-c">${S.clientes.map(c=>`<option value="${c.id}" ${c.id===p.cliente?"selected":""}>${esc(c.empresa)}</option>`).join("")}</select></div>
    <div class="cmp"><label for="pj-s">Serviço</label><select id="pj-s">${Object.keys(SERV).slice(0,4).map(s=>`<option ${s===p.servico?"selected":""}>${s}</option>`).join("")}</select></div>
    <div class="cmp"><label for="pj-r">Responsável</label><select id="pj-r">${S.equipe.map(e=>`<option value="${e.id}" ${e.id===p.resp?"selected":""}>${esc(e.nome)}</option>`).join("")}</select></div>
    ${admin()?`<div class="cmp"><label>Valor do projeto</label><div style="padding:.55rem 0;font-weight:600">${brl(p.valor||0)}</div></div>`:""}
  </div>
  <fieldset class="cmp" style="border:0"><legend style="font-size:.85rem;font-weight:600;margin-bottom:.4rem">Etiquetas</legend>
    <div class="etq-sel">${Object.entries(ETQ).map(([k,[n,cor]])=>`<label style="--c:${cor}"><input type="checkbox" name="pj-etq" value="${k}" ${p.etiquetas.includes(k)?"checked":""}><span>${n}</span></label>`).join("")}</div></fieldset>
  <div class="bloco"><h3>Checklist</h3><ul class="checklist" id="pj-ck">${p.check.map((c,k)=>`<li class="${c[1]?"feito":""}"><input type="checkbox" id="ck${k}" ${c[1]?"checked":""} data-k="${k}"><label for="ck${k}"><span>${esc(c[0])}</span></label></li>`).join("")}</ul>
  <div style="display:flex;gap:.4rem;margin-top:.5rem"><input id="pj-nc" aria-label="Nova tarefa" placeholder="Nova tarefa" style="flex:1;padding:.45rem .6rem;border:1px solid #AEB5AD;border-radius:6px"><button class="btn peq sec" id="pj-add">Adicionar</button></div></div>
  <div class="bloco"><h3>Entregas para o cliente</h3>
    <p class="mut" style="margin-bottom:.6rem">Artes para aprovação aparecem no portal com os botões “Aprovar” e “Pedir ajustes”. Arquivos finais só são liberados ao cliente depois do pagamento total.</p>
    <div class="entregas">${p.entregas.map(en=>`<div class="entrega">${en.tipo==="aprovacao"&&en.img?`<img src="${srcPF(en.img)}" alt="">`:`<span class="doc">ZIP</span>`}
      <div><strong>${esc(en.titulo)}</strong><div class="mut">${en.tipo==="aprovacao"?"Para aprovação":"Arquivo final"}${en.comentario?` · “${esc(en.comentario)}”`:""}</div></div>
      <span style="display:flex;gap:.3rem;align-items:center"><span class="tag ${(stEnt[en.status]||stEnt.aguardando)[1]}">${(stEnt[en.status]||stEnt.aguardando)[0]}</span><button class="btn peq sec" aria-label="Remover ${esc(en.titulo)}" data-rm-ent="${en.id}">×</button></span></div>`).join("")||`<p class="mut">Nada enviado ainda.</p>`}</div>
    <div class="acoes"><label class="btn peq sec" style="cursor:pointer">Enviar arte para aprovação<input type="file" id="pj-arte" accept="image/*" class="sr-only"></label><button class="btn peq sec" id="pj-final">Adicionar arquivo final</button>
      <a class="btn peq sec" href="../cliente.html#${c.id}">Ver no portal</a></div>
    <div id="pj-final-form" class="oculto" style="margin-top:.6rem"><div class="linha2"><div class="cmp"><label for="pj-fn">Nome do arquivo</label><input id="pj-fn" placeholder="Ex.: Pacote de logotipos"></div><div class="cmp"><label for="pj-fu">Link para download</label><input id="pj-fu" type="url" placeholder="https://drive.google.com/…"></div></div><button class="btn peq" id="pj-fok">Adicionar</button></div></div>
  <div class="bloco"><h3>Anexos internos</h3>
    <ul class="coments">${p.anexos.map((a,k)=>`<li style="display:flex;justify-content:space-between;align-items:center;gap:.5rem"><span>${a.src?`<a href="${esc(a.src)}" download="${esc(a.nome)}">${esc(a.nome)}</a>`:esc(a.nome)}</span><button class="btn peq sec" aria-label="Remover ${esc(a.nome)}" data-rm-anexo="${k}">×</button></li>`).join("")}</ul>
    <label class="btn peq sec" style="cursor:pointer">Anexar arquivo<input type="file" id="pj-anexo" class="sr-only" multiple></label></div>
  <div class="bloco" id="pj-coments-bloco"><h3>Comentários</h3>
    <ul class="coments">${p.comentarios.map(k=>`<li class="${k.autor==="cliente"?"cliente":""}"><small>${esc(nomeAutor(k.autor))}${k.autor==="cliente"?" (cliente)":""} · ${quando(k.quando)}</small><p>${esc(k.texto)}</p></li>`).join("")||`<li class="mut" style="background:none;border:0;padding:0">Nenhum comentário ainda.</li>`}</ul>
    <div class="cmp"><label for="pj-cm">Novo comentário</label><textarea id="pj-cm" placeholder="Visível só para a equipe"></textarea></div><button class="btn peq sec" id="pj-cm-ok">Comentar</button></div>`;
  abrir(p.titulo,esc(c.empresa),corpo,`<button class="btn perigo" id="pj-del">Excluir</button><button class="btn" id="pj-ok">Salvar</button>`);
  const reabrir=()=>{salvar();render();verProjeto(id)};
  $("#pj-ck").addEventListener("change",e=>{p.check[e.target.dataset.k][1]=e.target.checked?1:0;e.target.closest("li").classList.toggle("feito",e.target.checked);salvar()});
  document.querySelectorAll('[name="pj-etq"]').forEach(x=>x.onchange=()=>{p.etiquetas=[...document.querySelectorAll('[name="pj-etq"]:checked')].map(y=>y.value);salvar();render()});
  $("#pj-add").onclick=()=>{const v=$("#pj-nc").value.trim();if(!v)return;p.check.push([v,0]);reabrir()};
  $("#pj-cm-ok").onclick=()=>{const v=$("#pj-cm").value.trim();if(!v){$("#pj-cm").focus();return}p.comentarios.push({autor:usuario,texto:v,quando:new Date().toISOString()});reabrir();toast("Comentário adicionado.")};
  $("#pj-arte").onchange=async e=>{const f=e.target.files[0];if(!f)return;p.entregas.push({id:uid("e"),tipo:"aprovacao",titulo:f.name.replace(/\.[^.]+$/,""),img:await reduzir(f,1400,.8),status:"aguardando"});
    registrarEmail("arte",c.email,{nome:(c.nome||"").split(" ")[0],projeto:p.titulo,portal:linkPortal(c)});reabrir();toast("Arte enviada. O cliente recebe o aviso e aprova pelo portal.")};
  $("#pj-final").onclick=()=>{$("#pj-final-form").classList.toggle("oculto");$("#pj-fn").focus()};
  $("#pj-fok").onclick=()=>{const n=$("#pj-fn").value.trim();if(!n){$("#pj-fn").focus();return}p.entregas.push({id:uid("e"),tipo:"final",titulo:n,url:$("#pj-fu").value.trim(),status:"ok"});reabrir();toast("Arquivo final adicionado ao portal.")};
  $("#gav-corpo").onclick=e=>{const b=e.target.closest("[data-rm-ent],[data-rm-anexo]");if(!b)return;
    if(b.dataset.rmEnt) p.entregas=p.entregas.filter(x=>x.id!==b.dataset.rmEnt); else p.anexos.splice(+b.dataset.rmAnexo,1); reabrir()};
  $("#pj-anexo").onchange=async e=>{for(const f of e.target.files){const src=f.type.startsWith("image/")?await reduzir(f,1200,.75):"";p.anexos.push({nome:f.name,src})}reabrir();toast("Anexo adicionado. No sistema publicado, qualquer arquivo vai para o armazenamento.")};
  $("#pj-ok").onclick=()=>{const et=p.etapa;p.titulo=$("#pj-t").value;p.prazo=$("#pj-p").value||p.prazo;p.cliente=$("#pj-c").value;p.servico=$("#pj-s").value;p.resp=$("#pj-r").value;salvar();fechar();
    if($("#pj-e").value!==et) moverProjeto(id,$("#pj-e").value); else{render();toast("Projeto salvo.")}};
  $("#pj-del").onclick=()=>{if(!$("#pj-del").dataset.c){$("#pj-del").dataset.c=1;$("#pj-del").textContent="Confirmar exclusão";return}S.projetos=S.projetos.filter(x=>x.id!==id);salvar();fechar();render();toast("Projeto excluído.")};
  if(aba==="coments") $("#pj-cm").focus();
}

/* ============ CONTRATOS ============ */
function contratos(){
  const l=S.orcamentos.filter(o=>o.status==="aprovado").sort((a,b)=>b.num.localeCompare(a.num));
  const st=o=>o.contrato&&o.contrato.status==="assinado"?["Assinado","st-aprovado"]:["Aguardando assinatura","st-pendente"];
  return `<div class="cab"><div><h1>Contratos</h1><p>Cada proposta aprovada gera o contrato com os dados do cliente, os serviços e os valores. O cliente assina pelo link.</p></div>
    <div class="acoes"><button class="btn sec" onclick="editarModelo()">Editar modelo do contrato</button></div></div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Proposta</th><th>Cliente</th><th>Aprovada em</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
  ${l.length?l.map(o=>{const c=cli(o.cliente),[n,k]=st(o);return `<tr><td><strong>Nº ${esc(o.num)}</strong></td><td>${esc(c.empresa)}<div class="mut">${esc(c.nome)}</div></td>
    <td>${o.aprovadoEm?fmt(o.aprovadoEm):"—"}</td><td><span class="tag ${k}">${n}</span>${o.contrato&&o.contrato.assinatura?`<div class="mut">${new Date(o.contrato.assinatura.quando).toLocaleDateString("pt-BR")}</div>`:""}</td>
    <td><span class="acoes"><a class="btn peq sec" href="../contrato.html#${o.id}">Abrir<span class="sr-only"> contrato ${esc(o.num)}</span></a>
      ${o.contrato&&o.contrato.status==="assinado"?"":`<button class="btn peq sec" onclick="copiarTexto(linkContrato(S.orcamentos.find(x=>x.id==='${o.id}')),'Link do contrato copiado.')">Copiar link</button>
      ${c.whats?`<a class="btn peq sec" href="${zapLink(c.whats,`Oi, ${(c.nome||"").split(" ")[0]}! Seu contrato está pronto para assinar: ${linkContrato(o)}`)}" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>`:""}`}</span></td></tr>`}).join(""):`<tr><td colspan="5" class="vazio">Nenhuma proposta aprovada ainda.</td></tr>`}
  </tbody></table></div>
  <p class="mut" style="margin-top:1rem">O contrato assinado guarda a versão do modelo usada na assinatura. Mudanças no modelo valem só para os próximos contratos.</p>`;
}
function editarModelo(){
  const atual=S.contratoModelo||LS.MODELO_CONTRATO;
  const ex=S.orcamentos.find(o=>o.status==="aprovado");
  abrir("Modelo do contrato","Usado nos próximos contratos",`
    <p class="mut" style="margin-bottom:.6rem">Linhas que começam com “## ” viram títulos de cláusula, e “- ” vira item de lista. Os campos entre chaves são preenchidos sozinhos: {cliente_nome}, {cliente_doc}, {cliente_endereco}, {cliente_email}, {proposta}, {data_aprovacao}, {servicos}, {prazo}, {valor}, {valor_extenso}, {condicao}.</p>
    <div class="cmp"><label for="md-t">Texto do contrato</label><textarea id="md-t" style="min-height:300px;font-size:.85rem">${esc(atual)}</textarea></div>
    ${ex?`<div class="bloco"><h3>Prévia com a proposta nº ${esc(ex.num)}</h3><div class="contrato-prev" id="md-prev" tabindex="0" role="region" aria-label="Prévia do contrato"></div></div>`:""}`,
    `<button class="btn sec" id="md-pad">Voltar ao modelo padrão</button><button class="btn" id="md-ok">Salvar modelo</button>`);
  const prev=()=>{if(ex) $("#md-prev").innerHTML=LS.contratoHTML($("#md-t").value,LS.camposContrato(ex,cli(ex.cliente)))};
  prev(); $("#md-t").oninput=prev;
  $("#md-pad").onclick=()=>{$("#md-t").value=LS.MODELO_CONTRATO;prev()};
  $("#md-ok").onclick=()=>{const v=$("#md-t").value.trim();S.contratoModelo=v===LS.MODELO_CONTRATO.trim()?undefined:v;salvar();fechar();toast("Modelo do contrato salvo.")};
}

/* ============ CALENDÁRIO ============ */
let mesCal=0, filtroCal="tudo";
const ST_POST={ideia:["Ideia","#A39C94"],producao:["Em produção","#B9772A"],aprovacao:["Aguardando cliente","#3A6EA5"],ajustes:["Ajustes pedidos","#A3283A"],aprovado:["Aprovado","#2F6B4F"],publicado:["Publicado","#462D26"]};
const FORMATOS=["Feed","Carrossel","Reels","Stories"];
function eventosCal(){
  const ev=[];
  if(filtroCal==="tudo"||filtroCal==="prazos"){
    S.projetos.filter(p=>p.etapa!=="Concluído").forEach(p=>ev.push({d:p.prazo,t:`Prazo: ${p.titulo}`,c:SERV[p.servico]||"#3A6EA5",a:`verProjeto('${p.id}')`}));
    S.orcamentos.filter(o=>o.status==="enviado").forEach(o=>{const d=dt(o.enviadoEm||o.criado);d.setDate(d.getDate()+ +o.validade);ev.push({d:d.toISOString().slice(0,10),t:`Proposta ${o.num} vence`,c:"#86BBD8",a:`abrirOrc('${o.id}')`})});
  }
  if(admin()&&(filtroCal==="tudo"||filtroCal==="pagamentos")) S.caixa.filter(l=>!l.pago).forEach(l=>ev.push({d:l.data,t:`${l.tipo==="entrada"?"Receber":"Pagar"} ${brl(l.valor)}: ${l.desc}`,c:l.tipo==="entrada"?"#2F6B4F":"#A3283A",a:`location.hash='caixa'`}));
  if(filtroCal==="tudo"||filtroCal==="posts") (S.posts||[]).forEach(p=>ev.push({d:p.data,t:`${p.formato}: ${p.tema} (${cli(p.cliente).empresa})`,c:(ST_POST[p.status]||ST_POST.ideia)[1],a:`editarPost('${p.id}')`}));
  return ev;
}
function calendario(){
  const b=new Date(HOJE.getFullYear(),HOJE.getMonth()+mesCal,1), ini=new Date(b); ini.setDate(1-((b.getDay()+6)%7));
  const ev=eventosCal(), porDia={}; ev.forEach(x=>(porDia[x.d]=porDia[x.d]||[]).push(x));
  const dias=[]; for(let i=0;i<42;i++){const d=new Date(ini);d.setDate(ini.getDate()+i);dias.push(d)}
  const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const evBtn=x=>`<button class="ev" style="--c:${x.c}" onclick="${x.a}" title="${esc(x.t)}">${esc(x.t)}</button>`;
  const doMes=dias.filter(d=>d.getMonth()===b.getMonth()&&porDia[iso(d)]);
  const F=[["tudo","Tudo"],["prazos","Prazos"],...(admin()?[["pagamentos","Pagamentos"]]:[]),["posts","Posts das redes"]];
  return `<div class="cab"><div><h1>Calendário</h1><p>Prazos dos projetos, vencimentos e o calendário editorial dos clientes de social media.</p></div>
    <div class="acoes"><button class="btn" onclick="editarPost()">Novo post</button></div></div>
  <div class="cal-topo"><div class="filtros" style="margin:0">${F.map(([k,n])=>`<button aria-pressed="${filtroCal===k}" onclick="filtroCal='${k}';render()">${n}</button>`).join("")}</div>
    <div class="mes-nav"><button aria-label="Mês anterior" onclick="mesCal--;render()">‹</button><strong>${(m=>m[0].toUpperCase()+m.slice(1))(b.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}))}</strong><button aria-label="Próximo mês" onclick="mesCal++;render()">›</button></div></div>
  ${filtroCal==="posts"||filtroCal==="tudo"?`<div class="legenda" style="flex-wrap:wrap">${Object.values(ST_POST).map(([n,c])=>`<span style="--c:${c}">${n}</span>`).join("")}</div>`:""}
  <div class="cal">${["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=>`<div class="dsem" aria-hidden="true">${d}</div>`).join("")}
    ${dias.map(d=>{const k=iso(d),l=porDia[k]||[];return `<div class="dia ${d.getMonth()!==b.getMonth()?"fora":""} ${k===dia(0)?"hoje":""}" role="group" aria-label="${d.toLocaleDateString("pt-BR",{day:"numeric",month:"long"})}${l.length?`, ${l.length} ${l.length>1?"itens":"item"}`:""}"><span class="n">${d.getDate()}</span>${l.slice(0,4).map(evBtn).join("")}${l.length>4?`<span class="mut" style="font-size:.72rem">+${l.length-4}</span>`:""}</div>`}).join("")}</div>
  <div class="cal-lista">${doMes.length?doMes.map(d=>`<div class="dia-l"><h3>${d.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</h3>${porDia[iso(d)].map(evBtn).join("")}</div>`).join(""):`<p class="vazio">Nada neste mês.</p>`}</div>`;
}
function editarPost(id){
  const novo=!id, p=novo?{id:uid("pt"),cliente:(S.clientes.find(c=>/guapi/i.test(c.empresa))||S.clientes[0]).id,data:dia(1),formato:"Feed",tema:"",legenda:"",status:"ideia",resp:usuario}:JSON.parse(JSON.stringify(S.posts.find(x=>x.id===id)));
  abrir(novo?"Novo post":p.tema||"Post",novo?"Calendário editorial":esc(cli(p.cliente).empresa),`
    <div class="linha2">
      <div class="cmp"><label for="po-c">Cliente</label><select id="po-c">${S.clientes.map(c=>`<option value="${c.id}" ${c.id===p.cliente?"selected":""}>${esc(c.empresa)}</option>`).join("")}</select></div>
      <div class="cmp"><label for="po-d">Data de publicação</label><input id="po-d" type="date" value="${p.data}"></div>
      <div class="cmp"><label for="po-f">Formato</label><select id="po-f">${FORMATOS.map(f=>`<option ${f===p.formato?"selected":""}>${f}</option>`).join("")}</select></div>
      <div class="cmp"><label for="po-s">Situação</label><select id="po-s">${Object.entries(ST_POST).map(([k,[n]])=>`<option value="${k}" ${k===p.status?"selected":""}>${n}</option>`).join("")}</select></div>
      <div class="cmp"><label for="po-r">Responsável</label><select id="po-r">${S.equipe.map(e=>`<option value="${e.id}" ${e.id===p.resp?"selected":""}>${esc(e.nome)}</option>`).join("")}</select></div>
    </div>
    <div class="cmp"><label for="po-t">Tema</label><input id="po-t" value="${esc(p.tema)}" placeholder="Ex.: Promoção de aniversariante"></div>
    <div class="cmp"><label for="po-l">Legenda</label><textarea id="po-l" style="min-height:120px">${esc(p.legenda)}</textarea></div>
    ${p.comentario?`<div class="resp"><dt>Pedido de ajuste do cliente</dt><dd>${esc(p.comentario)}</dd></div>`:""}
    <p class="mut">Com a situação “Aguardando cliente”, o post aparece no portal para o cliente aprovar ou pedir ajustes.</p>`,
    `${novo?"":`<button class="btn perigo" id="po-del">Excluir</button>`}<button class="btn" id="po-ok">Salvar post</button>`);
  $("#po-ok").onclick=()=>{const t=$("#po-t").value.trim();if(!t){$("#po-t").setAttribute("aria-invalid","true");$("#po-t").focus();return}
    const antes=p.status;
    Object.assign(p,{cliente:$("#po-c").value,data:$("#po-d").value||p.data,formato:$("#po-f").value,status:$("#po-s").value,resp:$("#po-r").value,tema:t,legenda:$("#po-l").value});
    if(novo) S.posts.push(p); else S.posts[S.posts.findIndex(x=>x.id===p.id)]=p;
    if(p.status==="aprovacao"&&antes!=="aprovacao"){const c=cli(p.cliente);registrarEmail("arte",c.email,{nome:(c.nome||"").split(" ")[0],projeto:`o post “${p.tema}”`,portal:linkPortal(c)})}
    salvar();fechar();render();toast(p.status==="aprovacao"?"Post salvo e enviado para o cliente aprovar no portal.":"Post salvo.")};
  if($("#po-del")) $("#po-del").onclick=()=>{const b=$("#po-del");if(!b.dataset.c){b.dataset.c=1;b.textContent="Confirmar exclusão";return}S.posts=S.posts.filter(x=>x.id!==p.id);salvar();fechar();render();toast("Post excluído.")};
}

/* ============ PORTFÓLIO DO SITE ============ */
let PF=PORTFOLIO.carregar();
const PF_CORES=[["#3A6EA5","Azul escuro"],["#86BBD8","Azul claro"],["#462D26","Marrom"],["#2D2D2D","Cinza"]];
function salvarPF(msg){if(PORTFOLIO.salvar(PF)){if(msg)toast(msg)}else toast("Não foi possível salvar o portfólio. Confira a conexão e tente de novo.")}
const srcPF=u=>!u||/^(data:|blob:|https?:)/.test(u)?u:"../"+u;
const thumbPF=p=>`<span class="pf-thumb" style="--c:${p.cor};${p.cor==="#86BBD8"?"color:#2D2D2D":""}">${p.capa?`<img src="${srcPF(p.capa)}" alt="">`:esc(iniciais(p.nome))}</span>`;
function portfolio(){
  const pub=PF.filter(p=>p.publicado).length;
  return `<div class="cab"><div><h1>Portfólio do site</h1><p>${pub} de ${PF.length} projetos publicados. A ordem daqui é a ordem do site.</p></div>
   <div class="acoes"><a class="btn sec" href="../index.html#trabalhos">Ver no site</a><button class="btn" onclick="editarPF()">Novo projeto</button></div></div>
  <ul class="pf-lista">${PF.map((p,i)=>`<li class="pf-item ${p.publicado?"":"oculto-site"}">
    <span class="pf-ordem"><button aria-label="Subir ${esc(p.nome)}" onclick="moverPF(${i},-1)" ${i===0?"disabled":""}>↑</button><button aria-label="Descer ${esc(p.nome)}" onclick="moverPF(${i},1)" ${i===PF.length-1?"disabled":""}>↓</button></span>
    ${thumbPF(p)}
    <span><span class="pf-nome">${esc(p.nome)}</span><br><span class="mut">${esc(p.descricao)} · ${esc(PORTFOLIO.AREAS[p.area]?.pt||"")}${p.capa?"":" · sem capa"}</span></span>
    <label class="chave"><input type="checkbox" ${p.publicado?"checked":""} onchange="publicarPF(${i},this.checked)"> ${p.publicado?"Publicado":"Oculto"}</label>
    <button class="btn peq sec" onclick="editarPF('${p.id}')">Editar</button></li>`).join("")}</ul>
  <p class="mut" style="margin-top:1rem">Projetos ocultos continuam guardados aqui e não aparecem no site.</p>`;
}
function moverPF(i,d){const j=i+d;[PF[i],PF[j]]=[PF[j],PF[i]];salvarPF();render();const b=document.querySelectorAll(".pf-ordem")[j]?.children[d<0?0:1];if(b&&!b.disabled)b.focus()}
function publicarPF(i,v){PF[i].publicado=v;salvarPF(v?`"${PF[i].nome}" publicado no site.`:`"${PF[i].nome}" ocultado do site.`);render()}
function reduzir(file,max,q){return new Promise((ok,erro)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",q))};im.onerror=erro;im.src=r.result};r.onerror=erro;r.readAsDataURL(file)})}
const linksPF=p=>(p.links||[]).map((l,k)=>`<div class="linha-cfg"><div class="cmp"><label for="pfl-t${k}">Texto do botão</label><input id="pfl-t${k}" data-l="${k}" data-c="t" value="${esc(l.t)}"></div><div class="cmp"><label for="pfl-u${k}">Endereço</label><input id="pfl-u${k}" data-l="${k}" data-c="url" type="url" value="${esc(l.url)}"></div><button type="button" class="rm-linha" aria-label="Remover botão ${k+1}" data-rml="${k}">×</button></div>
       <div class="cmp" style="margin-top:-.2rem"><label for="pfl-e${k}">Texto do botão em inglês</label><input id="pfl-e${k}" data-l="${k}" data-c="tEn" value="${esc(l.tEn||"")}"></div>`).join("");
function editarPF(id){
  const novo=!id, p=novo?{id:uid("pf"),nome:"",descricao:"",descricaoEn:"",area:"identidade",cor:"#3A6EA5",capa:"",galeria:[],texto:"",textoEn:"",links:[],publicado:false,ano:String(HOJE.getFullYear())}:JSON.parse(JSON.stringify(PF.find(x=>x.id===id)));
  const corpo=`
   <div class="cmp"><label for="pf-n">Nome do projeto</label><input id="pf-n" value="${esc(p.nome)}" required aria-describedby="pf-e"><p class="mut" id="pf-e" style="color:var(--alerta);display:none">Dê um nome ao projeto.</p></div>
   <div class="linha2">
     <div class="cmp"><label for="pf-d">Descrição curta</label><input id="pf-d" value="${esc(p.descricao)}" placeholder="Ex.: Psicóloga"></div>
     <div class="cmp"><label for="pf-de">Descrição em inglês</label><input id="pf-de" value="${esc(p.descricaoEn||"")}" placeholder="Ex.: Psychologist"></div>
     <div class="cmp"><label for="pf-a">Área</label><select id="pf-a">${Object.entries(PORTFOLIO.AREAS).map(([k,v])=>`<option value="${k}" ${k===p.area?"selected":""}>${v.pt}</option>`).join("")}</select></div>

     <div class="cmp"><label for="pf-y">Ano</label><input id="pf-y" value="${esc(p.ano||"")}" inputmode="numeric"></div>
   </div>
   <fieldset class="cmp" style="border:0"><legend style="font-size:.85rem;font-weight:600;margin-bottom:.4rem">Cor da miniatura (quando não há capa)</legend>
     <div class="cores-pf">${PF_CORES.map(([c,n],k)=>`<input type="radio" name="pf-cor" id="pfc${k}" value="${c}" ${c===p.cor?"checked":""}><label for="pfc${k}" style="--c:${c}" title="${n}"><span class="sr-only">${n}</span></label>`).join("")}</div></fieldset>
   <div class="bloco"><h3>Capa</h3><div class="capa-prev" id="pf-capa-prev" style="--c:${p.cor}">${p.capa?`<img src="${srcPF(p.capa)}" alt="Capa atual">`:esc(iniciais(p.nome||"?"))}</div>
     <div class="acoes"><label class="btn peq sec" style="cursor:pointer">Escolher imagem<input type="file" id="pf-capa" accept="image/*" class="sr-only"></label>${p.capa?`<button class="btn peq perigo" id="pf-capa-rm">Remover capa</button>`:""}</div></div>
   <div class="bloco"><h3>Galeria do projeto</h3><p class="mut">Até 50 imagens, na ordem em que aparecem na página.</p>
     <div class="linha2" style="margin-top:.6rem">
       <div class="cmp"><label for="pf-pr">Formato das imagens</label><select id="pf-pr">${Object.entries(PORTFOLIO.PROPORCOES).map(([k,v])=>`<option value="${k}" ${PORTFOLIO.layout(p).prop===k?"selected":""}>${v}</option>`).join("")}</select></div>
       <div class="cmp"><label for="pf-g">Linhas automáticas: imagens por linha</label><select id="pf-g">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${PORTFOLIO.layout(p).cols===n?"selected":""}>${n}</option>`).join("")}</select></div></div>
     <p class="mut">Monte a galeria linha por linha: em cada linha, escolha quantas imagens ela tem. Arraste as imagens para mudar a ordem, inclusive de uma linha para outra (no celular, segure a imagem um instante antes de arrastar). As setas também mudam a ordem. As imagens que sobrarem seguem nas linhas automáticas. “Excluir linha” tira a linha do site e guarda as imagens dela em “Fora da galeria”, de onde dá para trazer de volta.</p>
     <div class="linhas-ed" id="pf-gal"></div>
     <h3 style="margin-top:1rem">Prévia da galeria</h3><div class="pf-prev" id="pf-prev" tabindex="0" role="region" aria-label="Prévia da galeria"></div>
     <label class="btn peq sec" style="cursor:pointer;margin-top:.5rem;display:inline-block">Adicionar imagens<input type="file" id="pf-galeria" accept="image/*" multiple class="sr-only"></label></div>
   <div class="cmp"><label for="pf-tx">Texto do projeto</label><textarea id="pf-tx" style="min-height:160px" aria-describedby="pf-tx-d" placeholder="Contexto, o que foi criado e por quê">${esc(p.texto||[p.desafio,p.solucao].filter(Boolean).join("\n\n"))}</textarea><p class="mut" id="pf-tx-d">Deixe uma linha em branco entre os parágrafos.</p></div>
   <div class="cmp"><label for="pf-txe">Texto em inglês</label><textarea id="pf-txe" style="min-height:160px">${esc(p.textoEn||"")}</textarea></div>
   <div class="bloco"><h3>Botões extras na página</h3><p class="mut" style="margin-bottom:.5rem">Ex.: protótipo no Figma, projeto completo no Canva.</p>
     <div id="pf-links">${linksPF(p)}</div>
     <button type="button" class="btn peq sec" id="pf-add-link">Adicionar botão</button></div>
   <label class="chave"><input type="checkbox" id="pf-pub" ${p.publicado?"checked":""}> Publicado no site</label>`;
  abrir(novo?"Novo projeto":p.nome,novo?"Aparece no site quando estiver publicado":esc(PORTFOLIO.AREAS[p.area]?.pt||""),corpo,
    `${novo?"":`<button class="btn perigo" id="pf-del">Excluir</button>`}<button class="btn" id="pf-ok">Salvar</button>`,
    novo?"":`<button class="btn peq sec" onclick="copiarTexto(new URL('../projeto.html#${p.slug}',location.href).href,'Link do projeto copiado.')">Copiar link</button><a class="btn peq sec" href="../projeto.html#${p.slug}">Abrir página</a>`);
  p.largas=p.largas||[]; p.ocultas=p.ocultas||[];
  const gal=()=>{
    p.grade=+$("#pf-g").value; p.proporcao=$("#pf-pr").value;
    const L=PORTFOLIO.linhas(p), vis=PORTFOLIO.visiveis(p), temAuto=L.some(r=>r.auto);
    $("#pf-gal").innerHTML=(L.length?L.map((r,ri)=>`<div class="linha-ed${r.auto?" linha-auto":""}"><div class="linha-ed-cab"><strong>Linha ${ri+1}${r.auto?' <span class="mut">(automática)</span>':""}</strong>
        <span style="display:flex;gap:.5rem;align-items:center"><label>Imagens nesta linha <select data-linha="${ri}" aria-label="Imagens na linha ${ri+1}">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${n===r.n?"selected":""}>${n}</option>`).join("")}</select></label>
        <button type="button" class="btn peq sec" data-excluir="${ri}">Excluir linha<span class="sr-only"> ${ri+1}</span></button></span></div>
      <div class="mini-gal">${vis.slice(r.ini,r.ini+r.qtd).map((g,j)=>{const k=r.ini+j;return `<figure class="gal-item" data-arrasta="${k}"><img src="${srcPF(g)}" alt="Imagem ${k+1}" draggable="false">
        <span class="gal-acoes"><button type="button" data-mv="${k}" data-d="-1" aria-label="Mover imagem ${k+1} para trás" ${k===0?"disabled":""}>‹</button><span class="gal-n">${k+1}</span><button type="button" data-mv="${k}" data-d="1" aria-label="Mover imagem ${k+1} para frente" ${k===vis.length-1?"disabled":""}>›</button></span>
        <button class="rm" type="button" aria-label="Apagar imagem ${k+1} do projeto" data-k="${k}">×</button></figure>`}).join("")}</div></div>`).join("")
      :`<span class="mut">Nenhuma imagem na galeria.</span>`)
      +`<div class="acoes">${temAuto&&(p.linhas||[]).length?`<button type="button" class="btn peq sec" id="pf-so">Excluir as linhas automáticas</button>`:""}${(p.linhas||[]).length?`<button type="button" class="btn peq sec" id="pf-auto">Voltar tudo para automático</button>`:""}</div>`
      +(p.ocultas.length?`<div class="linha-ed linha-auto"><div class="linha-ed-cab"><strong>Fora da galeria <span class="mut">(${p.ocultas.length})</span></strong><span class="mut">Guardadas no projeto, não aparecem no site</span></div>
        <div class="mini-gal">${p.ocultas.map((g,j)=>`<figure class="gal-item"><img src="${srcPF(g)}" alt="Imagem fora da galeria ${j+1}"><span class="gal-acoes"><button type="button" data-volta="${j}" style="flex:1">Voltar</button></span></figure>`).join("")}</div></div>`:"");
    $("#pf-prev").innerHTML=vis.length?PORTFOLIO.galeriaHTML(p,srcPF,k=>`Prévia ${k+1}`):`<span class="mut">A prévia aparece quando houver imagens.</span>`};
  /* ao mudar a quantidade de uma linha, as linhas até ela ficam fixas e o resto continua automático */
  $("#pf-gal").addEventListener("change",e=>{const sel=e.target.closest("select[data-linha]");if(!sel)return;
    const ri=+sel.dataset.linha, L=PORTFOLIO.linhas(p);p.linhas=L.slice(0,ri+1).map(x=>x.n);p.linhas[ri]=+sel.value;p.largas=[];gal();
    const ns=document.querySelector(`#pf-gal select[data-linha="${ri}"]`);if(ns)ns.focus()});
  $("#pf-g").onchange=gal; $("#pf-pr").onchange=gal;
  gal();
  p.links=p.links||[];
  const guardarLinks=()=>document.querySelectorAll("#pf-links [data-l]").forEach(i=>{p.links[i.dataset.l][i.dataset.c]=i.value});
  $("#pf-links").addEventListener("input",guardarLinks);
  $("#pf-links").addEventListener("click",e=>{const b=e.target.closest("[data-rml]");if(!b)return;guardarLinks();p.links.splice(+b.dataset.rml,1);redesenharLinks()});
  const redesenharLinks=()=>{$("#pf-links").innerHTML=linksPF(p)};
  $("#pf-add-link").onclick=()=>{guardarLinks();p.links.push({t:"",tEn:"",url:""});redesenharLinks();const ins=document.querySelectorAll("#pf-links [data-c='t']");ins[ins.length-1].focus()};
  $("#pf-gal").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    const vis=PORTFOLIO.visiveis(p), real=k=>p.galeria.indexOf(vis[k]);
    if(b.id==="pf-auto"){p.linhas=[]}
    else if(b.id==="pf-so"){const L=PORTFOLIO.linhas(p);L.filter(r=>r.auto).forEach(r=>p.ocultas.push(...vis.slice(r.ini,r.ini+r.qtd)));toast("As linhas automáticas saíram do site. As imagens ficaram guardadas em “Fora da galeria”.")}
    else if(b.dataset.excluir!==undefined){const ri=+b.dataset.excluir, L=PORTFOLIO.linhas(p), r=L[ri];
      p.ocultas.push(...vis.slice(r.ini,r.ini+r.qtd)); if(!r.auto) p.linhas=L.filter(x=>!x.auto).map(x=>x.n).filter((_,i)=>i!==ri);
      toast(`Linha ${ri+1} excluída. As imagens dela ficaram guardadas em “Fora da galeria”.`)}
    else if(b.dataset.volta!==undefined){p.ocultas.splice(+b.dataset.volta,1)}
    else if(b.dataset.k!==undefined){p.galeria.splice(real(+b.dataset.k),1)}
    else if(b.dataset.mv!==undefined){const k=+b.dataset.mv,j=k+ +b.dataset.d,a1=real(k),a2=real(j);[p.galeria[a1],p.galeria[a2]]=[p.galeria[a2],p.galeria[a1]];gal();
      const nb=document.querySelector(`#pf-gal [data-mv="${j}"][data-d="${b.dataset.d}"]`)||document.querySelector(`#pf-gal [data-mv="${j}"]`);if(nb&&!nb.disabled)nb.focus();return}
    gal()});
  /* arrastar e soltar as imagens (mouse e toque) */
  (()=>{const box=$("#pf-gal"), rol=$("#gav-corpo");let ar=null;
    const fim=()=>{if(!ar)return;clearTimeout(ar.timer);if(ar.fan)ar.fan.remove();box.querySelectorAll(".gal-item").forEach(f=>f.classList.remove("arrastando","antes","depois"));ar=null;cancelAnimationFrame(rolar.id)};
    const rolar=()=>{if(!ar||!ar.on)return;const r=rol.getBoundingClientRect(),m=50;
      if(ar.y<r.top+m)rol.scrollTop-=12;else if(ar.y>r.bottom-m)rol.scrollTop+=12;rolar.id=requestAnimationFrame(rolar)};
    const comecar=()=>{ar.on=true;const f=ar.fig,img=f.querySelector("img");f.classList.add("arrastando");
      const fan=img.cloneNode();fan.className="fantasma";fan.alt="";document.body.appendChild(fan);ar.fan=fan;mover();rolar()};
    const mover=()=>{if(!ar||!ar.on)return;ar.fan.style.left=(ar.x-36)+"px";ar.fan.style.top=(ar.y-36)+"px";
      box.querySelectorAll(".gal-item").forEach(f=>f.classList.remove("antes","depois"));
      const el=document.elementFromPoint(ar.x,ar.y),alvo=el&&el.closest("#pf-gal .gal-item[data-arrasta]");ar.alvo=null;
      if(alvo&&alvo!==ar.fig){const r=alvo.getBoundingClientRect(),dep=ar.x>r.left+r.width/2;alvo.classList.add(dep?"depois":"antes");ar.alvo={k:+alvo.dataset.arrasta,dep}}};
    box.addEventListener("pointerdown",e=>{const f=e.target.closest(".gal-item[data-arrasta]");if(!f||e.target.closest("button")||e.button>0)return;
      ar={fig:f,k:+f.dataset.arrasta,x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,on:false,toque:e.pointerType!=="mouse"};
      if(ar.toque)ar.timer=setTimeout(()=>{if(ar&&!ar.on)comecar()},280);});
    addEventListener("pointermove",e=>{if(!ar)return;ar.x=e.clientX;ar.y=e.clientY;
      if(!ar.on){const d=Math.hypot(ar.x-ar.x0,ar.y-ar.y0);if(ar.toque){if(d>10)fim()}else if(d>6)comecar();return}
      mover()});
    box.addEventListener("touchmove",e=>{if(ar&&ar.on)e.preventDefault()},{passive:false});
    addEventListener("pointerup",()=>{if(!ar)return;const a=ar;
      if(a.on&&a.alvo){const vis=PORTFOLIO.visiveis(p),item=vis[a.k];let t=a.alvo.k+(a.alvo.dep?1:0);if(t>a.k)t--;
        if(t!==a.k){vis.splice(a.k,1);vis.splice(t,0,item);p.galeria=vis.concat(p.galeria.filter(g=>!vis.includes(g)));fim();gal();toast(`Imagem movida para a posição ${t+1}.`);return}}
      fim()});
    addEventListener("pointercancel",fim);
    box.addEventListener("contextmenu",e=>{if(ar)e.preventDefault()});
  })();
  document.querySelectorAll('input[name="pf-cor"]').forEach(r=>r.onchange=()=>{p.cor=r.value;$("#pf-capa-prev").style.setProperty("--c",p.cor)});
  $("#pf-capa").onchange=async e=>{const f=e.target.files[0];if(!f)return;p.capa=await reduzir(f,1200,.8);$("#pf-capa-prev").innerHTML=`<img src="${p.capa}" alt="Nova capa">`};
  if($("#pf-capa-rm")) $("#pf-capa-rm").onclick=()=>{p.capa="";$("#pf-capa-prev").textContent=iniciais(p.nome||"?")};
  $("#pf-galeria").onchange=async e=>{const fs=[...e.target.files], cabe=Math.max(0,50-p.galeria.length);
    if(fs.length>cabe) toast(cabe?`O limite é 50 imagens por projeto: entraram só ${cabe} das ${fs.length}.`:"Este projeto já tem 50 imagens, que é o limite.");
    for(const f of fs.slice(0,cabe)) p.galeria.push(await reduzir(f,1400,.78)); e.target.value=""; gal()};
  $("#pf-ok").onclick=()=>{
    const nome=$("#pf-n").value.trim(); if(!nome){$("#pf-e").style.display="block";$("#pf-n").setAttribute("aria-invalid","true");$("#pf-n").focus();return}
    Object.assign(p,{nome,descricao:$("#pf-d").value.trim(),descricaoEn:$("#pf-de").value.trim(),area:$("#pf-a").value,ano:$("#pf-y").value.trim(),grade:+$("#pf-g").value,proporcao:$("#pf-pr").value,largas:(p.linhas||[]).length?[]:p.largas,linhas:p.linhas||[],ocultas:(p.ocultas||[]).filter(u=>p.galeria.includes(u)),texto:$("#pf-tx").value.trim(),textoEn:$("#pf-txe").value.trim(),desafio:"",solucao:"",links:(p.links||[]).filter(l=>l.url),publicado:$("#pf-pub").checked});
    let base=PORTFOLIO.slugify(nome)||"projeto", sl=base, n=2; while(PF.some(x=>x.slug===sl&&x.id!==p.id)) sl=base+"-"+(n++); p.slug=sl;
    if(novo) PF.unshift(p); else PF[PF.findIndex(x=>x.id===p.id)]=p;
    salvarPF(novo?"Projeto criado. Ele aparece no topo da lista.":"Projeto salvo."); fechar(); render();
  };
  if($("#pf-del")) $("#pf-del").onclick=()=>{const b=$("#pf-del");if(!b.dataset.c){b.dataset.c=1;b.textContent="Confirmar exclusão";return}PF=PF.filter(x=>x.id!==p.id);salvarPF("Projeto excluído do portfólio.");fechar();render()};
}

/* ============ CSV ============ */
function baixarCSV(nome,linhas){
  const cel=v=>{const t=String(v??"");return /[;"\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t};
  const csv="\ufeff"+linhas.map(l=>l.map(cel).join(";")).join("\r\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download=nome;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast(`Planilha "${nome}" baixada. Ela abre no Excel e no Google Planilhas.`);
}
const num=v=>Number(v||0).toFixed(2).replace(".",",");
function csvCaixa(){const r=resumoMes(mesCx);baixarCSV(`caixa-${r.b.getFullYear()}-${String(r.b.getMonth()+1).padStart(2,"0")}.csv`,
  [["Data","Descrição","Tipo","Categoria","Cliente","Valor (R$)","Situação"],...[...r.doMes].sort((a,b)=>a.data.localeCompare(b.data)).map(l=>[dt(l.data).toLocaleDateString("pt-BR"),l.desc,l.tipo==="entrada"?"Entrada":"Saída",l.cat,l.cliente?cli(l.cliente).empresa:"",num(l.tipo==="entrada"?l.valor:-l.valor),l.pago?(l.tipo==="entrada"?"Recebido":"Pago"):"Pendente"])])}
function csvClientes(){baixarCSV("clientes.csv",[["Empresa","Nome","E-mail","WhatsApp","Cidade","Origem","Cliente desde","Projetos",...(admin()?["Recebido (R$)"]:[])],
  ...S.clientes.map(c=>[c.empresa,c.nome,c.email,c.whats,c.cidade,c.origem,dt(c.desde).toLocaleDateString("pt-BR"),S.projetos.filter(p=>p.cliente===c.id).length,...(admin()?[num(S.caixa.filter(l=>l.cliente===c.id&&l.tipo==="entrada"&&l.pago).reduce((a,l)=>a+l.valor,0))]:[])])])}

/* ============ CLIENTES ============ */
function clientes(){
  const pago=c=>S.caixa.filter(l=>l.cliente===c.id&&l.tipo==="entrada"&&l.pago).reduce((a,l)=>a+l.valor,0);
  return `<div class="cab"><div><h1>Clientes</h1><p>Quem chega pelo formulário entra aqui quando você cria o orçamento.</p></div><button class="btn sec" onclick="csvClientes()">Exportar planilha</button></div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Cliente</th><th>Cidade</th><th>Origem</th><th>Projetos</th>${admin()?'<th class="valor">Recebido</th>':""}</tr></thead><tbody>
  ${S.clientes.map(c=>`<tr class="clicavel" onclick="verCliente('${c.id}')">
    <td><button class="linha-btn" onclick="event.stopPropagation();verCliente('${c.id}')">${esc(c.empresa)}</button><div class="mut">${esc(c.nome)}</div></td><td>${esc(c.cidade)}</td><td>${esc(c.origem)}</td>
    <td>${S.projetos.filter(p=>p.cliente===c.id).length}</td>${admin()?`<td class="valor">${brl(pago(c))}</td>`:""}</tr>`).join("")}
  </tbody></table></div>`;
}
function verCliente(id){
  const c=cli(id), pj=S.projetos.filter(p=>p.cliente===id), oc=S.orcamentos.filter(o=>o.cliente===id);
  abrir(c.empresa,esc(c.nome),`
   <div class="bloco"><h3>Contato</h3><dl><div class="resp"><dt>E-mail</dt><dd>${esc(c.email)}</dd></div><div class="resp"><dt>WhatsApp</dt><dd>${esc(c.whats||"—")}</dd></div><div class="resp"><dt>Cidade</dt><dd>${esc(c.cidade)}</dd></div><div class="resp"><dt>Cliente desde</dt><dd>${dt(c.desde).toLocaleDateString("pt-BR")}</dd></div></dl></div>
   <div class="bloco"><h3>Projetos</h3>${pj.length?pj.map(p=>`<div class="item-lista"><span>${esc(p.titulo)}</span><span class="mut">${p.etapa}</span></div>`).join(""):`<p class="mut">Nenhum projeto ainda.</p>`}</div>
   <div class="bloco"><h3>Orçamentos</h3>${oc.length?oc.map(o=>`<div class="item-lista"><button class="btn peq sec" onclick="fechar();abrirOrc('${o.id}')">Nº ${o.num}</button><span><span class="tag ${ST_ORC[o.status][1]}">${ST_ORC[o.status][0]}</span>${admin()?" "+brl(totalOrc(o)):""}</span></div>`).join(""):`<p class="mut">Nenhum orçamento.</p>`}</div>
   ${oc.some(o=>o.status==="aprovado")?`<div class="bloco"><h3>Contratos</h3>${oc.filter(o=>o.status==="aprovado").map(o=>`<div class="item-lista"><a class="btn peq sec" href="../contrato.html#${o.id}">Contrato nº ${o.num}</a><span class="tag ${o.contrato&&o.contrato.status==="assinado"?"st-aprovado":"st-pendente"}">${o.contrato&&o.contrato.status==="assinado"?"Assinado":"Aguardando assinatura"}</span></div>`).join("")}</div>`:""}`,
   c.whats?`<a class="btn" href="${zapLink(c.whats,`Oi, ${(c.nome||"").split(" ")[0]}!`)}" target="_blank" rel="noopener">Conversar no WhatsApp<span class="sr-only"> (abre em nova aba)</span></a>`:"",
   `<button class="btn peq sec" onclick="copiarTexto(linkPortal(cli('${c.id}')),'Link do portal copiado.')">Copiar link</button><a class="btn peq sec" href="../cliente.html#${c.id}">Abrir portal</a>`);
}

/* ============ NOTA FISCAL (MEI) ============ */
const soNum=t=>String(t||"").replace(/\D/g,"");
function nfTomador(l){
  const c=cli(l.cliente), o=S.orcamentos.find(y=>y.id===l.orc)||S.orcamentos.find(y=>y.cliente===c.id&&y.contrato&&y.contrato.assinatura);
  const a=o&&o.contrato&&o.contrato.assinatura, doc=(a&&a.doc)||c.doc||"", n=soNum(doc).length;
  return {c,o,nome:(a&&a.nome)||c.empresa||c.nome,doc,endereco:(a&&a.endereco)||c.endereco||c.cidade||"",exigida:n===14?"sim":n===11?"opcional":"verificar"};
}
function notasPendentes(){return S.caixa.filter(l=>l.tipo==="entrada"&&l.pago&&l.cliente&&!l.nf).sort((a,b)=>(b.pagoEm||b.data).localeCompare(a.pagoEm||a.data))}
function emitirNota(id){
  const l=S.caixa.find(x=>x.id===id), t=nfTomador(l), cfg=SITE.carregar().integracoes.nf||{};
  const pj=S.projetos.find(y=>y.id===l.projeto)||S.projetos.find(y=>y.cliente===l.cliente&&y.etapa!=="Concluído")||S.projetos.find(y=>y.cliente===l.cliente);
  const servico=t.o?t.o.itens.map(i=>i.s).filter(Boolean).join(", "):pj?pj.titulo:l.cat, parcela=l.desc.replace(t.c.empresa+", ","").replace(/\s*\([^)]*\)\s*$/,"");
  const desc=(cfg.descricao||"Serviços de design gráfico: {servico}.").replace("{servico}",servico).replace("{parcela}",parcela);
  const campos=[["Tomador (nome ou razão social)",t.nome],["CPF ou CNPJ do tomador",t.doc||"Pedir ao cliente"],["E-mail do tomador",t.c.email],["Endereço do tomador",t.endereco],
    ["Data de competência",dt(l.pagoEm||l.data).toLocaleDateString("pt-BR")],["Código de tributação nacional",cfg.codigo||"13.05.01"],["Descrição do serviço",desc],["Valor do serviço",num(l.valor)]];
  const aviso=t.exigida==="sim"?`<p class="painel" style="margin-bottom:1rem">Cliente com CNPJ: a nota é <strong>obrigatória</strong>.</p>`:t.exigida==="opcional"?`<p class="painel" style="margin-bottom:1rem">Cliente pessoa física: como MEI, a nota é opcional. Emita se o cliente pedir.</p>`:`<p class="painel" style="margin-bottom:1rem">Ainda não temos o CPF ou CNPJ deste cliente. Para empresa (CNPJ), a nota é obrigatória.</p>`;
  const emit=l.nf&&l.nf.status==="emitida";
  abrir(emit?`Nota fiscal ${l.nf.numero||""}`:"Emitir nota fiscal",`${esc(t.c.empresa)} · ${brl(l.valor)}`,`${emit?"":aviso}
    <div class="acoes" style="margin-bottom:1rem"><a class="btn peq" href="https://www.nfse.gov.br/EmissorNacional" target="_blank" rel="noopener">Abrir Emissor Nacional<span class="sr-only"> (abre em nova aba)</span></a><button class="btn peq sec" id="nf-tudo">Copiar todos os dados</button></div>
    <ol class="mut" style="margin:0 0 1rem 1.1rem;display:grid;gap:.25rem"><li>Abra o Emissor Nacional e entre com a conta gov.br.</li><li>Em “Nova NFS-e”, cole os dados abaixo.</li><li>Depois de emitir, volte aqui e informe o número da nota.</li></ol>
    <dl>${campos.map(([k,v],i)=>`<div class="item-lista"><div><dt class="mut">${k}</dt><dd style="white-space:pre-wrap">${esc(v)}</dd></div><button class="btn peq sec" data-copiar="${i}" aria-label="Copiar ${k}">Copiar</button></div>`).join("")}</dl>
    <div class="bloco" style="margin-top:1rem"><h3>Depois de emitir</h3><div class="linha2"><div class="cmp"><label for="nf-n">Número da nota</label><input id="nf-n" inputmode="numeric" value="${esc(l.nf&&l.nf.numero||"")}"></div>
      <div class="cmp"><label for="nf-u">Link do PDF da nota (opcional)</label><input id="nf-u" type="url" value="${esc(l.nf&&l.nf.url||"")}" placeholder="Aparece para o cliente no portal"></div></div></div>`,
    `${emit?"":`<button class="btn sec" id="nf-disp">Não vou emitir</button>`}<button class="btn" id="nf-ok">${emit?"Salvar":"Marcar como emitida"}</button>`);
  $("#gav-corpo").onclick=e=>{const b=e.target.closest("[data-copiar]");if(!b)return;copiarTexto(campos[+b.dataset.copiar][1],`${campos[+b.dataset.copiar][0]} copiado.`)};
  $("#nf-tudo").onclick=()=>copiarTexto(campos.map(([k,v])=>`${k}: ${v}`).join("\n"),"Todos os dados copiados.");
  $("#nf-ok").onclick=()=>{const n=$("#nf-n").value.trim();if(!n){$("#nf-n").setAttribute("aria-invalid","true");$("#nf-n").focus();toast("Informe o número da nota emitida.");return}
    l.nf={status:"emitida",numero:n,url:$("#nf-u").value.trim(),quando:dia(0)};salvar();fechar();render();toast(`Nota ${n} registrada.${l.nf.url?" O cliente vê o PDF no portal.":""}`)};
  if($("#nf-disp")) $("#nf-disp").onclick=()=>{l.nf={status:"dispensada",quando:dia(0)};salvar();fechar();render();toast("Pagamento marcado como sem nota.")};
}

/* ============ CAIXA ============ */
function resumoMes(off){
  const b=new Date(HOJE.getFullYear(),HOJE.getMonth()+off,1), y=b.getFullYear(), m=b.getMonth();
  const doMes=S.caixa.filter(l=>{const d=dt(l.data);return d.getFullYear()===y&&d.getMonth()===m});
  const soma=(t,p)=>doMes.filter(l=>l.tipo===t&&(p===undefined||l.pago===p)).reduce((a,l)=>a+l.valor,0);
  return {b,doMes,ent:soma("entrada",true),sai:soma("saida",true),rec:soma("entrada",false),pag:soma("saida",false),saldo:soma("entrada",true)-soma("saida",true)};
}
function caixa(){
  const r=resumoMes(mesCx);
  const meses=[-5,-4,-3,-2,-1,0].map(k=>resumoMes(mesCx+k));
  const mx=Math.max(...meses.map(x=>Math.max(x.ent+x.rec,x.sai+x.pag)),1);
  const W=600,H=190,bw=30,gap=W/6;
  const barras=meses.map((x,i)=>{const cx=i*gap+gap/2, he=(x.ent+x.rec)/mx*140, hs=(x.sai+x.pag)/mx*140, hp=x.rec/mx*140;
    return `<g><title>${x.b.toLocaleDateString("pt-BR",{month:"long"})}: entradas ${brl(x.ent+x.rec)}, saídas ${brl(x.sai+x.pag)}</title>
    <rect x="${cx-bw-2}" y="${160-he}" width="${bw}" height="${he}" fill="#2F6B4F" rx="2"/>
    ${hp?`<rect x="${cx-bw-2}" y="${160-he}" width="${bw}" height="${hp}" fill="#9CC2AE" rx="2"/>`:""}
    <rect x="${cx+2}" y="${160-hs}" width="${bw}" height="${hs}" fill="#A3283A" rx="2" opacity=".8"/>
    <text x="${cx}" y="180" text-anchor="middle" font-size="14" fill="#55606B" font-family="inherit">${x.b.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</text></g>`}).join("");
  let l=r.doMes; if(filtroCx==="entrada"||filtroCx==="saida") l=l.filter(x=>x.tipo===filtroCx); if(filtroCx==="pendente") l=l.filter(x=>!x.pago);
  l=[...l].sort((a,b)=>a.data.localeCompare(b.data));
  return `<div class="cab"><div><h1>Caixa</h1><p>Entradas e saídas do estúdio. Parcelas de orçamentos aprovados entram aqui automaticamente.</p></div>
   <div class="acoes"><div class="mes-nav"><button aria-label="Mês anterior" onclick="mesCx--;render()">‹</button><strong>${(m=>m[0].toUpperCase()+m.slice(1))(r.b.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}))}</strong><button aria-label="Próximo mês" onclick="mesCx++;render()">›</button></div>
   <button class="btn sec" onclick="csvCaixa()">Exportar planilha</button><button class="btn" onclick="novoLanc()">Novo lançamento</button></div></div>
  <dl class="numeros">
   <div class="num"><dt>Entradas recebidas</dt><dd class="pos">${brl(r.ent)}</dd></div>
   <div class="num"><dt>Saídas pagas</dt><dd class="neg">${brl(r.sai)}</dd></div>
   <div class="num"><dt>Saldo do mês</dt><dd class="${r.saldo>=0?"pos":"neg"}">${brl(r.saldo)}</dd></div>
   <div class="num"><dt>A receber</dt><dd>${brl(r.rec)}</dd></div>
   <div class="num"><dt>A pagar</dt><dd>${brl(r.pag)}</dd></div>
  </dl>
  <section class="painel" style="margin-bottom:1.5rem"><h2>Últimos 6 meses</h2>
   <div class="legenda"><span style="--c:#2F6B4F">Entradas recebidas</span><span style="--c:#9CC2AE">A receber</span><span style="--c:#C66070">Saídas</span></div>
   <svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Entradas e saídas nos últimos 6 meses"><line x1="0" x2="${W}" y1="160" y2="160" stroke="#C9CEC6"/>${barras}</svg></section>
  ${relatorios()}
  <div class="filtros">${[["todos","Todos"],["entrada","Entradas"],["saida","Saídas"],["pendente","Pendentes"]].map(([k,n])=>`<button aria-pressed="${filtroCx===k}" onclick="filtroCx='${k}';render()">${n}</button>`).join("")}</div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="valor">Valor</th><th>Situação</th></tr></thead><tbody>
  ${l.length?l.map(x=>{const atras=!x.pago&&diasAte(x.data)<0;return `<tr><td>${fmt(x.data)}</td><td>${esc(x.desc)}</td><td class="mut">${esc(x.cat)}</td>
   <td class="valor" style="color:${x.tipo==="entrada"?"var(--mata)":"var(--alerta)"}">${x.tipo==="entrada"?"+":"−"} ${brl(x.valor)}</td>
   <td>${x.pago?`<span class="tag st-pago">${x.tipo==="entrada"?"Recebido":"Pago"}</span>${x.tipo==="entrada"&&x.cliente?` <a class="btn peq sec" href="../recibo.html#${x.id}">Recibo<span class="sr-only"> de ${esc(x.desc)}</span></a> ${x.nf&&x.nf.status==="emitida"?`<button class="tag st-aprovado" style="border:0;cursor:pointer" onclick="emitirNota('${x.id}')">NF ${esc(x.nf.numero||"emitida")}</button>`:x.nf&&x.nf.status==="dispensada"?`<span class="tag st-recusado">Sem NF</span>`:`<button class="btn peq" onclick="emitirNota('${x.id}')">Emitir nota</button>`}`:""}`:`<button class="btn peq sec" onclick="quitar('${x.id}')">${atras?"Atrasado · ":""}Marcar ${x.tipo==="entrada"?"recebido":"pago"}</button>`}</td></tr>`}).join(""):`<tr><td colspan="5" class="vazio">Nenhum lançamento neste filtro.</td></tr>`}
  </tbody></table></div>`;
}
function relatorios(){
  const ap=S.orcamentos.filter(o=>o.status==="aprovado"&&diasAte(o.aprovadoEm||o.criado)>=-365);
  const agrupar=f=>{const m={};ap.forEach(o=>{const k=f(o)||"Outros";m[k]=(m[k]||0)+totalOrc(o)});return Object.entries(m).sort((a,b)=>b[1]-a[1])};
  const porServ=agrupar(o=>{const t=o.itens[0]?.s||"";return /social/i.test(t)?"Social media":/identidade|marca|papelaria/i.test(t)?"Identidade visual":/alinhamento/i.test(t)?"Alinhamento visual":"Outros projetos"});
  const porOrig=agrupar(o=>cli(o.cliente).origem);
  const barras=(l,cor)=>{const mx=Math.max(...l.map(x=>x[1]),1);return l.map(([k,v])=>`<div class="rel-l"><span>${esc(k)}</span><span class="rel-b"><i style="width:${Math.max(4,v/mx*100)}%;background:${cor}"></i></span><strong>${brl(v)}</strong></div>`).join("")||`<p class="mut">Nenhum orçamento aprovado nos últimos 12 meses.</p>`};
  return `<div class="grade2" style="margin-bottom:1.5rem">
    <section class="painel"><h2>Aprovados por serviço</h2><p class="mut" style="margin:-.4rem 0 .8rem">Últimos 12 meses, valor total dos orçamentos</p>${barras(porServ,"#3A6EA5")}</section>
    <section class="painel"><h2>Aprovados por origem do cliente</h2><p class="mut" style="margin:-.4rem 0 .8rem">De onde vieram os clientes que fecharam</p>${barras(porOrig,"#462D26")}</section></div>`;
}
function quitar(id){const x=S.caixa.find(l=>l.id===id);x.pago=true;salvar();render();toast(`${x.desc}: marcado como ${x.tipo==="entrada"?"recebido":"pago"}.`)}
function novoLanc(){
  abrir("Novo lançamento","",`
   <div class="cmp"><label for="nl-t">Tipo</label><select id="nl-t"><option value="saida">Saída</option><option value="entrada">Entrada</option></select></div>
   <div class="cmp"><label for="nl-d">Descrição</label><input id="nl-d" placeholder="Ex.: Assinatura do Canva"></div>
   <div class="linha2"><div class="cmp"><label for="nl-v">Valor (R$)</label><input id="nl-v" type="number" min="0" step="0.01"></div>
   <div class="cmp"><label for="nl-dt">Data</label><input id="nl-dt" type="date" value="${dia(0)}"></div></div>
   <div class="cmp"><label for="nl-c">Categoria</label><select id="nl-c">${CAT_S.map(c=>`<option>${c}</option>`).join("")}</select></div>
   <div class="cmp"><label><input type="checkbox" id="nl-p" checked style="width:auto;margin-right:.4rem">Já foi pago ou recebido</label></div>
   <p class="erro-nl mut oculto" style="color:var(--alerta)">Preencha a descrição e um valor maior que zero.</p>`,
   `<button class="btn" id="nl-ok">Salvar lançamento</button>`);
  $("#nl-t").onchange=e=>{$("#nl-c").innerHTML=(e.target.value==="entrada"?CAT_E:CAT_S).map(c=>`<option>${c}</option>`).join("")};
  $("#nl-ok").onclick=()=>{const v=+$("#nl-v").value,d=$("#nl-d").value.trim();if(!d||!(v>0)){document.querySelector(".erro-nl").classList.remove("oculto");return}
    S.caixa.push({id:uid("L"),desc:d,tipo:$("#nl-t").value,cat:$("#nl-c").value,valor:v,data:$("#nl-dt").value||dia(0),pago:$("#nl-p").checked});salvar();fechar();render();toast("Lançamento salvo.")};
}


/* ============ CONTEÚDO DO SITE ============ */
let C=SITE.carregar();
const TEXTOS=[["heroTitB","Título da abertura (palavra entre *asteriscos* fica em destaque)"],["sobre1","Sobre: 1º parágrafo"],["sobre2","Sobre: 2º parágrafo"]];
(C.servicos||[]).forEach(sv=>{if(sv.pedido&&!SERV[sv.pedido])SERV[sv.pedido]=sv.cor});
const CORES_SV=[["#3A6EA5","Azul escuro"],["#86BBD8","Azul claro"],["#462D26","Marrom"],["#2D2D2D","Grafite"],["#E4DDD1","Bege"]];
function moverLink(i,d){const j=i+d;[C.links[i],C.links[j]]=[C.links[j],C.links[i]];render()}
function moverSv(i,d){const j=i+d;[C.servicos[i],C.servicos[j]]=[C.servicos[j],C.servicos[i]];render()}
function getP(o,p){return p.split(".").reduce((a,k)=>a?.[k],o)}
function setP(o,p,v){const k=p.split(".");const u=k.pop();k.reduce((a,x)=>a[x],o)[u]=v}
function campo(path,label,tipo="text",extra=""){const v=getP(C,path)??"";const id="c-"+path.replace(/\./g,"-");
  if(tipo==="area") return `<div class="cmp"><label for="${id}">${label}</label><textarea id="${id}" data-k="${path}" ${extra}>${esc(v)}</textarea></div>`;
  if(tipo==="check") return `<label class="chave"><input type="checkbox" id="${id}" data-k="${path}" data-tipo="bool" ${v?"checked":""}> ${label}</label>`;
  return `<div class="cmp"><label for="${id}">${label}</label><input id="${id}" type="${tipo}" data-k="${path}" ${tipo==="number"?'data-tipo="num" min="0" step="50"':""} value="${esc(v)}" ${extra}></div>`}
function conteudo(){
  const P=C.precos;
  return `<div class="cab"><div><h1>Conteúdo do site</h1><p>O que você salvar aqui aparece no site na hora. Campos de texto vazios mantêm o texto atual do site.</p></div>
   <div class="acoes"><a class="btn sec" href="../index.html">Ver o site</a><a class="btn sec" href="../links.html">Ver página de links</a></div></div>
  <form class="secoes-cfg" id="form-cfg" onsubmit="return false">
   <section class="painel"><h2>Serviços</h2>
     <p class="mut" style="margin-bottom:.9rem">Os serviços aparecem no site nesta ordem, cada um em uma caixa da cor escolhida, e também viram opções no formulário de orçamento.</p>
     ${C.servicos.map((sv,i)=>{const base=["identidade","social","alinhamento"].includes(sv.id);return `<div class="depo-cfg">
       <div style="display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.6rem"><strong>${esc(sv.t||"Novo serviço")}</strong>
         <span class="acoes"><span class="pf-ordem" style="flex-direction:row"><button type="button" aria-label="Subir ${esc(sv.t)}" onclick="moverSv(${i},-1)" ${i===0?"disabled":""}>↑</button><button type="button" aria-label="Descer ${esc(sv.t)}" onclick="moverSv(${i},1)" ${i===C.servicos.length-1?"disabled":""}>↓</button></span>
         ${C.servicos.length>1?`<button type="button" class="btn peq perigo" onclick="C.servicos.splice(${i},1);render()">Remover</button>`:""}</span></div>
       <div class="linha2">${campo(`servicos.${i}.t`,"Nome do serviço")}${campo(`servicos.${i}.tEn`,"Em inglês")}
         ${campo(`servicos.${i}.p`,"Texto","area")}${campo(`servicos.${i}.pEn`,"Texto em inglês","area")}
         ${campo(`servicos.${i}.i`,"“Ideal para…”")}${campo(`servicos.${i}.iEn`,"“Ideal para…” em inglês")}
         <div class="cmp"><label for="sv-c${i}">Cor da caixa</label><select id="sv-c${i}" data-k="servicos.${i}.cor">${CORES_SV.map(([c,n])=>`<option value="${c}" ${c===sv.cor?"selected":""}>${n}</option>`).join("")}</select></div>
         ${campo(`servicos.${i}.pedido`,"Nome curto no formulário e no sistema")}
         ${base?"":campo(`servicos.${i}.valor`,"A partir de (R$), se for mostrar valores","number")}</div></div>`}).join("")}
     <button type="button" class="btn peq sec" onclick="C.servicos.push({id:uid('sv'),cor:'#86BBD8',pedido:'',t:'',tEn:'',p:'',pEn:'',i:'',iEn:'',valor:0});render()">Adicionar serviço</button>
     <div style="margin-top:1.25rem">${campo("servicosAbertos","Mostrar os serviços já abertos no site","check")}
     <p class="mut" style="margin-top:.4rem">Desligado: cada serviço mostra só o nome e abre com um clique. Ligado: todos já aparecem com o texto à mostra.</p></div></section>
   <section class="painel"><h2>Valores dos serviços</h2>
     <p class="mut" style="margin-bottom:.9rem">Opcional. Quando ligado, cada serviço mostra o valor de referência dentro da caixa dele, no site.</p>
     ${campo("precos.mostrar","Mostrar valores no site","check")}
     <div class="linha2" style="margin-top:1rem">
       <div>${campo("precos.identidade.mostrar","Identidade visual","check")}${campo("precos.identidade.valor","A partir de (R$)","number")}</div>
       <div>${campo("precos.alinhamento.mostrar","Alinhamento visual","check")}${campo("precos.alinhamento.valor","A partir de (R$)","number")}</div>
     </div>
     <div class="bloco" style="margin-top:1rem"><h3>Pacotes de social media (valor por mês)</h3>${campo("precos.social.mostrar","Mostrar pacotes","check")}
       <div style="margin-top:.75rem">${P.social.pacotes.map((p,i)=>`<div class="linha-cfg">${campo(`precos.social.pacotes.${i}.nome`,"Pacote")}${campo(`precos.social.pacotes.${i}.valor`,"Valor por mês (R$)","number")}<button type="button" class="rm-linha" aria-label="Remover pacote ${i+1}" onclick="C.precos.social.pacotes.splice(${i},1);render()">×</button></div>`).join("")}</div>
       <button type="button" class="btn peq sec" onclick="C.precos.social.pacotes.push({nome:'',valor:0});render()">Adicionar pacote</button></div>
   </section>
   <section class="painel"><h2>Depoimentos</h2>
     <p class="mut" style="margin-bottom:.9rem">Só depoimentos reais, com autorização do cliente. A seção aparece no site quando há pelo menos um publicado.</p>
     ${C.depoimentos.map((d,i)=>`<div class="depo-cfg"><div class="linha2">${campo(`depoimentos.${i}.nome`,"Nome")}${campo(`depoimentos.${i}.papel`,"Profissão ou empresa")}</div>${campo(`depoimentos.${i}.texto`,"Depoimento","area")}
       <div style="display:flex;justify-content:space-between;align-items:center">${campo(`depoimentos.${i}.publicado`,"Publicado no site","check")}<button type="button" class="btn peq perigo" onclick="C.depoimentos.splice(${i},1);render()">Remover</button></div></div>`).join("")||`<p class="vazio">Nenhum depoimento ainda. Quando um projeto vai para “Concluído”, o cliente recebe o pedido de depoimento por e-mail.</p>`}
     <button type="button" class="btn peq sec" onclick="C.depoimentos.push({id:uid('d'),nome:'',papel:'',texto:'',publicado:false});render()">Adicionar depoimento</button>
   </section>
   <section class="painel"><h2>Como eu trabalho</h2>
     ${C.processo.map((p,i)=>`<div class="depo-cfg"><div class="linha-cfg tres">${campo(`processo.${i}.t`,`Etapa ${i+1}`)}${campo(`processo.${i}.d`,"Descrição")}<button type="button" class="rm-linha" aria-label="Remover etapa ${i+1}" onclick="C.processo.splice(${i},1);render()">×</button></div>
       <div class="linha-cfg tres" style="margin:0">${campo(`processo.${i}.tEn`,"Em inglês")}${campo(`processo.${i}.dEn`,"Descrição em inglês")}<span></span></div></div>`).join("")}
     <button type="button" class="btn peq sec" onclick="C.processo.push({t:'',d:''});render()">Adicionar etapa</button>
   </section>
   <section class="painel"><h2>Textos do site</h2><p class="mut" style="margin-bottom:.9rem">Cada texto tem a versão em português e em inglês. Campo vazio mantém o texto atual do site.</p>
     ${TEXTOS.map(([k,l])=>{const t=k.endsWith("p")||k.startsWith("sobre")?"area":"text";return `<div class="linha2">${campo("textos."+k,l,t,'placeholder="Usar o texto atual do site"')}${campo("textosEn."+k,"Em inglês",t,'placeholder="Use the current site text" lang="en"')}</div>`}).join("")}</section>
   <section class="painel"><h2>Página de links (bio do Instagram)</h2>
     ${C.links.map((l,i)=>`<div class="depo-cfg"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem"><strong>${esc(l.titulo||"Novo botão")}</strong><span class="pf-ordem" style="flex-direction:row"><button type="button" aria-label="Subir ${esc(l.titulo)}" onclick="moverLink(${i},-1)" ${i===0?"disabled":""}>↑</button><button type="button" aria-label="Descer ${esc(l.titulo)}" onclick="moverLink(${i},1)" ${i===C.links.length-1?"disabled":""}>↓</button></span></div><div class="linha-cfg">${campo(`links.${i}.titulo`,"Texto do botão")}${campo(`links.${i}.url`,"Endereço")}<button type="button" class="rm-linha" aria-label="Remover link ${i+1}" onclick="C.links.splice(${i},1);render()">×</button></div>${campo(`links.${i}.tituloEn`,"Texto do botão em inglês")}</div>`).join("")}
     <button type="button" class="btn peq sec" onclick="C.links.push({titulo:'',url:''});render()">Adicionar link</button>
   </section>
   <section class="painel"><h2>Integrações</h2>
     ${campo("integracoes.agenda","Link da página de agendamento do Google Agenda (aparece no portal do cliente na etapa de briefing)","url",'placeholder="https://calendar.app.google/…"')}
     <div class="linha2"><div class="cmp"><label for="c-gw">Plataforma de pagamento</label><select id="c-gw" data-k="integracoes.gateway">${["InfinitePay","Asaas","Mercado Pago","Efí Bank"].map(g=>`<option ${g===C.integracoes.gateway?"selected":""}>${g}</option>`).join("")}</select></div>
     ${campo("integracoes.descontoVista","Desconto no Pix à vista (%)","number",'step="1" max="30"')}
     <div class="cmp"><label for="c-em">Serviço de e-mail</label><select id="c-em" data-k="integracoes.email">${["Google Workspace","Resend","Brevo"].map(g=>`<option ${g===C.integracoes.email?"selected":""}>${g}</option>`).join("")}</select></div></div>
     <p class="mut" style="margin-top:.4rem">Com o Google Workspace, os e-mails automáticos saem do próprio contato@lumarasilva.com.br e ficam na pasta Enviados. Com a InfinitePay, o Pix não tem taxa e as mensalidades são cobradas com um link novo a cada mês.</p>
     <div class="bloco" style="margin-top:.5rem"><h3>Nota fiscal (MEI, Emissor Nacional)</h3>
       <p class="mut" style="margin-bottom:.6rem">A nota é emitida no Emissor Nacional do governo. O sistema avisa quando um pagamento entra e deixa os dados prontos para copiar. Na descrição, {servico} e {parcela} são preenchidos sozinhos.</p>
       <div class="linha2">${campo("integracoes.nf.codigo","Código de tributação nacional")}${campo("integracoes.nf.descricao","Descrição padrão do serviço")}</div>
       <p class="mut">O 13.05.01 (composição gráfica e pré-impressão) corresponde à atividade principal do CNPJ, 18.21-1-00. Vale confirmar com a contadora na primeira nota.</p></div>
     <div class="bloco" style="margin-top:.5rem"><h3>WhatsApp Business (API da Meta)</h3>
       <p class="mut" style="margin-bottom:.6rem">Quando ligado, as mensagens marcadas em “Mensagens automáticas” também saem pelo WhatsApp, do mesmo número que você usa no celular. A Meta cobra por mensagem enviada.</p>
       ${campo("integracoes.whatsapp.ativo","Enviar mensagens automáticas pelo WhatsApp","check")}
       <div style="margin-top:.75rem;max-width:320px">${campo("integracoes.whatsapp.numero","Número do WhatsApp Business","tel")}</div></div>
   </section>
  </form>
  <div class="barra-salvar"><button class="btn sec" onclick="C=SITE.carregar();render();toast('Alterações descartadas.')">Descartar</button><button class="btn" onclick="salvarCfg()">Salvar e publicar no site</button></div>`;
}
document.addEventListener("input",e=>{const t=e.target; if(!t.dataset||!t.dataset.k||view!=="conteudo") return;
  setP(C,t.dataset.k,t.dataset.tipo==="bool"?t.checked:t.dataset.tipo==="num"?+t.value:t.value)});
document.addEventListener("change",e=>{const t=e.target; if(t.tagName==="SELECT"&&t.dataset.k&&view==="conteudo") setP(C,t.dataset.k,t.value)});
function salvarCfg(){C.servicos=C.servicos.filter(sv=>sv.t.trim());C.servicos.forEach(sv=>{if(!sv.pedido)sv.pedido=sv.t;if(!SERV[sv.pedido])SERV[sv.pedido]=sv.cor});C.depoimentos=C.depoimentos.filter(d=>d.nome||d.texto);C.links=C.links.filter(l=>l.titulo||l.url);C.processo=C.processo.filter(p=>p.t||p.d);
  if(SITE.salvar(C)){render();toast("Conteúdo salvo e publicado no site.")}else toast("Não foi possível salvar.")}

/* ============ E-MAILS AUTOMÁTICOS ============ */
function emails(){
  const M=S.emails.modelos, venc=S.orcamentos.filter(o=>o.status==="enviado").map(o=>{const d=dt(o.enviadoEm||o.criado);d.setDate(d.getDate()+ +o.validade-2);return {o,quando:d.toISOString().slice(0,10)}}).filter(x=>diasAte(x.quando)>=0).sort((a,b)=>a.quando.localeCompare(b.quando));
  const zap=SITE.carregar().integracoes.whatsapp||{};
  return `<div class="cab"><div><h1>Mensagens automáticas</h1><p>E-mails, e WhatsApp quando ligado, enviados sozinhos em cada etapa. Os envios aparecem no histórico abaixo.</p></div></div>
  <p class="painel" style="margin-bottom:1.25rem">WhatsApp: <strong>${zap.ativo?"ligado":"desligado"}</strong>. ${zap.ativo?"As mensagens marcadas com “Também no WhatsApp” saem pelos dois canais.":"Para ligar, vá em Conteúdo do site › Integrações."}</p>
  <section class="painel" style="margin-bottom:1.25rem"><h2>Automações</h2>
   ${Object.entries(M).map(([k,m])=>`<div class="auto"><div><strong>${m.nome}</strong><div class="mut">${m.quando}</div></div>
     <span style="display:flex;flex-direction:column;gap:.35rem"><label class="chave"><input type="checkbox" ${m.ativo?"checked":""} onchange="S.emails.modelos['${k}'].ativo=this.checked;salvar();render()"> ${m.ativo?"Ligado":"Desligado"}</label>
     <label class="chave"><input type="checkbox" ${m.whats?"checked":""} onchange="S.emails.modelos['${k}'].whats=this.checked;salvar();render()"> Também no WhatsApp</label></span>
     <button class="btn peq sec" onclick="editarEmail('${k}')">Editar mensagem</button></div>`).join("")}
  </section>
  <div class="grade2">
   <section class="painel"><h2>Próximas cobranças</h2>${(()=>{const l=S.caixa.filter(x=>x.tipo==="entrada"&&!x.pago&&x.cliente&&diasAte(x.data)>=-30&&diasAte(x.data)<=30).sort((a,b)=>a.data.localeCompare(b.data));
     return l.length?l.map(x=>{const d=diasAte(x.data);return `<div class="item-lista"><div><strong>${esc(cli(x.cliente).empresa)}</strong><div class="sub">${brl(x.valor)} · vence ${fmt(x.data)}</div></div><span class="tag ${d<0?"st-atrasado":x.avisado?"st-aprovado":"st-pendente"}">${d<0?(x.atrasoAvisado?"Aviso de atraso enviado":"Atrasada"):x.avisado?"Aviso enviado":"Aviso em "+fmtLongo(dia(Math.max(0,d-3)))}</span></div>`}).join(""):`<p class="vazio">Nenhuma parcela em aberto.</p>`})()}</section>
   <section class="painel"><h2>Próximos lembretes de proposta</h2>${venc.length&&M.lembrete.ativo?venc.map(({o,quando})=>`<div class="item-lista"><div><strong>${esc(cli(o.cliente).empresa)}</strong><div class="sub">Proposta nº ${o.num}</div></div><span class="tag st-pendente">${fmtLongo(quando)}</span></div>`).join(""):`<p class="vazio">Nenhum lembrete agendado.</p>`}</section>
   <section class="painel"><h2>Histórico de envios</h2>${S.emails.historico.length?S.emails.historico.slice(0,12).map(h=>`<div class="item-lista"><div><strong>${esc(h.assunto)}</strong><span class="canal" ${h.canal==="WhatsApp"?"":'style="background:#DCE8EF;color:#1F4A62"'}>${h.canal||"E-mail"}</span><div class="sub">Para ${esc(h.para)}</div></div><button class="btn peq sec" onclick="verEmail('${h.id}')">${new Date(h.quando).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} · Ver</button></div>`).join(""):`<p class="vazio">Nenhum e-mail enviado ainda. Envie um orçamento ou mova um projeto para “Concluído” para ver aqui.</p>`}</section>
  </div>`;
}
function editarEmail(k){const m=S.emails.modelos[k];
  abrir(m.nome,esc(m.quando),`<div class="cmp"><label for="em-a">Assunto</label><input id="em-a" value="${esc(m.assunto)}"></div>
   <div class="cmp"><label for="em-c">Mensagem</label><textarea id="em-c" style="min-height:220px">${esc(m.corpo)}</textarea></div>
   <p class="mut">Campos que são trocados automaticamente: {nome}, {numero}, {link}, {validade}, {agenda}, {portal}, {projeto}, {valor}, {vencimento}, {descricao}.</p>`,
   `<button class="btn" id="em-ok">Salvar mensagem</button>`);
  $("#em-ok").onclick=()=>{m.assunto=$("#em-a").value;m.corpo=$("#em-c").value;salvar();fechar();render();toast("Mensagem salva.")}}
function verEmail(id){const h=S.emails.historico.find(x=>x.id===id);abrir(h.assunto,"Para "+esc(h.para),`<div class="email-prev">${esc(h.corpo)}</div>`)}

/* ============ EQUIPE ============ */
const PAPEIS={admin:["Administradora","Tudo, incluindo caixa e valores"],equipe:["Equipe","Pedidos, projetos, calendário e clientes, sem valores"]};
function equipe(){
  const lista=S.equipe.filter(p=>p.email||!window.NUVEM_ADMIN);
  const eu=pessoa(usuario);
  return `<div class="cab"><div><h1>Equipe</h1><p>Cada pessoa entra com o próprio e-mail e senha e vê só o que o papel dela permite.</p></div>
   ${admin()?`<div class="acoes"><button class="btn" onclick="novaPessoa()">Adicionar pessoa</button></div>`:""}</div>
  <div class="tab-wrap"><table class="tabela"><thead><tr><th>Pessoa</th><th>Papel</th><th>O que vê</th>${admin()?"<th><span class=\"sr-only\">Ações</span></th>":""}</tr></thead><tbody>
  ${lista.map(p=>`<tr><td><span style="display:flex;gap:.6rem;align-items:center"><span class="avatar" style="--c:${p.cor}">${iniciais(p.nome)}</span><span><strong>${esc(p.nome)}</strong>${p.email?`<br><span class="mut" style="font-size:.85rem">${esc(p.email)}</span>`:""}</span></span></td>
    <td>${esc(p.papel||"")}${p.convite?` <span class="tag st-rascunho">convite enviado</span>`:""}</td><td class="mut">${esc(p.acesso||"")}</td>
    ${admin()?`<td style="white-space:nowrap">${p.email&&p.id!==eu.id?`<button class="btn peq sec" onclick="convidarDeNovo('${p.id}')">Reenviar convite</button> <button class="btn peq perigo" onclick="removerPessoa('${p.id}')">Remover</button>`:p.id===eu.id?`<span class="mut">Você</span>`:""}</td>`:""}</tr>`).join("")}
  </tbody></table></div>`;
}
function novaPessoa(){
  abrir("Adicionar pessoa","A pessoa recebe um e-mail para criar a própria senha.",
   `<div class="cmp"><label for="np-nome">Nome</label><input id="np-nome" autocomplete="off"></div>
    <div class="cmp"><label for="np-email">E-mail</label><input id="np-email" type="email" autocomplete="off"></div>
    <div class="cmp"><label for="np-papel">Papel</label><select id="np-papel"><option value="equipe">Equipe: pedidos, projetos, calendário e clientes, sem valores</option><option value="admin">Administradora: tudo, incluindo caixa e valores</option></select></div>
    <p class="mut" id="np-erro" role="alert"></p>`,
   `<button class="btn" id="np-ok">Enviar convite</button>`);
  $("#np-ok").onclick=async()=>{
    const nome=$("#np-nome").value.trim(), email=$("#np-email").value.trim().toLowerCase(), papel=$("#np-papel").value, er=$("#np-erro");
    if(!nome){er.textContent="Digite o nome.";$("#np-nome").focus();return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){er.textContent="Digite um e-mail válido.";$("#np-email").focus();return}
    if(S.equipe.some(p=>(p.email||"")===email)){er.textContent="Essa pessoa já está na equipe. Use “Reenviar convite”.";return}
    const b=$("#np-ok"); b.disabled=true; b.textContent="Enviando…"; er.textContent="";
    try{
      if(window.NUVEM_ADMIN) await NUVEM_ADMIN.api("equipe",{acao:"convidar",nome,email,papel});
      const cores=["#86BBD8","#462D26","#5E5A55","#2E5E7A","#9C6B4E"];
      S.equipe.push({id:uid("p"),nome,email,papel:PAPEIS[papel][0],acesso:PAPEIS[papel][1],cor:cores[S.equipe.length%cores.length],convite:new Date().toISOString()});
      salvar();fechar();render();toast(`Convite enviado para ${email}.`);
    }catch(e){b.disabled=false;b.textContent="Enviar convite";er.textContent="Não foi possível enviar o convite: "+e.message+"."}
  };
}
async function convidarDeNovo(id){
  const p=pessoa(id);
  try{ await NUVEM_ADMIN.api("equipe",{acao:"convidar",nome:p.nome,email:p.email,papel:p.papel==="Administradora"?"admin":"equipe"});
    p.convite=new Date().toISOString();salvar();render();toast(`Convite reenviado para ${p.email}.`) }
  catch(e){toast("Não foi possível reenviar: "+e.message+".")}
}
function removerPessoa(id){
  const p=pessoa(id);
  abrir("Remover "+esc(p.nome),"A pessoa deixa de entrar na área da equipe na hora.",
   `<p>O histórico do que ${esc(p.nome.split(" ")[0])} fez (comentários, projetos) continua no sistema.</p><p class="mut" id="rp-erro" role="alert"></p>`,
   `<button class="btn sec" onclick="fechar()">Cancelar</button><button class="btn perigo" id="rp-ok">Remover acesso</button>`);
  $("#rp-ok").onclick=async()=>{
    const b=$("#rp-ok"); b.disabled=true;
    try{ if(window.NUVEM_ADMIN) await NUVEM_ADMIN.api("equipe",{acao:"remover",email:p.email});
      p.email="";p.removido=new Date().toISOString();p.papel="Sem acesso";p.acesso="";salvar();fechar();render();toast(`${p.nome} não tem mais acesso.`) }
    catch(e){b.disabled=false;$("#rp-erro").textContent="Não foi possível remover: "+e.message+"."}
  };
}

/* ============ início ============ */
const lat=$("#lateral"),bm=$("#abrir-menu");
bm.onclick=()=>{const a=lat.classList.toggle("aberta");bm.setAttribute("aria-expanded",a)};
function fecharMenu(){lat.classList.remove("aberta");bm.setAttribute("aria-expanded",false)}
/* ============ BUSCA ============ */
function buscar(q){
  const n=t=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
  const b=n(q).trim(); if(b.length<2) return [];
  const tem=(...c)=>c.some(x=>n(x).includes(b));
  const g=[];
  const add=(tit,itens)=>{if(itens.length) g.push([tit,itens.slice(0,6)])};
  add("Clientes",S.clientes.filter(c=>tem(c.empresa,c.nome,c.email,c.cidade)).map(c=>[c.empresa,c.nome,`verCliente('${c.id}')`]));
  add("Pedidos",S.pedidos.filter(p=>tem(p.nome,p.email,p.negocio,p.servico)).map(p=>[p.nome,p.servico,`verPedido('${p.id}')`]));
  add("Orçamentos",S.orcamentos.filter(o=>tem(o.num,cli(o.cliente).empresa,...o.itens.map(i=>i.s))).map(o=>[`Nº ${o.num}`,cli(o.cliente).empresa,`abrirOrc('${o.id}')`]));
  add("Projetos",S.projetos.filter(p=>tem(p.titulo,cli(p.cliente).empresa)).map(p=>[p.titulo,`${cli(p.cliente).empresa} · ${p.etapa}`,`verProjeto('${p.id}')`]));
  add("Posts",(S.posts||[]).filter(p=>tem(p.tema,p.legenda)).map(p=>[p.tema,`${cli(p.cliente).empresa} · ${fmt(p.data)}`,`editarPost('${p.id}')`]));
  add("Portfólio do site",PF.filter(p=>tem(p.nome,p.descricao)).map(p=>[p.nome,p.descricao,`editarPF('${p.id}')`]));
  if(admin()) add("Caixa",S.caixa.filter(l=>tem(l.desc,l.cat)).map(l=>[l.desc,`${brl(l.valor)} · ${fmt(l.data)}`,`location.hash='caixa'`]));
  return g;
}
(function(){
  const inp=$("#busca"), res=$("#busca-res");
  const fecharB=()=>{res.hidden=true};
  inp.addEventListener("input",()=>{const g=buscar(inp.value);
    if(!inp.value.trim()){fecharB();return}
    res.innerHTML=g.length?g.map(([t,l])=>`<h3>${t}</h3>${l.map(([a,b,f])=>`<button type="button" data-f="${esc(f)}">${esc(a)}<small>${esc(b)}</small></button>`).join("")}`).join(""):`<p class="mut" style="padding:.5rem">Nada encontrado para “${esc(inp.value)}”.</p>`;
    res.hidden=false});
  res.addEventListener("click",e=>{const b=e.target.closest("button[data-f]");if(!b)return;fecharB();inp.value="";fecharMenu();new Function(b.dataset.f)()});
  inp.addEventListener("keydown",e=>{if(e.key==="Escape"){inp.value="";fecharB()}if(e.key==="ArrowDown"){const b=res.querySelector("button");if(b){e.preventDefault();b.focus()}}});
  res.addEventListener("keydown",e=>{const bs=[...res.querySelectorAll("button")],i=bs.indexOf(document.activeElement);
    if(e.key==="ArrowDown"&&i<bs.length-1){e.preventDefault();bs[i+1].focus()} if(e.key==="ArrowUp"){e.preventDefault();(i>0?bs[i-1]:inp).focus()} if(e.key==="Escape"){fecharB();inp.focus()}});
  document.addEventListener("click",e=>{if(!e.target.closest(".busca"))fecharB()});
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(innerWidth<=860){lat.classList.add("aberta");bm.setAttribute("aria-expanded",true)}inp.focus();inp.select()}});
})();
try{sessionStorage.setItem("lumara_equipe","1")}catch(e){}
NUVEM_ADMIN.antes&&NUVEM_ADMIN.antes(); carregar(); rota(); NUVEM_ADMIN.depois();
if(notas.length){const msg=notas.join(" ");setTimeout(()=>toast(msg),300);notas=[]}
