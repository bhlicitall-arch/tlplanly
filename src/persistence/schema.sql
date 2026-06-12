-- TLPlanly - esquema SaaS operacional
-- Banco alvo: PostgreSQL.
-- O servidor aplica este modelo automaticamente quando DATABASE_URL existe.

create table if not exists saas_schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists saas_tenants (
  id text primary key,
  name text not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create table if not exists saas_users (
  id text primary key,
  tenant_id text not null references saas_tenants(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'admin',
  password_hash text not null,
  password_salt text not null,
  created_at timestamptz not null default now()
);

create table if not exists saas_sessions (
  token_hash text primary key,
  user_id text not null references saas_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists saas_projects (
  id text primary key,
  tenant_id text not null references saas_tenants(id) on delete cascade,
  user_id text not null references saas_users(id) on delete cascade,
  name text not null,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saas_projects_tenant_updated_idx
  on saas_projects (tenant_id, updated_at desc);

create index if not exists saas_sessions_expires_idx
  on saas_sessions (expires_at);

insert into saas_schema_migrations (version)
values ('2026-06-12-saas-core')
on conflict (version) do nothing;
