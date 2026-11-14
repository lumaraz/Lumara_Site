-- Lumara Silva: estrutura do banco (rodar uma vez no SQL Editor do Supabase)

-- Quem é da equipe (só esses e-mails entram na área da equipe)
create table if not exists equipe (
  email text primary key,
  nome text,
  papel text not null default 'admin' check (papel in ('admin','equipe'))
);

-- Dados do sistema: um registro por cliente, pedido, proposta, projeto, lançamento ou post
create table if not exists registros (
  tipo text not null,
  id text not null,
  dados jsonb not null,
  atualizado timestamptz not null default now(),
  primary key (tipo, id)
);

-- Configurações: site e portfólio são públicos; o resto é só da equipe
create table if not exists config (
  chave text primary key,
  dados jsonb not null,
  atualizado timestamptz not null default now()
);

-- O que chega de fora (pedido de orçamento, aprovação, assinatura, pagamento)
create table if not exists eventos (
  id bigint generated always as identity primary key,
  tipo text not null,
  dados jsonb not null,
  criado timestamptz not null default now(),
  processado timestamptz
);

-- Fila de e-mails e mensagens
create table if not exists envios (
  id bigint generated always as identity primary key,
  canal text not null default 'email',
  para text not null,
  assunto text,
  corpo text,
  status text not null default 'pendente',
  erro text,
  criado timestamptz not null default now(),
  enviado timestamptz
);

create or replace function da_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from equipe where email = lower(auth.jwt() ->> 'email'))
$$;

alter table equipe enable row level security;
alter table registros enable row level security;
alter table config enable row level security;
alter table eventos enable row level security;
alter table envios enable row level security;

create policy equipe_le on equipe for select to authenticated using (da_equipe());
create policy registros_tudo on registros for all to authenticated using (da_equipe()) with check (da_equipe());
create policy config_tudo on config for all to authenticated using (da_equipe()) with check (da_equipe());
create policy config_publica on config for select to anon using (chave in ('site','portfolio'));
create policy eventos_tudo on eventos for all to authenticated using (da_equipe()) with check (da_equipe());
create policy envios_tudo on envios for all to authenticated using (da_equipe()) with check (da_equipe());
-- Visitantes e clientes não escrevem direto no banco: passam pelas funções do Netlify.

-- Imagens (portfólio, artes para aprovação, anexos)
insert into storage.buckets (id, name, public) values ('arquivos','arquivos', true)
  on conflict (id) do nothing;
create policy arquivos_equipe_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and da_equipe());
create policy arquivos_equipe_altera on storage.objects for update to authenticated
  using (bucket_id = 'arquivos' and da_equipe());
create policy arquivos_equipe_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and da_equipe());

-- Primeira pessoa da equipe
insert into equipe (email, nome, papel) values ('contato@lumarasilva.com.br','Lumara Silva','admin')
  on conflict (email) do nothing;
