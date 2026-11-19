/* Portfólio compartilhado entre o site, as páginas de projeto e a área da equipe.
   No site publicado os dados vêm do banco (/api/publico); sem servidor, ficam no navegador. Esta
   mesma estrutura vira uma tabela no banco de dados e as imagens vão para o armazenamento.
   texto/textoEn: parágrafos separados por uma linha em branco. links: botões extras na página do projeto. */
/* corrige endereços digitados sem https:// (ex.: bio.site/lumarasilva) e links antigos do próprio site */
window.urlLimpa=window.urlLimpa||function(u){u=String(u||"").trim();if(!u)return u;
  if(/^(https?:|mailto:|tel:|#)/i.test(u)) return u.replace(/^http:\/\/(www\.)?lumarasilva\.com\.br/i,"https://lumarasilva.com.br");
  const s=u.replace(/^(\.\.\/|\.\/|\/)/,"");
  if(/^index\.html#trabalhos$/i.test(s)) return "/#projetos";
  if(/^index\.html(#.*)?$/i.test(s)) return "/"+(s.split("#")[1]?"#"+s.split("#")[1]:"");
  if(/^(orcamento|privacidade|links)\.html/i.test(s)) return "/"+s.replace(/\.html/i,"");
  if(/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|\?|$)/i.test(s)&&!/^[^/]+\.html?\b/i.test(s)) return "https://"+s;
  return u;};
(function(){
  const CHAVE="lumara_portfolio_v4"; /* v4: Guapi publicado com o material completo */
  const AREAS={
    identidade:{pt:"Identidade visual",en:"Visual identity"},
    social:{pt:"Social media",en:"Social media"},
    outros:{pt:"Design",en:"Design"}
  };
  const padrao=[
 {
  "nome": "Ana Júlia",
  "descricao": "Psicóloga e neuropsicóloga",
  "descricaoEn": "Psychologist and neuropsychologist",
  "area": "identidade",
  "cor": "#3A6EA5",
  "grade": 1,
  "ano": "2026",
  "slug": "ana-julia",
  "texto": "A psicologia no ambiente digital vive um momento de expansão acelerada, e o público, cada vez mais informado, busca mais do que um profissional: quer alguém em quem possa confiar e se sentir confortável. Nesse cenário, a diferenciação vem da especialidade técnica, mas também da forma como a profissional se apresenta e se comunica. Ana Júlia ocupa um espaço único: une rigor técnico, com formação em TCC e Neuropsicologia, a uma presença genuinamente acolhedora, atendendo crianças, adolescentes e adultos com o mesmo cuidado.\n\nA identidade visual foi construída a partir de quatro pilares que refletem quem ela é: acolhedora, empática, cuidadosa e moderna. Não são atributos criados para o mercado, mas características reais que agora ganham forma e consistência em cada escolha visual e verbal. O conceito central é o de uma psicóloga presente de verdade, que acompanha o paciente no processo, guia sem impor e cuida com método e humanidade.",
  "textoEn": "Psychology in the digital space is expanding rapidly, and an increasingly informed public is looking for more than just a professional: they want someone they can trust and feel comfortable with. In this landscape, differentiation comes from technical expertise, but also from the way professionals present themselves and communicate. Ana Júlia occupies a unique space: she combines technical rigor, with training in CBT and Neuropsychology, with a genuinely welcoming presence, caring for children, teens, and adults with the same level of attention.\n\nThe visual identity was built on four pillars that reflect who she is: welcoming, empathetic, caring, and modern. These are not attributes created for the market, but real traits that now take shape and consistency in every visual and verbal choice. The core concept is that of a psychologist who is truly present, who walks alongside the patient throughout the process, guides without imposing, and cares with both method and humanity.",
  "capa": "img/projetos/ana-julia/capa.webp",
  "galeria": [
   "img/projetos/ana-julia/01.webp",
   "img/projetos/ana-julia/02.webp",
   "img/projetos/ana-julia/03.webp",
   "img/projetos/ana-julia/04.webp",
   "img/projetos/ana-julia/05.webp",
   "img/projetos/ana-julia/06.webp",
   "img/projetos/ana-julia/07.webp",
   "img/projetos/ana-julia/08.webp",
   "img/projetos/ana-julia/09.webp",
   "img/projetos/ana-julia/10.webp",
   "img/projetos/ana-julia/11.webp",
   "img/projetos/ana-julia/12.webp",
   "img/projetos/ana-julia/13.webp"
  ],
  "compartilhar": "img/projetos/ana-julia/compartilhar.jpg"
 },
 {
  "nome": "AS Consultoria",
  "descricao": "Recrutamento e seleção",
  "descricaoEn": "Recruitment and selection",
  "area": "identidade",
  "cor": "#2D2D2D",
  "grade": 1,
  "ano": "2026",
  "slug": "as-consultoria",
  "texto": "A AS Consultoria e Serviços é uma empresa especializada em recrutamento e seleção, conectando talentos às necessidades estratégicas de empresas. Sua atuação é focada em processos seletivos estruturados, com análise de perfil, triagem qualificada e acompanhamento do processo de contratação.\n\nA identidade visual foi desenvolvida para transmitir profissionalismo, confiança e organização, valores essenciais no setor de recursos humanos. A construção gráfica utiliza formas sólidas, tipografia moderna e uma paleta equilibrada, reforçando a ideia de conexão entre empresas e talentos, além de comunicar credibilidade e eficiência nos serviços prestados.",
  "textoEn": "AS Consultoria e Serviços is a company specialized in recruitment and selection, connecting talent with the strategic needs of businesses. Its work focuses on structured hiring processes, including profile analysis, qualified screening, and support throughout the recruitment process.\n\nThe visual identity was designed to convey professionalism, trust, and organization, key values within the human resources sector. The graphic construction combines solid shapes, modern typography, and a balanced color palette, reinforcing the idea of connecting companies and talent, while communicating credibility and efficiency in the services provided.",
  "capa": "img/projetos/as-consultoria/capa.webp",
  "galeria": [
   "img/projetos/as-consultoria/01.webp",
   "img/projetos/as-consultoria/02.webp",
   "img/projetos/as-consultoria/03.webp",
   "img/projetos/as-consultoria/04.webp",
   "img/projetos/as-consultoria/05.webp",
   "img/projetos/as-consultoria/06.webp",
   "img/projetos/as-consultoria/07.webp",
   "img/projetos/as-consultoria/08.webp",
   "img/projetos/as-consultoria/09.webp",
   "img/projetos/as-consultoria/10.webp",
   "img/projetos/as-consultoria/11.webp",
   "img/projetos/as-consultoria/12.webp",
   "img/projetos/as-consultoria/13.webp",
   "img/projetos/as-consultoria/14.webp"
  ],
  "compartilhar": "img/projetos/as-consultoria/compartilhar.jpg"
 },
 {
  "nome": "Juliana Carvalho",
  "descricao": "Advogada",
  "descricaoEn": "Lawyer",
  "area": "social",
  "cor": "#23446A",
  "grade": 3,
  "ano": "2026",
  "slug": "juliana-carvalho",
  "texto": "O projeto teve como foco profissionalizar a presença digital de Juliana Carvalho, desenvolvendo uma comunicação visual mais consistente, organizada e alinhada à sua atuação profissional.\n\nA proposta foi estabelecer uma identidade visual para os conteúdos, criando unidade entre as publicações e tornando a comunicação mais reconhecível. A combinação de cores, tipografia, fotografias e elementos gráficos constrói uma linguagem que equilibra profissionalismo e proximidade. O resultado é uma comunicação mais coesa, que fortalece a presença digital e contribui para transmitir confiança e credibilidade ao público.",
  "textoEn": "The project focused on professionalizing Juliana Carvalho’s digital presence by developing a more consistent, organized visual communication aligned with her professional practice.\n\nThe goal was to establish a cohesive visual language across her content, creating unity between publications and making her communication more recognizable. The combination of colors, typography, photography, and graphic elements creates a visual identity that balances professionalism and approachability. The result is a more cohesive digital presence that strengthens her professional image and helps communicate trust and credibility to her audience.",
  "capa": "img/projetos/juliana-carvalho/capa.webp",
  "galeria": [
   "img/projetos/juliana-carvalho/01.webp",
   "img/projetos/juliana-carvalho/02.webp",
   "img/projetos/juliana-carvalho/03.webp",
   "img/projetos/juliana-carvalho/04.webp",
   "img/projetos/juliana-carvalho/05.webp",
   "img/projetos/juliana-carvalho/06.webp",
   "img/projetos/juliana-carvalho/07.webp",
   "img/projetos/juliana-carvalho/08.webp",
   "img/projetos/juliana-carvalho/09.webp",
   "img/projetos/juliana-carvalho/10.webp",
   "img/projetos/juliana-carvalho/11.webp",
   "img/projetos/juliana-carvalho/12.webp",
   "img/projetos/juliana-carvalho/13.webp",
   "img/projetos/juliana-carvalho/14.webp",
   "img/projetos/juliana-carvalho/15.webp"
  ],
  "compartilhar": "img/projetos/juliana-carvalho/compartilhar.jpg"
 },
 {
  "nome": "Guapi Parque das Águas",
  "descricao": "Parque aquático",
  "descricaoEn": "Water park",
  "area": "social",
  "cor": "#86BBD8",
  "grade": 3,
  "ano": "2026",
  "slug": "guapi-parque-das-aguas",
  "publicado": true,
  "texto": "O Guapi Parque das Águas é um dos maiores parques aquáticos do estado do Rio de Janeiro, com 50 mil metros quadrados. No projeto, fui responsável por adaptar a identidade visual para os canais digitais da marca. A identidade é divertida, colorida e dinâmica, e meu trabalho foi garantir que essa linguagem funcionasse bem em diferentes formatos.\n\nDesenvolvo artes para redes sociais e campanhas especiais, além da adaptação de banners para o site nos formatos desktop e mobile. O foco foi manter consistência visual, boa leitura e alinhamento com a proposta da marca em todos os pontos de contato.",
  "textoEn": "Guapi Parque das Águas is one of the largest water parks in Rio de Janeiro state, spanning 50,000 square meters. In this project, I adapted the brand’s visual identity for its digital channels, ensuring a fun, colorful, and dynamic language across multiple formats.\n\nMy work includes creating social media visuals and special campaign materials, as well as adapting website banners for both desktop and mobile. The goal is to maintain visual consistency, clarity, and alignment with the brand’s overall concept across all touchpoints.",
  "capa": "img/projetos/guapi-parque-das-aguas/capa.webp",
  "compartilhar": "img/projetos/guapi-parque-das-aguas/compartilhar.jpg",
  "galeria": [
   "img/projetos/guapi-parque-das-aguas/01.webp",
   "img/projetos/guapi-parque-das-aguas/02.webp",
   "img/projetos/guapi-parque-das-aguas/03.webp",
   "img/projetos/guapi-parque-das-aguas/04.webp",
   "img/projetos/guapi-parque-das-aguas/05.webp",
   "img/projetos/guapi-parque-das-aguas/06.webp",
   "img/projetos/guapi-parque-das-aguas/07.webp",
   "img/projetos/guapi-parque-das-aguas/08.webp",
   "img/projetos/guapi-parque-das-aguas/09.webp",
   "img/projetos/guapi-parque-das-aguas/10.webp",
   "img/projetos/guapi-parque-das-aguas/11.webp",
   "img/projetos/guapi-parque-das-aguas/12.webp",
   "img/projetos/guapi-parque-das-aguas/13.webp",
   "img/projetos/guapi-parque-das-aguas/14.webp",
   "img/projetos/guapi-parque-das-aguas/15.webp",
   "img/projetos/guapi-parque-das-aguas/16.webp",
   "img/projetos/guapi-parque-das-aguas/17.webp",
   "img/projetos/guapi-parque-das-aguas/18.webp",
   "img/projetos/guapi-parque-das-aguas/19.webp",
   "img/projetos/guapi-parque-das-aguas/20.webp",
   "img/projetos/guapi-parque-das-aguas/21.webp",
   "img/projetos/guapi-parque-das-aguas/22.webp",
   "img/projetos/guapi-parque-das-aguas/23.webp",
   "img/projetos/guapi-parque-das-aguas/24.webp",
   "img/projetos/guapi-parque-das-aguas/25.webp",
   "img/projetos/guapi-parque-das-aguas/26.webp",
   "img/projetos/guapi-parque-das-aguas/27.webp",
   "img/projetos/guapi-parque-das-aguas/28.webp",
   "img/projetos/guapi-parque-das-aguas/29.webp",
   "img/projetos/guapi-parque-das-aguas/30.webp",
   "img/projetos/guapi-parque-das-aguas/31.webp",
   "img/projetos/guapi-parque-das-aguas/32.webp",
   "img/projetos/guapi-parque-das-aguas/33.webp",
   "img/projetos/guapi-parque-das-aguas/34.webp",
   "img/projetos/guapi-parque-das-aguas/35.webp",
   "img/projetos/guapi-parque-das-aguas/36.webp",
   "img/projetos/guapi-parque-das-aguas/37.webp",
   "img/projetos/guapi-parque-das-aguas/38.webp",
   "img/projetos/guapi-parque-das-aguas/39.webp"
  ],
  "linhas": [
   1,
   4,
   3,
   5,
   2,
   4,
   3,
   2,
   1,
   4,
   3,
   1,
   2,
   2,
   2
  ],
  "proporcao": "original"
 },
 {
  "nome": "Yin's Brasil",
  "descricao": "Catálogo da coleção 2026",
  "descricaoEn": "2026 collection catalog",
  "area": "outros",
  "cor": "#86BBD8",
  "grade": 1,
  "ano": "2025",
  "slug": "yin-s-brasil",
  "texto": "O catálogo da Coleção 2026 da Yin’s Brasil recebeu uma identidade visual vibrante e lúdica, refletindo o universo dinâmico e colorido dos produtos. O projeto gráfico, que inclui criação de capa, paleta cromática, elementos visuais, diagramação e tratamento de imagens, foi pensado para transmitir alegria e modernidade, mantendo a organização e clareza das informações.\n\nO principal desafio foi harmonizar a diversidade de linhas, desde a linha baby, com estampas divertidas e materiais interativos, até as linhas casual, esportiva e executiva, sob uma mesma narrativa visual. A solução utilizou cores vibrantes e uma diagramação fluida, resultando em um material atrativo e funcional, que guia o cliente de maneira intuitiva pelas diferentes categorias de mochilas, estojos, lancheiras e acessórios.",
  "textoEn": "The 2026 Collection Catalog for Yin’s Brasil received a vibrant and playful visual identity, reflecting the dynamic and colorful universe of the products. The graphic project, which included the creation of the cover, color palette, visual elements, layout design, and image editing, was designed to convey joy and modernity while ensuring clarity and organization of information.\n\nThe main challenge was to harmonize the diversity of product lines, from the baby line, with fun prints and interactive materials, to the casual, sports, and executive lines, under a single visual narrative. The solution combined vibrant colors with a fluid layout, resulting in an attractive and functional material that intuitively guides the customer through the different categories of backpacks, pencil cases, lunch bags, and accessories.",
  "capa": "img/projetos/yin-s-brasil/capa.webp",
  "galeria": [
   "img/projetos/yin-s-brasil/01.webp",
   "img/projetos/yin-s-brasil/02.webp",
   "img/projetos/yin-s-brasil/03.webp",
   "img/projetos/yin-s-brasil/04.webp",
   "img/projetos/yin-s-brasil/05.webp",
   "img/projetos/yin-s-brasil/06.webp"
  ],
  "compartilhar": "img/projetos/yin-s-brasil/compartilhar.jpg"
 },
 {
  "nome": "Anasol",
  "descricao": "Rebranding de protetores solares",
  "descricaoEn": "Sun care rebranding",
  "area": "identidade",
  "cor": "#86BBD8",
  "grade": 1,
  "ano": "2024",
  "slug": "anasol",
  "texto": "A Anasol faz parte do grupo brasileiro Dahuer e oferece linhas completas de protetores solares, bronzeadores, produtos pós-sol e dermocosméticos. Há mais de três décadas, a Anasol tem sido uma referência confiável no mercado de proteção solar, oferecendo soluções inovadoras, modernas e especializadas para a pele brasileira e para todos os que buscam desfrutar do clima tropical com segurança e estilo.\n\nO objetivo com o rebranding é modernizar a identidade da Anasol e expressar sua essência, ressaltando seus valores, aumentando o reconhecimento da marca e posicionando-a como a marca ideal para o dia a dia dos brasileiros. Tendo em vista que a marca oferece mais do que apenas protetores solares, o objetivo do redesign é desvincular a imagem da Anasol exclusivamente desses produtos e mostrar que seus produtos são essenciais para o cotidiano. A nova identidade visual facilitou a comunicação e a memorização do seu público alvo, transmitindo uma mensagem leve, alegre, simples, brasileira e acessível.\n\nFoi desenvolvido a pesquisa de marca, criação de conceito, atributos da marca, pesquisa de público alvo e manual da marca com os seus desdobramentos.\n\nEsse projeto é acadêmico e foi realizado para a conclusão do bloco Identidade Visual do Instituto Infnet - ECDD.",
  "textoEn": "Anasol is part of the Brazilian group Dahuer and offers complete lines of sunscreens, tanning products, after-sun care, and dermocosmetics. For over three decades, Anasol has been a trusted reference in the sun protection market, delivering innovative, modern, and specialized solutions for Brazilian skin and for everyone who wants to enjoy the tropical climate with safety and style.\n\nThe goal of the rebranding is to modernize Anasol’s identity and express its essence by highlighting its values, increasing brand recognition, and positioning it as the ideal brand for Brazilians’ everyday lives. Since the brand offers more than just sunscreens, the redesign aims to move away from associating Anasol exclusively with these products and to show that its products are essential for daily use. The new visual identity made communication with the target audience clearer and more memorable, conveying a message that is light, cheerful, simple, Brazilian, and accessible.\n\nThe project involved brand research, concept development, brand attributes, target audience research, and a brand guidelines manual with its applications.\n\nThis is an academic project developed to complete the Visual Identity module at Instituto Infnet – ECDD.",
  "capa": "img/projetos/anasol/capa.webp",
  "galeria": [
   "img/projetos/anasol/01.webp",
   "img/projetos/anasol/02.webp",
   "img/projetos/anasol/03.webp",
   "img/projetos/anasol/04.webp",
   "img/projetos/anasol/05.webp",
   "img/projetos/anasol/06.webp",
   "img/projetos/anasol/07.webp",
   "img/projetos/anasol/08.webp",
   "img/projetos/anasol/09.webp",
   "img/projetos/anasol/10.webp",
   "img/projetos/anasol/11.webp",
   "img/projetos/anasol/12.webp",
   "img/projetos/anasol/13.webp",
   "img/projetos/anasol/14.webp",
   "img/projetos/anasol/15.webp",
   "img/projetos/anasol/16.webp"
  ],
  "compartilhar": "img/projetos/anasol/compartilhar.jpg"
 },
 {
  "nome": "NKCom",
  "descricao": "Redesign de site",
  "descricaoEn": "Website redesign",
  "area": "outros",
  "cor": "#3A6EA5",
  "grade": 1,
  "ano": "2024",
  "slug": "nkcom",
  "links": [
   {
    "t": "Acesse o protótipo interativo",
    "tEn": "Open the interactive prototype",
    "url": "https://www.figma.com/proto/NtK7VkgijcOahES2XgvnTa/NkCom-%257C-Website-Redesign?page-id=0%253A1&node-id=383-957&viewport=-1025%252C467%252C0.05&t=Zgf3LMKjmq1KnamD-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=383%253A957&show-proto-sidebar=1"
   },
   {
    "t": "Visualize o projeto completo",
    "tEn": "View the full project",
    "url": "https://www.canva.com/design/DAFl7R-5GUQ/dcb17ywo7ODZWzRKBXj89Q/view?utm_content=DAFl7R-5GUQ&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h6ee8d95435"
   }
  ],
  "texto": "NkCom é uma agência de marketing de São Paulo, fundada em 2018, com a missão de tornar o marketing acessível para pequenos e médios empreendedores. Desde então, já ajudou mais de 1.000 clientes, oferecendo serviços especializados para atender às necessidades de cada negócio.\n\nEmbora a agência já possuísse um website, identificamos a necessidade de uma reformulação. Para isso, realizamos um estudo aprofundado, entendendo melhor o posicionamento da marca e as expectativas do público-alvo. Como resultado, desenvolvemos um novo site do zero, com uma estrutura mais moderna e eficiente, além de propor uma nova identidade visual para a empresa, garantindo uma comunicação mais alinhada e impactante.",
  "textoEn": "NkCom is a marketing agency based in São Paulo, founded in 2018 with the mission of making marketing accessible to small and medium-sized entrepreneurs. Since then, it has supported over 1,000 clients, offering specialized services tailored to each business’s needs.\n\nAlthough the agency already had a website, we identified the need for a complete redesign. To achieve this, we carried out an in-depth study to better understand the brand’s positioning and the expectations of its target audience. As a result, we developed a brand-new website from scratch, with a more modern and efficient structure, and also proposed a new visual identity for the company, ensuring more aligned and impactful communication.",
  "capa": "img/projetos/nkcom/capa.webp",
  "galeria": [
   "img/projetos/nkcom/01.webp",
   "img/projetos/nkcom/02.webp"
  ],
  "compartilhar": "img/projetos/nkcom/compartilhar.jpg"
 },
 {
  "nome": "80 anos de Barbara Kruger",
  "descricao": "Editorial para exposição",
  "descricaoEn": "Exhibition editorial",
  "area": "outros",
  "cor": "#2D2D2D",
  "grade": 1,
  "ano": "2024",
  "slug": "barbara-kruger",
  "texto": "Barbara Kruger é uma artista visual e designer reconhecida por suas críticas à influência da mídia e publicidade na sociedade. Com sua linguagem única, ela aborda temas como consumismo, feminismo, política, identidade e raça. Suas obras, utilizando a linguagem dos meios de comunicação, promovem discussões sociológicas e destacam sua importância no ativismo artístico contemporâneo. O projeto divulga uma exposição da artista para o lançamento do livro dos seus 80 anos, como material de divulgação foi feito um pôster, um folder que será distribuído dentro do evento, para a realização de uma experiência mais imersiva, e o livro que teve o seu lançamento e venda durante o evento.\n\nFoi desenvolvido o briefing, benchmark, brainstorming, moodboard, esboços no papel, prancha gráfica e diagramação pelo Adobe InDesign.\n\nEsse projeto é acadêmico e foi realizado para a conclusão do bloco Design Editorial do Instituto Infnet - ECDD.",
  "textoEn": "Barbara Kruger is a visual artist and designer recognized for her critiques of the influence of media and advertising on society. With her unique language, she addresses themes such as consumerism, feminism, politics, identity, and race. Her works, which adopt the language of mass media, foster sociological discussions and highlight her importance in contemporary artistic activism.\n\nThe project promotes an exhibition of the artist to celebrate the launch of the book marking her 80th birthday. As promotional material, a poster and a brochure—distributed during the event—were created, along with the book itself, which was launched and sold at the exhibition.\n\nThe process involved the development of a briefing, benchmarking, brainstorming, moodboard, paper sketches, graphic boards, and layout design using Adobe InDesign.\n\nThis is an academic project carried out to complete the Editorial Design module at Instituto Infnet – ECDD.",
  "capa": "img/projetos/barbara-kruger/capa.webp",
  "galeria": [
   "img/projetos/barbara-kruger/01.webp",
   "img/projetos/barbara-kruger/02.webp",
   "img/projetos/barbara-kruger/03.webp",
   "img/projetos/barbara-kruger/04.webp",
   "img/projetos/barbara-kruger/05.webp",
   "img/projetos/barbara-kruger/06.webp",
   "img/projetos/barbara-kruger/07.webp",
   "img/projetos/barbara-kruger/08.webp"
  ],
  "compartilhar": "img/projetos/barbara-kruger/compartilhar.jpg"
 }
].map((p,i)=>Object.assign({
    id:"pf"+(i+1), capa:"", galeria:[], compartilhar:"", grade:1, texto:"", textoEn:"", links:[], publicado:true, ano:"2026"
  },p));

  function slugify(t){return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")}
  function carregar(){
    try{const s=(window.NUVEM&&window.NUVEM.portfolio)?JSON.parse(JSON.stringify(window.NUVEM.portfolio)):JSON.parse(localStorage.getItem(CHAVE)); if(Array.isArray(s)&&s.length){s.forEach(p=>(p.links||[]).forEach(l=>{l.url=urlLimpa(l.url)}));return s}}catch(e){}
    return JSON.parse(JSON.stringify(padrao));
  }
  function salvar(lista){
    try{localStorage.setItem(CHAVE,JSON.stringify(lista));return true}
    catch(e){return false}
  }
  function restaurar(){try{localStorage.removeItem(CHAVE)}catch(e){} return carregar()}
  /* texto em parágrafos, no idioma pedido (cai para o português se não houver inglês) */
  function paragrafos(p,en){
    const t=(en&&p.textoEn)||p.texto||[p.desafio,p.solucao].filter(Boolean).join("\n\n");
    return String(t||"").split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
  }
  /* como a galeria aparece: formato das imagens e quantas imagens vão em cada linha.
     linhas: quantidade de imagens de cada linha, na ordem (ex.: [1,3,2]); as imagens que sobrarem
     seguem em linhas automáticas com "grade" imagens cada. largas: formato antigo (imagem em linha inteira). */
  const PROPORCOES={original:"Manter o formato original","1/1":"Quadrado (1:1)","4/5":"Retrato (4:5)","3/4":"Retrato (3:4)","16/9":"Paisagem (16:9)"};
  function layout(p){
    const cols=Math.min(10,Math.max(1,+p.grade||1));
    return {cols,prop:p.proporcao||(cols===3?"3/4":"original"),largas:p.largas||[]};
  }
  /* imagens fora da galeria ficam guardadas no projeto, mas não aparecem no site */
  function visiveis(p){const oc=p.ocultas||[];return (p.galeria||[]).filter(u=>!oc.includes(u))}
  function linhas(p){
    const tot=visiveis(p).length, L=layout(p), out=[]; let i=0;
    (p.linhas||[]).forEach(n=>{if(i<tot){const k=Math.min(Math.max(1,+n||1),10);out.push({n:k,ini:i,qtd:Math.min(k,tot-i),auto:false});i+=k}});
    while(i<tot){let k=L.cols;
      if(!(p.linhas||[]).length&&L.largas.length){if(L.largas.includes(i))k=1;else{let j=i;while(j<tot&&j-i<L.cols&&!L.largas.includes(j))j++;k=Math.max(1,j-i)}}
      out.push({n:k,ini:i,qtd:Math.min(k,tot-i),auto:true});i+=k}
    return out;
  }
  /* HTML da galeria, usado no site e na prévia da área da equipe */
  function galeriaHTML(p,src,alt){
    const L=layout(p), g=visiveis(p);
    return `<div class="galeria" style="${L.prop!=="original"?`--prop:${L.prop}`:""}" data-prop="${L.prop}">${linhas(p).map(r=>
      `<div class="g-linha" data-n="${r.n}" style="--n:${r.n}">${g.slice(r.ini,r.ini+r.qtd).map((u,j)=>{const k=r.ini+j;
        return `<img src="${src(u)}" alt="${alt(k,g.length)}" ${k>1?'loading="lazy"':""} decoding="async" onload="this.style.setProperty('--r',this.naturalWidth/this.naturalHeight)">`}).join("")}</div>`).join("")}</div>`;
  }
  const CSS_GALERIA=`.galeria{--gap:clamp(.6rem,1.6vw,1.25rem);display:grid;grid-template-columns:minmax(0,1fr);gap:var(--gap)}
    .g-linha{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:var(--gap);align-items:start}
    .galeria img{width:100%;display:block;border-radius:clamp(6px,1vw,12px)}
    .galeria:not([data-prop="original"]) .g-linha:not([data-n="1"]) img{aspect-ratio:var(--prop);object-fit:cover}
    .galeria[data-prop="original"] .g-linha:not([data-n="1"]){display:flex}
    .galeria[data-prop="original"] .g-linha:not([data-n="1"]) img{flex:var(--r,1) 1 0;min-width:0;width:auto;height:auto}
    @media (max-width:760px){.g-linha:not([data-n="1"]):not([data-n="2"]){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))}
      .g-linha[data-n="6"],.g-linha[data-n="7"],.g-linha[data-n="8"],.g-linha[data-n="9"],.g-linha[data-n="10"]{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      .galeria .g-linha[data-n] img{width:100%!important;min-width:0}}`;
  window.PORTFOLIO={AREAS,carregar,salvar,restaurar,slugify,padrao,paragrafos,layout,linhas,visiveis,galeriaHTML,PROPORCOES,CSS_GALERIA};
})();
