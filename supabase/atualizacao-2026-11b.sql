-- Atualização de 19/nov/2026 (rodar uma vez no SQL Editor do Supabase, antes de publicar)
-- Não cria colunas: Kanban, novos campos do formulário e modelos ficam nos campos JSON que já existem.
-- Pode rodar mais de uma vez sem problema.

-- 1) Quadro de projetos: a coluna "Briefing" passa a se chamar "Onboarding"
update registros
   set dados = jsonb_set(dados, '{etapa}', '"Onboarding"')
 where tipo = 'projetos' and dados->>'etapa' = 'Briefing';

-- 2) Nova paleta: o marrom (#462D26) vira o azul #23446A no conteúdo salvo pela área da equipe
--    (cores dos serviços, capas do portfólio, etc.)
update config
   set dados = regexp_replace(dados::text, '#462d26', '#23446A', 'gi')::jsonb
 where dados::text ~* '#462d26';
update registros
   set dados = regexp_replace(dados::text, '#462d26', '#23446A', 'gi')::jsonb
 where dados::text ~* '#462d26';

-- 3) Links salvos sem https:// (ex.: bio.site/lumarasilva) e links antigos do próprio site
update config
   set dados = regexp_replace(
                 regexp_replace(
                   regexp_replace(dados::text, '"url": "(bio\.site/[^"]*)"', '"url": "https://\1"', 'g'),
                 '"url": "(\.\./|\./|/)?index\.html#trabalhos"', '"url": "/#projetos"', 'g'),
               '"url": "(\.\./|\./|/)?(orcamento|privacidade|links)\.html"', '"url": "/\2"', 'g')::jsonb
 where chave in ('site', 'portfolio')
   and dados::text ~ '"url": "(bio\.site/|(\.\./|\./|/)?(index|orcamento|privacidade|links)\.html)';

-- 4) Conferência (só leitura): quantos cartões há em cada coluna do quadro
select dados->>'etapa' as coluna, count(*) as cartoes
  from registros where tipo = 'projetos'
 group by 1 order by 1;
