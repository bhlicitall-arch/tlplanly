import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createId, normalizeEmail } from './auth';

export type UserRole = 'admin' | 'construtor' | 'auditor' | 'leitor';

export type PublicUser = {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: UserRole;
  planId?: string;
  planName?: string;
  planStatus?: string;
  planExpiresAt?: string | null;
  seats?: number;
};

export type StoredUser = PublicUser & {
  passwordHash: string;
  passwordSalt: string;
};

export type ProjectRecord = {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  state: any;
  createdAt: string;
  updatedAt: string;
};

export type SaasStoreHealth = {
  mode: 'postgres' | 'file';
  database: boolean;
  ready: boolean;
  users?: number;
  projects?: number;
  checkedAt: string;
  detail?: string;
};

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  annualMonthlyPriceCents: number;
  includedUsers: number;
  maxProjects: number;
  maxAiMessagesMonthly: number;
  maxOcrPagesMonthly: number;
  features: string[];
  public: boolean;
  sortOrder: number;
};

export type CouponRecord = {
  code: string;
  planId: string;
  label: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  trialDays?: number;
  createdAt: string;
};

type SubscriptionRecord = {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  seats: number;
  startsAt: string;
  endsAt?: string | null;
  couponCode?: string | null;
  createdAt: string;
};

type TenantRecord = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
};

type SessionRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
};

type StoreData = {
  tenants: TenantRecord[];
  users: StoredUser[];
  sessions: SessionRecord[];
  projects: ProjectRecord[];
  plans: PricingPlan[];
  coupons: CouponRecord[];
  subscriptions: SubscriptionRecord[];
  couponRedemptions: Array<{
    id: string;
    code: string;
    tenantId: string;
    userId: string;
    redeemedAt: string;
  }>;
};

export interface SaasStore {
  readonly mode: 'postgres' | 'file';
  init(): Promise<void>;
  health(): Promise<SaasStoreHealth>;
  listPlans(): Promise<PricingPlan[]>;
  validateCoupon(code: string): Promise<{ valid: boolean; coupon?: CouponRecord; plan?: PricingPlan; reason?: string }>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    orgName?: string;
    couponCode?: string;
  }): Promise<PublicUser>;
  findUserByEmail(email: string): Promise<StoredUser | null>;
  getUserBySession(tokenHash: string): Promise<PublicUser | null>;
  createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  deleteSession(tokenHash: string): Promise<void>;
  listProjects(user: PublicUser): Promise<ProjectRecord[]>;
  getProject(user: PublicUser, id: string): Promise<ProjectRecord | null>;
  createProject(user: PublicUser, input: { name: string; state: any }): Promise<ProjectRecord>;
  updateProject(user: PublicUser, id: string, input: { name?: string; state?: any }): Promise<ProjectRecord | null>;
  deleteProject(user: PublicUser, id: string): Promise<boolean>;
}

function publicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    tenantId: user.tenantId,
    tenantName: user.tenantName || 'Cliente TLPlanly',
    name: user.name,
    email: user.email,
    role: user.role,
    planId: user.planId,
    planName: user.planName,
    planStatus: user.planStatus,
    planExpiresAt: user.planExpiresAt,
    seats: user.seats,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'trial_authorized',
    name: 'Teste Autorizado',
    description: 'Acesso controlado para demonstracao assistida por cupom.',
    monthlyPriceCents: 0,
    annualMonthlyPriceCents: 0,
    includedUsers: 1,
    maxProjects: 2,
    maxAiMessagesMonthly: 50,
    maxOcrPagesMonthly: 20,
    features: ['7 dias de avaliacao', 'Importacao limitada', 'SINAPI/SICRO/ORSE', 'Copilot limitado'],
    public: true,
    sortOrder: 10,
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Para engenheiro, arquiteto, orcamentista ou consultor individual.',
    monthlyPriceCents: 8900,
    annualMonthlyPriceCents: 6200,
    includedUsers: 1,
    maxProjects: 20,
    maxAiMessagesMonthly: 800,
    maxOcrPagesMonthly: 150,
    features: ['Orcamentos completos', 'Importacao Excel/PDF', 'BDI, encargos e curva ABC', 'Readequacao de proposta', 'Exportacao Excel/PDF'],
    public: true,
    sortOrder: 20,
  },
  {
    id: 'team',
    name: 'Equipe',
    description: 'Para pequenas equipes de engenharia e construtoras em crescimento.',
    monthlyPriceCents: 14990,
    annualMonthlyPriceCents: 10500,
    includedUsers: 3,
    maxProjects: 80,
    maxAiMessagesMonthly: 2500,
    maxOcrPagesMonthly: 500,
    features: ['Ate 3 usuarios', 'OCR em lote', 'Composicoes proprias', 'Auditoria SINAPI/BDI', 'Relatorios tecnicos'],
    public: true,
    sortOrder: 30,
  },
  {
    id: 'licitacoes_pro',
    name: 'Licitacoes Pro',
    description: 'Para empresas que atuam com pregoes, propostas e controle de conformidade.',
    monthlyPriceCents: 31400,
    annualMonthlyPriceCents: 21900,
    includedUsers: 5,
    maxProjects: 250,
    maxAiMessagesMonthly: 8000,
    maxOcrPagesMonthly: 1500,
    features: ['Ate 5 usuarios', 'Relatorio TCU/CGU', 'Readequacao avancada de propostas', 'Auditoria avancada', 'Prioridade em bases oficiais'],
    public: true,
    sortOrder: 40,
  },
  {
    id: 'public_control',
    name: 'Orgao Publico / Controle',
    description: 'Para fiscalizacao, controle interno, municipios e equipes com governanca.',
    monthlyPriceCents: 0,
    annualMonthlyPriceCents: 0,
    includedUsers: 10,
    maxProjects: 1000,
    maxAiMessagesMonthly: 20000,
    maxOcrPagesMonthly: 5000,
    features: ['Usuarios 10+', 'Ambiente isolado', 'Painel administrativo', 'Auditoria TCU/CGU', 'API e integracoes sob proposta'],
    public: true,
    sortOrder: 50,
  },
];

function normalizeCouponCode(code: string): string {
  return String(code || '').trim().toUpperCase();
}

function isCouponExpired(coupon: CouponRecord, now = new Date()): boolean {
  return !!coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now.getTime();
}

function couponReason(coupon: CouponRecord | null): string | null {
  if (!coupon) return 'Cupom nao encontrado.';
  if (!coupon.active) return 'Cupom inativo.';
  if (isCouponExpired(coupon)) return 'Cupom expirado.';
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return 'Cupom ja atingiu o limite de usos.';
  return null;
}

function publicPlans(plans: PricingPlan[]): PricingPlan[] {
  return plans.filter(plan => plan.public).sort((a, b) => a.sortOrder - b.sortOrder);
}

function addDaysIso(date: Date, days: number): string {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy.toISOString();
}

function mergePlans(existing: PricingPlan[] | undefined): PricingPlan[] {
  const byId = new Map(DEFAULT_PLANS.map(plan => [plan.id, plan]));
  (Array.isArray(existing) ? existing : []).forEach(plan => {
    if (plan?.id) byId.set(plan.id, { ...byId.get(plan.id), ...plan });
  });
  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function mergeCoupons(existing: CouponRecord[] | undefined, incoming: CouponRecord[]): CouponRecord[] {
  const byCode = new Map<string, CouponRecord>();
  (Array.isArray(existing) ? existing : []).forEach(coupon => {
    if (coupon?.code) byCode.set(normalizeCouponCode(coupon.code), { ...coupon, code: normalizeCouponCode(coupon.code) });
  });
  incoming.forEach(coupon => {
    const code = normalizeCouponCode(coupon.code);
    const previous = byCode.get(code);
    byCode.set(code, {
      ...coupon,
      code,
      usedCount: previous?.usedCount || 0,
      createdAt: previous?.createdAt || coupon.createdAt,
    });
  });
  return [...byCode.values()];
}

function configuredCoupons(): CouponRecord[] {
  const raw = process.env.TLPLANLY_REGISTRATION_COUPONS || process.env.REGISTRATION_COUPONS || '';
  const fallback = process.env.NODE_ENV === 'production'
    ? ''
    : 'TLPLANLY-DEMO-7D:trial_authorized:100:2026-12-31:7,TLPLANLY-PRO-2026:professional:50:2026-12-31:0,TLPLANLY-EQUIPE-2026:team:50:2026-12-31:0,TLPLANLY-LICITACOES-2026:licitacoes_pro:25:2026-12-31:0';
  const source = raw.trim() || fallback;
  if (!source) return [];
  return source.split(',').map(item => {
    const [code, planId, maxUsesRaw, expiresAtRaw, trialDaysRaw, ...labelParts] = item.split(':');
    const normalized = normalizeCouponCode(code);
    const plan = DEFAULT_PLANS.find(p => p.id === (planId || '').trim()) || DEFAULT_PLANS[0];
    const maxUses = Math.max(1, Number(maxUsesRaw) || 1);
    const expiresAt = (expiresAtRaw || '').trim()
      ? new Date(`${expiresAtRaw.trim()}T23:59:59.999Z`).toISOString()
      : null;
    return {
      code: normalized,
      planId: plan.id,
      label: labelParts.join(':').trim() || plan.name,
      active: !!normalized,
      maxUses,
      usedCount: 0,
      expiresAt,
      trialDays: Math.max(0, Number(trialDaysRaw) || 0),
      createdAt: nowIso(),
    };
  }).filter(coupon => coupon.code);
}

function defaultData(): StoreData {
  return {
    tenants: [],
    users: [],
    sessions: [],
    projects: [],
    plans: [...DEFAULT_PLANS],
    coupons: configuredCoupons(),
    subscriptions: [],
    couponRedemptions: [],
  };
}

export class FileSaasStore implements SaasStore {
  readonly mode = 'file' as const;
  private readonly filePath: string;
  private data: StoreData = defaultData();

  constructor(filePath = path.join(process.cwd(), '.tlplanly-data', 'saas-store.json')) {
    this.filePath = filePath;
  }

  async init(): Promise<void> {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (fs.existsSync(this.filePath)) {
      this.data = { ...defaultData(), ...JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) };
      this.data.plans = mergePlans(this.data.plans);
      this.data.coupons = mergeCoupons(this.data.coupons, configuredCoupons());
      this.data.subscriptions = Array.isArray(this.data.subscriptions) ? this.data.subscriptions : [];
      this.data.couponRedemptions = Array.isArray(this.data.couponRedemptions) ? this.data.couponRedemptions : [];
      this.data.users = this.data.users.map(user => ({
        ...user,
        tenantName: user.tenantName || this.data.tenants.find(tenant => tenant.id === user.tenantId)?.name || 'Cliente TLPlanly',
        ...this.userPlanInfo(user.tenantId),
      }));
      this.persist();
    } else {
      this.persist();
    }
  }

  async health(): Promise<SaasStoreHealth> {
    return {
      mode: this.mode,
      database: false,
      ready: true,
      users: this.data.users.length,
      projects: this.data.projects.length,
      checkedAt: nowIso(),
      detail: 'Persistencia local em arquivo. Configure DATABASE_URL para ativar PostgreSQL.',
    };
  }

  private persist(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  private userPlanInfo(tenantId: string): Pick<PublicUser, 'planId' | 'planName' | 'planStatus' | 'planExpiresAt' | 'seats'> {
    const subscription = this.data.subscriptions.find(sub => sub.tenantId === tenantId && sub.status === 'active');
    const plan = this.data.plans.find(p => p.id === subscription?.planId);
    return {
      planId: plan?.id || subscription?.planId || 'trial_authorized',
      planName: plan?.name || 'Teste Autorizado',
      planStatus: subscription?.status || 'active',
      planExpiresAt: subscription?.endsAt || null,
      seats: subscription?.seats || plan?.includedUsers || 1,
    };
  }

  async listPlans(): Promise<PricingPlan[]> {
    return publicPlans(this.data.plans);
  }

  async validateCoupon(code: string): Promise<{ valid: boolean; coupon?: CouponRecord; plan?: PricingPlan; reason?: string }> {
    const normalized = normalizeCouponCode(code);
    const coupon = this.data.coupons.find(item => item.code === normalized) || null;
    const reason = couponReason(coupon);
    if (reason || !coupon) return { valid: false, reason: reason || 'Cupom invalido.' };
    const plan = this.data.plans.find(item => item.id === coupon.planId);
    if (!plan) return { valid: false, reason: 'Plano vinculado ao cupom nao existe.' };
    return { valid: true, coupon, plan };
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    orgName?: string;
    couponCode?: string;
  }): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    if (this.data.users.some(user => user.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const validation = input.couponCode ? await this.validateCoupon(input.couponCode) : null;
    if (input.couponCode && !validation?.valid) {
      throw new Error(validation?.reason || 'Cupom invalido.');
    }
    const coupon = validation?.coupon;
    const plan = validation?.plan || this.data.plans.find(p => p.id === 'trial_authorized') || DEFAULT_PLANS[0];
    const endsAt = coupon?.trialDays ? addDaysIso(new Date(), coupon.trialDays) : null;
    const tenant: TenantRecord = {
      id: createId('ten'),
      name: input.orgName?.trim() || input.name.trim() || 'TLPlanly',
      plan: plan.id,
      createdAt: nowIso(),
    };
    const user: StoredUser = {
      id: createId('usr'),
      tenantId: tenant.id,
      tenantName: tenant.name,
      name: input.name.trim(),
      email,
      role: 'admin',
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      planId: plan.id,
      planName: plan.name,
      planStatus: 'active',
      planExpiresAt: endsAt,
      seats: plan.includedUsers,
    };
    const subscription: SubscriptionRecord = {
      id: createId('sub'),
      tenantId: tenant.id,
      planId: plan.id,
      status: 'active',
      seats: plan.includedUsers,
      startsAt: nowIso(),
      endsAt,
      couponCode: coupon?.code || null,
      createdAt: nowIso(),
    };
    this.data.tenants.push(tenant);
    this.data.users.push(user);
    this.data.subscriptions.push(subscription);
    if (coupon) {
      coupon.usedCount += 1;
      this.data.couponRedemptions.push({
        id: createId('red'),
        code: coupon.code,
        tenantId: tenant.id,
        userId: user.id,
        redeemedAt: nowIso(),
      });
    }
    this.persist();
    return publicUser(user);
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    return this.data.users.find(user => user.email === normalizeEmail(email)) || null;
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.data.sessions = this.data.sessions.filter(session => session.expiresAt > nowIso());
    this.data.sessions.push({ tokenHash, userId, expiresAt: expiresAt.toISOString(), createdAt: nowIso() });
    this.persist();
  }

  async getUserBySession(tokenHash: string): Promise<PublicUser | null> {
    const session = this.data.sessions.find(s => s.tokenHash === tokenHash && s.expiresAt > nowIso());
    if (!session) return null;
    const user = this.data.users.find(u => u.id === session.userId);
    return user ? publicUser(user) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter(session => session.tokenHash !== tokenHash);
    this.persist();
  }

  async listProjects(user: PublicUser): Promise<ProjectRecord[]> {
    return this.data.projects
      .filter(project => project.tenantId === user.tenantId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(user: PublicUser, id: string): Promise<ProjectRecord | null> {
    return this.data.projects.find(project => project.tenantId === user.tenantId && project.id === id) || null;
  }

  async createProject(user: PublicUser, input: { name: string; state: any }): Promise<ProjectRecord> {
    const timestamp = nowIso();
    const project: ProjectRecord = {
      id: createId('obra'),
      tenantId: user.tenantId,
      userId: user.id,
      name: input.name?.trim() || 'Orçamento TLPlanly',
      state: input.state || {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.data.projects.push(project);
    this.persist();
    return project;
  }

  async updateProject(user: PublicUser, id: string, input: { name?: string; state?: any }): Promise<ProjectRecord | null> {
    const project = await this.getProject(user, id);
    if (!project) return null;
    if (input.name !== undefined) project.name = input.name.trim() || project.name;
    if (input.state !== undefined) project.state = input.state;
    project.updatedAt = nowIso();
    this.persist();
    return project;
  }

  async deleteProject(user: PublicUser, id: string): Promise<boolean> {
    const before = this.data.projects.length;
    this.data.projects = this.data.projects.filter(project => !(project.tenantId === user.tenantId && project.id === id));
    this.persist();
    return this.data.projects.length !== before;
  }
}

export class PostgresSaasStore implements SaasStore {
  readonly mode = 'postgres' as const;
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }

  async init(): Promise<void> {
    await this.pool.query(`
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
      create index if not exists saas_projects_tenant_updated_idx on saas_projects (tenant_id, updated_at desc);
      create index if not exists saas_sessions_expires_idx on saas_sessions (expires_at);
      create index if not exists saas_subscriptions_tenant_status_idx on saas_subscriptions (tenant_id, status);
      create index if not exists saas_coupon_redemptions_code_idx on saas_coupon_redemptions (code);
      insert into saas_schema_migrations (version) values ('2026-06-12-saas-core')
      on conflict (version) do nothing;
      insert into saas_schema_migrations (version) values ('2026-06-15-plans-coupons')
      on conflict (version) do nothing;
      delete from saas_sessions where expires_at <= now();
    `);
    await this.seedPlans();
    await this.seedConfiguredCoupons();
  }

  private async seedPlans(): Promise<void> {
    for (const plan of DEFAULT_PLANS) {
      await this.pool.query(
        `insert into saas_plans
          (id, name, description, monthly_price_cents, annual_monthly_price_cents, included_users,
           max_projects, max_ai_messages_monthly, max_ocr_pages_monthly, features, public, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12)
         on conflict (id) do update set
           name = excluded.name,
           description = excluded.description,
           monthly_price_cents = excluded.monthly_price_cents,
           annual_monthly_price_cents = excluded.annual_monthly_price_cents,
           included_users = excluded.included_users,
           max_projects = excluded.max_projects,
           max_ai_messages_monthly = excluded.max_ai_messages_monthly,
           max_ocr_pages_monthly = excluded.max_ocr_pages_monthly,
           features = excluded.features,
           public = excluded.public,
           sort_order = excluded.sort_order`,
        [
          plan.id,
          plan.name,
          plan.description,
          plan.monthlyPriceCents,
          plan.annualMonthlyPriceCents,
          plan.includedUsers,
          plan.maxProjects,
          plan.maxAiMessagesMonthly,
          plan.maxOcrPagesMonthly,
          JSON.stringify(plan.features),
          plan.public,
          plan.sortOrder,
        ]
      );
    }
  }

  private async seedConfiguredCoupons(): Promise<void> {
    for (const coupon of configuredCoupons()) {
      await this.pool.query(
        `insert into saas_coupons
          (code, plan_id, label, active, max_uses, used_count, expires_at, trial_days)
         values ($1,$2,$3,$4,$5,0,$6,$7)
         on conflict (code) do update set
           plan_id = excluded.plan_id,
           label = excluded.label,
           active = excluded.active,
           max_uses = excluded.max_uses,
           expires_at = excluded.expires_at,
           trial_days = excluded.trial_days`,
        [
          coupon.code,
          coupon.planId,
          coupon.label,
          coupon.active,
          coupon.maxUses,
          coupon.expiresAt || null,
          coupon.trialDays || 0,
        ]
      );
    }
  }

  async listPlans(): Promise<PricingPlan[]> {
    const result = await this.pool.query(
      `select id, name, description, monthly_price_cents, annual_monthly_price_cents,
              included_users, max_projects, max_ai_messages_monthly, max_ocr_pages_monthly,
              features, public, sort_order
       from saas_plans
       where public = true
       order by sort_order asc`
    );
    return result.rows.map(rowToPlan);
  }

  async validateCoupon(code: string): Promise<{ valid: boolean; coupon?: CouponRecord; plan?: PricingPlan; reason?: string }> {
    const normalized = normalizeCouponCode(code);
    const result = await this.pool.query(
      `select c.code, c.plan_id, c.label, c.active, c.max_uses, c.used_count, c.expires_at, c.trial_days, c.created_at,
              p.id as p_id, p.name as p_name, p.description as p_description,
              p.monthly_price_cents, p.annual_monthly_price_cents, p.included_users,
              p.max_projects, p.max_ai_messages_monthly, p.max_ocr_pages_monthly,
              p.features, p.public, p.sort_order
       from saas_coupons c
       join saas_plans p on p.id = c.plan_id
       where c.code = $1
       limit 1`,
      [normalized]
    );
    const row = result.rows[0];
    if (!row) return { valid: false, reason: 'Cupom nao encontrado.' };
    const coupon = rowToCoupon(row);
    const reason = couponReason(coupon);
    if (reason) return { valid: false, coupon, plan: rowToPlanFromCouponJoin(row), reason };
    return { valid: true, coupon, plan: rowToPlanFromCouponJoin(row) };
  }

  async health(): Promise<SaasStoreHealth> {
    try {
      const result = await this.pool.query(`
        select
          (select count(*)::int from saas_users) as users,
          (select count(*)::int from saas_projects) as projects
      `);
      return {
        mode: this.mode,
        database: true,
        ready: true,
        users: Number(result.rows[0]?.users || 0),
        projects: Number(result.rows[0]?.projects || 0),
        checkedAt: nowIso(),
      };
    } catch (err: any) {
      return {
        mode: this.mode,
        database: true,
        ready: false,
        checkedAt: nowIso(),
        detail: err?.message || 'Falha ao consultar PostgreSQL.',
      };
    }
  }

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    orgName?: string;
    couponCode?: string;
  }): Promise<PublicUser> {
    const tenantId = createId('ten');
    const userId = createId('usr');
    const email = normalizeEmail(input.email);
    const tenantName = input.orgName?.trim() || input.name.trim() || 'TLPlanly';
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const normalizedCoupon = normalizeCouponCode(input.couponCode || '');
      if (!normalizedCoupon) throw new Error('Cupom de autorizacao obrigatorio.');
      const couponResult = await client.query(
        `select c.code, c.plan_id, c.label, c.active, c.max_uses, c.used_count, c.expires_at, c.trial_days, c.created_at,
                p.id as p_id, p.name as p_name, p.description as p_description,
                p.monthly_price_cents, p.annual_monthly_price_cents, p.included_users,
                p.max_projects, p.max_ai_messages_monthly, p.max_ocr_pages_monthly,
                p.features, p.public, p.sort_order
         from saas_coupons c
         join saas_plans p on p.id = c.plan_id
         where c.code = $1
         for update of c`,
        [normalizedCoupon]
      );
      const couponRow = couponResult.rows[0];
      const coupon = couponRow ? rowToCoupon(couponRow) : null;
      const reason = couponReason(coupon);
      if (reason || !couponRow || !coupon) throw new Error(reason || 'Cupom invalido.');
      const plan = rowToPlanFromCouponJoin(couponRow);
      const subscriptionId = createId('sub');
      const redemptionId = createId('red');
      const endsAt = coupon.trialDays ? addDaysIso(new Date(), coupon.trialDays) : null;
      await client.query(
        'insert into saas_tenants (id, name, plan) values ($1, $2, $3)',
        [tenantId, tenantName, plan.id]
      );
      const result = await client.query(
        `insert into saas_users (id, tenant_id, name, email, role, password_hash, password_salt)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, tenant_id, $8::text as tenant_name, name, email, role,
                   $9::text as plan_id, $10::text as plan_name, 'active'::text as plan_status,
                   $11::timestamptz as plan_expires_at, $12::int as seats`,
        [userId, tenantId, input.name.trim(), email, 'admin', input.passwordHash, input.passwordSalt, tenantName, plan.id, plan.name, endsAt, plan.includedUsers]
      );
      await client.query(
        `insert into saas_subscriptions (id, tenant_id, plan_id, status, seats, starts_at, ends_at, coupon_code)
         values ($1, $2, $3, 'active', $4, now(), $5, $6)`,
        [subscriptionId, tenantId, plan.id, plan.includedUsers, endsAt, coupon.code]
      );
      await client.query(
        `insert into saas_coupon_redemptions (id, code, tenant_id, user_id)
         values ($1, $2, $3, $4)`,
        [redemptionId, coupon.code, tenantId, userId]
      );
      await client.query(
        'update saas_coupons set used_count = used_count + 1 where code = $1',
        [coupon.code]
      );
      await client.query('commit');
      return rowToPublicUser(result.rows[0]);
    } catch (err: any) {
      await client.query('rollback');
      if (String(err?.message || '').includes('duplicate')) throw new Error('Este e-mail já está cadastrado.');
      throw err;
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const result = await this.pool.query(
      `select u.id, u.tenant_id, t.name as tenant_name, u.name, u.email, u.role, u.password_hash, u.password_salt,
              p.id as plan_id, p.name as plan_name, s.status as plan_status, s.ends_at as plan_expires_at, s.seats
       from saas_users u
       join saas_tenants t on t.id = u.tenant_id
       left join saas_subscriptions s on s.tenant_id = u.tenant_id and s.status = 'active'
       left join saas_plans p on p.id = s.plan_id
       where u.email = $1 limit 1`,
      [normalizeEmail(email)]
    );
    if (!result.rows[0]) return null;
    return rowToStoredUser(result.rows[0]);
  }

  async createSession(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.pool.query(
      `insert into saas_sessions (token_hash, user_id, expires_at)
       values ($1, $2, $3)
       on conflict (token_hash) do update set user_id = excluded.user_id, expires_at = excluded.expires_at`,
      [tokenHash, userId, expiresAt.toISOString()]
    );
  }

  async getUserBySession(tokenHash: string): Promise<PublicUser | null> {
    const result = await this.pool.query(
      `select u.id, u.tenant_id, t.name as tenant_name, u.name, u.email, u.role,
              p.id as plan_id, p.name as plan_name, sub.status as plan_status, sub.ends_at as plan_expires_at, sub.seats
       from saas_sessions s
       join saas_users u on u.id = s.user_id
       join saas_tenants t on t.id = u.tenant_id
       left join saas_subscriptions sub on sub.tenant_id = u.tenant_id and sub.status = 'active'
       left join saas_plans p on p.id = sub.plan_id
       where s.token_hash = $1 and s.expires_at > now()
       limit 1`,
      [tokenHash]
    );
    return result.rows[0] ? rowToPublicUser(result.rows[0]) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.pool.query('delete from saas_sessions where token_hash = $1', [tokenHash]);
  }

  async listProjects(user: PublicUser): Promise<ProjectRecord[]> {
    const result = await this.pool.query(
      `select id, tenant_id, user_id, name, state, created_at, updated_at
       from saas_projects where tenant_id = $1 order by updated_at desc`,
      [user.tenantId]
    );
    return result.rows.map(rowToProject);
  }

  async getProject(user: PublicUser, id: string): Promise<ProjectRecord | null> {
    const result = await this.pool.query(
      `select id, tenant_id, user_id, name, state, created_at, updated_at
       from saas_projects where tenant_id = $1 and id = $2 limit 1`,
      [user.tenantId, id]
    );
    return result.rows[0] ? rowToProject(result.rows[0]) : null;
  }

  async createProject(user: PublicUser, input: { name: string; state: any }): Promise<ProjectRecord> {
    const id = createId('obra');
    const result = await this.pool.query(
      `insert into saas_projects (id, tenant_id, user_id, name, state)
       values ($1, $2, $3, $4, $5::jsonb)
       returning id, tenant_id, user_id, name, state, created_at, updated_at`,
      [id, user.tenantId, user.id, input.name?.trim() || 'Orçamento TLPlanly', JSON.stringify(input.state || {})]
    );
    return rowToProject(result.rows[0]);
  }

  async updateProject(user: PublicUser, id: string, input: { name?: string; state?: any }): Promise<ProjectRecord | null> {
    const current = await this.getProject(user, id);
    if (!current) return null;
    const name = input.name !== undefined ? input.name.trim() || current.name : current.name;
    const state = input.state !== undefined ? input.state : current.state;
    const result = await this.pool.query(
      `update saas_projects
       set name = $3, state = $4::jsonb, updated_at = now()
       where tenant_id = $1 and id = $2
       returning id, tenant_id, user_id, name, state, created_at, updated_at`,
      [user.tenantId, id, name, JSON.stringify(state || {})]
    );
    return result.rows[0] ? rowToProject(result.rows[0]) : null;
  }

  async deleteProject(user: PublicUser, id: string): Promise<boolean> {
    const result = await this.pool.query(
      'delete from saas_projects where tenant_id = $1 and id = $2',
      [user.tenantId, id]
    );
    return (result.rowCount || 0) > 0;
  }
}

function rowToPublicUser(row: any): PublicUser {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name || 'Cliente TLPlanly',
    name: row.name,
    email: row.email,
    role: row.role,
    planId: row.plan_id || undefined,
    planName: row.plan_name || undefined,
    planStatus: row.plan_status || undefined,
    planExpiresAt: row.plan_expires_at instanceof Date ? row.plan_expires_at.toISOString() : row.plan_expires_at || null,
    seats: row.seats ? Number(row.seats) : undefined,
  };
}

function rowToStoredUser(row: any): StoredUser {
  return {
    ...rowToPublicUser(row),
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
  };
}

function rowToProject(row: any): ProjectRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    name: row.name,
    state: row.state || {},
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function rowToPlan(row: any): PricingPlan {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    monthlyPriceCents: Number(row.monthly_price_cents || 0),
    annualMonthlyPriceCents: Number(row.annual_monthly_price_cents || 0),
    includedUsers: Number(row.included_users || 1),
    maxProjects: Number(row.max_projects || 0),
    maxAiMessagesMonthly: Number(row.max_ai_messages_monthly || 0),
    maxOcrPagesMonthly: Number(row.max_ocr_pages_monthly || 0),
    features: Array.isArray(row.features) ? row.features : [],
    public: row.public !== false,
    sortOrder: Number(row.sort_order || 100),
  };
}

function rowToPlanFromCouponJoin(row: any): PricingPlan {
  return rowToPlan({
    id: row.p_id,
    name: row.p_name,
    description: row.p_description,
    monthly_price_cents: row.monthly_price_cents,
    annual_monthly_price_cents: row.annual_monthly_price_cents,
    included_users: row.included_users,
    max_projects: row.max_projects,
    max_ai_messages_monthly: row.max_ai_messages_monthly,
    max_ocr_pages_monthly: row.max_ocr_pages_monthly,
    features: row.features,
    public: row.public,
    sort_order: row.sort_order,
  });
}

function rowToCoupon(row: any): CouponRecord {
  return {
    code: row.code,
    planId: row.plan_id,
    label: row.label || '',
    active: row.active !== false,
    maxUses: Number(row.max_uses || 1),
    usedCount: Number(row.used_count || 0),
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at || null,
    trialDays: Number(row.trial_days || 0),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at || nowIso(),
  };
}

export function createSaasStore(): SaasStore {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? new PostgresSaasStore(databaseUrl) : new FileSaasStore();
}
