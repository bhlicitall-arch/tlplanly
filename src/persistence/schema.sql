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

create table if not exists saas_plans (
  id text primary key,
  name text not null,
  description text not null default '',
  monthly_price_cents int not null default 0,
  annual_monthly_price_cents int not null default 0,
  included_users int not null default 1,
  max_projects int not null default 0,
  max_ai_messages_monthly int not null default 0,
  max_ocr_pages_monthly int not null default 0,
  features jsonb not null default '[]'::jsonb,
  public boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists saas_coupons (
  code text primary key,
  plan_id text not null references saas_plans(id),
  label text not null default '',
  active boolean not null default true,
  max_uses int not null default 1,
  used_count int not null default 0,
  expires_at timestamptz,
  trial_days int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists saas_subscriptions (
  id text primary key,
  tenant_id text not null references saas_tenants(id) on delete cascade,
  plan_id text not null references saas_plans(id),
  status text not null default 'active',
  seats int not null default 1,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  coupon_code text references saas_coupons(code),
  created_at timestamptz not null default now()
);

create table if not exists saas_coupon_redemptions (
  id text primary key,
  code text not null references saas_coupons(code),
  tenant_id text not null references saas_tenants(id) on delete cascade,
  user_id text not null references saas_users(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

create index if not exists saas_projects_tenant_updated_idx
  on saas_projects (tenant_id, updated_at desc);

create index if not exists saas_sessions_expires_idx
  on saas_sessions (expires_at);

create index if not exists saas_subscriptions_tenant_status_idx
  on saas_subscriptions (tenant_id, status);

create index if not exists saas_coupon_redemptions_code_idx
  on saas_coupon_redemptions (code);

insert into saas_schema_migrations (version)
values ('2026-06-12-saas-core')
on conflict (version) do nothing;

insert into saas_schema_migrations (version)
values ('2026-06-15-plans-coupons')
on conflict (version) do nothing;
