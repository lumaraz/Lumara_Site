/* Funções usadas por várias páginas: idioma, eventos do cliente, valores por extenso e o modelo do contrato.
   No sistema final, os eventos viram chamadas ao servidor e o modelo do contrato fica no banco de dados. */
(function(){
  const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function idioma(){try{return localStorage.getItem("lumara_lang")==="en"?"en":"pt"}catch(e){return "pt"}}
  function salvarIdioma(l){try{localStorage.setItem("lumara_lang",l)}catch(e){}}
  /* liga um botão PT/EN (dois <span> dentro) e chama aoTrocar(lang) */
  function ligarIdioma(btn,aoTrocar){
    let lang=idioma();
    const pintar=()=>{const en=lang==="en";btn.children[0].classList.toggle("ativo",!en);btn.children[1].classList.toggle("ativo",en);
      btn.setAttribute("aria-label",en?"Mudar para português":"Switch to English");btn.setAttribute("lang",en?"pt-BR":"en");
      document.documentElement.lang=en?"en":"pt-BR"};
    btn.addEventListener("click",()=>{lang=lang==="pt"?"en":"pt";salvarIdioma(lang);pintar();aoTrocar(lang)});
    pintar(); return lang;
  }
  const brl=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const data=(iso,lang)=>new Date(String(iso).slice(0,10)+"T00:00:00").toLocaleDateString(lang==="en"?"en-GB":"pt-BR");
  function evento(ev){let l=[];try{l=JSON.parse(localStorage.getItem("lumara_eventos")||"[]")}catch(x){}
    l.push(Object.assign({quando:new Date().toISOString()},ev));try{localStorage.setItem("lumara_eventos",JSON.stringify(l))}catch(x){}}
  function fila(){try{return JSON.parse(localStorage.getItem("lumara_eventos")||"[]")}catch(x){return []}}
  /* dados do sistema; sem nada salvo neste navegador, usa os dados de exemplo do protótipo */
  function dados(){
    let S=null; try{S=JSON.parse(localStorage.getItem("lumara_admin"))}catch(x){}
    if((!S||S.v!==4)&&window.EXEMPLO){S=window.EXEMPLO.completo();try{localStorage.setItem("lumara_admin",JSON.stringify(S))}catch(x){}}
    return S;
  }

  /* valor por extenso, em reais */
  function extenso(valor){
    const U=["","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","quatorze","quinze","dezesseis","dezessete","dezoito","dezenove"];
    const D=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"];
    const C=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
    const ate999=n=>{if(n===0)return"";if(n===100)return"cem";const c=Math.floor(n/100),r=n%100,p=[];if(c)p.push(C[c]);
      if(r){if(r<20)p.push(U[r]);else{const d=Math.floor(r/10),u=r%10;p.push(u?D[d]+" e "+U[u]:D[d])}}return p.join(" e ")};
    const inteiro=n=>{if(n===0)return"zero";const mi=Math.floor(n/1e6),mil=Math.floor(n/1e3)%1e3,r=n%1e3,p=[];
      if(mi)p.push(mi===1?"um milhão":ate999(mi)+" milhões");if(mil)p.push(mil===1?"mil":ate999(mil)+" mil");if(r)p.push(ate999(r));
      if(p.length>1){const ult=p.pop();return p.join(", ")+((r&&(r<100||r%100===0))?" e ":" ")+ult}return p[0]};
    const v=Math.round(Number(valor||0)*100),re=Math.floor(v/100),ce=v%100;
    let t=re?inteiro(re)+(re===1?" real":(re%1e6===0?" de reais":" reais")):"";
    if(ce) t+=(t?" e ":"")+inteiro(ce)+(ce===1?" centavo":" centavos");
    return t||"zero real";
  }

  /* ===== contrato =====
     Formato do modelo: "## " abre uma cláusula, "- " é item de lista, as demais linhas são parágrafos.
     Campos entre chaves são preenchidos com os dados da proposta. */
  const MODELO_CONTRATO=`## IDENTIFICAÇÃO DAS PARTES
CONTRATANTE: {cliente_nome}, inscrito(a) no CPF/CNPJ sob o nº {cliente_doc}, com endereço em {cliente_endereco}, e-mail {cliente_email}.
CONTRATADA: LUMARA DA SILVA E SILVA, pessoa jurídica de direito privado inscrita no CNPJ sob o nº 65.247.485/0001-68, com sede na Rua Jofre Sodré, nº 96, Barbuda, Magé – RJ, neste ato representada por sua titular, Lumara da Silva e Silva, designer gráfica, e-mail contato@lumarasilva.com.br.
As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições de preço, forma e prazo de pagamento aqui descritas.
## CLÁUSULA 1 – DO OBJETO
1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, dos serviços de design descritos na proposta nº {proposta}, aprovada pela CONTRATANTE em {data_aprovacao}, que passa a fazer parte deste contrato:
{servicos}
1.2. Os arquivos finais serão entregues nos formatos .PDF, .PNG, .JPG, .SVG, .EPS e .AI, conforme a necessidade de cada peça, fechados e com textos convertidos em curvas, prontos para uso.
1.3. Fontes tipográficas pagas, imagens de banco, fotografias, impressão e qualquer outro custo de terceiros não estão incluídos no valor deste contrato. Quando necessários, serão informados previamente e pagos pela CONTRATANTE, que também será a titular das respectivas licenças.
1.4. Não fazem parte deste contrato o registro da marca no Instituto Nacional da Propriedade Industrial (INPI), a busca de anterioridade, a impressão de materiais e quaisquer serviços não listados na cláusula 1.1. A CONTRATANTE é a única responsável por verificar a disponibilidade da marca para registro.
1.5. Qualquer serviço adicional ou alteração do escopo será objeto de novo orçamento, aprovado por escrito antes do início da execução.
## CLÁUSULA 2 – DOS PRAZOS E DO BRIEFING
2.1. O prazo estimado para a conclusão do projeto é de {prazo}, contado a partir do recebimento do briefing completo e da confirmação do pagamento da primeira parcela, o que ocorrer por último.
2.2. O briefing e as informações fornecidas pela CONTRATANTE são essenciais para o desenvolvimento do projeto e orientam todo o trabalho entregue. A CONTRATANTE responde pela veracidade das informações e pelo direito de uso dos materiais que fornecer, como textos, fotos e logotipos de terceiros.
2.3. A CONTRATANTE deverá enviar o briefing e os materiais solicitados em até 7 (sete) dias após a assinatura deste contrato, e responder às apresentações e solicitações de aprovação em até 5 (cinco) dias úteis. Atrasos nesses envios prorrogam o prazo de entrega pelo mesmo período.
2.4. Se a CONTRATANTE ficar mais de 30 (trinta) dias sem enviar retorno, o projeto será pausado e a retomada dependerá da disponibilidade da agenda da CONTRATADA. Após 60 (sessenta) dias sem retorno, o projeto poderá ser considerado encerrado, sendo devidos os valores das etapas já realizadas.
## CLÁUSULA 3 – DAS APRESENTAÇÕES, AJUSTES E APROVAÇÃO
3.1. Estão incluídas no valor 2 (duas) rodadas de ajustes sobre a proposta apresentada.
3.2. Ajustes além das rodadas incluídas, ou pedidos que alterem o conceito já aprovado, serão orçados à parte.
3.3. A aprovação será feita de forma expressa, por e-mail, mensagem de WhatsApp ou pelo botão de aprovação no portal do cliente. O projeto aprovado será considerado definitivo, não sendo admitida reprovação retroativa.
3.4. Após a aprovação final e a quitação integral do valor contratado, a CONTRATADA disponibilizará os arquivos finais no portal do cliente ou por link seguro, para download por 90 (noventa) dias. Após esse prazo, a CONTRATADA não tem obrigação de manter cópias.
3.5. A CONTRATANTE terá 10 (dez) dias úteis, contados da entrega dos arquivos, para solicitar correções que não alterem o escopo aprovado, como erros de digitação ou problemas técnicos de arquivo. Pedidos posteriores poderão ser cobrados.
## CLÁUSULA 4 – DO VALOR E DO PAGAMENTO
4.1. Pelos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor total de {valor} ({valor_extenso}), na seguinte condição: {condicao}.
4.2. Os pagamentos serão feitos por Pix, cartão de crédito ou boleto, por meio do link de pagamento enviado pela CONTRATADA ou do portal do cliente.
4.3. O valor pago na aprovação funciona como sinal e garante a reserva da agenda da CONTRATADA para o projeto.
4.4. Em caso de atraso, incidirão multa de 2% (dois por cento) sobre o valor em aberto, juros de 1% (um por cento) ao mês e correção monetária pelo IPCA. Após 5 (cinco) dias de atraso, o projeto será suspenso até a regularização, com prorrogação do prazo de entrega pelo mesmo período.
4.5. Os arquivos finais e a cessão de direitos prevista na cláusula 7.1 ficam condicionados à quitação integral do valor contratado.
## CLÁUSULA 5 – DAS OBRIGAÇÕES DAS PARTES
5.1. Compete à CONTRATANTE: fornecer informações e materiais completos e dentro dos prazos; enviar retorno claro e dentro dos prazos combinados; aprovar ou solicitar ajustes nas entregas conforme previsto neste contrato; efetuar os pagamentos conforme pactuado; e respeitar as condições de uso das artes previstas na cláusula 7.
5.2. Compete à CONTRATADA: executar os serviços descritos no objeto com qualidade técnica; cumprir os prazos e especificações definidos neste contrato; enviar atualizações periódicas sobre o andamento do projeto; e manter sigilo sobre as informações e materiais recebidos.
## CLÁUSULA 6 – DA CONFIDENCIALIDADE E DOS DADOS PESSOAIS
6.1. As partes manterão sigilo sobre informações estratégicas, comerciais e financeiras a que tiverem acesso em razão deste contrato, durante a sua vigência e por 2 (dois) anos após o seu término.
6.2. Os dados pessoais trocados entre as partes serão usados apenas para a execução deste contrato, emissão de cobranças e notas fiscais e cumprimento de obrigações legais, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados), conforme a Política de Privacidade publicada em lumarasilva.com.br/privacidade.
## CLÁUSULA 7 – DOS DIREITOS AUTORAIS, DO PORTFÓLIO E DO USO DE INTELIGÊNCIA ARTIFICIAL
7.1. Após a quitação integral, a CONTRATADA cede à CONTRATANTE, em caráter definitivo e sem limite de território, os direitos patrimoniais sobre a versão final aprovada do projeto, para uso na identificação e na comunicação da marca da CONTRATANTE, nos termos da Lei nº 9.610/1998.
7.2. Os direitos morais de autoria são inalienáveis e permanecem com a CONTRATADA. Propostas, alternativas e esboços não aprovados, bem como os arquivos de trabalho, continuam pertencendo à CONTRATADA e não fazem parte da cessão.
7.3. A CONTRATADA poderá divulgar o projeto em seu portfólio, site e redes sociais após o lançamento da marca pela CONTRATANTE, salvo pedido de sigilo feito por escrito antes da assinatura deste contrato.
7.4. É vedado à CONTRATANTE, bem como a qualquer terceiro por ela contratado ou autorizado, utilizar os materiais desenvolvidos pela CONTRATADA, no todo ou em parte, para alimentar, treinar, ajustar ou aprimorar ferramentas, modelos ou sistemas de inteligência artificial, de qualquer natureza.
7.4.1. Também é vedado inserir as artes entregues em ferramentas de inteligência artificial para alterá-las, editá-las, recriá-las ou gerar variações a partir delas, bem como utilizar inteligência artificial para produzir peças que reproduzam, imitem ou sejam substancialmente semelhantes às artes entregues pela CONTRATADA.
7.4.2. A cessão de direitos prevista na cláusula 7.1 não autoriza os usos vedados nesta cláusula, e a proibição permanece válida mesmo após o término ou a rescisão deste contrato.
7.4.3. O descumprimento do disposto nesta cláusula, durante ou após a vigência deste contrato, caracteriza violação grave. Durante a vigência, autoriza a rescisão imediata pela CONTRATADA, nos termos da cláusula 8.5.
7.4.4. Em caso de descumprimento do disposto nesta cláusula, durante ou após a vigência deste contrato, a CONTRATANTE pagará à CONTRATADA, a título de cláusula penal, valor equivalente a 50% (cinquenta por cento) do total pago pela CONTRATANTE durante a vigência deste contrato, sem prejuízo da indenização por perdas e danos que exceder esse valor e da obrigação de remover imediatamente os materiais produzidos em desacordo com esta cláusula.
7.5. A CONTRATADA declara que o logotipo e os elementos centrais da identidade visual são criação própria e não foram gerados por ferramentas de inteligência artificial generativa.
7.6. Alterações feitas nas artes pela CONTRATANTE ou por terceiros, por qualquer meio, descaracterizam a autoria e afastam a responsabilidade técnica da CONTRATADA sobre o resultado.
## CLÁUSULA 8 – DA RESCISÃO E DO CANCELAMENTO
8.1. O contrato poderá ser rescindido por qualquer das partes em caso de descumprimento de suas obrigações pela outra parte, mediante notificação por escrito, por e-mail ou outro meio eletrônico, com prazo de 5 (cinco) dias para correção.
8.2. Qualquer das partes poderá rescindir este contrato sem justa causa, mediante aviso prévio de 7 (sete) dias, devendo ser pagas as etapas já realizadas ou em andamento até a data da rescisão.
8.3. Na rescisão sem justa causa por iniciativa da CONTRATANTE, o sinal previsto na cláusula 4.3 não será devolvido.
8.4. Na rescisão sem justa causa por iniciativa da CONTRATADA, serão devolvidos os valores pagos referentes às etapas ainda não realizadas.
8.5. A CONTRATADA poderá rescindir imediatamente este contrato, sem aviso prévio, em caso de violação grave, como o descumprimento da cláusula 7.4, sem prejuízo da cobrança dos valores devidos e das penalidades previstas.
8.6. Em qualquer hipótese de rescisão, somente serão entregues os arquivos das etapas integralmente pagas, e a cessão de direitos alcançará apenas esse material.
## CLÁUSULA 9 – DAS DISPOSIÇÕES GERAIS
9.1. A tolerância de qualquer das partes quanto ao descumprimento de alguma condição deste contrato não significa renúncia ao direito de exigi-la, nem novação.
9.2. A CONTRATADA não é mandatária nem procuradora da CONTRATANTE e não assume obrigações em seu nome além das previstas neste contrato.
9.3. Não há vínculo empregatício nem subordinação entre as partes.
9.4. As comunicações por e-mail, WhatsApp e pelo portal do cliente, nos contatos indicados neste contrato, são válidas para todos os fins, inclusive aprovações e notificações.
9.5. As partes reconhecem a validade da assinatura eletrônica deste contrato, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.
9.6. A responsabilidade da CONTRATADA por eventuais danos decorrentes deste contrato fica limitada ao valor total efetivamente pago pela CONTRATANTE, exceto em caso de dolo.
## CLÁUSULA 10 – DO FORO
10.1. Fica eleito o foro da Comarca de Magé – RJ para resolver questões oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`;

  const CONDICOES={
    "À vista, com 5% de desconto":"à vista, na aprovação da proposta",
    "50% na aprovação e 50% na entrega":"50% (cinquenta por cento) na aprovação da proposta e 50% (cinquenta por cento) na aprovação final, antes da entrega dos arquivos",
    "3 parcelas mensais":"em 3 (três) parcelas mensais iguais, a primeira na aprovação da proposta",
    "Mensal, todo dia 10":"mensalmente, com vencimento todo dia 10, enquanto durar a prestação do serviço"
  };
  /* monta os campos do contrato a partir de uma proposta (o) e do cliente (c) */
  function camposContrato(o,c,assin){
    const total=o.itens.reduce((a,i)=>a+(+i.v||0),0);
    const a=assin||o.contrato?.assinatura||{};
    const vazio="____________________";
    return {
      cliente_nome:a.nome||c.nome+(c.empresa&&c.empresa!==c.nome?" ("+c.empresa+")":""),
      cliente_doc:a.doc||vazio, cliente_endereco:a.endereco||vazio, cliente_email:c.email||vazio,
      proposta:o.num, data_aprovacao:o.aprovadoEm?data(o.aprovadoEm):data(o.criado),
      servicos:o.itens.filter(i=>i.s).map(i=>"- "+i.s+(i.d?": "+i.d.replace(/\n+/g,"; "):"")).join("\n"),
      prazo:o.prazoEntrega||"a combinar entre as partes", valor:brl(total), valor_extenso:extenso(total),
      condicao:CONDICOES[o.pagamento]||o.pagamento
    };
  }
  /* transforma o modelo em HTML com os campos preenchidos */
  function contratoHTML(modelo,campos){
    const linhas=String(modelo||MODELO_CONTRATO).replace(/\{(\w+)\}/g,(m,k)=>campos[k]!==undefined?campos[k]:m).split("\n");
    let html="",lista=false;
    linhas.forEach(l=>{
      const t=l.trim(); if(!t) return;
      if(t.startsWith("- ")){if(!lista){html+="<ul>";lista=true}html+=`<li>${esc(t.slice(2))}</li>`;return}
      if(lista){html+="</ul>";lista=false}
      if(t.startsWith("## ")) html+=`<h2>${esc(t.slice(3))}</h2>`;
      else{const m=t.match(/^(\d+(?:\.\d+)+\.)\s+(.*)$/);
        html+=m?`<p class="${m[1].split(".").length>3?"sub":""}"><strong>${m[1]}</strong> ${esc(m[2])}</p>`:`<p>${esc(t).replace(/^(CONTRATANTE|CONTRATADA):/,"<strong>$1:</strong>")}</p>`}
    });
    if(lista) html+="</ul>";
    return html;
  }
  window.LS={esc,idioma,salvarIdioma,ligarIdioma,brl,data,evento,fila,dados,extenso,MODELO_CONTRATO,camposContrato,contratoHTML,CONDICOES};
})();
