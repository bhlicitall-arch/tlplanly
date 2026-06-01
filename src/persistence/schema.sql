-- TLPlanly - esquema inicial de persistencia SaaS
-- Banco alvo: PostgreSQL/Supabase ou D1 adaptado posteriormente.

create table if not exists tenants (
  id text primary key,
  nome text not null,
  plano text not null default 'trial',
  criado_em timestamptz not null default now()
);

create table if not exists usuarios (
  id text primary key,
  tenant_id text not null references tenants(id),
  nome text not null,
  email text not null,
  papel text not null check (papel in ('admin', 'construtor', 'auditor', 'leitor')),
  criado_em timestamptz not null default now(),
  unique (tenant_id, email)
);

create table if not exists obras (
  id text primary key,
  tenant_id text not null references tenants(id),
  nome text not null,
  municipio text,
  uf text,
  orgao text,
  status text not null default 'orcamento',
  criado_em timestamptz not null default now()
);

create table if not exists orcamentos (
  id text primary key,
  tenant_id text not null references tenants(id),
  obra_id text not null references obras(id),
  nome text not null,
  uf_referencia text not null default 'MG',
  regime_encargos text not null default 'nao_desonerado',
  bdi_percentual numeric(8,4) not null default 0,
  total_direto numeric(14,2) not null default 0,
  total_geral numeric(14,2) not null default 0,
  criado_em timestamptz not null default now()
);

create table if not exists orcamento_itens (
  id text primary key,
  orcamento_id text not null references orcamentos(id),
  codigo text not null,
  descricao text not null,
  unidade text not null,
  quantidade numeric(14,4) not null default 0,
  preco_unitario numeric(14,4) not null default 0,
  preco_total numeric(14,2) not null default 0,
  fonte text,
  match_tipo text,
  codigo_referencia text,
  match_score numeric(6,4)
);

create table if not exists bases_referencia (
  id text primary key,
  fonte text not null,
  uf text,
  data_referencia text not null,
  regime text,
  tipo text not null check (tipo in ('insumo', 'composicao', 'servico', 'material')),
  importado_em timestamptz not null default now()
);

create table if not exists referencia_precos (
  id text primary key,
  base_id text not null references bases_referencia(id),
  codigo text not null,
  descricao text not null,
  unidade text not null,
  preco numeric(14,4) not null,
  fonte_original text,
  unique (base_id, codigo)
);

create table if not exists auditorias (
  id text primary key,
  tenant_id text not null references tenants(id),
  orcamento_id text not null references orcamentos(id),
  total_itens integer not null,
  aprovados integer not null,
  alertas integer not null,
  criticos integer not null,
  nao_encontrados integer not null,
  criado_em timestamptz not null default now()
);

create table if not exists auditoria_resultados (
  id text primary key,
  auditoria_id text not null references auditorias(id),
  item_id text references orcamento_itens(id),
  status text not null,
  preco_planilha numeric(14,4),
  preco_referencia numeric(14,4),
  diferenca_percentual numeric(10,4),
  match_tipo text,
  match_score numeric(6,4),
  codigo_referencia text,
  motivo text
);

create table if not exists cpus (
  id text primary key,
  tenant_id text not null references tenants(id),
  codigo text not null,
  descricao text not null,
  unidade text not null,
  custo_unitario numeric(14,4) not null default 0,
  criado_em timestamptz not null default now(),
  unique (tenant_id, codigo)
);

create table if not exists cpu_insumos (
  id text primary key,
  cpu_id text not null references cpus(id),
  codigo_referencia text not null,
  descricao text not null,
  unidade text not null,
  coeficiente numeric(14,6) not null,
  preco_unitario numeric(14,4) not null
);
