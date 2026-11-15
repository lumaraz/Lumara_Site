-- Contagem de visitas (rodar uma vez no SQL Editor do Supabase, antes de publicar)
create table if not exists visitas (
  dia date not null,
  pagina text not null,
  origem text not null,
  n integer not null default 0,
  primary key (dia, pagina, origem)
);
alter table visitas enable row level security;
drop policy if exists visitas_le on visitas;
create policy visitas_le on visitas for select to authenticated using (da_equipe());

-- soma +1 de forma segura (chamada só pelo servidor)
create or replace function registrar_visita(p_pagina text, p_origem text)
returns void language sql security definer set search_path = public as $$
  insert into visitas (dia, pagina, origem, n)
  values ((now() at time zone 'America/Sao_Paulo')::date, left(p_pagina, 80), left(p_origem, 40), 1)
  on conflict (dia, pagina, origem) do update set n = visitas.n + 1
$$;
revoke all on function registrar_visita(text, text) from public, anon, authenticated;
