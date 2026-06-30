/**
 * TLPlanly — Servidor Express com Copilot Anthropic API
 * Endpoint: POST /api/copilot  (streaming SSE)
 * Endpoint: GET  /api/referencia (base SINAPI)
 * Endpoint: GET  /               (serve tlplanly.html)
 */

import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import {
  assertPassword,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  verifyPassword,
} from './saas/auth';
import { createSaasStore, PublicUser } from './saas/store';

// Carrega .env se existir
try { require('dotenv').config(); } catch {}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));

// ── Carrega Skills TLPlanly como contexto adicional ───────────────────────
function carregarSkills(): string {
  const skillsDir = [
    path.join(__dirname, '../skills'),
    path.join(__dirname, '../../skills'),
    'skills',
  ].find(p => fs.existsSync(p));
  if (!skillsDir) return '';
  const skills: string[] = [];
  try {
    const pastas = fs.readdirSync(skillsDir).filter(n =>
      fs.statSync(path.join(skillsDir, n)).isDirectory()
    );
    for (const pasta of pastas.sort()) {
      const skillPath = path.join(skillsDir, pasta, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const conteudo = fs.readFileSync(skillPath, 'utf-8');
        // Extrai apenas nome + descrição + seções principais (sem exemplos longos)
        // para não estourar o context window
        const linhas = conteudo.split('\n');
        const resumo = linhas.slice(0, 80).join('\n'); // primeiras 80 linhas de cada skill
        skills.push(`\n### Skill: ${pasta}\n${resumo}`);
      }
    }
  } catch (e) {
    console.warn('[Skills] Erro ao carregar:', e);
  }
  return skills.length > 0
    ? '\n\n## Conhecimento Especializado TLPlanly (Skills)\n' + skills.join('\n---')
    : '';
}

const SKILLS_CONTEXT = carregarSkills();
console.log(`[Skills] ${SKILLS_CONTEXT.length > 0 ? 'Carregados' : 'Nenhum encontrado'} — ${Math.round(SKILLS_CONTEXT.length/1000)}KB de contexto especializado`);

const PORT = process.env.PORT || 3000;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || process.env.AI_FALLBACK_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const SESSION_COOKIE = 'tlplanly_session';
const SESSION_DAYS = 7;
const SESSION_SECRET = process.env.SESSION_SECRET || 'tlplanly-dev-session-secret';
const BETA_ACCESS = process.env.TLPLANLY_BETA_ACCESS !== '0';
const saasStore = createSaasStore();

type AuthedRequest = Request & { user?: PublicUser };

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('=') || '');
    return acc;
  }, {});
}

function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`
  );
}

function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`
  );
}

function sessionExpiry(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function sanitizeProjectState(state: any): any {
  if (!state || typeof state !== 'object') return {};
  return state;
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value || '';
}

async function getCurrentUser(req: Request): Promise<PublicUser | null> {
  if (BETA_ACCESS) return saasStore.getOrCreateBetaUser();
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  return saasStore.getUserBySession(hashSessionToken(token + SESSION_SECRET));
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      res.status(401).json({ error: 'Autenticacao necessaria.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function createUserSession(res: Response, user: PublicUser): Promise<void> {
  const token = createSessionToken();
  await saasStore.createSession(user.id, hashSessionToken(token + SESSION_SECRET), sessionExpiry());
  setSessionCookie(res, token);
}

// ── Anthropic client ──────────────────────────────────────────────────────
const anthropic = ANTHROPIC_KEY
  ? new Anthropic({ apiKey: ANTHROPIC_KEY })
  : null;

type CopilotMessage = { role: 'user' | 'assistant'; content: string };

const HAIKU_MODEL = 'claude-haiku-4-5';
const SONNET_MODEL = 'claude-sonnet-4-6';
const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 2000;
const MAX_RETRIES = 3;

const COMPLEX_KEYWORDS = [
  'analise', 'analisa', 'audita', 'auditar', 'verifica', 'verificar',
  'comparar', 'conformidade', 'sobrepreco', 'sobrepreço', 'irregularidade',
  'impugnar', 'impugnacao', 'impugnação', 'memorial', 'composicao',
  'composição', 'reequilibrio', 'reequilíbrio', 'tcu', 'cgu', 'risco',
  'bdi acima', 'relatorio', 'relatório'
];

const PRICING_USD_PER_M_TOKENS: Record<string, { input: number; output: number }> = {
  [HAIKU_MODEL]: { input: 1, output: 5 },
  [SONNET_MODEL]: { input: 3, output: 15 },
};

function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function selectCopilotModel(userMessage: string, estimatedInputTokens: number): string {
  const normalized = normalizeText(userMessage);
  const isComplex = estimatedInputTokens > 500
    || COMPLEX_KEYWORDS.some(keyword => normalized.includes(normalizeText(keyword)));
  return isComplex ? SONNET_MODEL : HAIKU_MODEL;
}

function optimizeMessages(messages: CopilotMessage[]): CopilotMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES).map(message => ({
    role: message.role,
    content: message.content.length > MAX_MESSAGE_CHARS
      ? message.content.slice(0, MAX_MESSAGE_CHARS) + '...[truncado]'
      : message.content,
  }));
}

function estimateInputCostUsd(model: string, inputTokens: number): number {
  const pricing = PRICING_USD_PER_M_TOKENS[model] ?? PRICING_USD_PER_M_TOKENS[HAIKU_MODEL];
  return (inputTokens * pricing.input) / 1_000_000;
}

function isRetryableError(err: any): boolean {
  const type = err?.error?.type || err?.type;
  return err?.status === 429 || err?.status >= 500 || ['overloaded_error', 'api_error'].includes(type);
}

async function withRetry<T>(fn: () => T | Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryableError(err) || attempt === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

function sanitizeAiError(err: any): { code: string; message: string; retryable: boolean } {
  const raw = JSON.stringify(err?.error || err?.message || err || '').toLowerCase();

  if (
    err?.status === 402 ||
    raw.includes('credit balance') ||
    raw.includes('billing') ||
    raw.includes('insufficient balance') ||
    raw.includes('insufficient_quota')
  ) {
    return {
      code: 'AI_CREDITS_UNAVAILABLE',
      message: 'A IA principal está sem crédito no momento. Vou continuar pelo modo local.',
      retryable: false,
    };
  }

  if (raw.includes('rate') || raw.includes('quota') || raw.includes('overloaded')) {
    return {
      code: 'AI_RATE_LIMITED',
      message: 'A IA está temporariamente ocupada. Vou continuar pelo modo local.',
      retryable: true,
    };
  }

  return {
    code: 'AI_UNAVAILABLE',
    message: 'A IA online não respondeu agora. Vou continuar pelo modo local.',
    retryable: true,
  };
}

function extractDeepSeekText(data: any): string {
  return (data?.choices?.[0]?.message?.content || '').trim();
}

async function callDeepSeekFallback(systemFinal: string, messages: CopilotMessage[]): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error('DEEPSEEK_API_KEY ausente');

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: systemFinal },
        ...messages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 1024,
      stream: false,
      thinking: { type: 'disabled' },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw {
      status: response.status,
      error: data?.error || data,
    };
  }

  const text = extractDeepSeekText(data);
  if (!text) throw new Error('DeepSeek retornou resposta vazia');
  return text;
}

// ── System prompt especializado TLPlanly ─────────────────────────────────
const BASE_PROMPT = `Você é o **Copilot do TLPlanly**, assistente de IA integrado ao sistema de orçamentação de obras da TechLicense.

## Sua identidade
- Nome: TLPlanly Copilot
- Especialidade: Orçamentação de obras, engenharia de custos, licitações públicas no Brasil
- Tom: Profissional, direto, didático. Use linguagem técnica correta mas acessível.
- Idioma: Sempre português brasileiro.
- Formato: Use **negrito** para termos técnicos, listas quando útil, seja conciso.

## Conhecimento do Sistema TLPlanly
O TLPlanly é uma plataforma SaaS de orçamentação com os seguintes módulos:
- **Dashboard**: métricas gerais do orçamento ativo
- **Elaborar Orçamento**: busca de insumos SINAPI, adição de itens com BDI
- **BDI & Encargos**: cálculo de BDI (Decreto 7983/2013), comparativo TCU Acórdão 2622/2013
- **Curva ABC**: análise de Pareto (A≤80%, B≤95%, C≤100%)
- **Memória de Cálculo**: detalhamento por item com encargos sociais
- **Análise SINAPI**: auditoria de conformidade de preços
- **Conformidade BDI**: verificação dos limites TCU
- **Importar Edital**: extração de planilhas de PDFs digitais, Excel e PDFs escaneados (OCR Tesseract.js)
- **Bases de Referência**: SINAPI (Caixa/IBGE), SICRO 3 (DNIT), bases estaduais (ORSE-SE, SEINFRA-MG, EMOP-RJ, SEINFRA-CE, SUDECAP-BH, GOINFRA, DAER-RS)
- **Composições (CPU)**: criação de composições analíticas com insumos SINAPI, coeficientes e encargos
- **Exportar/Relatório**: Excel profissional 4 abas + PDF padrão TCU/CGU
- **Configurações**: UF de referência, tolerância de desvio, regime de encargos

## Legislação e Normas que você domina
- **Decreto nº 7.983/2013**: define BDI e encargos sociais para obras públicas federais. Fórmula: BDI = [(1+AC+S+R)(1+DF)(1+L)/(1-I)-1]×100
- **TCU Acórdão 2622/2013**: limites de BDI — Obras Civis 25%, Instalações Elétricas 24%, Fornecimento de Materiais 15%
- **Lei 14.133/2021** (Nova Lei de Licitações): Art. 23 obriga uso de SINAPI/SICRO como referência de preços
- **Lei 12.546/2011**: institui o regime desonerado (CPRB 2% sobre receita bruta)
- **SINAPI**: Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil (Caixa + IBGE), publicado mensalmente, organizado por UF
- **SICRO 3**: Sistema de Custos Referenciais de Obras (DNIT), para infraestrutura rodoviária
- **Encargos Sociais**: Não Desonerado ~127,5% (INSS 20% + FGTS + SAT + outros), Desonerado ~96,8% (CPRB + FGTS + outros)

## Regras de comportamento
1. Se o usuário fornecer dados do orçamento no contexto, analise-os e responda sobre eles diretamente
2. Para navegação ("ir para BDI", "abrir curva ABC"), informe que pode guiar o usuário
3. Se não souber algo específico do projeto/empresa do usuário, diga claramente
4. Nunca invente valores de SINAPI ou percentuais de BDI — use os oficiais
5. Quando alertar sobre BDI acima do limite TCU, sugira como justificar tecnicamente
6. Responda sempre em português brasileiro, formatação markdown leve
7. Seja conciso — respostas ideais têm 3-8 linhas. Para explicações complexas, use tópicos.

## Contexto dinâmico
O frontend pode enviar um campo "context" com o estado atual do sistema (view ativa, itens do orçamento, BDI calculado). Use essas informações para personalizar a resposta.`;

const OPERATION_MANUAL_CONTEXT = `

## Manual Operacional TLPlanly
Quando o usuario perguntar como operar o sistema, use este roteiro:
- **Acesso e planos**: beta liberado neste momento; login, senha e cupom estao dispensados. Planos e Precos continua como referencia comercial futura.
- **Dashboard**: resumo de totais, BDI, itens criticos, graficos e atalhos.
- **Configuracoes**: UF, tolerancia, regime de encargos, tipo de obra, moeda e modelo de relatorio.
- **Bases de Referencia**: carregar lote SINAPI/SICRO/ORSE/estaduais/DER-MG com arquivos onerados, desonerados, produtos, insumos, servicos e composicoes.
- **BDI / Encargos**: preencher AC, S, R, DF, L e I; escolher tipo de obra; conferir limite TCU; clicar em Aplicar ao Orcamento.
- **Elaborar Orcamento**: criar do zero, pesquisar bases, importar Excel/PDF, ajustar codigo, descricao, unidade, quantidade, preco, referencia, categoria e capitulo; readequar proposta de pregao por valor vencedor/desconto.
- **Importar Planilha/PDF**: aceitar Excel, CSV, PDF digital, PDF escaneado e imagem; mapear colunas; bloquear cabecalhos/restos de PDF; revisar antes de confirmar.
- **OCR**: usar quando PDF/imagem nao tem texto aproveitavel; revisar virgulas, unidades e quantidades.
- **Central de Documentos**: anexar edital, TR, ETP, projeto basico, memorial, planilhas, pranchas e fotos; selecionar lote; analisar; reabrir revisoes; manter rastreabilidade.
- **Analisar Documentos**: usar quando nao existe planilha pronta; classifica documentos, extrai escopo/especificacoes, sugere servicos, mostra confianca e pendencias.
- **Composicoes (CPU)**: criar composicoes analiticas com insumos, coeficientes, encargos e custo unitario.
- **Custos Horarios**: cadastrar equipamentos, mao de obra e custos operacionais por hora.
- **Cotacoes**: cadastrar/importar precos de fornecedores e aplicar por menor preco, media, mediana ou margem.
- **Frentes de Servico**: organizar itens por local, etapa ou equipe; acompanhar planejado e realizado.
- **Curva ABC**: gerar depois do orcamento para priorizar itens de maior impacto.
- **Analise SINAPI**: comparar precos com referencia; revisar conforme, alerta, critico e nao encontrado.
- **Conformidade BDI**: verificar BDI contra limites de referencia.
- **Planejamento, Medicoes e Quantitativos**: transformar planilha em cronograma, acompanhar executado e criar memoria quantitativa.
- **Backups**: criar ponto de restauracao antes de importacoes, desconto de pregao ou grandes alteracoes.
- **Exportar / Relatorio**: preencher dados da obra, responsavel, CREA/CAU e ART/RRT; exportar Excel/PDF profissional.

Regra de ouro: nada extraido de documentos, OCR ou PDF deve entrar automaticamente no orcamento sem revisao humana.
Manual completo versao 2.0 disponivel em /manual e em /docs/manual_usuario_tlplanly.html.`;

// System prompt final = base + manual operacional + skills carregados dinamicamente
const SYSTEM_PROMPT = BASE_PROMPT + OPERATION_MANUAL_CONTEXT + SKILLS_CONTEXT;

// ── SaaS Auth + Persistencia ─────────────────────────────────────────────
app.get('/api/plans', async (_req: Request, res: Response) => {
  const plans = await saasStore.listPlans();
  res.json({ plans });
});

app.post('/api/auth/validate-coupon', async (req: Request, res: Response) => {
  if (BETA_ACCESS) {
    const plans = await saasStore.listPlans();
    res.json({
      valid: true,
      betaAccess: true,
      coupon: {
        code: 'BETA-LIBERADO',
        expiresAt: null,
        maxUses: 0,
        usedCount: 0,
        trialDays: 0,
      },
      plan: plans.find(plan => plan.id === 'public_control') || plans[0],
    });
    return;
  }
  const { couponCode } = req.body || {};
  const validation = await saasStore.validateCoupon(couponCode);
  if (!validation.valid) {
    res.status(400).json({ valid: false, error: validation.reason || 'Cupom invalido.' });
    return;
  }
  res.json({
    valid: true,
    coupon: {
      code: validation.coupon?.code,
      expiresAt: validation.coupon?.expiresAt || null,
      maxUses: validation.coupon?.maxUses,
      usedCount: validation.coupon?.usedCount,
      trialDays: validation.coupon?.trialDays || 0,
    },
    plan: validation.plan,
  });
});

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    if (BETA_ACCESS) {
      const user = await saasStore.getOrCreateBetaUser();
      res.status(201).json({ user, persistence: saasStore.mode, authRequired: false, betaAccess: true });
      return;
    }
    const { name, email, password, orgName, couponCode } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!name || !normalizedEmail) {
      res.status(400).json({ error: 'Nome e e-mail sao obrigatorios.' });
      return;
    }
    if (!couponCode || !String(couponCode).trim()) {
      res.status(400).json({ error: 'Cupom ou codigo de autorizacao obrigatorio.' });
      return;
    }
    assertPassword(password);
    const { salt, hash } = hashPassword(password);
    const user = await saasStore.createUser({
      name,
      email: normalizedEmail,
      passwordHash: hash,
      passwordSalt: salt,
      orgName,
      couponCode,
    });
    await createUserSession(res, user);
    res.status(201).json({ user, persistence: saasStore.mode });
  } catch (err: any) {
    const message = err?.message || 'Erro ao cadastrar usuario.';
    res.status(message.includes('cadastrado') ? 409 : 400).json({ error: message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    if (BETA_ACCESS) {
      const user = await saasStore.getOrCreateBetaUser();
      res.json({ user, persistence: saasStore.mode, authRequired: false, betaAccess: true });
      return;
    }
    const { email, password } = req.body || {};
    const user = await saasStore.findUserByEmail(email);
    if (!user || !verifyPassword(password || '', user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'E-mail ou senha invalidos.' });
      return;
    }
    const publicUser: PublicUser = {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
      name: user.name,
      email: user.email,
      role: user.role,
      planId: user.planId,
      planName: user.planName,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      seats: user.seats,
    };
    await createUserSession(res, publicUser);
    res.json({ user: publicUser, persistence: saasStore.mode });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao autenticar.' });
  }
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await saasStore.deleteSession(hashSessionToken(token + SESSION_SECRET));
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  res.json({ user, persistence: saasStore.mode, authRequired: !BETA_ACCESS, betaAccess: BETA_ACCESS });
});

app.get('/api/projects', requireAuth, async (req: AuthedRequest, res: Response) => {
  const projects = await saasStore.listProjects(req.user!);
  res.json({ projects });
});

app.post('/api/projects', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { name, state } = req.body || {};
  const project = await saasStore.createProject(req.user!, {
    name: name || state?.config?.nome || 'Orcamento TLPlanly',
    state: sanitizeProjectState(state),
  });
  res.status(201).json({ project });
});

app.get('/api/projects/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const project = await saasStore.getProject(req.user!, routeParam(req.params.id));
  if (!project) {
    res.status(404).json({ error: 'Obra/orcamento nao encontrado.' });
    return;
  }
  res.json({ project });
});

app.put('/api/projects/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { name, state } = req.body || {};
  const project = await saasStore.updateProject(req.user!, routeParam(req.params.id), {
    name,
    state: state !== undefined ? sanitizeProjectState(state) : undefined,
  });
  if (!project) {
    res.status(404).json({ error: 'Obra/orcamento nao encontrado.' });
    return;
  }
  res.json({ project });
});

app.delete('/api/projects/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const deleted = await saasStore.deleteProject(req.user!, routeParam(req.params.id));
  res.status(deleted ? 200 : 404).json({ ok: deleted });
});

app.get('/api/saas/status', async (_req: Request, res: Response) => {
  const persistence = await saasStore.health();
  res.json({
    persistence: persistence.mode,
    database: persistence.database,
    ready: persistence.ready,
    users: persistence.users,
    projects: persistence.projects,
    auth: !BETA_ACCESS,
    betaAccess: BETA_ACCESS,
    detail: persistence.detail,
    timestamp: persistence.checkedAt,
  });
});

// ── POST /api/copilot — Streaming SSE ────────────────────────────────────
app.post('/api/copilot', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { messages, context } = req.body as {
    messages: CopilotMessage[];
    context?: {
      view?: string;
      totalItens?: number;
      totalOrcamento?: number;
      bdi?: number;
      sinapiCount?: number;
    };
  };

  if (!messages || !messages.length) {
    res.status(400).json({ error: 'messages obrigatório' });
    return;
  }

  if (!anthropic && !DEEPSEEK_KEY) {
    res.status(503).json({
      error: 'Nenhum provedor de IA configurado. Configure ANTHROPIC_API_KEY ou DEEPSEEK_API_KEY.'
    });
    return;
  }

  // Monta contexto dinâmico no system prompt
  let systemFinal = SYSTEM_PROMPT;
  if (context) {
    const ctxLines = ['## Estado atual do sistema (fornecido pelo frontend):'];
    if (context.view)           ctxLines.push(`- Tela ativa: ${context.view}`);
    if (context.totalItens !== undefined) ctxLines.push(`- Itens no orçamento: ${context.totalItens}`);
    if (context.totalOrcamento !== undefined) ctxLines.push(`- Total do orçamento: R$ ${context.totalOrcamento.toFixed(2)}`);
    if (context.bdi !== undefined)  ctxLines.push(`- BDI configurado: ${context.bdi.toFixed(2)}%`);
    if (context.sinapiCount !== undefined) ctxLines.push(`- Insumos SINAPI carregados: ${context.sinapiCount.toLocaleString('pt-BR')}`);
    systemFinal = SYSTEM_PROMPT + '\n\n' + ctxLines.join('\n');
  }

  // Configura SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const optimizedMessages = optimizeMessages(messages);
    const userMessage = messages[messages.length - 1]?.content || '';
    const estimatedRoutingTokens = optimizedMessages.reduce((sum, message) => sum + estimateTokens(message.content), 0);
    const estimatedInputTokens = estimateTokens(systemFinal) + estimatedRoutingTokens;
    const model = selectCopilotModel(userMessage, estimatedRoutingTokens);
    const estimatedInputUsd = estimateInputCostUsd(model, estimatedInputTokens);

    res.setHeader('X-TLPlanly-Copilot-Model', model);
    res.setHeader('X-TLPlanly-Estimated-Input-Tokens', String(estimatedInputTokens));
    res.setHeader('X-TLPlanly-Estimated-Input-Cost-Usd', estimatedInputUsd.toFixed(6));
    res.write(`data: ${JSON.stringify({
      meta: {
        costAware: true,
        provider: anthropic ? 'anthropic' : 'deepseek',
        model: anthropic ? model : DEEPSEEK_MODEL,
        estimatedInputTokens,
        estimatedRoutingTokens,
        estimatedInputUsd: Number(estimatedInputUsd.toFixed(6)),
        historyMessages: optimizedMessages.length,
      }
    })}\n\n`);

    if (!anthropic) {
      const fallbackText = await withRetry(() => callDeepSeekFallback(systemFinal, optimizedMessages));
      res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    const stream = await withRetry(() => anthropic.messages.stream({
      model,
      max_tokens: 1024,
      system: systemFinal,
      messages: optimizedMessages,
    }));

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const data = JSON.stringify({ text: chunk.delta.text });
        res.write(`data: ${data}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err: any) {
    const primaryError = sanitizeAiError(err);

    if (DEEPSEEK_KEY) {
      try {
        const optimizedMessages = optimizeMessages(messages);
        res.write(`data: ${JSON.stringify({
          meta: {
            provider: 'deepseek',
            model: DEEPSEEK_MODEL,
            fallbackFrom: 'anthropic',
            reason: primaryError.code,
          }
        })}\n\n`);
        const fallbackText = await withRetry(() => callDeepSeekFallback(systemFinal, optimizedMessages));
        res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      } catch (fallbackErr: any) {
        console.warn('[Copilot] Fallback DeepSeek indisponivel:', sanitizeAiError(fallbackErr).code);
      }
    }

    res.write(`data: ${JSON.stringify({
      error: primaryError.message,
      code: primaryError.code,
      fallbackToLocal: true
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ── GET /api/referencia — Base SINAPI ────────────────────────────────────
app.get('/api/referencia', requireAuth, (_req: AuthedRequest, res: Response) => {
  const caminhos = [
    path.join(__dirname, '../../data/referencia.json'),
    path.join(__dirname, '../data/referencia.json'),
    'data/referencia.json',
  ];
  for (const p of caminhos) {
    if (fs.existsSync(p)) {
      res.sendFile(path.resolve(p));
      return;
    }
  }
  res.status(404).json({ error: 'referencia.json não encontrado' });
});

// ── GET /health ───────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const persistence = await saasStore.health();
  res.json({
    status: 'ok',
    anthropic: !!anthropic,
    deepseek: !!DEEPSEEK_KEY,
    providers: {
      primary: anthropic ? 'anthropic' : DEEPSEEK_KEY ? 'deepseek' : 'local',
      fallback: DEEPSEEK_KEY && anthropic ? 'deepseek' : 'local',
    },
    model: HAIKU_MODEL,
    costAware: true,
    fallbackModel: SONNET_MODEL,
    deepseekModel: DEEPSEEK_MODEL,
    persistence: persistence.mode,
    database: persistence.database,
    databaseReady: persistence.ready,
    users: persistence.users,
    projects: persistence.projects,
    authRequired: !BETA_ACCESS,
    betaAccess: BETA_ACCESS,
    historyMessages: MAX_HISTORY_MESSAGES,
    maxMessageChars: MAX_MESSAGE_CHARS,
    timestamp: new Date().toISOString(),
  });
});

// ── Serve tlplanly.html ───────────────────────────────────────────────────
const htmlCaminhos = [
  path.join(__dirname, '../../frontend/index.html'),
  path.join(__dirname, '../frontend/index.html'),
  path.join(__dirname, '../../tlplanly.html'),
  path.join(__dirname, '../tlplanly.html'),
  'frontend/index.html',
  'tlplanly.html',
];
const standaloneHtmlCaminhos = [
  path.join(__dirname, '../../frontend/index.html'),
  path.join(__dirname, '../frontend/index.html'),
  'frontend/index.html',
  path.join(__dirname, '../../tlplanly.html'),
  path.join(__dirname, '../tlplanly.html'),
  'tlplanly.html',
];

function sendFirstExisting(res: Response, pathsToTry: string[], fallbackMessage: string): void {
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.resolve(p));
      return;
    }
  }
  res.status(404).send(fallbackMessage);
}
app.get('/', (_req, res) => {
  sendFirstExisting(res, htmlCaminhos, 'tlplanly.html nao encontrado');
});

app.get('/tlplanly.html', (_req, res) => {
  sendFirstExisting(res, standaloneHtmlCaminhos, 'tlplanly.html nao encontrado');
});
app.get('/manual', (_req, res) => {
  const manualPaths = [
    path.join(__dirname, '../../docs/manual_usuario_tlplanly.html'),
    path.join(__dirname, '../docs/manual_usuario_tlplanly.html'),
    'docs/manual_usuario_tlplanly.html',
  ];
  for (const p of manualPaths) {
    if (fs.existsSync(p)) { res.sendFile(path.resolve(p)); return; }
  }
  res.status(404).send('manual_usuario_tlplanly.html nao encontrado');
});
app.use('/frontend', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
[
  path.join(__dirname, '..'),
  path.join(__dirname, '../..'),
  process.cwd(),
].forEach(root => {
  if (fs.existsSync(root)) app.use(express.static(path.resolve(root)));
});

// ── Start ─────────────────────────────────────────────────────────────────
async function startServer() {
  await saasStore.init();
  app.listen(PORT, () => {
    console.log('TLPlanly Server - TechLicense');
    console.log(`http://localhost:${PORT}`);
    console.log(`Persistencia: ${saasStore.mode}`);
    console.log(`Anthropic API: ${anthropic ? 'configurada' : 'ausente'}`);
  });
}

startServer().catch(err => {
  console.error('[TLPlanly] Falha ao iniciar servidor:', err);
  process.exit(1);
});
