/* Dados de exemplo do protótipo, usados pela área da equipe e pelas páginas dos clientes
   (portal, proposta, contrato e recibo). Assim os links de exemplo funcionam mesmo abertos
   em outra aba ou em outro aparelho, onde a área da equipe ainda não foi aberta.
   No sistema final, estes dados vêm do banco de dados. */
(function(){
const HOJE=new Date(); HOJE.setHours(0,0,0,0);
const dia=n=>{const d=new Date(HOJE);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const uid=p=>p+Math.random().toString(36).slice(2,8);
function exemplo(){
  const equipe=[
    {id:"lumara",nome:"Lumara Silva",papel:"Administradora",cor:"#2E5E7A",acesso:"Tudo, incluindo caixa e valores"},
    {id:"bia",nome:"Bia Rocha",papel:"Designer",cor:"#2F6B4F",acesso:"Pedidos e projetos, sem valores e sem caixa"}
  ];
  const clientes=[
    {id:"c1",nome:"Ana Júlia Mendes",empresa:"Ana Júlia Psicologia",cidade:"Niterói - RJ",email:"contato@anajulia.psi.br",whats:"(21) 98877-1020",origem:"Instagram",desde:dia(-210)},
    {id:"c2",nome:"Juliana Carvalho",empresa:"Carvalho Advocacia",cidade:"Rio de Janeiro - RJ",email:"juliana@carvalhoadv.com.br",whats:"(21) 99654-3321",origem:"Indicação",desde:dia(-150)},
    {id:"c3",nome:"Rafael Souza",empresa:"AS Consultoria e Serviços",cidade:"Rio de Janeiro - RJ",email:"rafael@asconsultoria.com.br",whats:"(21) 97712-4455",origem:"LinkedIn",desde:dia(-95)},
    {id:"c4",nome:"Marina Guapi",empresa:"Guapi Parque das Águas",cidade:"Guapimirim - RJ",email:"marketing@guapiparque.com.br",whats:"(21) 99201-7788",origem:"Indicação",desde:dia(-60)},
    {id:"c5",nome:"Yin Takahashi",empresa:"Yin's Brasil",cidade:"São Paulo - SP",email:"yin@yinsbrasil.com",whats:"(11) 98123-4567",origem:"Pinterest",desde:dia(-30)},
    {id:"c6",nome:"Paula Leme",empresa:"Studio Leme Pilates",cidade:"Rio de Janeiro - RJ",email:"paula@studioleme.com.br",whats:"(21) 99330-2211",origem:"Instagram",desde:dia(-6)}
  ];
  const pedidos=[
    {id:"P1",status:"novo",recebido:dia(-1)+"T14:20:00",nome:"Caio Maré",email:"caio@cafemare.com.br",cidade:"Rio de Janeiro - RJ",contato:"WhatsApp",whatsapp:"(21) 98111-3030",
     negocio:"Café Maré, uma cafeteria de especialidade em Copacabana, aberta há 8 meses.",papel:"Fundador(a)",redes:"@cafemare.rio",tempo:"8 meses",porte:"Microempresa",servico:"Identidade visual",
     objetivos:"Abrimos com uma marca improvisada e agora queremos algo que combine com o ambiente e o público da praia.",trabalho:"Logo, cardápio, embalagens para viagem e sinalização da loja.",prazo:"Antes do verão, até meados de dezembro",refs:"pinterest.com/cafemare/referencias",imagens:["fachada.jpg","cardapio-atual.pdf"],origem:"Instagram"},
    {id:"P2",status:"novo",recebido:dia(0)+"T09:05:00",nome:"Helena Duarte",email:"helena@duartenutri.com",cidade:"Belo Horizonte - MG",contato:"E-mail",whatsapp:"",
     negocio:"Consultório de nutrição esportiva.",papel:"Fundador(a)",redes:"@helenaduarte.nutri",tempo:"3 anos",porte:"MEI",servico:"Social media",
     objetivos:"Quero que o Instagram passe a trazer pacientes e pareça mais profissional.",trabalho:"Templates para posts e stories. Já tenho logo, mas não tenho manual.",prazo:"Sem pressa",refs:"",imagens:[],origem:"Pinterest"},
    {id:"P3",status:"enviado",orc:"O14",cliente:"c6",recebido:dia(-6)+"T11:00:00",nome:"Paula Leme",email:"paula@studioleme.com.br",cidade:"Rio de Janeiro - RJ",contato:"WhatsApp",whatsapp:"(21) 99330-2211",
     negocio:"Studio Leme Pilates, estúdio de pilates no Leme.",papel:"Sócio(a)",redes:"@studiolemepilates",tempo:"2 anos",porte:"Microempresa",servico:"Identidade visual",
     objetivos:"Vamos abrir a segunda unidade e queremos renovar a marca.",trabalho:"Logo, papelaria e fachada.",prazo:"Janeiro",refs:"",imagens:[],origem:"Instagram"}
  ];
  const orcamentos=[
    {id:"O14",num:"2026-014",cliente:"c6",pedido:"P3",status:"enviado",criado:dia(-5),validade:15,prazoEntrega:"6 semanas",pagamento:"50% na aprovação e 50% na entrega",
     itens:[{s:"Identidade visual completa",d:"Pesquisa, conceito, logotipo e variações, paleta, tipografia e manual de marca",v:4200},{s:"Papelaria",d:"Cartão de visita, papel timbrado e assinatura de e-mail",v:900},{s:"Projeto de fachada",d:"Arte final para a fachada da nova unidade",v:800}],
     obs:"Inclui duas rodadas de ajustes. Arquivos finais em AI, PDF, PNG e SVG."},
    {id:"O13",num:"2026-013",cliente:"c5",status:"aprovado",criado:dia(-28),aprovadoEm:dia(-24),contrato:{status:"assinado",assinatura:{nome:"Yin Takahashi (Yin's Brasil Comércio Ltda.)",doc:"12.345.678/0001-90",endereco:"Rua Augusta, 1500, São Paulo – SP",quando:new Date(Date.now()-23*864e5).toISOString()}},validade:15,prazoEntrega:"5 semanas",pagamento:"50% na aprovação e 50% na entrega",
     itens:[{s:"Editorial Coleção 2026",d:"Lookbook de 32 páginas, diagramação e tratamento de imagens",v:5600}],obs:""},
    {id:"O12",num:"2026-012",cliente:"c4",status:"aprovado",criado:dia(-58),aprovadoEm:dia(-55),contrato:{status:"assinado",assinatura:{nome:"Guapi Parque das Águas Ltda.",doc:"98.765.432/0001-10",endereco:"Estrada do Parque, 200, Guapimirim – RJ",quando:new Date(Date.now()-54*864e5).toISOString()}},validade:15,prazoEntrega:"Mensal",pagamento:"Mensal, todo dia 10",
     itens:[{s:"Social media mensal",d:"12 posts e 8 stories por mês, com calendário editorial",v:1800}],obs:"Contrato de 6 meses."},
    {id:"O11",num:"2026-011",cliente:"c3",status:"recusado",criado:dia(-80),validade:15,prazoEntrega:"4 semanas",pagamento:"À vista",
     itens:[{s:"Site institucional",d:"Layout de 5 páginas no Figma",v:3800}],obs:""}
  ];
  const projetos=[
    {id:"J1",orc:"O13",titulo:"Lookbook Coleção 2026",cliente:"c5",servico:"Editorial",etapa:"Criação",prazo:dia(9),resp:"lumara",valor:5600,check:[["Seleção de fotos",1],["Grid e diagramação",1],["Tratamento de imagens",0],["Textos finais",0]]},
    {id:"J2",orc:"O12",titulo:"Social media do mês",cliente:"c4",servico:"Social media",etapa:"Ajustes",prazo:dia(2),resp:"bia",valor:1800,check:[["Calendário",1],["Posts 1 a 6",1],["Posts 7 a 12",1],["Stories",0]],etiquetas:["cliente"],
     comentarios:[{autor:"bia",texto:"Calendário aprovado na reunião. Faltam os stories da campanha de férias.",quando:new Date(Date.now()-2*864e5).toISOString()}]},
    {id:"J3",orc:"O12",titulo:"Social media do próximo mês",cliente:"c4",servico:"Social media",etapa:"Briefing",prazo:dia(24),resp:"bia",valor:1800,check:[["Reunião de pauta",0],["Calendário",0]]},
    {id:"J4",titulo:"Rebranding Carvalho Advocacia",cliente:"c2",servico:"Identidade visual",etapa:"Apresentação",prazo:dia(4),resp:"lumara",valor:4800,check:[["Pesquisa",1],["Conceitos",1],["Apresentação montada",1],["Reunião com cliente",0]],etiquetas:["urgente","cliente"],
     entregas:[{id:"e1",tipo:"aprovacao",titulo:"Proposta de logotipo",img:"img/projetos/as-consultoria/02.webp",status:"aguardando"},{id:"e2",tipo:"aprovacao",titulo:"Paleta e tipografia",img:"img/projetos/as-consultoria/05.webp",status:"aguardando"}],
     comentarios:[{autor:"lumara",texto:"Apresentação enviada pelo portal. Juliana pediu para ver até sexta.",quando:new Date(Date.now()-864e5).toISOString()}],anexos:[{nome:"briefing-carvalho.pdf",src:""}]},
    {id:"J5",titulo:"Templates de Instagram",cliente:"c2",servico:"Social media",etapa:"Briefing",prazo:dia(30),resp:"lumara",valor:1500,check:[]},
    {id:"J6",titulo:"Manual de marca",cliente:"c1",servico:"Identidade visual",etapa:"Entrega final",prazo:dia(-1),resp:"lumara",valor:3900,check:[["Manual em PDF",1],["Pacote de arquivos",1],["Envio ao cliente",0]],etiquetas:["revisao"],
     entregas:[{id:"e3",tipo:"aprovacao",titulo:"Manual de marca, versão final",img:"img/projetos/ana-julia/03.webp",status:"aprovado"},{id:"e4",tipo:"final",titulo:"Pacote de logotipos (AI, SVG, PNG)",url:"https://drive.google.com/",status:"ok"},{id:"e5",tipo:"final",titulo:"Manual de marca em PDF",url:"https://drive.google.com/",status:"ok"}]},
    {id:"J7",titulo:"Cartões e papelaria",cliente:"c1",servico:"Identidade visual",etapa:"Concluído",prazo:dia(-20),resp:"bia",valor:700,check:[["Arte final",1],["Envio à gráfica",1]]}
  ];
  const L=(desc,tipo,cat,valor,data,pago,cliente)=>({id:uid("L"),desc,tipo,cat,valor,data,pago,cliente});
  const caixa=[];
  // histórico de 6 meses
  for(let m=5;m>=1;m--){
    const b=new Date(HOJE.getFullYear(),HOJE.getMonth()-m,1), iso=d=>new Date(b.getFullYear(),b.getMonth(),d).toISOString().slice(0,10);
    caixa.push(L("Projetos do mês","entrada","Projeto",[5200,6100,4300,7400,6800][5-m],iso(12),true));
    if(m<=2) caixa.push(L("Guapi Parque das Águas, social media do mês (Pix)","entrada","Social media mensal",1800,iso(10),true,"c4"));
    caixa.push(L("Adobe Creative Cloud","saida","Ferramentas e assinaturas",124,iso(5),true));
    caixa.push(L("Figma Professional","saida","Ferramentas e assinaturas",75,iso(5),true));
    caixa.push(L("DAS MEI","saida","Impostos (DAS)",81,iso(20),true));
    caixa.push(L("Freelancer de apoio","saida","Freelancers",[0,600,0,900,800][5-m],iso(25),true));
  }
  const mi=d=>new Date(HOJE.getFullYear(),HOJE.getMonth(),d).toISOString().slice(0,10);
  caixa.push(
    Object.assign(L("Yin's Brasil, 1ª parcela (50%) (Pix)","entrada","Projeto",2800,mi(3),true,"c5"),{orc:"O13"}),
    L("Social media Guapi, novembro","entrada","Social media mensal",1800,mi(10),true,"c4"),
    L("Carvalho Advocacia, 1ª parcela","entrada","Projeto",2400,mi(6),true,"c2"),
    Object.assign(L("Ana Júlia Psicologia, parcela final do manual","entrada","Projeto",1950,dia(3),false,"c1"),{projeto:"J6"}),
    Object.assign(L("Yin's Brasil, 2ª parcela (50%)","entrada","Projeto",2800,dia(12),false,"c5"),{orc:"O13"}),
    L("Carvalho Advocacia, 2ª parcela","entrada","Projeto",2400,dia(18),false,"c2"),
    L("Adobe Creative Cloud","saida","Ferramentas e assinaturas",124,mi(5),true),
    L("Figma Professional","saida","Ferramentas e assinaturas",75,mi(5),true),
    L("Banco de fontes (licença)","saida","Banco de imagens e fontes",210,mi(8),true),
    L("DAS MEI","saida","Impostos (DAS)",81,mi(20),HOJE.getDate()>20),
    L("Bia Rocha, freelance novembro","saida","Freelancers",1200,dia(5),false),
    L("Impulsionamento Instagram","saida","Marketing",150,dia(-2),false)
  );
  /* calendário editorial do Guapi: posts do mês em várias etapas */
  const P=(d,formato,tema,legenda,status)=>({id:uid("pt"),cliente:"c4",projeto:"J2",data:dia(d),formato,tema,legenda,status,resp:"bia"});
  const posts=[
    P(-9,"Feed","Abertura da temporada","A temporada de verão começou! Escorregas, piscina de ondas e muita diversão para toda a família.","publicado"),
    P(-6,"Reels","Bastidores da manutenção","","publicado"),
    P(-2,"Stories","Enquete: qual o melhor brinquedo?","","publicado"),
    P(1,"Carrossel","5 dicas para curtir o parque","Protetor solar, chegar cedo, levar boia de braço para os pequenos e mais. Salve para a próxima visita!","aprovacao"),
    P(3,"Feed","Promoção de aniversariante","Aniversariante do mês não paga entrada! Apresente um documento na bilheteria.","aprovacao"),
    P(5,"Stories","Cardápio da lanchonete","","producao"),
    P(8,"Reels","Tobogã novo","","producao"),
    P(12,"Feed","Férias escolares","","ideia"),
    P(15,"Carrossel","Pacotes para grupos e escolas","","ideia")
  ];
  let nfn=31; caixa.forEach(l=>{if(l.tipo==="entrada"&&l.pago&&l.cliente&&!/Yin's Brasil, 1ª|Carvalho Advocacia, 1ª/.test(l.desc)) l.nf={status:"emitida",numero:String(nfn++),url:"",quando:l.data}});
  return {v:4,equipe,clientes,pedidos,orcamentos,projetos,caixa,posts,seq:15};
}

function catalogoPadrao(){return [
  {id:"sv1",nome:"Identidade visual completa",valor:4200,descricao:"Pesquisa, conceito, logotipo e variações, paleta, tipografia e manual de marca"},
  {id:"sv2",nome:"Papelaria",valor:900,descricao:"Cartão de visita, papel timbrado e assinatura de e-mail"},
  {id:"sv3",nome:"Alinhamento visual",valor:1200,descricao:"Ajuste dos principais pontos da comunicação visual para as redes sociais"},
  {id:"sv4",nome:"Social media: 2 posts por semana",valor:900,descricao:"8 posts e stories por mês, com calendário editorial"},
  {id:"sv5",nome:"Social media: 3 posts por semana",valor:1250,descricao:"12 posts e stories por mês, com calendário editorial"},
  {id:"sv6",nome:"Apresentação ou e-book",valor:800,descricao:"Diagramação de até 20 páginas a partir do conteúdo enviado"},
  {id:"sv7",nome:"Rodada extra de ajustes",valor:300,descricao:"Uma rodada de ajustes além das duas incluídas"}
]}
function emailsPadrao(){return {
  modelos:{
    recebido:{nome:"Pedido recebido",quando:"Assim que alguém envia o formulário de orçamento",ativo:true,whats:false,assunto:"Recebi seu pedido de orçamento",corpo:"Oi, {nome}!\n\nRecebi suas respostas e em até 2 dias úteis envio o seu orçamento para este e-mail.\n\nObrigada pelo contato,\nLumara"},
    enviado:{nome:"Orçamento enviado",quando:"Quando você marca o orçamento como enviado",ativo:true,whats:true,assunto:"Seu orçamento está pronto",corpo:"Oi, {nome}!\n\nSeu orçamento nº {numero} está pronto. Pelo link abaixo você vê os detalhes, aprova e paga a entrada:\n{link}\n\nA proposta vale até {validade}.\n\nLumara"},
    lembrete:{nome:"Lembrete de validade",quando:"2 dias antes de uma proposta enviada vencer",ativo:true,whats:false,assunto:"Sua proposta vence em 2 dias",corpo:"Oi, {nome}!\n\nPassando para lembrar que a proposta nº {numero} vale até {validade}. Se tiver qualquer dúvida, é só responder este e-mail.\n{link}\n\nLumara"},
    pago:{nome:"Pagamento confirmado",quando:"Quando o pagamento da entrada é confirmado",ativo:true,whats:true,assunto:"Pagamento confirmado, vamos começar!",corpo:"Oi, {nome}!\n\nRecebi o pagamento, muito obrigada. Os próximos passos são assinar o contrato e escolher o horário da reunião de briefing:\n{agenda}\n\nVocê acompanha o projeto por aqui: {portal}\n\nLumara"},
    contrato:{nome:"Contrato para assinar",quando:"Quando a proposta é aprovada",ativo:true,whats:false,assunto:"Seu contrato está pronto para assinar",corpo:"Oi, {nome}!\n\nO contrato do projeto já está pronto. Leia com calma e assine pelo link:\n{link}\n\nQualquer dúvida, é só responder este e-mail.\n\nLumara"},
    arte:{nome:"Arte para aprovar",quando:"Quando você envia uma arte para aprovação no portal",ativo:true,whats:true,assunto:"Tem arte nova para você aprovar",corpo:"Oi, {nome}!\n\nEnviei \"{projeto}\" para a sua aprovação. É só abrir o portal, aprovar ou pedir ajustes:\n{portal}\n\nLumara"},
    cobranca:{nome:"Parcela a vencer",quando:"3 dias antes do vencimento de uma parcela",ativo:true,whats:true,assunto:"Sua parcela vence em {vencimento}",corpo:"Oi, {nome}!\n\nA parcela de {valor} referente a {descricao} vence em {vencimento}. Você paga por Pix ou cartão pelo portal:\n{portal}\n\nObrigada,\nLumara"},
    atraso:{nome:"Parcela em atraso",quando:"No dia seguinte ao vencimento de uma parcela não paga",ativo:true,whats:true,assunto:"Parcela em aberto",corpo:"Oi, {nome}!\n\nNão identifiquei o pagamento da parcela de {valor}, que venceu em {vencimento}. Se já pagou, pode desconsiderar. Se não, o link para pagar está aqui:\n{portal}\n\nLumara"},
    depoimento:{nome:"Pedido de depoimento",quando:"Quando um projeto vai para Concluído",ativo:true,whats:false,assunto:"Como foi trabalhar comigo?",corpo:"Oi, {nome}!\n\nFoi muito bom criar o projeto {projeto} com você. Se puder, responda este e-mail com duas ou três frases sobre como foi a experiência. Com a sua autorização, ele pode aparecer no meu site.\n\nLumara"}
  },
  historico:[]
}}

function completo(){const S=exemplo();S.emails=emailsPadrao();S.catalogo=catalogoPadrao();return S}
window.EXEMPLO={exemplo,emailsPadrao,catalogoPadrao,completo};
})();
