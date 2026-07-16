-- =============================================================================
-- LavaCar — schema multi-tenant (prefixo lc_)
-- Módulo isolado dentro do projeto Supabase compartilhado com o CRM.
-- 100% idempotente: pode ser re-executado com segurança.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

create table if not exists lc_empresas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  criado_por  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists lc_membros (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references lc_empresas (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  papel       text not null default 'dono' check (papel in ('dono', 'funcionario')),
  created_at  timestamptz not null default now(),
  unique (empresa_id, user_id)
);

create table if not exists lc_servicos (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references lc_empresas (id) on delete cascade,
  nome        text not null,
  preco       numeric(10, 2) not null default 0,
  ativo       boolean not null default true,
  ordem       int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists lc_categorias (
  id          uuid primary key default gen_random_uuid(),
  empresa_id  uuid not null references lc_empresas (id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('entrada', 'saida')),
  ordem       int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists lc_lavagens (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references lc_empresas (id) on delete cascade,
  servico_id      uuid references lc_servicos (id) on delete set null,
  servico_nome    text not null,
  valor           numeric(10, 2) not null default 0 check (valor >= 0),
  forma_pagamento text not null default 'dinheiro'
                    check (forma_pagamento in ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'outro')),
  cliente         text,
  placa           text,
  observacao      text,
  status          text not null default 'pago' check (status in ('pago', 'pendente')),
  data            date not null default current_date,
  criado_por      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create table if not exists lc_movimentacoes (
  id              uuid primary key default gen_random_uuid(),
  empresa_id      uuid not null references lc_empresas (id) on delete cascade,
  tipo            text not null check (tipo in ('entrada', 'saida')),
  categoria_id    uuid references lc_categorias (id) on delete set null,
  categoria_nome  text,
  descricao       text not null default '',
  valor           numeric(10, 2) not null default 0 check (valor >= 0),
  forma_pagamento text not null default 'dinheiro'
                    check (forma_pagamento in ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'outro')),
  data            date not null default current_date,
  -- entrada gerada automaticamente por uma lavagem paga; CASCADE => excluir a
  -- lavagem exclui a movimentação vinculada. UNIQUE => no máx. 1 por lavagem.
  lavagem_id      uuid unique references lc_lavagens (id) on delete cascade,
  criado_por      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Índices
-- -----------------------------------------------------------------------------

create index if not exists lc_membros_user_idx        on lc_membros (user_id);
create index if not exists lc_servicos_empresa_idx     on lc_servicos (empresa_id);
create index if not exists lc_categorias_empresa_idx   on lc_categorias (empresa_id);
create index if not exists lc_lavagens_empresa_data_idx      on lc_lavagens (empresa_id, data);
create index if not exists lc_movimentacoes_empresa_data_idx on lc_movimentacoes (empresa_id, data);
create index if not exists lc_movimentacoes_lavagem_idx      on lc_movimentacoes (lavagem_id);

-- -----------------------------------------------------------------------------
-- Funções helper (SECURITY DEFINER — evitam recursão de policy em lc_membros)
-- Rodam como o dono da função (que ignora RLS), então consultar lc_membros
-- dentro delas NÃO dispara as policies de lc_membros novamente.
-- -----------------------------------------------------------------------------

create or replace function lc_is_member(eid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from lc_membros m
    where m.empresa_id = eid and m.user_id = auth.uid()
  );
$$;

create or replace function lc_empresa_sem_membros(eid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select not exists (
    select 1 from lc_membros m where m.empresa_id = eid
  );
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

alter table lc_empresas       enable row level security;
alter table lc_membros        enable row level security;
alter table lc_servicos       enable row level security;
alter table lc_categorias     enable row level security;
alter table lc_lavagens       enable row level security;
alter table lc_movimentacoes  enable row level security;

-- lc_empresas ---------------------------------------------------------------
drop policy if exists lc_empresas_select on lc_empresas;
create policy lc_empresas_select on lc_empresas
  for select using (lc_is_member(id));

drop policy if exists lc_empresas_insert on lc_empresas;
create policy lc_empresas_insert on lc_empresas
  for insert with check (criado_por = auth.uid());

drop policy if exists lc_empresas_update on lc_empresas;
create policy lc_empresas_update on lc_empresas
  for update using (lc_is_member(id)) with check (lc_is_member(id));

drop policy if exists lc_empresas_delete on lc_empresas;
create policy lc_empresas_delete on lc_empresas
  for delete using (lc_is_member(id));

-- lc_membros ----------------------------------------------------------------
-- Recursão evitada: a policy usa lc_is_member (SECURITY DEFINER), que não
-- reavalia as policies de lc_membros.
drop policy if exists lc_membros_select on lc_membros;
create policy lc_membros_select on lc_membros
  for select using (lc_is_member(empresa_id));

-- Bootstrap do dono: só é possível inserir o PRIMEIRO membro (a própria linha
-- do user) enquanto a empresa não tiver membro nenhum.
drop policy if exists lc_membros_insert on lc_membros;
create policy lc_membros_insert on lc_membros
  for insert with check (
    user_id = auth.uid() and lc_empresa_sem_membros(empresa_id)
  );

drop policy if exists lc_membros_update on lc_membros;
create policy lc_membros_update on lc_membros
  for update using (lc_is_member(empresa_id)) with check (lc_is_member(empresa_id));

drop policy if exists lc_membros_delete on lc_membros;
create policy lc_membros_delete on lc_membros
  for delete using (lc_is_member(empresa_id));

-- lc_servicos ---------------------------------------------------------------
drop policy if exists lc_servicos_select on lc_servicos;
create policy lc_servicos_select on lc_servicos
  for select using (lc_is_member(empresa_id));

drop policy if exists lc_servicos_insert on lc_servicos;
create policy lc_servicos_insert on lc_servicos
  for insert with check (lc_is_member(empresa_id));

drop policy if exists lc_servicos_update on lc_servicos;
create policy lc_servicos_update on lc_servicos
  for update using (lc_is_member(empresa_id)) with check (lc_is_member(empresa_id));

drop policy if exists lc_servicos_delete on lc_servicos;
create policy lc_servicos_delete on lc_servicos
  for delete using (lc_is_member(empresa_id));

-- lc_categorias -------------------------------------------------------------
drop policy if exists lc_categorias_select on lc_categorias;
create policy lc_categorias_select on lc_categorias
  for select using (lc_is_member(empresa_id));

drop policy if exists lc_categorias_insert on lc_categorias;
create policy lc_categorias_insert on lc_categorias
  for insert with check (lc_is_member(empresa_id));

drop policy if exists lc_categorias_update on lc_categorias;
create policy lc_categorias_update on lc_categorias
  for update using (lc_is_member(empresa_id)) with check (lc_is_member(empresa_id));

drop policy if exists lc_categorias_delete on lc_categorias;
create policy lc_categorias_delete on lc_categorias
  for delete using (lc_is_member(empresa_id));

-- lc_lavagens ---------------------------------------------------------------
drop policy if exists lc_lavagens_select on lc_lavagens;
create policy lc_lavagens_select on lc_lavagens
  for select using (lc_is_member(empresa_id));

drop policy if exists lc_lavagens_insert on lc_lavagens;
create policy lc_lavagens_insert on lc_lavagens
  for insert with check (lc_is_member(empresa_id));

drop policy if exists lc_lavagens_update on lc_lavagens;
create policy lc_lavagens_update on lc_lavagens
  for update using (lc_is_member(empresa_id)) with check (lc_is_member(empresa_id));

drop policy if exists lc_lavagens_delete on lc_lavagens;
create policy lc_lavagens_delete on lc_lavagens
  for delete using (lc_is_member(empresa_id));

-- lc_movimentacoes ----------------------------------------------------------
drop policy if exists lc_movimentacoes_select on lc_movimentacoes;
create policy lc_movimentacoes_select on lc_movimentacoes
  for select using (lc_is_member(empresa_id));

drop policy if exists lc_movimentacoes_insert on lc_movimentacoes;
create policy lc_movimentacoes_insert on lc_movimentacoes
  for insert with check (lc_is_member(empresa_id));

drop policy if exists lc_movimentacoes_update on lc_movimentacoes;
create policy lc_movimentacoes_update on lc_movimentacoes
  for update using (lc_is_member(empresa_id)) with check (lc_is_member(empresa_id));

drop policy if exists lc_movimentacoes_delete on lc_movimentacoes;
create policy lc_movimentacoes_delete on lc_movimentacoes
  for delete using (lc_is_member(empresa_id));
