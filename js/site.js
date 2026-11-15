/* Conteúdo do site controlado pela área da equipe: textos, valores, etapas de trabalho,
   depoimentos, página de links e integrações. No site publicado vem do banco (/api/publico); sem servidor, fica no navegador (localStorage);
   no sistema final vira uma tabela de configurações no banco de dados. */
(function(){
  const CHAVE="lumara_site";
  const padrao={
    textos:{
      heroTxt:"",heroTitB:"Crio visuais que dão forma à *história* da *sua marca*",
      sobre1:"",sobre2:"",s1p:"",s1i:"",s2p:"",s2i:"",s3p:"",s3i:""
    },
    /* versões em inglês dos textos acima; vazio usa a tradução padrão do site */
    textosEn:{heroTitB:"",sobre1:"",sobre2:"",s1p:"",s1i:"",s2p:"",s2i:"",s3p:"",s3i:""},
    precos:{
      mostrar:false,
      identidade:{mostrar:true,valor:2500},
      social:{mostrar:true,pacotes:[
        {nome:"2 posts por semana",valor:900},
        {nome:"3 posts por semana",valor:1250},
        {nome:"5 posts por semana",valor:1900}
      ]},
      alinhamento:{mostrar:true,valor:1200}
    },
    processo:[
      {t:"Briefing e alinhamento",d:"Tudo começa com uma conversa para entender suas necessidades, ideias e expectativas. Quero conhecer melhor seu negócio, o que você deseja comunicar e quais são os objetivos do projeto. Assim, conseguimos estabelecer uma direção clara para o desenvolvimento do trabalho.",
       tEn:"Briefing and alignment",dEn:"It all starts with a conversation to understand your needs, ideas and expectations. I want to get to know your business, what you want to communicate and what the project's goals are. That way, we can set a clear direction for the work."},
      {t:"Pesquisa e criação",d:"Com as informações reunidas, começo a explorar possibilidades criativas. Pesquiso referências, analiso caminhos visuais e desenvolvo propostas alinhadas ao que foi definido inicialmente. É nessa etapa que as ideias começam a ganhar forma e se transformam em soluções visuais.",
       tEn:"Research and creation",dEn:"With the information gathered, I start exploring creative possibilities. I research references, analyze visual paths and develop proposals aligned with what we defined at the start. This is where ideas begin to take shape and turn into visual solutions."},
      {t:"Apresentação",d:"Apresento o trabalho desenvolvido, compartilhando as escolhas visuais e a proposta criativa por trás de cada solução. É o momento de visualizar o resultado, entender como os elementos se conectam e avaliar o projeto como um todo.",
       tEn:"Presentation",dEn:"I present the work, sharing the visual choices and the creative thinking behind each solution. It's the moment to see the result, understand how the elements connect and evaluate the project as a whole."},
      {t:"Finalização e entrega",d:"Após a aprovação, preparo os arquivos finais e organizo todo o material de acordo com as necessidades do projeto. Você recebe tudo pronto para utilizar, com as orientações necessárias para aplicar as soluções visuais no dia a dia.",
       tEn:"Final files and delivery",dEn:"Once approved, I prepare the final files and organize all the material according to the project's needs. You get everything ready to use, with the guidance you need to apply the visual solutions day to day."}
    ],

    depoimentos:[],
    links:[
      {titulo:"Solicitar orçamento",tituloEn:"Request a quote",url:"orcamento.html",destaque:true},
      {titulo:"Ver portfólio",tituloEn:"See portfolio",url:"index.html#trabalhos"},
      {titulo:"WhatsApp",url:"https://wa.me/5521989967803"}
    ],
    servicosAbertos:false,
    /* serviços do site, na ordem em que aparecem; "pedido" é o nome curto usado no formulário e no sistema.
       valor: "a partir de" para serviços novos (identidade, social e alinhamento usam os valores em precos) */
    servicos:[{"id": "identidade", "cor": "#3A6EA5", "pedido": "Identidade visual", "t": "Identidade visual", "tEn": "Visual identity", "p": "Dou rosto e jeito próprio para a sua marca. Crio um conjunto de elementos visuais, como logo, paleta de cores, tipografia e aplicações, que torna concretos os valores e atributos do seu negócio. Assim, as pessoas reconhecem você com mais facilidade e percebem mais valor no que você faz.", "pEn": "I give your brand its own face and personality. I create a set of visual elements, such as logo, color palette, typography and applications, that make your business's values and attributes tangible. That way, people recognize you more easily and see more value in what you do.", "i": "Ideal para quem quer construir uma marca com personalidade e se destacar com consistência.", "iEn": "Ideal if you want to build a brand with personality and stand out consistently.", "valor": 0}, {"id": "social", "cor": "#462D26", "pedido": "Social media", "t": "Design para social media", "tEn": "Social media design", "p": "Cuido de toda a parte visual das suas redes sociais: você me envia o conteúdo dos posts e eu cuido do design. Desenvolvo cada publicação para transmitir a essência da sua marca, com coerência visual e profissionalismo. Os pacotes são mensais, definidos pelo número de postagens por semana, e personalizados conforme a sua necessidade.", "pEn": "I take care of the whole visual side of your social media: you send me the post content and I handle the design. I craft each post to convey your brand's essence, with visual coherence and professionalism. Packages are monthly, based on the number of posts per week, and tailored to your needs.", "i": "Ideal para quem busca uma presença digital alinhada, consistente e com impacto visual.", "iEn": "Ideal if you want a digital presence that is aligned, consistent and visually striking.", "valor": 0}, {"id": "alinhamento", "cor": "#2D2D2D", "pedido": "Alinhamento visual", "t": "Alinhamento visual", "tEn": "Visual alignment", "p": "Alinho os principais pontos da sua comunicação visual para as redes sociais ou desenvolvo materiais pontuais, como apresentações e e-books. É uma solução enxuta para resolver um problema específico, sem precisar de uma identidade visual completa.", "pEn": "I align the key points of your visual communication for social media, or design one-off materials such as presentations and e-books. It's a lean solution to a specific problem, without needing a full visual identity.", "i": "Ideal para quem ainda não tem uma identidade definida ou tem dificuldade de aplicá-la no dia a dia.", "iEn": "Ideal if you don't have a defined identity yet or struggle to apply it day to day.", "valor": 0}],
    integracoes:{agenda:"https://calendar.app.google/gT5dsedECNeRG3ZG8",gateway:"InfinitePay",infiniteTag:"lumaradesign",descontoVista:5,email:"Google Workspace",whatsapp:{ativo:false,numero:"(21) 98996-7803"},
      nf:{codigo:"13.05.01",descricao:"Serviços de design gráfico: {servico}. Referente a {parcela}."}}
  };
  const clone=o=>JSON.parse(JSON.stringify(o));
  function mesclar(a,b){ // completa o salvo com campos novos do padrão
    if(Array.isArray(a)||typeof a!=="object"||a===null) return a;
    const r=Object.assign({},a);
    for(const k in b){ if(!(k in r)) r[k]=clone(b[k]); else if(b[k]&&typeof b[k]==="object"&&!Array.isArray(b[k])) r[k]=mesclar(r[k],b[k]); }
    return r;
  }
  function carregar(){
    try{const s=(window.NUVEM&&window.NUVEM.site)?JSON.parse(JSON.stringify(window.NUVEM.site)):JSON.parse(localStorage.getItem(CHAVE)); if(s&&typeof s==="object"){const r=mesclar(s,padrao);
      if(["Solicitar orçamento|Ver portfólio|Behance|LinkedIn|WhatsApp","Solicitar orçamento|Ver portfólio|WhatsApp|Behance|LinkedIn"].includes((r.links||[]).map(l=>l.titulo).join("|"))) r.links=clone(padrao.links); /* listas antigas de exemplo (sem Behance e LinkedIn desde nov/2026) */
      if((r.processo||[]).map(p=>p.t).join("|")==="Briefing|Criação|Apresentação e ajustes|Entrega") r.processo=clone(padrao.processo); /* texto antigo de exemplo */
      if(r.textos&&r.textos.heroTitB==="Crio visuais que dão forma à *história* da sua marca") r.textos.heroTitB=padrao.textos.heroTitB; /* destaque novo em "sua marca" */
      (r.processo||[]).forEach(p=>{const d=padrao.processo.find(x=>x.t===p.t);if(d&&p.tEn===undefined){p.tEn=d.tEn;p.dEn=p.d===d.d?d.dEn:""}});return r}}catch(e){}
    return clone(padrao);
  }
  function salvar(c){try{localStorage.setItem(CHAVE,JSON.stringify(c));return true}catch(e){return false}}
  function restaurar(){try{localStorage.removeItem(CHAVE)}catch(e){} return clone(padrao)}
  const brl=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
  window.SITE={carregar,salvar,restaurar,padrao,brl};
})();
