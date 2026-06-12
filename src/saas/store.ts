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
};

export interface SaasStore {
  readonly mode: 'postgres' | 'file';
  init(): Promise<void>;
  health(): Promise<SaasStoreHealth>;
  createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    orgName?: string;
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
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultData(): StoreData {
  return { tenants: [], users: [], sessions: [], projects: [] };
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
      this.data.users = this.data.users.map(user => ({
        ...user,
        tenantName: user.tenantName || this.data.tenants.find(tenant => tenant.id === user.tenantId)?.name || 'Cliente TLPlanly',
      }));
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

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    orgName?: string;
  }): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    if (this.data.users.some(user => user.email === email)) {
      throw new Error('Este e-mail já está cadastrado.');
    }
    const tenant: TenantRecord = {
      id: createId('ten'),
      name: input.orgName?.trim() || input.name.trim() || 'TLPlanly',
      plan: 'trial',
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
    };
    this.data.tenants.push(tenant);
    this.data.users.push(user);
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
      create index if not exists saas_projects_tenant_updated_idx on saas_projects (tenant_id, updated_at desc);
      create index if not exists saas_sessions_expires_idx on saas_sessions (expires_at);
      insert into saas_schema_migrations (version) values ('2026-06-12-saas-core')
      on conflict (version) do nothing;
      delete from saas_sessions where expires_at <= now();
    `);
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
  }): Promise<PublicUser> {
    const tenantId = createId('ten');
    const userId = createId('usr');
    const email = normalizeEmail(input.email);
    const tenantName = input.orgName?.trim() || input.name.trim() || 'TLPlanly';
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      await client.query(
        'insert into saas_tenants (id, name, plan) values ($1, $2, $3)',
        [tenantId, tenantName, 'trial']
      );
      const result = await client.query(
        `insert into saas_users (id, tenant_id, name, email, role, password_hash, password_salt)
         values ($1, $2, $3, $4, $5, $6, $7)
         returning id, tenant_id, $8::text as tenant_name, name, email, role`,
        [userId, tenantId, input.name.trim(), email, 'admin', input.passwordHash, input.passwordSalt, tenantName]
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
      `select u.id, u.tenant_id, t.name as tenant_name, u.name, u.email, u.role, u.password_hash, u.password_salt
       from saas_users u
       join saas_tenants t on t.id = u.tenant_id
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
      `select u.id, u.tenant_id, t.name as tenant_name, u.name, u.email, u.role
       from saas_sessions s
       join saas_users u on u.id = s.user_id
       join saas_tenants t on t.id = u.tenant_id
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

export function createSaasStore(): SaasStore {
  const databaseUrl = process.env.DATABASE_URL;
  return databaseUrl ? new PostgresSaasStore(databaseUrl) : new FileSaasStore();
}
