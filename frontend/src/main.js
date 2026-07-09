
// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let STATE = {
  mode: 'construtor',
  theme: 'dark',
  bdi: 0,
  bdiConfigured: false,
  bdiComponents: { ac:0, s:0, r:0, df:0, l:0, i:0 },
  bdiDraft: null,
  bdiDraftComponents: null,
  orcamento: [],      // { cod, desc, unid, qtd, preco, ref, cat }
  descontoProposta: null,
  planejamento: [],
  medicoes: [],
  quantitativos: {},
  documentos: [],
  extracoes: [],
  backups: [],
  gruposCusto: [],
  insumosImportados: [],
  insumosManuais: [],
  cpuBiblioteca: [],
  equipamentosHorarios: [],
  maoObraHoraria: [],
  cotacoesCustos: [],
  frentesServico: [],
  obras: [],
  obraAtivaId: '',
  obrasRecentes: [],
  workspaceConfig: {
    usuario: '00',
    plano: 'Beta liberado',
    validade: '',
    diretorioTrabalho: '',
    bancoPadrao: 'Base local',
    bloqueioAtivo: false
  },
  equipesMecanicas: [],
  cpuBancosExternos: [],
  sinapiBase: [],     // { codigoSinapi, descricao, unidade, precoMedio, ... }
  sinapiMes: '',
  auditResultados: [],
  charts: {},
  config: {
    uf:'MG',
    tolerancia:5,
    enc:'nd',
    obra:'civil',
    moeda:'BRL',
    moedaCotacao:1,
    relatorioModelo:'publico'
  }
};

let CLOUD = {
  user: null,
  projects: [],
  currentProjectId: localStorage.getItem('tlplanly_cloud_project') || '',
  timer: null,
  saving: false,
  suppress: false,
  dirty: false,
  lastSavedAt: null,
  error: null,
  persistence: 'local'
};

let AUTH_REQUIRED = false;
let BETA_ACCESS = true;

let PRICING_PLANS = [
  { id:'trial_authorized', name:'Teste Autorizado', description:'Acesso controlado para demonstracao assistida por cupom.', annualMonthlyPriceCents:0, monthlyPriceCents:0, includedUsers:1, maxProjects:2, maxAiMessagesMonthly:50, maxOcrPagesMonthly:20, features:['7 dias de avaliacao','Importacao limitada','SINAPI/SICRO/ORSE','Copilot limitado'], sortOrder:10 },
  { id:'professional', name:'Profissional', description:'Para engenheiro, arquiteto, orcamentista ou consultor individual.', annualMonthlyPriceCents:6200, monthlyPriceCents:8900, includedUsers:1, maxProjects:20, maxAiMessagesMonthly:800, maxOcrPagesMonthly:150, features:['Orcamentos completos','Importacao Excel/PDF','BDI, encargos e curva ABC','Readequacao de proposta','Exportacao Excel/PDF'], sortOrder:20 },
  { id:'team', name:'Equipe', description:'Para pequenas equipes de engenharia e construtoras em crescimento.', annualMonthlyPriceCents:10500, monthlyPriceCents:14990, includedUsers:3, maxProjects:80, maxAiMessagesMonthly:2500, maxOcrPagesMonthly:500, features:['Ate 3 usuarios','OCR em lote','Composicoes proprias','Auditoria SINAPI/BDI','Relatorios tecnicos'], sortOrder:30 },
  { id:'licitacoes_pro', name:'Licitacoes Pro', description:'Para empresas que atuam com pregoes, propostas e controle de conformidade.', annualMonthlyPriceCents:21900, monthlyPriceCents:31400, includedUsers:5, maxProjects:250, maxAiMessagesMonthly:8000, maxOcrPagesMonthly:1500, features:['Ate 5 usuarios','Relatorio TCU/CGU','Readequacao avancada de propostas','Auditoria avancada','Prioridade em bases oficiais'], sortOrder:40 },
  { id:'public_control', name:'Orgao Publico / Controle', description:'Para fiscalizacao, controle interno, municipios e equipes com governanca.', annualMonthlyPriceCents:0, monthlyPriceCents:0, includedUsers:10, maxProjects:1000, maxAiMessagesMonthly:20000, maxOcrPagesMonthly:5000, features:['Usuarios 10+','Ambiente isolado','Painel administrativo','Auditoria TCU/CGU','API e integracoes sob proposta'], sortOrder:50 }
];

// Load from localStorage
try {
  const s = localStorage.getItem('tlplanly_state');
  if (s) {
    const p = JSON.parse(s);
    STATE.orcamento = p.orcamento || [];
    STATE.planejamento = p.planejamento || [];
    STATE.medicoes = p.medicoes || [];
    STATE.quantitativos = p.quantitativos || {};
    STATE.documentos = p.documentos || [];
    STATE.extracoes = p.extracoes || [];
    STATE.backups = p.backups || [];
    STATE.gruposCusto = p.gruposCusto || [];
    STATE.insumosImportados = p.insumosImportados || [];
    STATE.insumosManuais = p.insumosManuais || [];
    STATE.cpuBiblioteca = p.cpuBiblioteca || [];
    STATE.equipamentosHorarios = p.equipamentosHorarios || [];
    STATE.maoObraHoraria = p.maoObraHoraria || [];
    STATE.cotacoesCustos = p.cotacoesCustos || [];
    STATE.frentesServico = p.frentesServico || [];
    STATE.obras = p.obras || [];
    STATE.obraAtivaId = p.obraAtivaId || '';
    STATE.obrasRecentes = p.obrasRecentes || [];
    STATE.workspaceConfig = { ...STATE.workspaceConfig, ...(p.workspaceConfig || {}) };
    STATE.equipesMecanicas = p.equipesMecanicas || [];
    STATE.cpuBancosExternos = p.cpuBancosExternos || [];
    STATE.descontoProposta = p.descontoProposta || null;
    const legacyDefaultBDI = isLegacyDefaultBDI(p);
    STATE.bdiConfigured = !legacyDefaultBDI
      && Number.isFinite(Number(p.bdi))
      && (p.bdiConfigured === true || (p.bdiConfigured === undefined && Number(p.bdi) > 0 && !!p.bdiComponents));
    STATE.bdi = STATE.bdiConfigured ? Number(p.bdi) : 0;
    STATE.bdiComponents = STATE.bdiConfigured && p.bdiComponents ? p.bdiComponents : STATE.bdiComponents;
    STATE.config = { ...STATE.config, ...(p.config || {}) };
  }
} catch(e) {}

function makeId(prefix='id') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function clonePlain(value, fallback) {
  try {
    return JSON.parse(JSON.stringify(value ?? fallback));
  } catch {
    return fallback;
  }
}

function isLegacyDefaultBDI(payload) {
  if (!payload || payload.bdiConfigured === true) return false;
  const c = payload.bdiComponents || {};
  const defaults =
    Number(c.ac) === 4 &&
    Number(c.s) === 0.5 &&
    Number(c.r) === 1.27 &&
    Number(c.df) === 1.23 &&
    Number(c.l) === 7.4 &&
    Number(c.i) === 8.65;
  const bdi = Number(payload.bdi);
  return defaults && (Math.abs(bdi - 25.88) < 0.05 || Math.abs(bdi - 24.46) < 0.05);
}

function gruposCustoDefault() {
  return [
    { codigo:'E', nome:'Equipamentos', tipo:'E', descricao:'Máquinas, ferramentas e equipamentos aplicados à obra', importado:false },
    { codigo:'M', nome:'Materiais', tipo:'M', descricao:'Materiais de consumo e permanentes incorporados ao serviço', importado:false },
    { codigo:'S', nome:'Mão de Obra', tipo:'S', descricao:'Serviços de profissionais, oficiais, ajudantes e equipes', importado:false },
    { codigo:'T', nome:'Transportes', tipo:'T', descricao:'Fretes, deslocamentos, DMT e transporte de materiais', importado:false },
    { codigo:'SV', nome:'Serviços', tipo:'SV', descricao:'Serviços ou composições de preço unitário', importado:false }
  ];
}

function normalizarGruposCusto(grupos) {
  const byCode = new Map();
  gruposCustoDefault().forEach(g => byCode.set(g.codigo, g));
  (Array.isArray(grupos) ? grupos : []).forEach(g => {
    const codigo = String(g.codigo || g.cod || g.tipo || '').trim().toUpperCase();
    if (!codigo) return;
    byCode.set(codigo, {
      codigo,
      nome: String(g.nome || g.desc || g.descricao || codigo).trim(),
      tipo: normalizarGrupoCustoImportacao(g.tipo || g.nome || codigo),
      descricao: String(g.descricao || g.desc || '').trim(),
      importado: g.importado === true
    });
  });
  return [...byCode.values()];
}

function lotePrincipalPadrao() {
  return {
    id: makeId('lote'),
    codigo: 'L01',
    nome: 'Planilha principal',
    descricao: 'Planilha base do orçamento',
    criadoEm: new Date().toISOString()
  };
}

function normalizarLotesObra(lotes, multiPlanilha = false) {
  const lista = (Array.isArray(lotes) ? lotes : []).map((lote, idx) => ({
    id: lote.id || makeId('lote'),
    codigo: String(lote.codigo || lote.cod || `L${String(idx + 1).padStart(2, '0')}`).trim(),
    nome: String(lote.nome || lote.descricao || `Lote ${idx + 1}`).trim(),
    descricao: String(lote.descricao || '').trim(),
    criadoEm: lote.criadoEm || new Date().toISOString()
  }));
  if (!lista.length) lista.push(lotePrincipalPadrao());
  if (!multiPlanilha && lista.length > 1) return lista.slice(0, 1);
  return lista;
}

function normalizarObras(obras) {
  const vistos = new Set();
  return (Array.isArray(obras) ? obras : [])
    .filter(Boolean)
    .map((obra, idx) => {
      let id = String(obra.id || '').trim() || makeId('obra');
      while (vistos.has(id)) id = makeId('obra');
      vistos.add(id);
      const multiPlanilha = obra.multiPlanilha === true || obra.maisDeUmaPlanilha === true || (Array.isArray(obra.lotes) && obra.lotes.length > 1);
      return {
        id,
        numero: String(obra.numero || obra.codigo || gerarNumeroObra(idx)).trim(),
        nome: String(obra.nome || obra.descricao || obra.name || 'Obra sem nome').trim(),
        cliente: String(obra.cliente || '').trim(),
        data: String(obra.data || todayIso()).slice(0, 10),
        bancoBase: String(obra.bancoBase || obra.banco || 'Base local').trim(),
        encargosMaoObraPct: Number(obra.encargosMaoObraPct ?? obra.encargosMaoObra ?? obra.encargosPct ?? 0) || 0,
        multiPlanilha,
        lotes: normalizarLotesObra(obra.lotes, multiPlanilha),
        snapshot: obra.snapshot && typeof obra.snapshot === 'object' ? obra.snapshot : null,
        criadoEm: obra.criadoEm || new Date().toISOString(),
        atualizadoEm: obra.atualizadoEm || obra.updatedAt || obra.criadoEm || new Date().toISOString()
      };
    });
}

function hasBDI() {
  return STATE.bdiConfigured === true && Number.isFinite(Number(STATE.bdi)) && Number(STATE.bdi) > 0;
}

function isFilledNumber(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function bdiValue() {
  return hasBDI() ? Number(STATE.bdi) : 0;
}

function bdiText(emptyText='Não configurado') {
  return hasBDI() ? bdiValue().toFixed(2) + '%' : emptyText;
}

function totalComBDI(subtotal) {
  return subtotal * (1 + bdiValue() / 100);
}

function bdiComponentValues(source) {
  const c = source || {};
  return {
    ac: Number(c.ac) || 0,
    s: Number(c.s) || 0,
    r: Number(c.r) || 0,
    df: Number(c.df) || 0,
    l: Number(c.l) || 0,
    i: Number(c.i) || 0
  };
}

function readBDIInputs() {
  const ids = ['ac','s','r','df','l','i'];
  const result = {};
  let complete = true;
  ids.forEach(key => {
    const el = document.getElementById('bdi-' + key);
    const raw = el?.value?.trim() || '';
    if (raw === '') complete = false;
    const value = Number(raw.replace(',', '.'));
    if (!Number.isFinite(value)) complete = false;
    result[key] = Number.isFinite(value) ? value : 0;
  });
  return { values: result, complete };
}

function calcularBDIComponents(c) {
  return ((1+c.ac/100+c.s/100+c.r/100)*(1+c.df/100)*(1+c.l/100) / (1-c.i/100) - 1) * 100;
}

function normalizeState() {
  STATE.orcamento = Array.isArray(STATE.orcamento) ? STATE.orcamento : [];
  STATE.planejamento = Array.isArray(STATE.planejamento) ? STATE.planejamento : [];
  STATE.medicoes = Array.isArray(STATE.medicoes) ? STATE.medicoes : [];
  STATE.quantitativos = STATE.quantitativos && typeof STATE.quantitativos === 'object' ? STATE.quantitativos : {};
  STATE.documentos = Array.isArray(STATE.documentos) ? STATE.documentos : [];
  STATE.extracoes = Array.isArray(STATE.extracoes) ? STATE.extracoes : [];
  STATE.backups = Array.isArray(STATE.backups) ? STATE.backups : [];
  STATE.gruposCusto = normalizarGruposCusto(STATE.gruposCusto);
  STATE.insumosImportados = Array.isArray(STATE.insumosImportados) ? STATE.insumosImportados : [];
  STATE.insumosManuais = Array.isArray(STATE.insumosManuais) ? STATE.insumosManuais : [];
  STATE.cpuBiblioteca = Array.isArray(STATE.cpuBiblioteca) ? STATE.cpuBiblioteca : [];
  STATE.equipamentosHorarios = Array.isArray(STATE.equipamentosHorarios) ? STATE.equipamentosHorarios : [];
  STATE.maoObraHoraria = Array.isArray(STATE.maoObraHoraria) ? STATE.maoObraHoraria : [];
  STATE.cotacoesCustos = Array.isArray(STATE.cotacoesCustos) ? STATE.cotacoesCustos : [];
  STATE.frentesServico = Array.isArray(STATE.frentesServico) ? STATE.frentesServico : [];
  STATE.obras = normalizarObras(STATE.obras);
  STATE.obrasRecentes = Array.isArray(STATE.obrasRecentes) ? STATE.obrasRecentes.filter(id => STATE.obras.some(o => o.id === id)).slice(0, 4) : [];
  STATE.workspaceConfig = {
    usuario: '00',
    plano: 'Beta liberado',
    validade: '',
    diretorioTrabalho: '',
    bancoPadrao: 'Base local',
    bloqueioAtivo: false,
    ...(STATE.workspaceConfig || {})
  };
  STATE.equipesMecanicas = Array.isArray(STATE.equipesMecanicas) ? STATE.equipesMecanicas : [];
  STATE.cpuBancosExternos = Array.isArray(STATE.cpuBancosExternos) ? STATE.cpuBancosExternos : [];
  if (STATE.obraAtivaId && !STATE.obras.some(o => o.id === STATE.obraAtivaId)) STATE.obraAtivaId = STATE.obras[0]?.id || '';
  STATE.descontoProposta = STATE.descontoProposta && typeof STATE.descontoProposta === 'object' ? STATE.descontoProposta : null;
  STATE.config = {
    uf:'MG',
    tolerancia:5,
    enc:'nd',
    obra:'civil',
    moeda:'BRL',
    moedaCotacao:1,
    relatorioModelo:'publico',
    ...(STATE.config || {})
  };
  STATE.bdi = Number.isFinite(Number(STATE.bdi)) ? Number(STATE.bdi) : 0;
  STATE.bdiConfigured = STATE.bdiConfigured === true && STATE.bdi > 0;
  STATE.bdiComponents = {
    ac:0,
    s:0,
    r:0,
    df:0,
    l:0,
    i:0,
    ...(STATE.bdiComponents || {})
  };
  if (!Number.isFinite(Number(STATE.config.moedaCotacao)) || Number(STATE.config.moedaCotacao) <= 0) {
    STATE.config.moedaCotacao = 1;
  }
  STATE.orcamento.forEach((it, idx) => {
    if (!it.id) it.id = makeId('orc');
    if (!it.capitulo) it.capitulo = it.cat || 'Serviços';
    if (!it.ordem) it.ordem = idx + 1;
  });
}

normalizeState();

function saveState() {
  try {
    obrasSalvarAtivaSnapshot({ silent:true });
    normalizeState();
    localStorage.setItem('tlplanly_state', JSON.stringify(persistedState()));
    cloudMarkDirty();
    cloudScheduleSave();
  } catch(e) {}
}

function persistedState() {
  if (typeof CPU_BIBLIOTECA !== 'undefined' && Array.isArray(CPU_BIBLIOTECA)) {
    STATE.cpuBiblioteca = CPU_BIBLIOTECA;
  }
  return {
    orcamento: STATE.orcamento,
    planejamento: STATE.planejamento,
    medicoes: STATE.medicoes,
    quantitativos: STATE.quantitativos,
    documentos: STATE.documentos,
    extracoes: STATE.extracoes,
    backups: STATE.backups,
    gruposCusto: STATE.gruposCusto,
    insumosImportados: STATE.insumosImportados,
    insumosManuais: STATE.insumosManuais,
    cpuBiblioteca: STATE.cpuBiblioteca,
    equipamentosHorarios: STATE.equipamentosHorarios,
    maoObraHoraria: STATE.maoObraHoraria,
    cotacoesCustos: STATE.cotacoesCustos,
    frentesServico: STATE.frentesServico,
    obras: STATE.obras,
    obraAtivaId: STATE.obraAtivaId,
    obrasRecentes: STATE.obrasRecentes,
    workspaceConfig: STATE.workspaceConfig,
    equipesMecanicas: STATE.equipesMecanicas,
    cpuBancosExternos: STATE.cpuBancosExternos,
    descontoProposta: STATE.descontoProposta,
    bdi: STATE.bdi,
    bdiConfigured: STATE.bdiConfigured,
    bdiComponents: STATE.bdiComponents,
    config: STATE.config
  };
}

function applyPersistedState(payload) {
  if (!payload || typeof payload !== 'object') return;
  CLOUD.suppress = true;
  STATE.orcamento = Array.isArray(payload.orcamento) ? payload.orcamento : [];
  STATE.planejamento = Array.isArray(payload.planejamento) ? payload.planejamento : [];
  STATE.medicoes = Array.isArray(payload.medicoes) ? payload.medicoes : [];
  STATE.quantitativos = payload.quantitativos && typeof payload.quantitativos === 'object' ? payload.quantitativos : {};
  STATE.documentos = Array.isArray(payload.documentos) ? payload.documentos : [];
  STATE.extracoes = Array.isArray(payload.extracoes) ? payload.extracoes : [];
  STATE.backups = Array.isArray(payload.backups) ? payload.backups : [];
  STATE.gruposCusto = Array.isArray(payload.gruposCusto) ? payload.gruposCusto : [];
  STATE.insumosImportados = Array.isArray(payload.insumosImportados) ? payload.insumosImportados : [];
  STATE.insumosManuais = Array.isArray(payload.insumosManuais) ? payload.insumosManuais : [];
  STATE.cpuBiblioteca = Array.isArray(payload.cpuBiblioteca) ? payload.cpuBiblioteca : [];
  STATE.equipamentosHorarios = Array.isArray(payload.equipamentosHorarios) ? payload.equipamentosHorarios : [];
  STATE.maoObraHoraria = Array.isArray(payload.maoObraHoraria) ? payload.maoObraHoraria : [];
  STATE.cotacoesCustos = Array.isArray(payload.cotacoesCustos) ? payload.cotacoesCustos : [];
  STATE.frentesServico = Array.isArray(payload.frentesServico) ? payload.frentesServico : [];
  STATE.obras = Array.isArray(payload.obras) ? payload.obras : [];
  STATE.obraAtivaId = payload.obraAtivaId || '';
  STATE.obrasRecentes = Array.isArray(payload.obrasRecentes) ? payload.obrasRecentes : [];
  STATE.workspaceConfig = { ...STATE.workspaceConfig, ...(payload.workspaceConfig || {}) };
  STATE.equipesMecanicas = Array.isArray(payload.equipesMecanicas) ? payload.equipesMecanicas : [];
  STATE.cpuBancosExternos = Array.isArray(payload.cpuBancosExternos) ? payload.cpuBancosExternos : [];
  STATE.descontoProposta = payload.descontoProposta && typeof payload.descontoProposta === 'object' ? payload.descontoProposta : null;
  const legacyDefaultBDI = isLegacyDefaultBDI(payload);
  STATE.bdiConfigured = !legacyDefaultBDI
    && Number.isFinite(Number(payload.bdi))
    && (payload.bdiConfigured === true || (payload.bdiConfigured === undefined && Number(payload.bdi) > 0 && !!payload.bdiComponents));
  STATE.bdi = STATE.bdiConfigured ? Number(payload.bdi) : 0;
  STATE.bdiComponents = STATE.bdiConfigured && payload.bdiComponents ? payload.bdiComponents : { ac:0, s:0, r:0, df:0, l:0, i:0 };
  STATE.bdiDraft = null;
  STATE.bdiDraftComponents = null;
  STATE.config = { ...STATE.config, ...(payload.config || {}) };
  normalizeState();
  localStorage.setItem('tlplanly_state', JSON.stringify(persistedState()));
  refreshAppFromState();
  CLOUD.suppress = false;
}

function refreshAppFromState() {
  if (typeof CPU_BIBLIOTECA !== 'undefined') {
    CPU_BIBLIOTECA = Array.isArray(STATE.cpuBiblioteca) ? STATE.cpuBiblioteca : [];
    try { localStorage.setItem('tlplanly_cpu_lib', JSON.stringify(CPU_BIBLIOTECA)); } catch(e) {}
    if (typeof cpuRenderBiblioteca === 'function') cpuRenderBiblioteca();
  }
  if (typeof cpuRenderManualCount === 'function') cpuRenderManualCount();
  const c = STATE.bdiComponents || {};
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.value = value;
  };
  setVal('bdi-ac', c.ac);
  setVal('bdi-s', c.s);
  setVal('bdi-r', c.r);
  setVal('bdi-df', c.df);
  setVal('bdi-l', c.l);
  setVal('bdi-i', c.i);
  setVal('orcNome', STATE.config.nome || document.getElementById('orcNome')?.value || 'Orcamento SINAPI');
  if (typeof syncConfigForm === 'function') syncConfigForm();
  if (typeof syncBDIInputsFromState === 'function') syncBDIInputsFromState();
  if (typeof renderBDIState === 'function') renderBDIState();
  if (typeof renderElaborar === 'function') renderElaborar();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof preencherSelectsOperacionais === 'function') preencherSelectsOperacionais();
  if (typeof custosHorariosRender === 'function') custosHorariosRender();
  if (typeof cotacoesRender === 'function') cotacoesRender();
  if (typeof frentesServicoRender === 'function') frentesServicoRender();
  if (typeof obrasRender === 'function') obrasRender();
  if (typeof insumosRender === 'function') insumosRender();
  if (typeof workspaceRender === 'function') workspaceRender();
  if (typeof cpuEditorRender === 'function') cpuEditorRender();
  if (typeof cpuBancoExternoRender === 'function') cpuBancoExternoRender();
  if (typeof equipeMecanicaRender === 'function') equipeMecanicaRender();
  if (typeof backupRender === 'function') backupRender();
  if (typeof docsRender === 'function') docsRender();
}

async function cloudApi(path, options = {}) {
  const opts = {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  const res = await fetch(path, opts);
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) throw new Error(data.error || 'Falha de comunicacao com a nuvem TLPlanly.');
  return data;
}

function priceText(cents) {
  const value = Number(cents || 0);
  if (!value) return 'Sob proposta';
  return (value / 100).toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) + '/mes';
}

function planUsageText(plan) {
  const users = plan.includedUsers >= 10 ? '10+ usuarios' : `${plan.includedUsers} usuario${plan.includedUsers > 1 ? 's' : ''}`;
  const projects = plan.maxProjects >= 1000 ? 'obras amplas' : `${plan.maxProjects} obras`;
  return `${users} · ${projects}`;
}

function planCard(plan, compact=false) {
  const isPro = plan.id === 'licitacoes_pro';
  const features = (plan.features || []).slice(0, compact ? 3 : 6)
    .map(feature => `<li>${escapeHtml(feature)}</li>`).join('');
  return `<div class="pricing-card ${isPro ? 'featured' : ''}">
    ${isPro ? '<div class="pricing-ribbon">Mais completo</div>' : ''}
    <div class="pricing-name">${escapeHtml(plan.name)}</div>
    <div class="pricing-desc">${escapeHtml(plan.description || '')}</div>
    <div class="pricing-price">${priceText(plan.annualMonthlyPriceCents)}</div>
    <div class="pricing-note">${plan.monthlyPriceCents ? 'valor no anual · mensal cheio ' + priceText(plan.monthlyPriceCents) : 'comercial sob validacao'}</div>
    <div class="pricing-usage">${escapeHtml(planUsageText(plan))}</div>
    <ul class="pricing-features">${features}</ul>
    ${compact ? '' : '<button class="btn btn-outline btn-sm" onclick="cloudOpen()">Ver ambiente beta</button>'}
  </div>`;
}

function renderPricingPlans() {
  const ordered = [...PRICING_PLANS].sort((a, b) => (a.sortOrder || 100) - (b.sortOrder || 100));
  const main = document.getElementById('pricing-cards');
  if (main) main.innerHTML = ordered.map(plan => planCard(plan)).join('');
  const mini = document.getElementById('login-pricing-cards');
  if (mini) mini.innerHTML = ordered.filter(plan => plan.id !== 'trial_authorized').slice(0, 3).map(plan => planCard(plan, true)).join('');
}

async function pricingInit() {
  try {
    const data = await cloudApi('/api/plans');
    if (Array.isArray(data.plans) && data.plans.length) PRICING_PLANS = data.plans;
  } catch {}
  renderPricingPlans();
}

function showPricingDetails() {
  if (!authIsLocked()) {
    cloudClose();
    showView('planos');
    return;
  }
  const el = document.getElementById('login-pricing-cards');
  if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

async function cloudValidateCoupon() {
  if (BETA_ACCESS) {
    const status = document.getElementById('coupon-status');
    if (status) {
      status.textContent = 'Cupom dispensado no beta. Acesso liberado para testes.';
      status.className = 'form-help ok';
    }
    return true;
  }
  const input = document.getElementById('cloud-coupon');
  const status = document.getElementById('coupon-status');
  const couponCode = input?.value?.trim() || '';
  if (!couponCode) {
    if (status) {
      status.textContent = 'Obrigatorio para criar conta. O cupom pode ter prazo e limite de uso.';
      status.className = 'form-help';
    }
    return false;
  }
  try {
    const data = await cloudApi('/api/auth/validate-coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode })
    });
    if (status) {
      const exp = data.coupon?.expiresAt ? ' · expira em ' + new Date(data.coupon.expiresAt).toLocaleDateString('pt-BR') : '';
      const uses = data.coupon?.maxUses ? ` · usos ${data.coupon.usedCount}/${data.coupon.maxUses}` : '';
      status.textContent = `Cupom valido: ${data.plan?.name || 'plano autorizado'}${exp}${uses}`;
      status.className = 'form-help ok';
    }
    return true;
  } catch (err) {
    if (status) {
      status.textContent = err.message || 'Cupom invalido, expirado ou sem usos disponiveis.';
      status.className = 'form-help error';
    }
    return false;
  }
}

function authIsLocked() {
  return AUTH_REQUIRED && !CLOUD.user;
}

function authApplyGate() {
  const locked = authIsLocked();
  document.body.classList.toggle('auth-locked', locked);
  const backdrop = document.getElementById('cloud-backdrop');
  const modal = document.getElementById('cloud-modal');
  if (locked) {
    if (backdrop) backdrop.style.display = 'block';
    if (modal) modal.style.display = 'block';
    cloudSetStatus('Login obrigatório para usar o TLPlanly');
  }
}

function requireLogin(action = 'usar o TLPlanly') {
  if (!authIsLocked()) return false;
  authApplyGate();
  const email = document.getElementById('cloud-email');
  if (email) setTimeout(() => email.focus(), 50);
  toast(`Entre com e-mail e senha para ${action}.`, 'warning');
  return true;
}

function cloudSetStatus(message) {
  const el = document.getElementById('cloud-status');
  if (el) el.textContent = message;
}

function cloudClearSaveTimer() {
  clearTimeout(CLOUD.timer);
  CLOUD.timer = null;
}

function cloudCurrentProject() {
  return CLOUD.projects.find(project => project.id === CLOUD.currentProjectId) || null;
}

function cloudLastSavedText() {
  if (CLOUD.saving) return 'Salvando agora...';
  if (CLOUD.error) return 'Erro ao salvar';
  if (CLOUD.dirty) return 'Alterações pendentes';
  if (CLOUD.lastSavedAt) return 'Salvo ' + new Date(CLOUD.lastSavedAt).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  return CLOUD.user ? 'Aguardando salvamento' : (BETA_ACCESS ? 'Beta liberado' : 'Login obrigatório');
}

function cloudRenderSaveStatus() {
  const chip = document.getElementById('cloudSaveChip');
  if (chip) {
    let label = 'Entrar';
    let cls = 'cloud-save-chip';
    if (CLOUD.user && CLOUD.saving) { label = 'Salvando'; cls += ' saving'; }
    else if (CLOUD.user && CLOUD.error) { label = 'Erro'; cls += ' error'; }
    else if (CLOUD.user && CLOUD.dirty) { label = 'Pendente'; cls += ' pending'; }
    else if (CLOUD.user && CLOUD.currentProjectId) { label = 'Salvo'; cls += ' ok'; }
    else if (CLOUD.user && BETA_ACCESS) { label = 'Beta'; cls += ' ok'; }
    else if (CLOUD.user) { label = 'Conta'; cls += ' pending'; }
    else if (BETA_ACCESS) { label = 'Beta'; cls += ' ok'; }
    chip.textContent = label;
    chip.className = cls;
    chip.title = CLOUD.user || BETA_ACCESS ? cloudLastSavedText() : 'Entre para usar o TLPlanly.';
  }
  const currentName = document.getElementById('cloud-current-name');
  if (currentName) currentName.textContent = cloudCurrentProject()?.name || 'Nenhuma obra selecionada';
  const saved = document.getElementById('cloud-last-saved');
  if (saved) saved.textContent = cloudLastSavedText();
}

function cloudMarkDirty() {
  if (CLOUD.suppress || !CLOUD.user || !CLOUD.currentProjectId) return;
  CLOUD.dirty = true;
  CLOUD.error = null;
  cloudRenderSaveStatus();
}

function cloudOpen() {
  document.getElementById('cloud-backdrop').style.display = 'block';
  document.getElementById('cloud-modal').style.display = 'block';
  cloudRender();
}

function cloudClose() {
  if (authIsLocked()) {
    authApplyGate();
    toast('Login obrigatório para continuar.', 'warning');
    return;
  }
  document.getElementById('cloud-backdrop').style.display = 'none';
  document.getElementById('cloud-modal').style.display = 'none';
}

function cloudRender() {
  const auth = document.getElementById('cloud-auth');
  const workspace = document.getElementById('cloud-workspace');
  const btn = document.getElementById('cloudBtn');
  if (!auth || !workspace) return;
  const logged = !!CLOUD.user;
  auth.style.display = logged || BETA_ACCESS ? 'none' : 'block';
  workspace.style.display = logged || BETA_ACCESS ? 'block' : 'none';
  if (btn) {
    btn.textContent = logged || BETA_ACCESS ? '☁' : '🔒';
    btn.title = logged || BETA_ACCESS ? 'Ambiente beta e obras salvas' : 'Entrar na conta TLPlanly';
  }
  if (!logged) {
    cloudSetStatus(BETA_ACCESS ? 'Modo beta liberado. Login, senha e cupom dispensados.' : 'Login obrigatório para usar o TLPlanly');
    cloudRenderSaveStatus();
    authApplyGate();
    return;
  }
  document.getElementById('cloud-user-name').textContent = CLOUD.user.name || 'Usuario';
  document.getElementById('cloud-user-email').textContent = CLOUD.user.email || '';
  const org = CLOUD.user.tenantName || CLOUD.user.tenant || 'Cliente TLPlanly';
  const orgEl = document.getElementById('cloud-user-org');
  if (orgEl) orgEl.textContent = `Cliente: ${org}`;
  const planEl = document.getElementById('cloud-plan-name');
  if (planEl) {
    const expires = CLOUD.user.planExpiresAt ? ` · expira em ${new Date(CLOUD.user.planExpiresAt).toLocaleDateString('pt-BR')}` : '';
    planEl.textContent = `${BETA_ACCESS ? 'Beta liberado' : (CLOUD.user.planName || 'Plano autorizado')}${expires}`;
  }
  const isolation = document.getElementById('cloud-isolation-text');
  if (isolation) isolation.textContent = `Ambiente "${org}" isolado. Outros clientes nao podem listar, abrir, alterar ou apagar estas obras.`;
  const select = document.getElementById('cloud-projects');
  select.innerHTML = '';
  if (!CLOUD.projects.length) {
    select.innerHTML = '<option value="">Nenhuma obra salva</option>';
  } else {
    CLOUD.projects.forEach(project => {
      const opt = document.createElement('option');
      opt.value = project.id;
      opt.textContent = `${project.name} - ${new Date(project.updatedAt).toLocaleDateString('pt-BR')}`;
      if (project.id === CLOUD.currentProjectId) opt.selected = true;
      select.appendChild(opt);
    });
  }
  cloudSetStatus(`${BETA_ACCESS ? 'Beta liberado' : 'Acesso autenticado'} · ${CLOUD.persistence === 'postgres' ? 'Banco Postgres' : 'Store local'} ativo · ${cloudLastSavedText()}`);
  cloudRenderSaveStatus();
  authApplyGate();
}

async function cloudInit() {
  try {
    const data = await cloudApi('/api/auth/me');
    AUTH_REQUIRED = data.authRequired === true;
    BETA_ACCESS = data.betaAccess === true || !AUTH_REQUIRED;
    CLOUD.user = data.user || null;
    CLOUD.persistence = data.persistence || 'local';
    if (CLOUD.user) {
      await cloudRefreshProjects();
      await loadSinapiBase();
    }
    cloudRender();
  } catch {
    CLOUD.user = null;
    cloudRender();
  }
  authApplyGate();
  cloudRenderSaveStatus();
}

async function cloudLogin() {
  try {
    if (BETA_ACCESS) {
      const data = await cloudApi('/api/auth/me');
      CLOUD.user = data.user || CLOUD.user;
      CLOUD.persistence = data.persistence || 'local';
      await cloudRefreshProjects();
      await loadSinapiBase();
      toast('Beta liberado', 'success');
      cloudRender();
      cloudClose();
      return;
    }
    const email = document.getElementById('cloud-email').value.trim();
    const password = document.getElementById('cloud-password').value;
    if (!email || !password) throw new Error('Informe e-mail e senha.');
    cloudSetStatus('Entrando...');
    const data = await cloudApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    CLOUD.user = data.user;
    CLOUD.persistence = data.persistence || 'local';
    await cloudRefreshProjects();
    await loadSinapiBase();
    toast('Conta conectada', 'success');
    cloudRender();
    authApplyGate();
    if (!CLOUD.projects.length) await cloudCreateProject();
    cloudClose();
  } catch (err) {
    cloudSetStatus(err.message || 'Erro ao entrar.');
    toast(err.message || 'Erro ao entrar.', 'error');
  }
}

async function cloudRegister() {
  try {
    if (BETA_ACCESS) {
      await cloudLogin();
      return;
    }
    const name = document.getElementById('cloud-name').value.trim();
    const email = document.getElementById('cloud-email').value.trim();
    const password = document.getElementById('cloud-password').value;
    const orgName = document.getElementById('cloud-org').value.trim();
    const couponCode = document.getElementById('cloud-coupon').value.trim();
    if (!name || !email || !password) throw new Error('Informe nome, e-mail e senha.');
    if (!couponCode) throw new Error('Informe o cupom ou codigo de autorizacao.');
    const couponOk = await cloudValidateCoupon();
    if (!couponOk) throw new Error('Cupom invalido, expirado ou sem usos disponiveis.');
    cloudSetStatus('Criando conta...');
    const data = await cloudApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, orgName, couponCode })
    });
    CLOUD.user = data.user;
    CLOUD.persistence = data.persistence || 'local';
    await cloudRefreshProjects();
    await loadSinapiBase();
    toast('Conta criada', 'success');
    cloudRender();
    authApplyGate();
    if (!CLOUD.projects.length) await cloudCreateProject();
    cloudClose();
  } catch (err) {
    cloudSetStatus(err.message || 'Erro ao criar conta.');
    toast(err.message || 'Erro ao criar conta.', 'error');
  }
}

async function cloudLogout() {
  if (BETA_ACCESS) {
    toast('No beta, o acesso permanece liberado.', 'info');
    cloudRender();
    return;
  }
  if (CLOUD.dirty && !confirm('Existem alterações pendentes na nuvem. Sair mesmo assim?')) return;
  cloudClearSaveTimer();
  try { await cloudApi('/api/auth/logout', { method: 'POST', body: '{}' }); } catch {}
  CLOUD.user = null;
  CLOUD.projects = [];
  CLOUD.currentProjectId = '';
  CLOUD.dirty = false;
  CLOUD.saving = false;
  CLOUD.error = null;
  CLOUD.lastSavedAt = null;
  localStorage.removeItem('tlplanly_cloud_project');
  cloudRender();
  authApplyGate();
  toast('Conta desconectada', 'info');
}

async function cloudRefreshProjects() {
  if (!CLOUD.user) return;
  const data = await cloudApi('/api/projects');
  CLOUD.projects = data.projects || [];
  if (!CLOUD.projects.some(p => p.id === CLOUD.currentProjectId)) {
    CLOUD.currentProjectId = CLOUD.projects[0]?.id || '';
  }
  if (CLOUD.currentProjectId) localStorage.setItem('tlplanly_cloud_project', CLOUD.currentProjectId);
  const current = cloudCurrentProject();
  if (current && !CLOUD.lastSavedAt) CLOUD.lastSavedAt = current.updatedAt;
}

function cloudSelectProject(id) {
  if (CLOUD.dirty && id !== CLOUD.currentProjectId && !confirm('A obra atual tem alterações pendentes. Trocar a seleção sem carregar/salvar?')) {
    cloudRender();
    return;
  }
  if (CLOUD.dirty && id !== CLOUD.currentProjectId) cloudClearSaveTimer();
  CLOUD.currentProjectId = id || '';
  if (CLOUD.currentProjectId) localStorage.setItem('tlplanly_cloud_project', CLOUD.currentProjectId);
  CLOUD.error = null;
  cloudRender();
}

function cloudProjectName() {
  return document.getElementById('orcNome')?.value?.trim()
    || STATE.config.nome
    || 'Orcamento TLPlanly';
}

async function cloudCreateProject() {
  if (!CLOUD.user) return cloudOpen();
  try {
    cloudClearSaveTimer();
    cloudSetStatus('Criando obra...');
    const data = await cloudApi('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: cloudProjectName(), state: persistedState() })
    });
    CLOUD.currentProjectId = data.project.id;
    CLOUD.dirty = false;
    CLOUD.error = null;
    CLOUD.lastSavedAt = data.project.updatedAt || new Date().toISOString();
    localStorage.setItem('tlplanly_cloud_project', CLOUD.currentProjectId);
    await cloudRefreshProjects();
    cloudRender();
    toast('Obra criada na nuvem', 'success');
  } catch (err) {
    toast(err.message || 'Erro ao criar obra.', 'error');
  }
}

async function cloudSaveNow() {
  if (!CLOUD.user) return cloudOpen();
  if (!CLOUD.currentProjectId) return cloudCreateProject();
  if (CLOUD.saving) return;
  try {
    CLOUD.saving = true;
    CLOUD.error = null;
    cloudRenderSaveStatus();
    cloudSetStatus('Salvando...');
    const data = await cloudApi(`/api/projects/${encodeURIComponent(CLOUD.currentProjectId)}`, {
      method: 'PUT',
      body: JSON.stringify({ name: cloudProjectName(), state: persistedState() })
    });
    const idx = CLOUD.projects.findIndex(p => p.id === data.project.id);
    if (idx >= 0) CLOUD.projects[idx] = data.project;
    CLOUD.dirty = false;
    CLOUD.lastSavedAt = data.project.updatedAt || new Date().toISOString();
    cloudSetStatus('Salvo agora');
  } catch (err) {
    CLOUD.error = err.message || 'Erro ao salvar.';
    cloudSetStatus(err.message || 'Erro ao salvar.');
    toast(err.message || 'Erro ao salvar na nuvem.', 'error');
  } finally {
    CLOUD.saving = false;
    cloudRender();
  }
}

async function cloudLoadSelectedProject() {
  if (!CLOUD.user || !CLOUD.currentProjectId) return;
  if (CLOUD.dirty && !confirm('Existem alterações pendentes. Carregar outra versão da obra mesmo assim?')) return;
  try {
    cloudClearSaveTimer();
    cloudSetStatus('Carregando obra...');
    const data = await cloudApi(`/api/projects/${encodeURIComponent(CLOUD.currentProjectId)}`);
    applyPersistedState(data.project.state || {});
    CLOUD.dirty = false;
    CLOUD.error = null;
    CLOUD.lastSavedAt = data.project.updatedAt || new Date().toISOString();
    cloudSetStatus('Obra carregada');
    cloudRender();
    cloudClose();
    toast('Obra carregada', 'success');
  } catch (err) {
    toast(err.message || 'Erro ao carregar obra.', 'error');
  }
}

function cloudScheduleSave() {
  if (CLOUD.suppress || !CLOUD.user || !CLOUD.currentProjectId) return;
  cloudClearSaveTimer();
  CLOUD.dirty = true;
  CLOUD.error = null;
  cloudSetStatus('Alterações pendentes. Salvando em instantes...');
  cloudRenderSaveStatus();
  CLOUD.timer = setTimeout(() => cloudSaveNow(), 1800);
}

window.addEventListener('beforeunload', event => {
  if (!CLOUD.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

// ═══════════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════════
function toggleTheme() {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', STATE.theme);
  document.getElementById('themeBtn').textContent = STATE.theme === 'dark' ? '☀' : '🌙';
  // Redraw charts with new colors
  setTimeout(()=>{ redrawAllCharts(); }, 100);
  localStorage.setItem('tlplanly_theme', STATE.theme);
}

// Restore theme
(function() {
  const t = localStorage.getItem('tlplanly_theme') || 'light';
  STATE.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '☀' : '🌙';
})();

// ═══════════════════════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════════════════════
function setMode(m) {
  if (requireLogin('alterar o modo de operação')) return;
  STATE.mode = m;
  document.getElementById('btnConstrutor').classList.toggle('active', m==='construtor');
  document.getElementById('btnAuditor').classList.toggle('active', m==='auditor');
  toast(m==='construtor' ? 'Modo Construtor ativo' : 'Modo Auditor ativo', 'info');
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
const FRONTEND_CORE_ONLY = true;
const FRONTEND_CORE_VIEWS = new Set(['obras', 'insumos', 'cpu', 'custos']);

function showView(id) {
  if (FRONTEND_CORE_ONLY && !FRONTEND_CORE_VIEWS.has(id)) id = 'obras';
  if (requireLogin('acessar os módulos')) return;
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const targetView = document.getElementById('view-'+id);
  if (!targetView) return;
  targetView.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+id+"'")) n.classList.add('active');
  });
  if (id==='dashboard') renderDashboard();
  if (id==='obras') obrasRender();
  if (id==='insumos') insumosRender();
  if (id==='curvaABC') gerarCurvaABC();
  if (id==='memoria') renderMemoria();
  if (id==='cpu') { cpuRenderBiblioteca(); cpuRenderManualCount(); cpuEditorRender(); cpuBancoExternoRender(); }
  if (id==='custos') { custosHorariosRender(); equipeMecanicaRender(); }
  if (id==='cotacoes') cotacoesRender();
  if (id==='frentes') frentesServicoRender();
  if (id==='planejamento') planejamentoRender();
  if (id==='medicoes') medicoesRender();
  if (id==='quantitativos') quantRender();
  if (id==='documentos') docsRender();
  if (id==='backups') backupRender();
  if (id==='analisador') analisadorRender();
  if (id==='relatorio') renderRelatorioPreview();
  if (id==='planos') renderPricingPlans();
  if (id==='config') syncConfigForm();
  if (id==='sinapi') renderSinapiBase();
  if (id==='bdi') { syncBDIInputsFromState(); renderBDIState(); showEncargos('nd'); renderBDIComp(); }
  if (id==='auditoria') executarAuditoria();
  if (id==='conformidade') verificarConformidade();
}

// ═══════════════════════════════════════════════════════════
// ENTRADA / BANCO DE TRABALHO
// ═══════════════════════════════════════════════════════════
function workspaceRender() {
  normalizeState();
  const cfg = STATE.workspaceConfig || {};
  const set = (id, value = '') => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = value || '';
  };
  set('workspace-usuario', cfg.usuario || '00');
  set('workspace-plano', cfg.plano || 'Beta liberado');
  set('workspace-validade', String(cfg.validade || '').slice(0, 10));
  set('workspace-diretorio', cfg.diretorioTrabalho || '');
  set('workspace-banco', cfg.bancoPadrao || 'Base local');
  const status = document.getElementById('workspace-status');
  if (status) {
    status.textContent = cfg.bloqueioAtivo ? 'Acesso bloqueado' : (cfg.plano || 'Beta liberado');
    status.className = cfg.bloqueioAtivo ? 'badge badge-err' : 'badge badge-ok';
  }
}

function workspaceSalvar() {
  normalizeState();
  STATE.workspaceConfig = {
    ...(STATE.workspaceConfig || {}),
    usuario: document.getElementById('workspace-usuario')?.value?.trim() || '00',
    plano: document.getElementById('workspace-plano')?.value || 'Beta liberado',
    validade: document.getElementById('workspace-validade')?.value || '',
    diretorioTrabalho: document.getElementById('workspace-diretorio')?.value?.trim() || '',
    bancoPadrao: document.getElementById('workspace-banco')?.value || 'Base local',
    bloqueioAtivo: false,
    salvoEm: new Date().toISOString()
  };
  saveState();
  workspaceRender();
  toast('Entrada e banco de trabalho salvos para o beta.', 'success');
}

function workspaceAplicarBancoNaObra() {
  const obra = obraAtiva();
  if (!obra) { toast('Abra ou crie uma obra antes de aplicar o banco de trabalho.', 'error'); return; }
  workspaceSalvar();
  obra.bancoBase = STATE.workspaceConfig?.bancoPadrao || obra.bancoBase || 'Base local';
  obra.diretorioTrabalho = STATE.workspaceConfig?.diretorioTrabalho || '';
  obra.atualizadoEm = new Date().toISOString();
  saveState();
  obrasRender();
  toast('Banco de trabalho aplicado à obra ativa.', 'success');
}

// ═══════════════════════════════════════════════════════════
// OBRAS / PROJETOS — NÚCLEO DO ORÇAMENTO
// ═══════════════════════════════════════════════════════════
function obraAtiva() {
  normalizeState();
  return STATE.obras.find(obra => obra.id === STATE.obraAtivaId) || null;
}

function gerarNumeroObra(offset = 0) {
  const ano = String(new Date().getFullYear()).slice(2);
  const base = Number(`${ano}000`);
  const numeros = (STATE.obras || [])
    .map(obra => Number(String(obra.numero || '').replace(/\D/g, '')))
    .filter(Number.isFinite);
  return String(Math.max(base, ...numeros, base) + 1 + Number(offset || 0));
}

function obrasGerarNumeroCampo() {
  const el = document.getElementById('obra-numero');
  if (el) el.value = gerarNumeroObra();
}

function obrasLimparFormulario() {
  const set = (id, value = '') => { const el = document.getElementById(id); if (el) el.value = value; };
  set('obra-numero', gerarNumeroObra());
  set('obra-data', todayIso());
  set('obra-nome');
  set('obra-cliente');
  set('obra-banco', 'Base local');
  set('obra-encargos-mao-obra');
  const multi = document.getElementById('obra-multi');
  if (multi) multi.checked = false;
}

function obraEncargosMaoObraCampo(origem = 'ativa') {
  const id = origem === 'nova' ? 'obra-encargos-mao-obra' : 'obra-active-encargos-mao-obra';
  const el = document.getElementById(id);
  return el ? parseNumeroBR(el.value) : 0;
}

function obraEncargosMaoObraPct() {
  const campoAtivo = document.getElementById('obra-active-encargos-mao-obra');
  if (campoAtivo) return parseNumeroBR(campoAtivo.value);
  const obra = obraAtiva();
  return Number(obra?.encargosMaoObraPct ?? obra?.encargosMaoObra ?? obra?.encargosPct ?? 0) || 0;
}

function obraSnapshotAtual() {
  const nomeCampo = document.getElementById('orcNome')?.value?.trim();
  const config = { ...(STATE.config || {}) };
  if (nomeCampo) config.nome = nomeCampo;
  return {
    orcamento: clonePlain(STATE.orcamento, []),
    planejamento: clonePlain(STATE.planejamento, []),
    medicoes: clonePlain(STATE.medicoes, []),
    quantitativos: clonePlain(STATE.quantitativos, {}),
    documentos: clonePlain(STATE.documentos, []),
    extracoes: clonePlain(STATE.extracoes, []),
    backups: clonePlain(STATE.backups, []),
    gruposCusto: clonePlain(STATE.gruposCusto, []),
    insumosImportados: clonePlain(STATE.insumosImportados, []),
    insumosManuais: clonePlain(STATE.insumosManuais, []),
    cpuBiblioteca: clonePlain(STATE.cpuBiblioteca, []),
    equipamentosHorarios: clonePlain(STATE.equipamentosHorarios, []),
    maoObraHoraria: clonePlain(STATE.maoObraHoraria, []),
    equipesMecanicas: clonePlain(STATE.equipesMecanicas, []),
    cpuBancosExternos: clonePlain(STATE.cpuBancosExternos, []),
    workspaceConfig: clonePlain(STATE.workspaceConfig, {}),
    cotacoesCustos: clonePlain(STATE.cotacoesCustos, []),
    frentesServico: clonePlain(STATE.frentesServico, []),
    descontoProposta: clonePlain(STATE.descontoProposta, null),
    bdi: STATE.bdi,
    bdiConfigured: STATE.bdiConfigured,
    bdiComponents: clonePlain(STATE.bdiComponents, { ac:0, s:0, r:0, df:0, l:0, i:0 }),
    config
  };
}

function obraSnapshotVazio(nome = 'Orçamento TLPlanly') {
  return {
    orcamento: [],
    planejamento: [],
    medicoes: [],
    quantitativos: {},
    documentos: [],
    extracoes: [],
    backups: [],
    gruposCusto: clonePlain(STATE.gruposCusto, gruposCustoDefault()),
    insumosImportados: clonePlain(STATE.insumosImportados, []),
    insumosManuais: clonePlain(STATE.insumosManuais, []),
    cpuBiblioteca: [],
    equipamentosHorarios: [],
    maoObraHoraria: [],
    equipesMecanicas: [],
    cpuBancosExternos: clonePlain(STATE.cpuBancosExternos, []),
    workspaceConfig: clonePlain(STATE.workspaceConfig, {}),
    cotacoesCustos: [],
    frentesServico: [],
    descontoProposta: null,
    bdi: 0,
    bdiConfigured: false,
    bdiComponents: { ac:0, s:0, r:0, df:0, l:0, i:0 },
    config: { ...(STATE.config || {}), nome }
  };
}

function obrasAplicarSnapshot(snapshot, obra) {
  const src = snapshot && typeof snapshot === 'object' ? snapshot : obraSnapshotVazio(obra?.nome || 'Orçamento TLPlanly');
  STATE.orcamento = clonePlain(src.orcamento, []);
  STATE.planejamento = clonePlain(src.planejamento, []);
  STATE.medicoes = clonePlain(src.medicoes, []);
  STATE.quantitativos = clonePlain(src.quantitativos, {});
  STATE.documentos = clonePlain(src.documentos, []);
  STATE.extracoes = clonePlain(src.extracoes, []);
  STATE.backups = clonePlain(src.backups, []);
  STATE.gruposCusto = clonePlain(src.gruposCusto, []);
  STATE.insumosImportados = clonePlain(src.insumosImportados, []);
  STATE.insumosManuais = clonePlain(src.insumosManuais, []);
  STATE.cpuBiblioteca = clonePlain(src.cpuBiblioteca, []);
  STATE.equipamentosHorarios = clonePlain(src.equipamentosHorarios, []);
  STATE.maoObraHoraria = clonePlain(src.maoObraHoraria, []);
  STATE.equipesMecanicas = clonePlain(src.equipesMecanicas, []);
  STATE.cpuBancosExternos = clonePlain(src.cpuBancosExternos, []);
  STATE.workspaceConfig = { ...(STATE.workspaceConfig || {}), ...(src.workspaceConfig || {}) };
  STATE.cotacoesCustos = clonePlain(src.cotacoesCustos, []);
  STATE.frentesServico = clonePlain(src.frentesServico, []);
  STATE.descontoProposta = clonePlain(src.descontoProposta, null);
  STATE.bdi = Number(src.bdi) || 0;
  STATE.bdiConfigured = src.bdiConfigured === true && STATE.bdi > 0;
  STATE.bdiComponents = clonePlain(src.bdiComponents, { ac:0, s:0, r:0, df:0, l:0, i:0 });
  STATE.config = { ...(STATE.config || {}), ...(src.config || {}), nome: obra?.nome || src.config?.nome || 'Orçamento TLPlanly' };
  normalizeState();
  refreshAppFromState();
}

function obrasSalvarAtivaSnapshot(options = {}) {
  if (!Array.isArray(STATE.obras) || !STATE.obraAtivaId) return false;
  const obra = STATE.obras.find(o => o.id === STATE.obraAtivaId);
  if (!obra) return false;
  obra.encargosMaoObraPct = obraEncargosMaoObraCampo();
  obra.snapshot = obraSnapshotAtual();
  obra.atualizadoEm = new Date().toISOString();
  const nomeCampo = document.getElementById('orcNome')?.value?.trim();
  if (nomeCampo && (!obra.nome || obra.nome === 'Obra sem nome' || obra.nome === 'Orçamento TLPlanly')) obra.nome = nomeCampo;
  if (!options.silent) toast('Obra ativa salva localmente', 'success');
  return true;
}

function obrasSalvarSessaoAtual() {
  normalizeState();
  if (STATE.obraAtivaId && obrasSalvarAtivaSnapshot({ silent:true })) {
    const ativa = obraAtiva();
    if (ativa) ativa.encargosMaoObraPct = obraEncargosMaoObraCampo();
    saveState();
    obrasRender();
    toast('Sessão atual salva na obra ativa', 'success');
    return;
  }
  const nome = document.getElementById('orcNome')?.value?.trim() || STATE.config?.nome || 'Orçamento TLPlanly';
  const obra = {
    id: makeId('obra'),
    numero: gerarNumeroObra(),
    nome,
    cliente: '',
    data: todayIso(),
    bancoBase: 'Base local',
    encargosMaoObraPct: obraEncargosMaoObraCampo('nova'),
    multiPlanilha: false,
    lotes: [lotePrincipalPadrao()],
    snapshot: obraSnapshotAtual(),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  STATE.obras.push(obra);
  STATE.obraAtivaId = obra.id;
  obrasMarcarRecente(obra.id);
  saveState();
  obrasRender();
  toast('Sessão atual transformada em obra', 'success');
}

function obrasSalvarParametrosAtiva() {
  normalizeState();
  const obra = obraAtiva();
  if (!obra) {
    toast('Abra uma obra antes de salvar encargos.', 'error');
    return;
  }
  obra.encargosMaoObraPct = obraEncargosMaoObraCampo();
  obra.atualizadoEm = new Date().toISOString();
  obrasSalvarAtivaSnapshot({ silent:true });
  saveState();
  obrasRender();
  toast('Encargos de mão de obra salvos na obra ativa.', 'success');
}

function obrasMarcarRecente(id) {
  if (!id) return;
  STATE.obrasRecentes = [id, ...(STATE.obrasRecentes || []).filter(item => item !== id)].slice(0, 4);
}

function obrasCriarNova() {
  normalizeState();
  const numero = document.getElementById('obra-numero')?.value?.trim() || gerarNumeroObra();
  const nome = document.getElementById('obra-nome')?.value?.trim();
  const cliente = document.getElementById('obra-cliente')?.value?.trim() || '';
  const data = document.getElementById('obra-data')?.value || todayIso();
  const bancoBase = document.getElementById('obra-banco')?.value || 'Base local';
  const encargosMaoObraPct = obraEncargosMaoObraCampo('nova');
  const multiPlanilha = document.getElementById('obra-multi')?.checked === true;
  if (!nome) { toast('Informe o nome do projeto/obra.', 'error'); return; }
  obrasSalvarAtivaSnapshot({ silent:true });
  const lotes = multiPlanilha
    ? [
        lotePrincipalPadrao(),
        { id: makeId('lote'), codigo:'L02', nome:'Lote 02', descricao:'Segunda planilha da obra', criadoEm:new Date().toISOString() }
      ]
    : [lotePrincipalPadrao()];
  const obra = {
    id: makeId('obra'),
    numero,
    nome,
    cliente,
    data,
    bancoBase,
    encargosMaoObraPct,
    multiPlanilha,
    lotes,
    snapshot: obraSnapshotVazio(nome),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  STATE.obras.push(obra);
  STATE.obraAtivaId = obra.id;
  obrasMarcarRecente(obra.id);
  obrasAplicarSnapshot(obra.snapshot, obra);
  saveState();
  obrasLimparFormulario();
  obrasRender();
  toast('Nova obra criada', 'success');
}

function obrasAbrir(id) {
  normalizeState();
  const obra = STATE.obras.find(o => o.id === id);
  if (!obra) return;
  if (STATE.obraAtivaId && STATE.obraAtivaId !== id) obrasSalvarAtivaSnapshot({ silent:true });
  STATE.obraAtivaId = id;
  obrasMarcarRecente(id);
  obrasAplicarSnapshot(obra.snapshot, obra);
  saveState();
  obrasRender();
  toast('Obra aberta: ' + obra.numero, 'success');
}

function obrasCopiar(id) {
  normalizeState();
  const origem = STATE.obras.find(o => o.id === id);
  if (!origem) return;
  obrasSalvarAtivaSnapshot({ silent:true });
  const numero = gerarNumeroObra();
  const nome = `Cópia de ${origem.nome || origem.numero}`;
  const nova = {
    ...clonePlain(origem, {}),
    id: makeId('obra'),
    numero,
    nome,
    data: todayIso(),
    lotes: normalizarLotesObra(clonePlain(origem.lotes, []), origem.multiPlanilha).map(lote => ({ ...lote, id: makeId('lote') })),
    snapshot: clonePlain(origem.snapshot, obraSnapshotVazio(nome)),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  if (nova.snapshot?.config) nova.snapshot.config.nome = nome;
  STATE.obras.push(nova);
  STATE.obraAtivaId = nova.id;
  obrasMarcarRecente(nova.id);
  obrasAplicarSnapshot(nova.snapshot, nova);
  saveState();
  obrasRender();
  toast('Obra copiada para o número ' + numero, 'success');
}

function obrasExcluir(id) {
  normalizeState();
  const obra = STATE.obras.find(o => o.id === id);
  if (!obra) return;
  if (!confirm(`Excluir a obra ${obra.numero} - ${obra.nome}? Esta ação remove a cópia local desta obra.`)) return;
  STATE.obras = STATE.obras.filter(o => o.id !== id);
  STATE.obrasRecentes = (STATE.obrasRecentes || []).filter(item => item !== id);
  if (STATE.obraAtivaId === id) {
    const proxima = STATE.obras[0] || null;
    STATE.obraAtivaId = proxima?.id || '';
    if (proxima) obrasAplicarSnapshot(proxima.snapshot, proxima);
    else obrasAplicarSnapshot(obraSnapshotVazio('Orçamento TLPlanly'), null);
  }
  saveState();
  obrasRender();
  toast('Obra excluída', 'info');
}

function obrasEncontrarPorNumero(numero) {
  const alvo = String(numero || '').trim();
  if (!alvo) return null;
  return (STATE.obras || []).find(obra => String(obra.numero || '').trim() === alvo) || null;
}

function obrasAbrirPorNumero() {
  normalizeState();
  const numero = document.getElementById('obra-abrir-numero')?.value?.trim();
  const obra = obrasEncontrarPorNumero(numero);
  if (!obra) { toast('Obra não encontrada para o número informado.', 'error'); return; }
  obrasAbrir(obra.id);
}

function obrasCopiarPorNumero() {
  normalizeState();
  const origemNumero = document.getElementById('obra-copiar-origem')?.value?.trim() || document.getElementById('obra-abrir-numero')?.value?.trim();
  const destinoNumero = document.getElementById('obra-copiar-destino')?.value?.trim();
  const origem = obrasEncontrarPorNumero(origemNumero);
  if (!origem) { toast('Obra de origem não encontrada.', 'error'); return; }
  obrasSalvarAtivaSnapshot({ silent:true });
  const numero = destinoNumero || gerarNumeroObra();
  if (obrasEncontrarPorNumero(numero) && !confirm(`Já existe uma obra com o número ${numero}. Substituir não é permitido; escolha outro destino.`)) return;
  if (obrasEncontrarPorNumero(numero)) return;
  const nome = `Cópia de ${origem.nome || origem.numero}`;
  const nova = {
    ...clonePlain(origem, {}),
    id: makeId('obra'),
    numero,
    nome,
    data: todayIso(),
    lotes: normalizarLotesObra(clonePlain(origem.lotes, []), origem.multiPlanilha).map(lote => ({ ...lote, id: makeId('lote') })),
    snapshot: clonePlain(origem.snapshot, obraSnapshotVazio(nome)),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  if (nova.snapshot?.config) nova.snapshot.config.nome = nome;
  STATE.obras.push(nova);
  STATE.obraAtivaId = nova.id;
  obrasMarcarRecente(nova.id);
  obrasAplicarSnapshot(nova.snapshot, nova);
  saveState();
  obrasRender();
  toast(`Obra copiada de ${origem.numero} para ${numero}.`, 'success');
}

function obrasExcluirPorNumero() {
  normalizeState();
  const numero = document.getElementById('obra-abrir-numero')?.value?.trim();
  const obra = obrasEncontrarPorNumero(numero);
  if (!obra) { toast('Obra não encontrada para exclusão.', 'error'); return; }
  obrasExcluir(obra.id);
}

function obrasConsultaAvancada() {
  normalizeState();
  const el = document.getElementById('obra-consulta-avancada');
  if (!el) return;
  const filtro = textoChave(document.getElementById('obra-busca')?.value || document.getElementById('obra-abrir-numero')?.value || '');
  const rows = (STATE.obras || []).filter(obra => !filtro || textoChave(`${obra.numero} ${obra.nome} ${obra.cliente} ${obra.bancoBase}`).includes(filtro));
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state" style="padding:12px">Nenhuma obra encontrada na consulta avançada.</div>';
    return;
  }
  el.innerHTML = `<div class="cpu-op-summary">${rows.length} obra(s) encontrada(s)</div>` + rows.slice(0, 12).map(obra => {
    const r = obraResumo(obra);
    return `<button class="obra-advanced-row" onclick="obrasAbrir('${obra.id}')">
      <strong>${escapeHtml(obra.numero)} · ${escapeHtml(obra.nome)}</strong>
      <span>${escapeHtml(obra.cliente || 'Sem cliente')} · ${escapeHtml(obra.bancoBase || 'Base local')} · ${r.lotes} lote(s) · ${fmtMoeda(r.total)}</span>
    </button>`;
  }).join('');
}

function obrasAdicionarLote() {
  normalizeState();
  const obra = obraAtiva();
  if (!obra) { toast('Crie ou abra uma obra antes de adicionar lotes.', 'error'); return; }
  const codigo = document.getElementById('obra-lote-codigo')?.value?.trim() || `L${String((obra.lotes || []).length + 1).padStart(2, '0')}`;
  const nome = document.getElementById('obra-lote-nome')?.value?.trim();
  const descricao = document.getElementById('obra-lote-desc')?.value?.trim() || '';
  if (!nome) { toast('Informe o nome do lote ou frente.', 'error'); return; }
  obra.multiPlanilha = true;
  obra.lotes = normalizarLotesObra(obra.lotes, true);
  obra.lotes.push({ id: makeId('lote'), codigo, nome, descricao, criadoEm: new Date().toISOString() });
  obra.atualizadoEm = new Date().toISOString();
  ['obra-lote-codigo','obra-lote-nome','obra-lote-desc'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  saveState();
  obrasRender();
  toast('Lote adicionado à obra', 'success');
}

function obrasExcluirLote(id) {
  const obra = obraAtiva();
  if (!obra) return;
  if ((obra.lotes || []).length <= 1) { toast('A obra precisa manter ao menos uma planilha principal.', 'warning'); return; }
  obra.lotes = obra.lotes.filter(lote => lote.id !== id);
  obra.multiPlanilha = obra.lotes.length > 1;
  obra.atualizadoEm = new Date().toISOString();
  saveState();
  obrasRender();
}

function obraResumo(obra) {
  const snap = obra?.snapshot || {};
  const itens = Array.isArray(snap.orcamento) ? snap.orcamento : [];
  const subtotal = itens.reduce((s, item) => s + ((Number(item.qtd) || 0) * (Number(item.preco) || 0)), 0);
  const bdi = snap.bdiConfigured ? Number(snap.bdi) || 0 : 0;
  return {
    itens: itens.length,
    subtotal,
    total: subtotal * (1 + bdi / 100),
    lotes: Array.isArray(obra?.lotes) ? obra.lotes.length : 0
  };
}

function obrasRender() {
  normalizeState();
  workspaceRender();
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const active = obraAtiva();
  const activeResumo = active ? obraResumo({ ...active, snapshot: obraSnapshotAtual() }) : { itens: STATE.orcamento.length, lotes:0 };
  setText('obra-kpi-total', STATE.obras.length);
  setText('obra-kpi-lotes', active ? activeResumo.lotes : 0);
  setText('obra-kpi-itens', activeResumo.itens || STATE.orcamento.length);
  setText('obra-kpi-recentes', (STATE.obrasRecentes || []).length);
  setText('obra-active-title', active ? `${active.numero} · ${active.nome}` : 'Nenhuma obra cadastrada');
  setText('obra-active-meta', active
    ? `${active.cliente || 'Cliente não informado'} · ${active.data || 'sem data'} · ${active.bancoBase || 'Base local'} · ${activeResumo.lotes} planilha(s)${Number(active.encargosMaoObraPct) > 0 ? ` · Encargos MO ${fmtNum(active.encargosMaoObraPct)}%` : ''}`
    : 'Crie uma obra para iniciar o núcleo de orçamento.');

  const dataInput = document.getElementById('obra-data');
  if (dataInput && !dataInput.value) dataInput.value = todayIso();
  const numeroInput = document.getElementById('obra-numero');
  if (numeroInput && !numeroInput.value) numeroInput.value = gerarNumeroObra();
  const activeParam = document.getElementById('obra-active-param');
  if (activeParam) activeParam.style.display = active ? '' : 'none';
  const activeEncargosInput = document.getElementById('obra-active-encargos-mao-obra');
  if (activeEncargosInput && document.activeElement !== activeEncargosInput) {
    activeEncargosInput.value = active && Number(active.encargosMaoObraPct) > 0 ? active.encargosMaoObraPct : '';
  }

  const busca = textoChave(document.getElementById('obra-busca')?.value || '');
  const obras = STATE.obras.filter(obra => {
    if (!busca) return true;
    return textoChave(`${obra.numero} ${obra.nome} ${obra.cliente} ${obra.bancoBase}`).includes(busca);
  });
  const tbody = document.getElementById('obra-lista');
  if (tbody) {
    if (!obras.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--text3)">Nenhuma obra encontrada</td></tr>';
    } else {
      tbody.innerHTML = obras.map(obra => {
        const r = obraResumo(obra);
        const activeBadge = obra.id === STATE.obraAtivaId ? '<span class="badge badge-ok">Ativa</span>' : '';
        return `<tr>
          <td class="td-mono">${escapeHtml(obra.numero)} ${activeBadge}</td>
          <td><strong>${escapeHtml(obra.nome)}</strong></td>
          <td>${escapeHtml(obra.cliente || '—')}</td>
          <td>${escapeHtml(obra.data || '—')}</td>
          <td>${escapeHtml(obra.bancoBase || 'Base local')}</td>
          <td>${r.lotes}</td>
          <td>${r.itens}</td>
          <td><strong>${fmtMoeda(r.total)}</strong></td>
          <td>
            <div class="obra-row-actions">
              <button class="btn btn-outline btn-sm" onclick="obrasAbrir('${obra.id}')">Abrir</button>
              <button class="btn btn-outline btn-sm" onclick="obrasCopiar('${obra.id}')">Copiar</button>
              <button class="btn btn-outline btn-sm" onclick="obrasExcluir('${obra.id}')">Excluir</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    }
  }

  const recentes = document.getElementById('obra-recentes');
  if (recentes) {
    const lista = (STATE.obrasRecentes || []).map(id => STATE.obras.find(obra => obra.id === id)).filter(Boolean);
    recentes.innerHTML = lista.length ? lista.map(obra => {
      const r = obraResumo(obra);
      return `<button class="obra-recent-card" onclick="obrasAbrir('${obra.id}')">
        <span>${escapeHtml(obra.numero)} · ${escapeHtml(obra.nome)}</span>
        <small>${escapeHtml(obra.cliente || 'Sem cliente')} · ${r.itens} item(ns) · ${fmtMoeda(r.total)}</small>
      </button>`;
    }).join('') : '<div class="empty-state" style="padding:18px">Nenhuma obra recente.</div>';
  }

  const lotes = document.getElementById('obra-lotes');
  if (lotes) {
    if (!active) {
      lotes.innerHTML = '<div class="empty-state" style="padding:18px">Nenhuma obra ativa.</div>';
    } else {
      lotes.innerHTML = (active.lotes || []).map(lote => `<div class="obra-lote-row">
        <div>
          <strong>${escapeHtml(lote.codigo)} · ${escapeHtml(lote.nome)}</strong>
          <span>${escapeHtml(lote.descricao || 'Sem descrição adicional')}</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="obrasExcluirLote('${lote.id}')">Excluir</button>
      </div>`).join('');
    }
  }
  obrasServicosRender();
}

function obrasScrollServicos() {
  document.getElementById('obra-servicos-card')?.scrollIntoView({ behavior:'smooth', block:'start' });
  setTimeout(() => document.getElementById('obra-serv-desc')?.focus(), 250);
}

function obrasServicoCodigoPadrao() {
  const seq = String((STATE.orcamento || []).length + 1).padStart(2, '0');
  return `SVC-${seq}`;
}

function obrasServicoEhPrincipal(item) {
  return item?.tipoItem === 'grupo' || item?.ehGrupo === true || item?.origem === 'servico-grupo';
}

function obrasServicoCodigoBase(cod) {
  return String(cod || '').trim().replace(/[.\-/\s]+$/g, '');
}

function obrasServicoPertenceAoGrupo(filhoCod, grupoCod) {
  const prefixo = obrasServicoCodigoBase(grupoCod);
  const filho = obrasServicoCodigoBase(filhoCod);
  if (!prefixo || !filho || filho === prefixo) return false;
  return filho.startsWith(`${prefixo}.`) || filho.startsWith(`${prefixo}-`) || filho.startsWith(`${prefixo}/`);
}

function obrasServicoSubtotalFilhos(item, lista = STATE.orcamento) {
  const prefixo = obrasServicoCodigoBase(item?.cod);
  if (!prefixo) return 0;
  return (lista || []).reduce((total, filho) => {
    if (!filho || filho === item || obrasServicoEhPrincipal(filho)) return total;
    return obrasServicoPertenceAoGrupo(filho.cod, prefixo) ? total + itemValor(filho) : total;
  }, 0);
}

function obrasServicoSubtotalVendaFilhos(item, lista = STATE.orcamento) {
  const prefixo = obrasServicoCodigoBase(item?.cod);
  if (!prefixo) return 0;
  return (lista || []).reduce((total, filho) => {
    if (!filho || filho === item || obrasServicoEhPrincipal(filho)) return total;
    return obrasServicoPertenceAoGrupo(filho.cod, prefixo) ? total + itemValorVenda(filho) : total;
  }, 0);
}

function obrasServicoVendaUnitario(item) {
  const custo = Number(item?.preco ?? item?.custoUnitario ?? 0) || 0;
  const vendaManual = Number(item?.precoVenda ?? item?.valorVenda ?? item?.precoVendaUnitario ?? 0) || 0;
  if (vendaManual > 0) return vendaManual;
  return roundUnitPrice(totalComBDI(custo));
}

function itemValorVenda(item) {
  if (obrasServicoEhPrincipal(item)) return 0;
  const qtd = Number(item?.qtd) || 0;
  const venda = obrasServicoVendaUnitario(item);
  const calculado = qtd * venda;
  const totalLinha = Number(item?.totalVendaLinha ?? item?.totalVenda ?? 0) || 0;
  const veioDeImportacao = !!(item?.linhaOrigem || item?.origemArquivo || item?.origemMetodo || item?.certStatus);
  if (veioDeImportacao && totalLinha > 0) {
    const divergencia = Math.abs(totalLinha - calculado) / Math.max(totalLinha, 1);
    if (divergencia <= 0.10) return totalLinha;
  }
  return calculado;
}

function obrasServicoLimparFormulario() {
  const card = document.getElementById('obra-servicos-card');
  if (card) card.dataset.editId = '';
  const set = (id, value = '') => { const el = document.getElementById(id); if (el) el.value = value; };
  set('obra-serv-cod', obrasServicoCodigoPadrao());
  set('obra-serv-desc');
  set('obra-serv-unid');
  set('obra-serv-qtd');
  set('obra-serv-custo');
  set('obra-serv-venda');
}

function obrasServicoSalvar() {
  normalizeState();
  if (!obraAtiva()) {
    toast('Crie ou abra uma obra antes de cadastrar serviços.', 'error');
    return;
  }
  const card = document.getElementById('obra-servicos-card');
  const editId = card?.dataset.editId || '';
  const cod = document.getElementById('obra-serv-cod')?.value?.trim() || obrasServicoCodigoPadrao();
  const desc = document.getElementById('obra-serv-desc')?.value?.trim();
  const unidRaw = document.getElementById('obra-serv-unid')?.value?.trim() || '';
  const qtdRaw = document.getElementById('obra-serv-qtd')?.value?.trim() || '';
  const isPrincipal = !unidRaw && !qtdRaw;
  const unid = isPrincipal ? '' : unidRaw;
  const qtd = isPrincipal ? 0 : (readNumeroCampo('obra-serv-qtd') || 0);
  const custoUnitario = isPrincipal ? 0 : (readNumeroCampo('obra-serv-custo') || 0);
  const vendaInformada = isPrincipal ? 0 : (readNumeroCampo('obra-serv-venda') || 0);
  const precoVenda = isPrincipal ? 0 : (vendaInformada || (hasBDI() ? roundUnitPrice(totalComBDI(custoUnitario)) : custoUnitario));
  if (!desc) { toast('Informe a descrição do serviço da obra.', 'error'); return; }
  if (!isPrincipal && !unid) { toast('Informe a unidade ou deixe unidade e quantidade vazias para item principal.', 'error'); return; }
  if (!isPrincipal && qtd <= 0) { toast('Informe a quantidade do serviço ou deixe unidade e quantidade vazias para item principal.', 'error'); return; }

  const existente = editId ? STATE.orcamento.find(it => it.id === editId) : null;
  if (existente) {
    existente.cod = cod;
    existente.desc = desc;
    existente.unid = unid;
    existente.qtd = qtd;
    existente.preco = roundUnitPrice(custoUnitario);
    existente.ref = roundUnitPrice(custoUnitario);
    existente.precoVenda = roundUnitPrice(precoVenda);
    existente.tipoItem = isPrincipal ? 'grupo' : 'servico';
    existente.ehGrupo = isPrincipal;
    if (isPrincipal) {
      existente.preco = 0;
      existente.ref = 0;
      existente.precoVenda = 0;
      existente.totalLinha = 0;
      existente.totalVendaLinha = 0;
      delete existente.composicaoId;
      delete existente.composicaoCod;
      delete existente.composicaoDesc;
    }
    existente.capitulo = existente.capitulo || 'Serviços da Obra';
    existente.cat = existente.cat || 'Serviço da obra';
  } else {
    STATE.orcamento.push({
      id: makeId('orc'),
      cod,
      desc,
      unid,
      qtd,
      preco: roundUnitPrice(custoUnitario),
      ref: roundUnitPrice(custoUnitario),
      precoVenda: roundUnitPrice(precoVenda),
      cat: isPrincipal ? 'Grupo de serviços' : 'Serviço da obra',
      capitulo: 'Serviços da Obra',
      tipoItem: isPrincipal ? 'grupo' : 'servico',
      ehGrupo: isPrincipal,
      ordem: STATE.orcamento.length + 1,
      origem: isPrincipal ? 'servico-grupo' : 'servico-obra'
    });
  }
  invalidarDescontoPregao('serviço da obra alterado');
  saveState();
  obrasServicoLimparFormulario();
  obrasRender();
  if (typeof renderElaborar === 'function') renderElaborar();
  toast(existente ? 'Serviço atualizado.' : 'Serviço cadastrado. Agora vincule uma composição.', 'success');
}

function obrasServicoEditar(id) {
  const item = (STATE.orcamento || []).find(it => it.id === id);
  if (!item) return;
  const card = document.getElementById('obra-servicos-card');
  if (card) card.dataset.editId = id;
  const set = (field, value = '') => { const el = document.getElementById(field); if (el) el.value = value; };
  set('obra-serv-cod', item.cod || '');
  set('obra-serv-desc', item.desc || '');
  set('obra-serv-unid', obrasServicoEhPrincipal(item) ? '' : (item.unid || ''));
  set('obra-serv-qtd', obrasServicoEhPrincipal(item) ? '' : (Number(item.qtd) || ''));
  set('obra-serv-custo', obrasServicoEhPrincipal(item) ? '' : (Number(item.preco) || ''));
  set('obra-serv-venda', obrasServicoEhPrincipal(item) ? '' : (Number(item.precoVenda) || ''));
  obrasScrollServicos();
}

function obrasServicoExcluir(id) {
  const item = (STATE.orcamento || []).find(it => it.id === id);
  if (!item) return;
  if (!confirm(`Excluir o serviço ${item.cod || ''} - ${item.desc || ''}?`)) return;
  STATE.orcamento = STATE.orcamento.filter(it => it.id !== id);
  STATE.orcamento.forEach((it, idx) => { it.ordem = idx + 1; });
  invalidarDescontoPregao('serviço da obra excluído');
  saveState();
  obrasRender();
  if (typeof renderElaborar === 'function') renderElaborar();
  toast('Serviço excluído da obra.', 'info');
}

function obrasServicoVincularCPU() {
  const itemId = document.getElementById('obra-serv-select')?.value || '';
  const cpuId = document.getElementById('obra-serv-cpu')?.value || '';
  const item = (STATE.orcamento || []).find(it => it.id === itemId);
  const cpu = (typeof CPU_BIBLIOTECA !== 'undefined' ? CPU_BIBLIOTECA : []).find(c => String(c.id) === String(cpuId));
  if (!item) { toast('Selecione um serviço cadastrado.', 'error'); return; }
  if (obrasServicoEhPrincipal(item)) { toast('Item principal recebe subtotal dos itens filhos. Vincule CPU em um serviço como 100.1, 100.2 etc.', 'warning'); return; }
  if (!cpu) { toast('Selecione uma composição para vincular ao serviço.', 'error'); return; }
  const preco = Number(cpu.precoUnitario) || 0;
  item.preco = roundUnitPrice(preco);
  item.ref = roundUnitPrice(preco);
  item.precoVenda = roundUnitPrice(totalComBDI(preco));
  item.composicaoId = cpu.id;
  item.composicaoCod = cpu.cod;
  item.composicaoDesc = cpu.desc;
  item.cat = cpu.tipo || item.cat || 'Serviço da obra';
  item.capitulo = cpu.tipo || item.capitulo || 'Serviços da Obra';
  item.totalLinha = 0;
  invalidarDescontoPregao('composição vinculada ao serviço');
  saveState();
  obrasRender();
  if (typeof renderElaborar === 'function') renderElaborar();
  toast('Composição vinculada ao serviço da obra.', 'success');
}

function obrasServicoNormalizarImportado(raw, origemArquivo = '', index = 0) {
  const desc = String(raw?.desc || raw?.descricao || raw?.servico || '').replace(/\s+/g, ' ').trim();
  if (!desc || desc.length < 3) return null;
  const codRaw = raw?.cod || raw?.codigo || raw?.item || '';
  const cod = limparCodigo(codRaw) || `SVC-${String((STATE.orcamento || []).length + index + 1).padStart(3, '0')}`;
  const unidRawOriginal = String(raw?.unid ?? raw?.unidade ?? '').trim();
  const unidRaw = /^(0|[-—])$/i.test(unidRawOriginal) ? '' : unidRawOriginal;
  const qtdRaw = raw?.qtd ?? raw?.quantidade ?? raw?.qtde ?? '';
  const temQtd = String(qtdRaw ?? '').trim() !== '' && parseNumeroBR(qtdRaw) > 0;
  const isPrincipal = raw?.semUnidQtd === true || (!unidRaw && !temQtd);
  const qtd = isPrincipal ? 0 : (temQtd ? (Number(raw?.qtd) || parseNumeroBR(qtdRaw)) : 0);
  const precoRaw = raw?.preco ?? raw?.valorUnitario ?? raw?.custoUnitario ?? raw?.precoUnitario ?? 0;
  const preco = Number(precoRaw) || parseNumeroBR(precoRaw) || 0;
  const precoVendaRaw = raw?.precoVenda ?? raw?.valorVenda ?? raw?.precoVendaUnitario ?? raw?.vendaUnitaria ?? preco;
  const precoVenda = Number(precoVendaRaw) || parseNumeroBR(precoVendaRaw) || preco;
  const totalRaw = raw?.totalLinha ?? raw?.total ?? raw?.totalCusto ?? 0;
  const totalLinha = Number(totalRaw) || parseNumeroBR(totalRaw) || 0;
  const totalVendaRaw = raw?.totalVendaLinha ?? raw?.totalVenda ?? raw?.valorVendaTotal ?? totalLinha;
  const totalVendaLinha = Number(totalVendaRaw) || parseNumeroBR(totalVendaRaw) || totalLinha;
  return {
    id: makeId('orc'),
    cod,
    desc,
    unid: isPrincipal ? '' : normalizarUnidadeImportacao(unidRaw || 'UN'),
    qtd: isPrincipal ? 0 : (qtd > 0 ? qtd : 0),
    quantidadeEmBranco: isPrincipal || !temQtd,
    preco: isPrincipal ? 0 : preco,
    ref: isPrincipal ? 0 : preco,
    precoVenda: isPrincipal ? 0 : precoVenda,
    cat: isPrincipal ? 'Grupo de serviços' : 'Serviço da obra',
    capitulo: 'Serviços da Obra',
    tipoItem: isPrincipal ? 'grupo' : 'servico',
    ehGrupo: isPrincipal,
    ordem: (STATE.orcamento || []).length + index + 1,
    origem: isPrincipal ? 'servico-grupo' : 'servico-importado',
    origemArquivo,
    origemMetodo: raw?.origemMetodo || raw?.origem || 'importacao',
    linhaOrigem: raw?.linhaOrigem || '',
    totalLinha: isPrincipal ? 0 : totalLinha,
    totalVendaLinha: isPrincipal ? 0 : totalVendaLinha
  };
}

async function obrasServicosImportarArquivo(event) {
  const input = event?.target;
  const files = Array.from(input?.files || []);
  if (input) input.value = '';
  if (!files.length) return;
  if (!obraAtiva()) {
    toast('Crie ou abra uma obra antes de importar a relação de serviços.', 'error');
    return;
  }

  const importados = [];
  const avisos = [];
  for (const file of files) {
    try {
      const ext = getFileExt(file);
      let items = [];
      if (SPREADSHEET_EXTS.includes(ext)) {
        const sheets = await lerPlanilhasArquivo(file);
        sheets.forEach(entry => {
          const sugestao = sheetSuggestMapping(entry.raw, 'orcamento');
          const parsed = sheetParseMappedRows(entry.raw, sugestao.mapping, 'orcamento', sugestao.headerRow);
          items.push(...parsed.items.map(it => ({ ...it, origemMetodo: `Planilha ${entry.sheetName}` })));
          avisos.push(...parsed.issues.map(msg => `${file.name}/${entry.sheetName}: ${msg}`));
        });
      } else if (ext === 'pdf') {
        items = await obrasServicosExtrairPDF(file);
      } else {
        avisos.push(`${file.name}: formato ignorado.`);
        continue;
      }
      items.forEach((item, idx) => {
        const normalizado = obrasServicoNormalizarImportado(item, file.name, importados.length + idx);
        if (normalizado) importados.push(normalizado);
      });
    } catch (err) {
      avisos.push(`${file.name}: ${err.message}`);
    }
  }

  if (!importados.length) {
    toast(avisos[0] || 'Nenhum serviço válido foi encontrado no arquivo.', 'error');
    return;
  }

  STATE.orcamento = [...(STATE.orcamento || []), ...importados];
  STATE.orcamento.forEach((it, idx) => { it.ordem = idx + 1; });
  invalidarDescontoPregao('serviços importados para a obra');
  saveState();
  obrasRender();
  if (typeof renderElaborar === 'function') renderElaborar();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof preencherSelectsOperacionais === 'function') preencherSelectsOperacionais();
  const extra = avisos.length ? ` ${Math.min(avisos.length, 3)} aviso(s) para revisar.` : '';
  toast(`${importados.length} serviço(s) importado(s) para a obra.${extra}`, avisos.length ? 'info' : 'success');
}

async function obrasServicosExtrairPDF(file) {
  if (!window.pdfjsLib) throw new Error('PDF.js não carregou.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const linhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const byY = {};
    tc.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!byY[y]) byY[y] = [];
      byY[y].push({ x: Math.round(item.transform[4]), text: String(item.str || '').trim() });
    });
    Object.keys(byY).map(Number).sort((a, b) => b - a).forEach(y => {
      const line = byY[y].sort((a, b) => a.x - b.x).map(part => part.text).join(' ').replace(/\s+/g, ' ').trim();
      if (line) linhas.push(line);
    });
    await sleep(5);
  }
  const estruturados = parsearLinhas(linhas);
  const genericos = obrasServicosParseLinhasGenericas(linhas);
  return genericos.length > estruturados.length ? genericos : estruturados;
}

function obrasServicosParseLinhasGenericas(linhas) {
  const tailRe = new RegExp(`\\b(${UNIDADE_TAIL_IMPORT_RE_SRC})\\b\\s+(${NUM_IMPORT_RE_SRC})(?:\\s+(?:R\\$\\s*)?(${NUM_IMPORT_RE_SRC}))?(?:\\s+(?:R\\$\\s*)?(${NUM_IMPORT_RE_SRC}))?\\s*$`, 'i');
  const rows = [];
  (linhas || []).forEach(line => {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    if (!cleaned || linhaImportacaoIgnorada(cleaned)) return;
    const tail = cleaned.match(tailRe);
    if (!tail || tail.index === undefined) return;
    const before = cleaned.slice(0, tail.index).trim();
    const head = before.match(/^([A-Z]{0,4}\d[\w.\-/]*(?:\s+\d[\w.\-/]*){0,5})\s+(.{4,})$/i);
    if (!head) return;
    const cod = limparCodigo(head[1]).replace(/\s+/g, '.');
    const desc = head[2].replace(/\s+/g, ' ').trim();
    if (!cod || desc.length < 4) return;
    rows.push({
      cod,
      desc,
      unid: normalizarUnidadeImportacao(tail[1]),
      qtd: parseNumeroBR(tail[2]) || 1,
      preco: parseNumeroBR(tail[3]) || 0,
      precoVenda: parseNumeroBR(tail[3]) || 0,
      totalLinha: parseNumeroBR(tail[4]) || 0,
      totalVendaLinha: parseNumeroBR(tail[4]) || 0,
      origem: 'pdf',
      origemMetodo: 'PDF planilha de serviços',
      linhaOrigem: cleaned
    });
  });
  return rows;
}

function obrasServicosRender() {
  const tbody = document.getElementById('obra-servicos-lista');
  const servSelect = document.getElementById('obra-serv-select');
  const cpuSelect = document.getElementById('obra-serv-cpu');
  if (!tbody && !servSelect && !cpuSelect) return;
  const servicos = Array.isArray(STATE.orcamento) ? STATE.orcamento : [];
  if (servSelect) {
    const vinculaveis = servicos.filter(it => !obrasServicoEhPrincipal(it));
    servSelect.innerHTML = vinculaveis.length
      ? vinculaveis.map(it => `<option value="${escapeHtml(it.id)}">${escapeHtml(it.cod || '')} · ${escapeHtml(it.desc || '')}</option>`).join('')
      : '<option value="">Nenhum serviço item cadastrado</option>';
  }
  const cpus = typeof CPU_BIBLIOTECA !== 'undefined' && Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
  if (cpuSelect) {
    cpuSelect.innerHTML = cpus.length
      ? cpus.map(cpu => `<option value="${escapeHtml(String(cpu.id))}">${escapeHtml(cpu.cod || '')} · ${escapeHtml(cpu.desc || '')} · ${fmtMoeda(cpu.precoUnitario || 0)}</option>`).join('')
      : '<option value="">Nenhuma CPU salva ainda</option>';
  }
  if (!tbody) return;
  if (!servicos.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty-state" style="padding:18px">Nenhum serviço cadastrado nesta obra.</td></tr>';
    return;
  }
  tbody.innerHTML = servicos.map(it => {
    const principal = obrasServicoEhPrincipal(it);
    const subtotal = principal ? obrasServicoSubtotalFilhos(it, servicos) : 0;
    const subtotalVenda = principal ? obrasServicoSubtotalVendaFilhos(it, servicos) : 0;
    const total = principal ? subtotal : itemValor(it);
    const totalVenda = principal ? subtotalVenda : itemValorVenda(it);
    const qtdVazia = principal || it.quantidadeEmBranco === true || !(Number(it.qtd) > 0);
    const cpuLabel = principal ? 'Item principal / subtotal' : (it.composicaoCod ? `${it.composicaoCod} · ${it.composicaoDesc || ''}` : 'Sem composição vinculada');
    return `<tr class="${principal ? 'obra-servico-principal' : ''}">
      <td class="td-mono">${escapeHtml(it.cod || '')}</td>
      <td><strong>${escapeHtml(it.desc || '')}</strong></td>
      <td>${principal ? '—' : escapeHtml(it.unid || '')}</td>
      <td>${qtdVazia ? '—' : fmtNum(it.qtd || 0)}</td>
      <td>${escapeHtml(cpuLabel)}</td>
      <td>${principal ? '—' : fmtMoeda(it.preco || 0)}</td>
      <td>${principal ? '—' : fmtMoeda(obrasServicoVendaUnitario(it))}</td>
      <td><strong>${fmtMoeda(total)}</strong></td>
      <td><strong>${fmtMoeda(totalVenda)}</strong></td>
      <td><div class="obra-row-actions">
        <button class="btn btn-outline btn-sm" onclick="obrasServicoEditar(${inlineJsArg(it.id)})">Editar</button>
        <button class="btn btn-outline btn-sm" onclick="obrasServicoExcluir(${inlineJsArg(it.id)})">Excluir</button>
      </div></td>
    </tr>`;
  }).join('');
}

function obrasCalculoTotaisAtuais() {
  const lista = STATE.orcamento || [];
  return {
    custo: lista.reduce((s, it) => s + itemValor(it), 0),
    venda: lista.reduce((s, it) => s + itemValorVenda(it), 0)
  };
}

function obrasCalculoSetTotais(totais = obrasCalculoTotaisAtuais()) {
  const custo = document.getElementById('obra-calc-total-custo');
  const venda = document.getElementById('obra-calc-total-venda');
  if (custo) custo.textContent = fmtMoeda(totais.custo || 0);
  if (venda) venda.textContent = fmtMoeda(totais.venda || 0);
  const status = document.getElementById('obra-calc-status');
  if (status) {
    status.textContent = hasBDI()
      ? `BDI configurado: ${bdiText('0%')}. Ao calcular, a venda será custo + BDI.`
      : 'Sem BDI configurado, a venda será igual ao custo.';
    status.className = 'form-help';
  }
}

function obrasCalculoAbrir() {
  normalizeState();
  const modal = document.getElementById('obra-calc-modal');
  if (modal) modal.style.display = 'flex';
  obrasCalculoSetTotais();
}

function obrasCalculoFechar() {
  const modal = document.getElementById('obra-calc-modal');
  if (modal) modal.style.display = 'none';
}

function obrasCalculoGrupoInsumo(ins) {
  const cod = codigoChave(ins?.cod || ins?.codigo);
  if (cod.startsWith('IE')) return 'E';
  if (cod.startsWith('IH')) return 'S';
  if (cod.startsWith('IM')) return 'M';
  if (cod.startsWith('IS')) return 'SV';
  if (cod.startsWith('IT')) return 'T';
  if (cod && !cod.startsWith('I')) return 'AX';
  return cpuTipoManual(cod || ins?.tipo || ins?.natureza || ins?.categoria, ins?.desc || ins?.descricao || '');
}

function obrasCalculoAtualizarInsumosCpu(flags = {}) {
  const cpus = typeof CPU_BIBLIOTECA !== 'undefined' && Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
  let insumosAtualizados = 0;
  let cpusAtualizadas = 0;
  cpus.forEach(cpu => {
    let mudou = false;
    (cpu.insumos || []).forEach(ins => {
      const grupo = obrasCalculoGrupoInsumo(ins);
      const deveAtualizar = (flags.equipamentos && grupo === 'E') || (flags.maoObra && grupo === 'S');
      if (!deveAtualizar) return;
      const code = ins.cod || ins.codigo;
      const ref = lookupPreco(code);
      const precoAtual = Number(ref?.preco ?? ref?.item?.precoMedio ?? ref?.item?.preco ?? 0) || 0;
      if (precoAtual <= 0) return;
      if (Math.abs((Number(ins.preco) || 0) - precoAtual) > 0.0001) {
        ins.preco = precoAtual;
        ins.desc = ins.desc || ref?.item?.descricao || ins.desc;
        ins.unid = ins.unid || ref?.item?.unidade || ins.unid;
        ins.fonte = ref?.fonte || ins.fonte;
        mudou = true;
        insumosAtualizados++;
      }
    });
    cpuRecalcularComposicaoSalva(cpu);
    if (mudou) cpusAtualizadas++;
  });
  if (cpusAtualizadas && typeof cpuSaveLib === 'function') cpuSaveLib();
  return { cpusAtualizadas, insumosAtualizados };
}

function obrasCalculoCpuDoItem(item) {
  const cpus = typeof CPU_BIBLIOTECA !== 'undefined' && Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
  if (!cpus.length || !item) return null;
  return cpus.find(cpu => String(cpu.id) === String(item.composicaoId))
    || cpus.find(cpu => codigoChave(cpu.cod) === codigoChave(item.composicaoCod))
    || null;
}

function obrasCalculoAplicarServicos() {
  let itensComCpu = 0;
  let itensManuais = 0;
  (STATE.orcamento || []).forEach(item => {
    if (obrasServicoEhPrincipal(item)) {
      item.preco = 0;
      item.ref = 0;
      item.precoVenda = 0;
      item.totalLinha = 0;
      item.totalVendaLinha = 0;
      return;
    }
    const cpu = obrasCalculoCpuDoItem(item);
    if (cpu) {
      const custo = roundUnitPrice(Number(cpu.precoUnitario) || 0);
      item.preco = custo;
      item.ref = custo;
      item.precoVenda = roundUnitPrice(totalComBDI(custo));
      item.composicaoId = cpu.id;
      item.composicaoCod = cpu.cod;
      item.composicaoDesc = cpu.desc;
      item.totalLinha = 0;
      item.totalVendaLinha = 0;
      itensComCpu++;
    } else {
      const custo = roundUnitPrice(Number(item.preco ?? item.custoUnitario ?? 0) || 0);
      item.preco = custo;
      item.ref = Number(item.ref) || custo;
      item.precoVenda = hasBDI() ? roundUnitPrice(totalComBDI(custo)) : custo;
      itensManuais++;
    }
  });
  return { itensComCpu, itensManuais };
}

function obrasCalculoExecutar() {
  normalizeState();
  const flags = {
    equipamentos: !!document.getElementById('obra-calc-equip')?.checked,
    maoObra: !!document.getElementById('obra-calc-mao')?.checked
  };
  const atualizacao = obrasCalculoAtualizarInsumosCpu(flags);
  if (!flags.equipamentos && !flags.maoObra) {
    const cpus = typeof CPU_BIBLIOTECA !== 'undefined' && Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
    cpus.forEach(cpu => cpuRecalcularComposicaoSalva(cpu));
    if (cpus.length && typeof cpuSaveLib === 'function') cpuSaveLib();
  }
  const aplicacao = obrasCalculoAplicarServicos();
  const totais = obrasCalculoTotaisAtuais();
  obrasCalculoSetTotais(totais);
  saveState();
  obrasRender();
  if (typeof renderElaborar === 'function') renderElaborar();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof preencherSelectsOperacionais === 'function') preencherSelectsOperacionais();
  const status = document.getElementById('obra-calc-status');
  if (status) {
    status.className = 'form-help ok';
    status.textContent = `${aplicacao.itensComCpu} serviço(s) com composição e ${aplicacao.itensManuais} manual(is). ${atualizacao.insumosAtualizados} insumo(s) de custo horário atualizado(s).`;
  }
  toast('Planilha de serviços calculada.', 'success');
}

// ═══════════════════════════════════════════════════════════
// INSUMOS — CADASTRO MANUAL, GRUPOS E CONSULTAS
// ═══════════════════════════════════════════════════════════
function insumosGrupoPorPrefixo(codigo) {
  const code = codigoChave(codigo);
  if (code.startsWith('IH')) return 'S';
  if (code.startsWith('IE')) return 'E';
  if (code.startsWith('IM')) return 'M';
  if (code.startsWith('IS')) return 'SV';
  if (code.startsWith('IT')) return 'T';
  return '';
}

function insumosPrefixoPorGrupo(grupo) {
  return { S:'IH', E:'IE', M:'IM', SV:'IS', T:'IT' }[grupo] || 'IM';
}

function insumosGrupoLabel(grupo) {
  return {
    S: 'Mão de obra',
    E: 'Equipamento',
    M: 'Material',
    SV: 'Serviço',
    T: 'Transporte'
  }[grupo] || 'Material';
}

function insumosGrupoNormalizado(value, codigo = '', descricao = '') {
  const prefixo = insumosGrupoPorPrefixo(codigo);
  if (prefixo) return prefixo;
  const tipoDireto = textoChave(value || '');
  if (['S','MO','MAO OBRA','MAO DE OBRA','HOMEM'].includes(tipoDireto)) return 'S';
  if (['E','EQ','EQUIP','EQUIPAMENTO'].includes(tipoDireto)) return 'E';
  if (['M','MAT','MATERIAL'].includes(tipoDireto)) return 'M';
  if (['T','TR','TRANSP','TRANSPORTE','FRETE'].includes(tipoDireto)) return 'T';
  if (['SV','SERV','SERVICO'].includes(tipoDireto)) return 'SV';
  const raw = textoChave(`${value || ''} ${descricao || ''}`);
  if (raw.includes('MAO') || raw.includes('HOMEM')) return 'S';
  if (raw.includes('EQUIP') || raw.includes('MAQUINA') || raw === 'E') return 'E';
  if (raw.includes('TRANSP') || raw.includes('FRETE') || raw === 'T') return 'T';
  if (raw.includes('SERVICO') || raw === 'SV' || raw === 'IS') return 'SV';
  return 'M';
}

function insumosCodigoSequencial(grupo = 'M') {
  const prefixo = insumosPrefixoPorGrupo(grupo);
  const usados = new Set((STATE.insumosManuais || []).map(i => codigoChave(i.codigoSinapi || i.codigo)));
  for (let i = 1; i < 99999; i++) {
    const cod = `${prefixo}${String(i).padStart(4, '0')}`;
    if (!usados.has(cod)) return cod;
  }
  return `${prefixo}${Date.now().toString().slice(-5)}`;
}

function insumosPrecoItem(item) {
  return Number(item?.precoMedio ?? item?.preco ?? item?.valor ?? 0) || 0;
}

function insumosCustoImprodutivo(item) {
  return Number(item?.custoImprodutivo ?? item?.precoImprodutivo ?? item?.improdutivo ?? 0) || 0;
}

function insumosDataInputValue(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return todayIso();
}

function insumosNormalizarManual(raw, options = {}) {
  const descricao = String(raw.descricao || raw.desc || '').trim();
  const grupo = insumosGrupoNormalizado(raw.grupo || raw.tipo || raw.natureza || raw.categoria, raw.codigoSinapi || raw.codigo || raw.cod, descricao);
  const codigoInformado = String(raw.codigoSinapi || raw.codigo || raw.cod || '').trim().toUpperCase();
  const codigo = codigoInformado || insumosCodigoSequencial(grupo);
  const preco = Number(raw.precoMedio ?? raw.preco ?? raw.valor ?? 0) || 0;
  const custoImprodutivo = grupo === 'E'
    ? (Number(raw.custoImprodutivo ?? raw.precoImprodutivo ?? raw.improdutivo ?? 0) || 0)
    : 0;
  return {
    codigoSinapi: codigo,
    codigo,
    descricao,
    unidade: String(raw.unidade || raw.unid || raw.un || (grupo === 'S' || grupo === 'E' ? 'h' : 'UN')).trim() || 'UN',
    tipo: grupo,
    grupo,
    natureza: grupo,
    categoria: insumosGrupoLabel(grupo),
    precoMedio: preco,
    preco,
    custoImprodutivo,
    precoImprodutivo: custoImprodutivo,
    fonte: String(raw.fonte || raw.fornecedor || options.fonte || 'Cadastro manual').trim(),
    origem: raw.origem || options.origem || 'manual',
    origemArquivo: options.origemArquivo || raw.origemArquivo || '',
    dataReferencia: raw.dataReferencia || raw.data || new Date().toLocaleDateString('pt-BR'),
    memoriaCustoHorario: raw.memoriaCustoHorario || '',
    parcelasCustoHorario: raw.parcelasCustoHorario || null,
    modoCalculo: raw.modoCalculo || raw.tipoCalculo || (raw.memoriaCustoHorario ? 'calculada' : 'manual'),
    salarioMensal: Number(raw.salarioMensal ?? raw.salario ?? 0) || 0,
    beneficiosMensais: Number(raw.beneficiosMensais ?? raw.beneficios ?? 0) || 0,
    beneficiosCompostos: clonePlain(raw.beneficiosCompostos || [], []),
    encargosPct: Number(raw.encargosPct ?? raw.encargos ?? 0) || 0,
    horasProdutivasMes: Number(raw.horasProdutivasMes ?? raw.horas ?? 0) || 0,
    custoProdutivo: raw.custoProdutivo ?? preco,
    manual: true,
    importado: !!options.importado || raw.importado === true,
    atualizadoEm: new Date().toISOString()
  };
}

function insumosSalvarManualItem(raw, options = {}) {
  normalizeState();
  const item = insumosNormalizarManual(raw, options);
  const code = codigoChave(item.codigoSinapi || item.codigo);
  if (!code || !item.descricao) return null;
  const byCode = new Map((STATE.insumosManuais || []).map(i => [codigoChave(i.codigoSinapi || i.codigo), i]));
  byCode.set(code, { ...(byCode.get(code) || {}), ...item, codigoSinapi: code, codigo: code });
  STATE.insumosManuais = [...byCode.values()].sort((a, b) =>
    codigoChave(a.codigoSinapi || a.codigo).localeCompare(codigoChave(b.codigoSinapi || b.codigo), 'pt-BR')
  );
  if (options.save !== false) {
    saveState();
    cpuRenderManualCount();
  }
  return byCode.get(code);
}

function insumosManualPorCodigo(codigo) {
  const code = codigoChave(codigo);
  if (!code) return null;
  return (STATE.insumosManuais || []).find(i => codigoChave(i.codigoSinapi || i.codigo) === code) || null;
}

function insumosPreencherFormularioManual(item, options = {}) {
  if (!item) return false;
  const grupo = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza, item.codigoSinapi || item.codigo, item.descricao);
  const set = (id, value = '') => { const el = document.getElementById(id); if (el) el.value = value; };
  set('ins-codigo', item.codigoSinapi || item.codigo || '');
  set('ins-desc', item.descricao || '');
  set('ins-unid', item.unidade || item.unid || 'UN');
  set('ins-grupo', grupo);
  set('ins-data', insumosDataInputValue(item.dataReferencia || item.data));
  set('ins-preco', String(insumosPrecoItem(item)).replace('.', ','));
  set('ins-improd', grupo === 'E' ? String(insumosCustoImprodutivo(item)).replace('.', ',') : '');
  set('ins-fonte', item.fonte || '');
  const modo = item.modoCalculo === 'calculada' || item.memoriaCustoHorario ? 'calculada' : 'manual';
  set('ins-modo-calculo', grupo === 'S' ? modo : 'manual');
  set('ins-mo-salario', item.salarioMensal ? String(item.salarioMensal) : '');
  set('ins-mo-beneficios', item.beneficiosMensais ? String(item.beneficiosMensais) : '');
  set('ins-mo-encargos', item.encargosPct ? String(item.encargosPct) : '127.5');
  set('ins-mo-horas', item.horasProdutivasMes ? String(item.horasProdutivasMes) : '189');
  MAO_OBRA_BENEFICIOS_DRAFT = clonePlain(item.beneficiosCompostos || [], []).map(i => ({ ...i, id: i.id || makeId('ben') }));
  insumosMaoObraRenderBeneficios();
  const benPreview = document.getElementById('ins-ben-preview');
  if (benPreview) {
    const totalBeneficios = MAO_OBRA_BENEFICIOS_DRAFT.reduce((s, i) => s + beneficioTotalMensal(i), 0);
    benPreview.textContent = totalBeneficios ? `Benefícios mensais calculados: ${fmtMoeda(totalBeneficios)}.` : '';
    benPreview.className = totalBeneficios ? 'form-help ok' : 'form-help';
  }
  const preview = document.getElementById('ins-mo-preview');
  if (preview) {
    preview.innerHTML = item.memoriaCustoHorario
      ? `<strong>Custo horário salvo:</strong> ${fmtMoeda(insumosPrecoItem(item))}<br><span>${escapeHtml(item.memoriaCustoHorario)}</span>`
      : '';
  }
  insumosGrupoAlterado();
  if (!options.silent) toast('Insumo manual carregado para edição.', 'info');
  return true;
}

function insumosCodigoAlterado() {
  const codigo = document.getElementById('ins-codigo')?.value || '';
  const grupo = insumosGrupoPorPrefixo(codigo);
  if (grupo) {
    const sel = document.getElementById('ins-grupo');
    if (sel) sel.value = grupo;
  }
  const existente = insumosManualPorCodigo(codigo);
  if (existente) {
    insumosPreencherFormularioManual(existente, { silent:true });
    return;
  }
  insumosGrupoAlterado();
}

function insumosGrupoAlterado() {
  const grupo = document.getElementById('ins-grupo')?.value || 'M';
  const wrap = document.getElementById('ins-improd-wrap');
  const improd = document.getElementById('ins-improd');
  const modo = document.getElementById('ins-modo-calculo');
  if (wrap) wrap.style.opacity = grupo === 'E' ? '1' : '.45';
  if (improd) {
    improd.disabled = grupo !== 'E';
    if (grupo !== 'E') improd.value = '';
  }
  if (modo && grupo !== 'S' && modo.value === 'calculada') modo.value = 'manual';
  const codigo = document.getElementById('ins-codigo');
  if (codigo && !codigo.value.trim()) codigo.placeholder = `Ex: ${insumosPrefixoPorGrupo(grupo)}0001`;
  insumosModoCalculoAlterado();
}

function insumosModoCalculoAlterado() {
  const grupo = document.getElementById('ins-grupo')?.value || 'M';
  const modo = document.getElementById('ins-modo-calculo')?.value || 'manual';
  const panel = document.getElementById('ins-mao-calculada-panel');
  const preco = document.getElementById('ins-preco');
  const visible = grupo === 'S' && modo === 'calculada';
  if (panel) panel.style.display = visible ? '' : 'none';
  if (preco) {
    preco.readOnly = visible;
    preco.title = visible ? 'Valor calculado pela composição da mão de obra' : '';
  }
  const help = document.getElementById('ins-form-help');
  if (help) {
    help.textContent = visible
      ? 'Modo calculado ativo: calcule salário, benefícios, encargos e horas produtivas para atualizar o custo unitário do insumo.'
      : 'O custo improdutivo fica disponível apenas para equipamentos.';
  }
  if (visible) insumosMaoObraRenderBeneficios();
}

function calcularCustoMaoObraDados({ salario = 0, beneficios = 0, encargos = 0, horas = 189, beneficiosCompostos = [] } = {}) {
  const sal = Number(salario) || 0;
  const ben = Number(beneficios) || 0;
  const enc = Number(encargos) || 0;
  const h = Math.max(1, Number(horas) || 189);
  const base = sal + ben;
  const encargosValor = base * enc / 100;
  const custoHora = (base + encargosValor) / h;
  const benMemoria = beneficiosCompostos.length
    ? ` Benefícios compostos: ${beneficiosCompostos.map(i => `${i.descricao} ${fmtMoeda(beneficioTotalMensal(i))}/mês`).join('; ')}.`
    : '';
  const memoria = `(${fmtMoeda(sal)} salário + ${fmtMoeda(ben)} benefícios) + ${enc.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% encargos sobre salário + benefícios / ${h} h produtivas.${benMemoria}`;
  return {
    salario: sal,
    beneficios: ben,
    encargos: enc,
    horas: h,
    encargosValor: roundCustoHorario(encargosValor),
    custoHora: roundCustoHorario(custoHora),
    memoria,
    beneficiosCompostos: clonePlain(beneficiosCompostos, [])
  };
}

function insumosMaoObraAdicionarBeneficio() {
  const raw = document.getElementById('ins-ben-desc')?.value?.trim();
  const qtd = readNumeroCampo('ins-ben-qtd') || 1;
  let preco = readNumeroCampo('ins-ben-preco');
  const periodo = document.getElementById('ins-ben-periodo')?.value || 'mensal';
  const fatorMes = readNumeroCampo('ins-ben-fator') || beneficioFatorPadrao(periodo);
  const preview = document.getElementById('ins-ben-preview');
  if (!raw) {
    toast('Informe o benefício ou código do insumo.', 'error');
    return;
  }
  const ref = buscarReferenciaPorCodigo(raw);
  const descricao = ref?.descricao || raw;
  if (ref && !preco) preco = ref.precoUnitario;
  if (preco <= 0) {
    toast('Informe o preço unitário do benefício.', 'error');
    return;
  }
  MAO_OBRA_BENEFICIOS_DRAFT.push({
    id: makeId('ben'),
    codigo: ref?.codigo || '',
    descricao,
    quantidade: qtd,
    precoUnitario: preco,
    periodicidade: periodo,
    fatorMes,
    fonte: ref?.fonte || 'Informado'
  });
  ['ins-ben-desc','ins-ben-preco','ins-ben-fator'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const qtdEl = document.getElementById('ins-ben-qtd');
  if (qtdEl) qtdEl.value = '1';
  if (preview) {
    preview.textContent = `${descricao} adicionado à composição de benefícios.`;
    preview.className = 'form-help ok';
  }
  insumosMaoObraRenderBeneficios();
  insumosMaoObraAplicarBeneficios({ silent:true });
}

function insumosMaoObraRemoverBeneficio(id) {
  MAO_OBRA_BENEFICIOS_DRAFT = MAO_OBRA_BENEFICIOS_DRAFT.filter(i => i.id !== id);
  insumosMaoObraRenderBeneficios();
  insumosMaoObraAplicarBeneficios({ silent:true });
}

function insumosMaoObraLimparBeneficios() {
  MAO_OBRA_BENEFICIOS_DRAFT = [];
  insumosMaoObraRenderBeneficios();
  insumosMaoObraAplicarBeneficios({ silent:true });
}

function insumosMaoObraRenderBeneficios() {
  const tbody = document.getElementById('ins-beneficios-lista');
  if (!tbody) return;
  if (!MAO_OBRA_BENEFICIOS_DRAFT.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding:14px">Nenhum benefício composto.</td></tr>';
    return;
  }
  tbody.innerHTML = MAO_OBRA_BENEFICIOS_DRAFT.map(i => `
    <tr>
      <td>${escapeHtml(i.descricao)}<div class="table-input-sub">${escapeHtml(i.codigo || i.fonte || '')}</div></td>
      <td>${fmtNum(i.quantidade)}</td>
      <td>${fmtMoeda(i.precoUnitario)}</td>
      <td>${escapeHtml(i.periodicidade)}</td>
      <td>${fmtNum(i.fatorMes)}</td>
      <td><strong>${fmtMoeda(beneficioTotalMensal(i))}</strong></td>
      <td><button class="btn btn-outline btn-sm" onclick="insumosMaoObraRemoverBeneficio('${escapeHtml(i.id)}')">Remover</button></td>
    </tr>
  `).join('');
}

function insumosMaoObraAplicarBeneficios(options = {}) {
  const total = MAO_OBRA_BENEFICIOS_DRAFT.reduce((s, i) => s + beneficioTotalMensal(i), 0);
  const input = document.getElementById('ins-mo-beneficios');
  if (input) input.value = total ? String(roundCustoHorario(total, 2)).replace('.', ',') : '';
  const preview = document.getElementById('ins-ben-preview');
  if (preview) {
    preview.textContent = total ? `Benefícios mensais calculados: ${fmtMoeda(total)}.` : '';
    preview.className = total ? 'form-help ok' : 'form-help';
  }
  if (!options.skipPreview) insumosCalcularMaoObra();
  if (!options.silent && total) toast('Benefícios calculados e aplicados à mão de obra.', 'success');
  return total;
}

function insumosCalcularMaoObra() {
  const beneficiosCompostos = clonePlain(MAO_OBRA_BENEFICIOS_DRAFT, []);
  const beneficiosCalculados = beneficiosCompostos.length
    ? beneficiosCompostos.reduce((s, i) => s + beneficioTotalMensal(i), 0)
    : 0;
  if (beneficiosCompostos.length) {
    const input = document.getElementById('ins-mo-beneficios');
    if (input) input.value = String(roundCustoHorario(beneficiosCalculados, 2)).replace('.', ',');
  }
  const calc = calcularCustoMaoObraDados({
    salario: readNumeroCampo('ins-mo-salario'),
    beneficios: beneficiosCompostos.length ? beneficiosCalculados : readNumeroCampo('ins-mo-beneficios'),
    encargos: readNumeroCampo('ins-mo-encargos'),
    horas: readNumeroCampo('ins-mo-horas'),
    beneficiosCompostos
  });
  const preview = document.getElementById('ins-mo-preview');
  if (preview) {
    preview.innerHTML = `<strong>Custo horário calculado:</strong> ${fmtMoeda(calc.custoHora)}<br><span>${escapeHtml(calc.memoria)}</span>`;
  }
  return calc;
}

function insumosAplicarCustoMaoObra() {
  const grupo = document.getElementById('ins-grupo')?.value || 'M';
  if (grupo !== 'S') {
    toast('O cálculo de mão de obra só se aplica a insumos do grupo Mão de obra.', 'error');
    return null;
  }
  const calc = insumosCalcularMaoObra();
  if (calc.custoHora <= 0) {
    toast('Informe salário, benefícios, encargos e horas produtivas para calcular.', 'error');
    return null;
  }
  const preco = document.getElementById('ins-preco');
  const fonte = document.getElementById('ins-fonte');
  if (preco) preco.value = String(calc.custoHora).replace('.', ',');
  if (fonte && (!fonte.value.trim() || fonte.value.trim() === 'Cadastro manual')) fonte.value = 'TLPlanly/Cálculo de mão de obra';
  toast('Custo calculado aplicado ao insumo.', 'success');
  return calc;
}

function insumosLimparFormulario() {
  const grupo = document.getElementById('ins-grupo')?.value || 'M';
  const set = (id, value = '') => { const el = document.getElementById(id); if (el) el.value = value; };
  set('ins-codigo', insumosCodigoSequencial(grupo));
  set('ins-desc');
  set('ins-unid', grupo === 'S' || grupo === 'E' ? 'h' : 'UN');
  set('ins-data', todayIso());
  set('ins-preco');
  set('ins-improd');
  set('ins-fonte', 'Cadastro manual');
  set('ins-modo-calculo', 'manual');
  set('ins-mo-salario');
  set('ins-mo-beneficios');
  set('ins-mo-encargos', '127.5');
  set('ins-mo-horas', '189');
  MAO_OBRA_BENEFICIOS_DRAFT = [];
  insumosMaoObraRenderBeneficios();
  const benPreview = document.getElementById('ins-ben-preview');
  if (benPreview) { benPreview.textContent = ''; benPreview.className = 'form-help'; }
  const preview = document.getElementById('ins-mo-preview');
  if (preview) preview.innerHTML = '';
  insumosGrupoAlterado();
}

function insumosSalvarManual() {
  normalizeState();
  const grupo = document.getElementById('ins-grupo')?.value || 'M';
  const modoCalculo = document.getElementById('ins-modo-calculo')?.value || 'manual';
  const calcMaoObra = grupo === 'S' && modoCalculo === 'calculada'
    ? insumosAplicarCustoMaoObra()
    : null;
  if (grupo === 'S' && modoCalculo === 'calculada' && !calcMaoObra) return;
  const raw = {
    codigo: document.getElementById('ins-codigo')?.value,
    descricao: document.getElementById('ins-desc')?.value,
    unidade: document.getElementById('ins-unid')?.value,
    grupo,
    preco: readNumeroCampo('ins-preco'),
    custoImprodutivo: readNumeroCampo('ins-improd'),
    fonte: document.getElementById('ins-fonte')?.value,
    data: document.getElementById('ins-data')?.value,
    modoCalculo,
    memoriaCustoHorario: calcMaoObra?.memoria || '',
    salarioMensal: calcMaoObra?.salario || 0,
    beneficiosMensais: calcMaoObra?.beneficios || 0,
    beneficiosCompostos: calcMaoObra?.beneficiosCompostos || [],
    encargosPct: calcMaoObra?.encargos || 0,
    horasProdutivasMes: calcMaoObra?.horas || 0,
    custoProdutivo: calcMaoObra?.custoHora || readNumeroCampo('ins-preco')
  };
  const item = insumosNormalizarManual(raw);
  if (!item.codigo) { toast('Informe o código do insumo.', 'error'); return; }
  if (!item.descricao) { toast('Informe a descrição do insumo.', 'error'); return; }
  insumosSalvarManualItem(item);
  if (grupo === 'S' && modoCalculo === 'calculada' && calcMaoObra?.custoHora > 0) {
    custosMaoObraRegistrarDeInsumo(item, calcMaoObra);
  }
  insumosRender();
  cpuRenderManualCount();
  toast('Insumo salvo na base manual', 'success');
}

function insumosEditarManual(codigo) {
  const code = codigoChave(codigo);
  const item = (STATE.insumosManuais || []).find(i => codigoChave(i.codigoSinapi || i.codigo) === code);
  if (!item) { toast('Este item não é da base manual.', 'warning'); return; }
  const grupo = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza, item.codigoSinapi || item.codigo, item.descricao);
  const set = (id, value = '') => { const el = document.getElementById(id); if (el) el.value = value; };
  set('ins-codigo', item.codigoSinapi || item.codigo || '');
  set('ins-desc', item.descricao || '');
  set('ins-unid', item.unidade || item.unid || 'UN');
  set('ins-grupo', grupo);
  set('ins-data', insumosDataInputValue(item.dataReferencia || item.data));
  set('ins-preco', String(insumosPrecoItem(item)).replace('.', ','));
  set('ins-improd', grupo === 'E' ? String(insumosCustoImprodutivo(item)).replace('.', ',') : '');
  set('ins-fonte', item.fonte || '');
  const modo = item.modoCalculo === 'calculada' || item.memoriaCustoHorario ? 'calculada' : 'manual';
  set('ins-modo-calculo', grupo === 'S' ? modo : 'manual');
  set('ins-mo-salario', item.salarioMensal ? String(item.salarioMensal) : '');
  set('ins-mo-beneficios', item.beneficiosMensais ? String(item.beneficiosMensais) : '');
  set('ins-mo-encargos', item.encargosPct ? String(item.encargosPct) : '127.5');
  set('ins-mo-horas', item.horasProdutivasMes ? String(item.horasProdutivasMes) : '189');
  MAO_OBRA_BENEFICIOS_DRAFT = clonePlain(item.beneficiosCompostos || [], []).map(i => ({ ...i, id: i.id || makeId('ben') }));
  insumosMaoObraRenderBeneficios();
  const benPreview = document.getElementById('ins-ben-preview');
  if (benPreview) {
    const totalBeneficios = MAO_OBRA_BENEFICIOS_DRAFT.reduce((s, i) => s + beneficioTotalMensal(i), 0);
    benPreview.textContent = totalBeneficios ? `Benefícios mensais calculados: ${fmtMoeda(totalBeneficios)}.` : '';
    benPreview.className = totalBeneficios ? 'form-help ok' : 'form-help';
  }
  const preview = document.getElementById('ins-mo-preview');
  if (preview) {
    preview.innerHTML = item.memoriaCustoHorario
      ? `<strong>Custo horário salvo:</strong> ${fmtMoeda(insumosPrecoItem(item))}<br><span>${escapeHtml(item.memoriaCustoHorario)}</span>`
      : '';
  }
  insumosGrupoAlterado();
  showView('insumos');
}

function insumosCopiarParaManual(codigo) {
  const code = codigoChave(codigo);
  const item = insumosTodasBases({ somenteManual:false }).find(i => codigoChave(i.codigoSinapi || i.codigo) === code);
  if (!item) { toast('Insumo não encontrado na consulta.', 'error'); return; }
  const grupo = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza || item.categoria, code, item.descricao);
  const fonte = item._base || item.fonte || 'Base de referência';
  const manual = insumosSalvarManualItem({
    codigo: code,
    descricao: item.descricao || item.desc || '',
    unidade: item.unidade || item.unid || (grupo === 'S' || grupo === 'E' ? 'h' : 'UN'),
    grupo,
    preco: insumosPrecoItem(item),
    custoImprodutivo: grupo === 'E' ? insumosCustoImprodutivo(item) : 0,
    fonte: `Cópia de ${fonte}`,
    data: item.dataReferencia || item.data || new Date().toLocaleDateString('pt-BR')
  });
  if (!manual) { toast('Não foi possível copiar o insumo.', 'error'); return; }
  insumosEditarManual(code);
  insumosRender({ somenteManual:true });
  toast('Insumo copiado para a base manual. Revise e salve se desejar ajustar.', 'success');
}

function insumosExcluirManual(codigo) {
  const code = codigoChave(codigo);
  const item = (STATE.insumosManuais || []).find(i => codigoChave(i.codigoSinapi || i.codigo) === code);
  if (!item) { toast('Este item não pode ser excluído aqui porque não é manual.', 'warning'); return; }
  if (!confirm(`Excluir o insumo ${code} - ${item.descricao}?`)) return;
  STATE.insumosManuais = (STATE.insumosManuais || []).filter(i => codigoChave(i.codigoSinapi || i.codigo) !== code);
  saveState();
  insumosRender();
  cpuRenderManualCount();
  toast('Insumo excluído da base manual', 'info');
}

function insumosConsultaRapida(tipo) {
  const sel = document.getElementById('ins-consulta-tipo');
  if (sel) sel.value = tipo;
  insumosRender();
}

function insumosTodasBases(options = {}) {
  const all = [];
  (STATE.insumosManuais || []).forEach(i => all.push({ ...i, _base:'Base manual', _manual:true }));
  if (!options.somenteManual) {
    (STATE.insumosImportados || []).forEach(i => all.push({ ...i, _base:'Base importada' }));
    (STATE.sinapiBase || []).forEach(i => all.push({ ...i, _base:'SINAPI' }));
  }
  const byCode = new Map();
  all.forEach(item => {
    const code = codigoChave(item.codigoSinapi || item.codigo);
    if (!code || byCode.has(code)) return;
    const grupo = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza || item.categoria, code, item.descricao);
    byCode.set(code, { ...item, codigoSinapi: code, codigo: code, grupo, tipo: grupo });
  });
  return [...byCode.values()];
}

function insumosFiltrar(options = {}) {
  const tipo = document.getElementById('ins-consulta-tipo')?.value || 'palavra';
  const busca = textoChave(document.getElementById('ins-busca')?.value || '');
  const grupoFiltro = document.getElementById('ins-filtro-grupo')?.value || '';
  let lista = insumosTodasBases(options);
  if (grupoFiltro) lista = lista.filter(i => insumosGrupoNormalizado(i.grupo || i.tipo, i.codigo, i.descricao) === grupoFiltro);
  if (tipo === 'grupo' && busca) {
    lista = lista.filter(i => textoChave(insumosGrupoLabel(insumosGrupoNormalizado(i.grupo || i.tipo, i.codigo, i.descricao))).includes(busca));
  } else if (busca) {
    lista = lista.filter(i => {
      const codigo = textoChave(i.codigoSinapi || i.codigo);
      const desc = textoChave(i.descricao || i.desc);
      if (tipo === 'codigo') return codigo.includes(busca);
      if (tipo === 'descricao') return desc.includes(busca);
      return `${codigo} ${desc} ${textoChave(i.fonte || i._base)}`.includes(busca);
    });
  }
  return lista.slice(0, 300);
}

function insumosRender(options = {}) {
  normalizeState();
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('ins-kpi-manual', (STATE.insumosManuais || []).length);
  setText('ins-kpi-importada', (STATE.insumosImportados || []).length);
  setText('ins-kpi-sinapi', (STATE.sinapiBase || []).length);
  setText('ins-kpi-equip', (STATE.insumosManuais || []).filter(i => insumosGrupoNormalizado(i.grupo || i.tipo, i.codigo, i.descricao) === 'E').length);
  const data = document.getElementById('ins-data');
  if (data && !data.value) data.value = todayIso();
  insumosGrupoAlterado();

  const lista = insumosFiltrar(options);
  setText('ins-result-info', `${lista.length} resultado(s) exibido(s)${options.somenteManual ? ' · somente base manual' : ' · manual, importada e SINAPI'}`);
  const tb = document.getElementById('ins-tabela');
  if (!tb) return;
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:var(--text3)">Nenhum insumo encontrado.</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(item => {
    const code = item.codigoSinapi || item.codigo || '';
    const grupo = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza || item.categoria, code, item.descricao);
    const manual = (STATE.insumosManuais || []).some(i => codigoChave(i.codigoSinapi || i.codigo) === codigoChave(code));
    const codeArg = inlineJsArg(code);
    return `<tr>
      <td class="td-mono" style="color:var(--gold)">${escapeHtml(code)}</td>
      <td>${escapeHtml(item.descricao || item.desc || '')}</td>
      <td><span class="badge">${escapeHtml(insumosGrupoLabel(grupo))}</span></td>
      <td>${escapeHtml(item.unidade || item.unid || 'UN')}</td>
      <td><strong>${fmtMoeda(insumosPrecoItem(item))}</strong></td>
      <td>${grupo === 'E' ? fmtMoeda(insumosCustoImprodutivo(item)) : '—'}</td>
      <td>${escapeHtml(item._base || item.fonte || (manual ? 'Base manual' : 'Base'))}</td>
      <td>${escapeHtml(item.dataReferencia || item.data || '—')}</td>
      <td>
        <div class="obra-row-actions">
          <button class="btn btn-outline btn-sm" onclick="${manual ? `insumosEditarManual(${codeArg})` : `insumosCopiarParaManual(${codeArg})`}">${manual ? 'Editar' : 'Copiar'}</button>
          ${manual ? `<button class="btn btn-outline btn-sm" onclick="insumosExcluirManual(${codeArg})">Excluir</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function insumosConsultaAvancadaRender() {
  normalizeState();
  const codigo = codigoChave(document.getElementById('ins-adv-codigo')?.value);
  const desc = textoChave(document.getElementById('ins-adv-desc')?.value || '');
  const palavra = textoChave(document.getElementById('ins-adv-palavra')?.value || '');
  const grupo = document.getElementById('ins-adv-grupo')?.value || '';
  const completa = document.getElementById('ins-adv-completa')?.checked === true;
  let lista = insumosTodasBases({ somenteManual:false });
  if (codigo) lista = lista.filter(i => codigoChave(i.codigoSinapi || i.codigo).includes(codigo));
  if (grupo) lista = lista.filter(i => insumosGrupoNormalizado(i.grupo || i.tipo || i.natureza, i.codigoSinapi || i.codigo, i.descricao) === grupo);
  if (desc) lista = lista.filter(i => textoChave(i.descricao || i.desc || '').includes(desc));
  if (palavra) {
    lista = lista.filter(i => {
      const base = completa
        ? `${i.codigoSinapi || i.codigo || ''} ${i.descricao || ''} ${i.fonte || ''} ${i._base || ''} ${i.memoriaCustoHorario || ''}`
        : `${i.codigoSinapi || i.codigo || ''} ${i.descricao || ''}`;
      return textoChave(base).includes(palavra);
    });
  }
  lista = lista.slice(0, 200);
  const out = document.getElementById('ins-adv-result');
  if (!out) return;
  if (!lista.length) {
    out.innerHTML = 'Nenhum insumo encontrado na consulta avançada.';
    return;
  }
  out.innerHTML = `
    <div class="cpu-op-summary">${lista.length} resultado(s) · ${completa ? 'descrição completa/fonte' : 'descrição curta'}</div>
    <div class="cpu-op-table ins-adv-table">
      <div class="cpu-op-head"><span>Código</span><span>Descrição</span><span>Grupo</span><span>Preço</span><span>Fonte</span></div>
      ${lista.map(item => {
        const code = item.codigoSinapi || item.codigo || '';
        const grp = insumosGrupoNormalizado(item.grupo || item.tipo || item.natureza || item.categoria, code, item.descricao);
        return `<div class="cpu-op-row">
          <span class="td-mono">${escapeHtml(code)}</span>
          <span>${escapeHtml(item.descricao || item.desc || '')}</span>
          <span>${escapeHtml(insumosGrupoLabel(grp))}</span>
          <span>${fmtMoeda(insumosPrecoItem(item))}</span>
          <span>${escapeHtml(item._base || item.fonte || 'Base')}</span>
        </div>`;
      }).join('')}
    </div>`;
}

async function insumosImportarExcel(event) {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;
  let total = 0;
  try {
    for (const file of files) {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type:'array' });
      wb.SheetNames.forEach(sheetName => {
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header:1, defval:'' });
        const items = cpuParseInsumosManualRows(raw, `${file.name}/${sheetName}`)
          .map(item => insumosNormalizarManual(item, { fonte:`Excel manual: ${file.name}`, origemArquivo:`${file.name}/${sheetName}`, importado:true }));
        items.forEach(item => {
          if (insumosSalvarManualItem(item, { save:false })) total++;
        });
      });
    }
    saveState();
    insumosRender({ somenteManual:true });
    cpuRenderManualCount();
    toast(`${total} insumo(s) importado(s) para a base manual`, total ? 'success' : 'info');
  } catch (err) {
    toast(err.message || 'Erro ao importar Excel de insumos.', 'error');
  } finally {
    if (event?.target) event.target.value = '';
  }
}

function insumosExportarExcel() {
  const lista = insumosFiltrar({ somenteManual:false });
  const rows = [['Código','Descrição','Grupo','Unidade','Custo Unitário','Custo Improdutivo','Fonte','Data']];
  lista.forEach(item => {
    const grupo = insumosGrupoNormalizado(item.grupo || item.tipo, item.codigoSinapi || item.codigo, item.descricao);
    rows.push([
      item.codigoSinapi || item.codigo || '',
      item.descricao || '',
      insumosGrupoLabel(grupo),
      item.unidade || item.unid || 'UN',
      valorMoeda(insumosPrecoItem(item)),
      grupo === 'E' ? valorMoeda(insumosCustoImprodutivo(item)) : '',
      item._base || item.fonte || '',
      item.dataReferencia || item.data || ''
    ]);
  });
  exportRowsToExcel('TLPlanly_Insumos_Consulta', [{ name:'Insumos', rows }]);
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg, type='info') {
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  el.textContent = msg;
  document.getElementById('toast').appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

// ═══════════════════════════════════════════════════════════
// SINAPI BASE LOAD
// ═══════════════════════════════════════════════════════════
async function loadSinapiBase() {
  try {
    const r = await fetch('/api/referencia');
    if (r.ok) {
      STATE.sinapiBase = await r.json();
      if (STATE.sinapiBase.length > 0) {
        STATE.sinapiMes = STATE.sinapiBase[0].dataReferencia || '';
      }
      document.getElementById('sin-count').textContent = STATE.sinapiBase.length.toLocaleString('pt-BR');
      document.getElementById('sin-mes').textContent = STATE.sinapiMes || '—';
    }
  } catch(e) {
    // Try local referencia.json
    try {
      const r2 = await fetch('/referencia.json');
      if (r2.ok) {
        STATE.sinapiBase = await r2.json();
        STATE.sinapiMes = STATE.sinapiBase[0]?.dataReferencia || '';
        document.getElementById('sin-count').textContent = STATE.sinapiBase.length.toLocaleString('pt-BR');
        document.getElementById('sin-mes').textContent = STATE.sinapiMes || '—';
      }
    } catch(e2) {
      console.warn('SINAPI base not loaded:', e2);
    }
  }
}

function buscarSINAPI(q) {
  const res = document.getElementById('sinapiResults');
  if (!q || q.length < 2) { res.classList.remove('open'); return; }
  const ul = q.toUpperCase();
  const matches = STATE.sinapiBase.filter(i =>
    i.codigoSinapi.includes(ul) || i.descricao.toUpperCase().includes(ul)
  ).slice(0, 20);
  if (!matches.length) { res.classList.remove('open'); return; }
  res.innerHTML = matches.map(i =>
    `<div class="search-item" onclick="selecionarInsumo('${i.codigoSinapi}')">
      <span class="search-item-code">${i.codigoSinapi}</span>
      ${i.descricao}
      <span class="search-item-unit">${i.unidade}</span>
      <span style="float:right;color:var(--gold);font-weight:700">${fmtMoeda(i.precoMedio)}</span>
    </div>`
  ).join('');
  res.classList.add('open');
}

function selecionarInsumo(cod) {
  const item = STATE.sinapiBase.find(i => i.codigoSinapi === cod);
  if (!item) return;
  document.getElementById('sinapiSearch').value = item.descricao;
  document.getElementById('sinapiResults').classList.remove('open');
  document.getElementById('addCod').value = item.codigoSinapi;
  document.getElementById('addDesc').value = item.descricao;
  document.getElementById('addUnid').value = item.unidade;
  document.getElementById('addPreco').value = item.precoMedio.toFixed(2);
  document.getElementById('addRef').value = item.precoMedio.toFixed(2);
  const cap = document.getElementById('addCapitulo');
  if (cap && !cap.value) cap.value = 'Serviços';
  document.getElementById('addItemPanel').style.display = 'block';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('sinapiResults')?.classList.remove('open');
  }
});

// ═══════════════════════════════════════════════════════════
// ORÇAMENTO
// ═══════════════════════════════════════════════════════════
function novoItemProprio() {
  document.getElementById('sinapiSearch').value = '';
  document.getElementById('addCod').value = 'PROP-' + String(STATE.orcamento.length + 1).padStart(3, '0');
  document.getElementById('addDesc').value = '';
  document.getElementById('addUnid').value = 'UN';
  document.getElementById('addQtd').value = '1';
  document.getElementById('addPreco').value = '0.00';
  document.getElementById('addRef').value = '0.00';
  document.getElementById('addCat').value = 'Serviços';
  const cap = document.getElementById('addCapitulo');
  if (cap) cap.value = 'Serviços próprios';
  document.getElementById('addItemPanel').style.display = 'block';
  document.getElementById('addDesc').focus();
}

function adicionarItem() {
  const cod = document.getElementById('addCod').value;
  const desc = document.getElementById('addDesc').value;
  const unid = document.getElementById('addUnid').value;
  const qtd = parseFloat(document.getElementById('addQtd').value) || 1;
  const preco = parseFloat(document.getElementById('addPreco').value) || 0;
  const ref = parseFloat(document.getElementById('addRef').value) || 0;
  const cat = document.getElementById('addCat').value;
  const capitulo = document.getElementById('addCapitulo')?.value?.trim() || cat || 'Serviços';
  if (!cod || !desc) { toast('Informe código e descrição do item', 'error'); return; }
  STATE.orcamento.push({ id: makeId('orc'), cod, desc, unid, qtd, preco, ref, precoVenda: roundUnitPrice(totalComBDI(preco)), cat, capitulo, ordem: STATE.orcamento.length + 1 });
  invalidarDescontoPregao('item adicionado ao orçamento');
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  document.getElementById('addItemPanel').style.display = 'none';
  document.getElementById('sinapiSearch').value = '';
  toast('Item adicionado ao orçamento', 'success');
}

function removerItem(idx) {
  STATE.orcamento.splice(idx, 1);
  reordenarOrcamento();
  invalidarDescontoPregao('item removido do orçamento');
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('Item removido', 'info');
}

function reordenarOrcamento() {
  STATE.orcamento.forEach((it, idx) => { it.ordem = idx + 1; });
}

function moverItem(idx, dir) {
  const next = idx + dir;
  if (next < 0 || next >= STATE.orcamento.length) return;
  const tmp = STATE.orcamento[idx];
  STATE.orcamento[idx] = STATE.orcamento[next];
  STATE.orcamento[next] = tmp;
  reordenarOrcamento();
  saveState();
  renderElaborar();
  preencherSelectsOperacionais();
}

function duplicarItem(idx) {
  const src = STATE.orcamento[idx];
  if (!src) return;
  const copy = {
    ...src,
    id: makeId('orc'),
    cod: String(src.cod || 'ITEM') + '-C',
    desc: String(src.desc || 'Item') + ' (cópia)',
    ordem: idx + 2
  };
  STATE.orcamento.splice(idx + 1, 0, copy);
  reordenarOrcamento();
  invalidarDescontoPregao('item duplicado no orçamento');
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('Item duplicado', 'success');
}

function zerarQuantidades() {
  if (!STATE.orcamento.length) { toast('Não há itens para zerar', 'info'); return; }
  if (!confirm('Zerar as quantidades de todos os itens mantendo a estrutura do orçamento?')) return;
  STATE.orcamento.forEach(it => { it.qtd = 0; });
  invalidarDescontoPregao('quantidades zeradas');
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('Quantidades zeradas. A estrutura foi preservada.', 'success');
}

function limparOrcamento() {
  if (!confirm('Deseja limpar todo o orçamento?')) return;
  STATE.orcamento = [];
  STATE.descontoProposta = null;
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('Orçamento limpo', 'info');
}

function renderElaborar() {
  normalizeState();
  const tb = document.getElementById('elab-tabela');
  if (!STATE.orcamento.length) {
    tb.innerHTML = '<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--text3)">Pesquise insumos SINAPI acima para adicionar itens</td></tr>';
    document.getElementById('elab-sub').textContent = fmtMoeda(0);
    document.getElementById('elab-total').textContent = fmtMoeda(0);
    document.getElementById('elab-bdi-pct').textContent = bdiText('Não configurado');
    renderDescontoPregaoResumo();
    return;
  }
  const rows = STATE.orcamento.map((it, i) => {
    const principal = obrasServicoEhPrincipal(it);
    const total = principal ? obrasServicoSubtotalFilhos(it, STATE.orcamento) : itemValor(it);
    const desvHtml = desvioHtml(it);
    return `<tr class="${principal ? 'obra-servico-principal' : ''}">
      <td class="td-mono">${i+1}</td>
      <td><input class="table-input mono" value="${escapeHtml(it.cod || '')}" onchange="editarItemCampo(${i},'cod',this.value)"/></td>
      <td>
        <input class="table-input table-input-desc" value="${escapeHtml(it.desc || '')}" onchange="editarItemCampo(${i},'desc',this.value)"/>
        <input class="table-input table-input-sub" value="${escapeHtml(it.capitulo || it.cat || 'Serviços')}" onchange="editarItemCampo(${i},'capitulo',this.value)" placeholder="Capítulo"/>
      </td>
      <td><input class="table-input compact" value="${principal ? '' : escapeHtml(it.unid || 'UN')}" onchange="editarItemCampo(${i},'unid',this.value)" ${principal ? 'placeholder="—"' : ''}/></td>
      <td><input class="table-input num" type="number" min="0" step="0.001" value="${principal ? '' : Number(it.qtd || 0)}" onchange="editarItemCampo(${i},'qtd',this.value)" ${principal ? 'placeholder="—"' : ''}/></td>
      <td><input class="table-input num" type="number" min="0" step="0.01" value="${principal ? '' : Number(it.preco || 0)}" onchange="editarItemCampo(${i},'preco',this.value)" ${principal ? 'placeholder="—"' : ''}/></td>
      <td style="color:var(--gold)">${it.ref > 0 ? fmtMoeda(it.ref) : '—'}</td>
      <td id="elab-desv-${i}">${desvHtml}</td>
      <td><strong id="elab-row-total-${i}">${fmtMoeda(total)}</strong></td>
      <td><select class="table-input compact" onchange="editarItemCampo(${i},'cat',this.value)">${categoriaOptions(it.cat)}</select></td>
      <td>
        <div class="op-actions">
          <button class="btn btn-outline btn-mini" onclick="moverItem(${i},-1)" title="Mover para cima">&#8593;</button>
          <button class="btn btn-outline btn-mini" onclick="moverItem(${i},1)" title="Mover para baixo">&#8595;</button>
          <button class="btn btn-outline btn-mini" onclick="duplicarItem(${i})" title="Duplicar item">Dup.</button>
          <button class="btn btn-danger btn-mini" onclick="removerItem(${i})" title="Remover item">&#215;</button>
        </div>
      </td>
    </tr>`;
  });
  tb.innerHTML = rows.join('');
  const sub = STATE.orcamento.reduce((s, it) => s + itemValor(it), 0);
  const total = totalComBDI(sub);
  document.getElementById('elab-sub').textContent = fmtMoeda(sub);
  document.getElementById('elab-total').textContent = fmtMoeda(total);
  document.getElementById('elab-bdi-pct').textContent = bdiText('Não configurado');
  renderDescontoPregaoResumo();
}

function categoriaOptions(current) {
  const cats = ['Serviços','Materiais','Mão de Obra','Equipamentos','Outros'];
  return cats.map(c => `<option${c === current ? ' selected' : ''}>${c}</option>`).join('');
}

function desvioHtml(it) {
  const ref = Number(it.ref) || 0;
  const preco = Number(it.preco) || 0;
  if (ref <= 0) return '<span style="color:var(--text3)">N/D</span>';
  const desv = ((preco - ref) / ref * 100);
  return `<span style="color:${desv > 5 ? 'var(--red)' : desv < -5 ? 'var(--green)' : 'var(--text2)'}">${desv > 0 ? '+' : ''}${desv.toFixed(1)}%</span>`;
}

function atualizarTotaisElaborar() {
  const sub = STATE.orcamento.reduce((s, it) => s + itemValor(it), 0);
  const total = totalComBDI(sub);
  const subEl = document.getElementById('elab-sub');
  const totalEl = document.getElementById('elab-total');
  const bdiEl = document.getElementById('elab-bdi-pct');
  if (subEl) subEl.textContent = fmtMoeda(sub);
  if (totalEl) totalEl.textContent = fmtMoeda(total);
  if (bdiEl) bdiEl.textContent = bdiText('Não configurado');
}

function atualizarLinhaElaborar(idx) {
  const it = STATE.orcamento[idx];
  if (!it) return;
  const rowTotal = document.getElementById('elab-row-total-' + idx);
  const desv = document.getElementById('elab-desv-' + idx);
  const total = obrasServicoEhPrincipal(it) ? obrasServicoSubtotalFilhos(it, STATE.orcamento) : itemValor(it);
  if (rowTotal) rowTotal.textContent = fmtMoeda(total);
  if (desv) desv.innerHTML = desvioHtml(it);
}

function editarItemCampo(idx, campo, valor) {
  const it = STATE.orcamento[idx];
  if (!it) return;
  if (['qtd','preco','ref'].includes(campo)) {
    it[campo] = parseFloat(String(valor).replace(',', '.')) || 0;
    if (campo === 'preco') it.precoVenda = roundUnitPrice(totalComBDI(it.preco));
    if (['qtd','preco'].includes(campo)) {
      it.totalLinha = 0;
      it.totalVendaLinha = 0;
    }
    if (['qtd','preco'].includes(campo)) invalidarDescontoPregao('preço ou quantidade alterado manualmente');
  }
  else it[campo] = String(valor || '').trim();
  if (campo === 'cat' && !it.capitulo) it.capitulo = it.cat;
  saveState();
  atualizarLinhaElaborar(idx);
  atualizarTotaisElaborar();
  renderDescontoPregaoResumo();
  preencherSelectsOperacionais();
  if (document.getElementById('view-dashboard')?.classList.contains('active')) renderDashboard();
}

function invalidarDescontoPregao(motivo = 'orçamento alterado') {
  if (!descontoPregaoAtivo()) return;
  STATE.descontoProposta = {
    ...STATE.descontoProposta,
    desfeitoEm: new Date().toISOString(),
    invalidadoPor: motivo,
    snapshot: []
  };
}

function roundUnitPrice(v) {
  return Math.round((Number(v) || 0) * 10000) / 10000;
}

function roundMoney(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

function orcamentoSubtotalAtual() {
  normalizeState();
  return STATE.orcamento.reduce((s, it) => s + itemValor(it), 0);
}

function descontoPregaoBaseLabel(base = 'com-bdi') {
  if (base === 'avancado') return 'Seleção avançada';
  return base === 'sem-bdi' ? 'Subtotal sem BDI' : 'Total com BDI';
}

function descontoPregaoValorAtual(base = 'com-bdi') {
  const sub = orcamentoSubtotalAtual();
  return base === 'sem-bdi' ? sub : totalComBDI(sub);
}

function descontoPregaoAtivo() {
  return !!(STATE.descontoProposta && !STATE.descontoProposta.desfeitoEm && Number(STATE.descontoProposta.final) > 0);
}

function lerDescontoPregaoForm() {
  const base = document.getElementById('desconto-base')?.value || STATE.descontoProposta?.base || 'com-bdi';
  const totalAtualBase = descontoPregaoValorAtual(base);
  let original = parseNumeroBR(document.getElementById('desconto-original')?.value);
  let final = parseNumeroBR(document.getElementById('desconto-final')?.value);
  let percentual = parseNumeroBR(document.getElementById('desconto-pct')?.value);

  if (original <= 0) original = totalAtualBase;
  if (final <= 0 && percentual > 0) final = original * (1 - percentual / 100);
  if (percentual <= 0 && final > 0 && original > 0) percentual = (1 - final / original) * 100;

  const subtotalAtual = orcamentoSubtotalAtual();
  const targetSubtotal = base === 'sem-bdi' ? final : final / (1 + bdiValue() / 100);
  const fatorAplicacao = subtotalAtual > 0 && targetSubtotal > 0 ? targetSubtotal / subtotalAtual : 0;
  const descontoRealSistema = totalAtualBase > 0 && final > 0 ? (1 - final / totalAtualBase) * 100 : percentual;

  return {
    base,
    original,
    final,
    percentual,
    subtotalAtual,
    totalAtualBase,
    targetSubtotal,
    fatorAplicacao,
    descontoRealSistema
  };
}

function usarTotalAtualDescontoPregao() {
  const base = document.getElementById('desconto-base')?.value || 'com-bdi';
  const el = document.getElementById('desconto-original');
  if (el) el.value = roundMoney(descontoPregaoValorAtual(base)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  calcularDescontoPregaoPreview(false);
}

function calcularDescontoPregaoPreview(showToast = true) {
  const dados = lerDescontoPregaoForm();
  if (!STATE.orcamento.length) {
    renderDescontoPregaoResumo(null, 'Importe ou elabore uma planilha antes de aplicar desconto.');
    if (showToast) toast('Não há itens no orçamento para readequar.', 'error');
    return null;
  }
  if (dados.original <= 0 || dados.final <= 0 || dados.fatorAplicacao <= 0) {
    renderDescontoPregaoResumo(null, 'Informe o valor vencedor ou o percentual de desconto.');
    if (showToast) toast('Informe o valor vencedor ou o percentual de desconto.', 'error');
    return null;
  }
  if (dados.final > dados.original) {
    renderDescontoPregaoResumo(dados, 'Atenção: o valor vencedor está acima do valor estimado informado.');
  } else {
    renderDescontoPregaoResumo(dados);
  }
  if (showToast) toast('Prévia de readequação calculada.', 'info');
  return dados;
}

function aplicarDescontoPregao() {
  const dados = calcularDescontoPregaoPreview(false);
  if (!dados) return;

  const linhas = STATE.orcamento.filter(it => (Number(it.qtd) || 0) > 0);
  if (!linhas.length) {
    toast('Não há linhas com quantidade para readequar.', 'error');
    return;
  }

  const snapshot = STATE.orcamento.map(it => ({
    id: it.id,
    preco: it.preco,
    totalLinha: it.totalLinha,
    descontoPregaoPct: it.descontoPregaoPct
  }));

  const subtotalAntes = orcamentoSubtotalAtual();
  const totalAntes = totalComBDI(subtotalAntes);

  linhas.forEach(it => {
    const qtd = Number(it.qtd) || 0;
    const totalBaseLinha = itemValor(it);
    it.preco = roundUnitPrice(qtd > 0 ? (totalBaseLinha * dados.fatorAplicacao) / qtd : 0);
    it.totalLinha = 0;
    it.descontoPregaoPct = roundMoney(dados.percentual);
  });

  let subtotalDepois = orcamentoSubtotalAtual();
  let residuo = dados.targetSubtotal - subtotalDepois;
  let itemAjuste = null;

  if (Math.abs(residuo) > 0.0001) {
    itemAjuste = [...linhas].sort((a, b) => ((Number(b.qtd) || 0) * (Number(b.preco) || 0)) - ((Number(a.qtd) || 0) * (Number(a.preco) || 0)))[0];
    if (itemAjuste) {
      const qtd = Number(itemAjuste.qtd) || 1;
      itemAjuste.preco = roundUnitPrice((Number(itemAjuste.preco) || 0) + residuo / qtd);
      itemAjuste.totalLinha = 0;
    }
  }

  subtotalDepois = orcamentoSubtotalAtual();
  residuo = dados.targetSubtotal - subtotalDepois;
  const totalDepois = totalComBDI(subtotalDepois);

  STATE.descontoProposta = {
    aplicadoEm: new Date().toISOString(),
    base: dados.base,
    original: roundMoney(dados.original),
    final: roundMoney(dados.final),
    percentual: roundMoney(dados.percentual),
    descontoRealSistema: roundMoney(dados.descontoRealSistema),
    fatorAplicacao: Number(dados.fatorAplicacao.toFixed(8)),
    subtotalAntes: roundMoney(subtotalAntes),
    totalAntes: roundMoney(totalAntes),
    subtotalDepois: roundMoney(subtotalDepois),
    totalDepois: roundMoney(totalDepois),
    alvoSubtotal: roundMoney(dados.targetSubtotal),
    residuoFinal: Number(residuo.toFixed(6)),
    itemAjusteId: itemAjuste?.id || '',
    itemAjuste: itemAjuste ? itemLabel(itemAjuste) : '',
    snapshot
  };

  saveState();
  renderElaborar();
  renderDashboard();
  if (document.getElementById('view-relatorio')?.classList.contains('active')) renderRelatorioPreview();
  preencherSelectsOperacionais();
  toast(`Planilha readequada para ${fmtMoeda(dados.final)}.`, 'success');
}

function itensDescontoAvancado(target, filtro) {
  const filtroKey = textoChave(filtro);
  if (target === 'todos') return STATE.orcamento.slice();
  if (target === 'categoria') {
    return STATE.orcamento.filter(it => !filtroKey || textoChave(it.cat).includes(filtroKey) || filtroKey.includes(textoChave(it.cat)));
  }
  if (target === 'capitulo') {
    return STATE.orcamento.filter(it => !filtroKey || textoChave(it.capitulo || it.cat).includes(filtroKey) || filtroKey.includes(textoChave(it.capitulo || it.cat)));
  }
  if (target === 'classe-a') {
    const subtotal = orcamentoSubtotalAtual();
    let acum = 0;
    return [...STATE.orcamento]
      .sort((a, b) => itemValor(b) - itemValor(a))
      .filter((it, idx) => {
        if (subtotal <= 0) return false;
        acum += itemValor(it) / subtotal * 100;
        return idx === 0 || acum <= 80;
      });
  }
  return [];
}

function aplicarDescontoAvancado() {
  normalizeState();
  if (!STATE.orcamento.length) {
    toast('Não há itens no orçamento para aplicar desconto.', 'error');
    return;
  }
  const target = document.getElementById('desconto-adv-target')?.value || 'categoria';
  const filtro = document.getElementById('desconto-adv-filtro')?.value || '';
  const pct = readNumeroCampo('desconto-adv-pct');
  if (pct <= 0 || pct >= 100) {
    toast('Informe um desconto entre 0% e 100%.', 'error');
    return;
  }
  const itens = itensDescontoAvancado(target, filtro).filter(it => (Number(it.qtd) || 0) > 0);
  if (!itens.length) {
    toast('Nenhum item encontrado para o filtro informado.', 'error');
    return;
  }

  const subtotalAntes = orcamentoSubtotalAtual();
  const totalAntes = totalComBDI(subtotalAntes);
  const snapshot = STATE.orcamento.map(it => ({
    id: it.id,
    preco: it.preco,
    totalLinha: it.totalLinha,
    descontoPregaoPct: it.descontoPregaoPct
  }));

  const fator = 1 - pct / 100;
  itens.forEach(it => {
    const qtd = Number(it.qtd) || 1;
    it.preco = roundUnitPrice((itemValor(it) * fator) / qtd);
    it.totalLinha = 0;
    it.descontoPregaoPct = roundMoney(pct);
    it.descontoAvancadoAlvo = target;
  });

  const subtotalDepois = orcamentoSubtotalAtual();
  const totalDepois = totalComBDI(subtotalDepois);
  STATE.descontoProposta = {
    aplicadoEm: new Date().toISOString(),
    base: 'avancado',
    alvo: target,
    filtro,
    original: roundMoney(totalAntes),
    final: roundMoney(totalDepois),
    percentual: roundMoney(pct),
    descontoRealSistema: subtotalAntes > 0 ? roundMoney((1 - subtotalDepois / subtotalAntes) * 100) : roundMoney(pct),
    fatorAplicacao: Number(fator.toFixed(8)),
    subtotalAntes: roundMoney(subtotalAntes),
    totalAntes: roundMoney(totalAntes),
    subtotalDepois: roundMoney(subtotalDepois),
    totalDepois: roundMoney(totalDepois),
    alvoSubtotal: roundMoney(subtotalDepois),
    residuoFinal: 0,
    itemAjuste: `${itens.length} itens selecionados`,
    snapshot
  };

  saveState();
  renderElaborar();
  renderDashboard();
  renderDescontoPregaoResumo(STATE.descontoProposta);
  toast(`Desconto de ${pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% aplicado em ${itens.length} itens.`, 'success');
}

function desfazerDescontoPregao() {
  const hist = STATE.descontoProposta;
  if (!hist?.snapshot?.length) {
    toast('Não há ajuste de pregão para desfazer.', 'error');
    return;
  }
  const byId = new Map(hist.snapshot.map(s => [s.id, s]));
  STATE.orcamento.forEach(it => {
    const old = byId.get(it.id);
    if (!old) return;
    it.preco = old.preco;
    it.totalLinha = old.totalLinha;
    if (old.descontoPregaoPct === undefined) delete it.descontoPregaoPct;
    else it.descontoPregaoPct = old.descontoPregaoPct;
  });
  STATE.descontoProposta = { ...hist, desfeitoEm: new Date().toISOString(), snapshot: [] };
  saveState();
  renderElaborar();
  renderDashboard();
  if (document.getElementById('view-relatorio')?.classList.contains('active')) renderRelatorioPreview();
  toast('Última readequação desfeita.', 'success');
}

function renderDescontoPregaoResumo(preview = null, alerta = '') {
  const wrap = document.getElementById('desconto-preview');
  const current = document.getElementById('desconto-current');
  if (!wrap && !current) return;

  const base = document.getElementById('desconto-base')?.value || STATE.descontoProposta?.base || 'com-bdi';
  const totalAtual = descontoPregaoValorAtual(base);
  if (current) current.textContent = `${descontoPregaoBaseLabel(base)} atual: ${fmtMoeda(totalAtual)}`;
  const originalInput = document.getElementById('desconto-original');
  if (originalInput) originalInput.placeholder = fmtMoeda(totalAtual);

  if (!wrap) return;
  const dados = preview || (descontoPregaoAtivo() ? STATE.descontoProposta : null);
  if (!dados) {
    wrap.innerHTML = `
      <div class="preg-preview-empty">
        Informe o valor estimado do edital e o valor vencedor, ou digite apenas o percentual de desconto. O TLPlanly recalcula os preços unitários e prepara a planilha ajustada para exportar.
        ${alerta ? `<br><strong>${escapeHtml(alerta)}</strong>` : ''}
      </div>`;
    return;
  }

  const targetSubtotal = Number(dados.targetSubtotal || dados.alvoSubtotal || 0);
  const final = Number(dados.final) || 0;
  const pct = Number(dados.percentual) || 0;
  const fator = Number(dados.fatorAplicacao || dados.fator || 0);
  const sistemaPct = Number(dados.descontoRealSistema || pct) || 0;
  const aplicado = dados.aplicadoEm && !preview;
  wrap.innerHTML = `
    <div class="preg-preview-grid">
      <div><span>Valor estimado</span><strong>${fmtMoeda(dados.original)}</strong></div>
      <div><span>Valor vencedor</span><strong>${fmtMoeda(final)}</strong></div>
      <div><span>Desconto informado</span><strong>${pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</strong></div>
      <div><span>Fator na planilha</span><strong>${(fator * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%</strong></div>
    </div>
    <div class="preg-preview-note">
      ${aplicado ? 'Readequação aplicada' : 'Prévia'} sobre <strong>${descontoPregaoBaseLabel(dados.base)}</strong>.
      Alvo técnico sem BDI: <strong>${fmtMoeda(targetSubtotal)}</strong>.
      Desconto real sobre o total atual do sistema: <strong>${sistemaPct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%</strong>.
      ${dados.itemAjuste ? `<br>Ajuste fino de centavos aplicado em: <strong>${escapeHtml(dados.itemAjuste)}</strong>.` : ''}
      ${alerta ? `<br><strong>${escapeHtml(alerta)}</strong>` : ''}
    </div>`;
}

function descontoPregaoRelatorioTexto() {
  if (!descontoPregaoAtivo()) return '';
  const d = STATE.descontoProposta;
  return `Readequação de proposta: valor estimado ${fmtMoeda(d.original)}, valor vencedor ${fmtMoeda(d.final)}, desconto ${Number(d.percentual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%, base ${descontoPregaoBaseLabel(d.base)}, fator aplicado ${(Number(d.fatorAplicacao || 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%.`;
}

function descontoPregaoRelatorioHtml(colspan = 11) {
  if (!descontoPregaoAtivo()) return '';
  const d = STATE.descontoProposta;
  return `<tr class="sh-row"><td colspan="${colspan}" style="background:#fff7e6;color:#111!important;font-weight:700;padding:8px 10px;border:1px solid #f2c46d">
    ${escapeHtml(descontoPregaoRelatorioTexto())}
    ${d.itemAjuste ? `<br><span style="font-weight:600">Ajuste de centavos: ${escapeHtml(d.itemAjuste)}</span>` : ''}
  </td></tr>`;
}

function exportarOrcamento() {
  exportarOrcamentoExcel();
}

function exportarOrcamentoExcel() {
  if (!window.XLSX) { toast('Excel indisponível: biblioteca XLSX não carregou.', 'error'); return; }
  const nome = document.getElementById('orcNome').value || 'orcamento';
  exportRowsToExcel(`orcamento_${nome}_TLPlanly`, [
    { name:'Orçamento', rows: montarLinhasOrcamento(nome) },
    { name:'Resumo', rows: montarResumoOrcamento(nome) }
  ]);
}

function exportarOrcamentoPDF() {
  const nome = document.getElementById('orcNome').value || 'orcamento';
  const rows = montarLinhasOrcamento(nome);
  const html = `
    <h1>Planilha Orçamentária</h1>
    <p><strong>Orçamento:</strong> ${escapeHtml(nome)} · <strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} · <strong>Moeda:</strong> ${moedaCodigo()}</p>
    ${rowsToHtmlTable(rows)}
  `;
  exportHtmlToPDF('Planilha Orçamentária - TLPlanly', html, `orcamento_${nome}_TLPlanly`);
}

function montarResumoOrcamento(nome) {
  const sub = STATE.orcamento.reduce((s, it)=>s+itemValor(it), 0);
  const rows = [
    ['Campo','Valor'],
    ['Orçamento', nome],
    ['Data', new Date().toLocaleDateString('pt-BR')],
    ['Itens', STATE.orcamento.length],
    ['Moeda', moedaCodigo()],
    ['Cotação', moedaCotacao()],
    ['BDI', bdiText('Não configurado')],
    ['Subtotal sem BDI', valorMoeda(sub)],
    ['Total com BDI', valorMoeda(totalComBDI(sub))]
  ];
  if (descontoPregaoAtivo()) {
    const d = STATE.descontoProposta;
    rows.push(
      [],
      ['Readequação de Pregão', 'Aplicada'],
      ['Valor estimado do edital', valorMoeda(d.original)],
      ['Valor vencedor', valorMoeda(d.final)],
      ['Desconto informado', `${Number(d.percentual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`],
      ['Base de cálculo', descontoPregaoBaseLabel(d.base)],
      ['Fator aplicado aos itens', `${(Number(d.fatorAplicacao || 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%`],
      ['Ajuste de centavos', d.itemAjuste || 'Não necessário']
    );
  }
  return rows;
}

function montarLinhasOrcamento(nome = 'Orçamento') {
  const rows = [
    [`PLANILHA ORÇAMENTÁRIA — ${nome}`],
    [`Emitido em ${new Date().toLocaleString('pt-BR')} · Moeda ${moedaCodigo()} · BDI ${bdiText('Não configurado')}`],
  ];
  if (descontoPregaoAtivo()) rows.push([descontoPregaoRelatorioTexto()]);
  rows.push(
    [],
    ['Item','Código','Descrição','Unidade','Quantidade',moedaHeader('P.Unit'),moedaHeader('Ref.SINAPI'),'Desvio %',moedaHeader('Total sem BDI'),moedaHeader('Total com BDI'),'Categoria','Capítulo']
  );
  STATE.orcamento.forEach((it, i) => {
    const desvio = Number(it.ref) > 0 ? ((Number(it.preco) - Number(it.ref)) / Number(it.ref) * 100) : '';
    rows.push([
      i + 1,
      it.cod || '',
      it.desc || '',
      it.unid || 'UN',
      Number(it.qtd) || 0,
      valorMoeda(Number(it.preco) || 0),
      Number(it.ref) > 0 ? valorMoeda(Number(it.ref)) : '',
      desvio === '' ? '' : Number(desvio.toFixed(2)),
      valorMoeda(itemValor(it)),
      valorMoeda(totalComBDI(itemValor(it))),
      it.cat || '',
      it.capitulo || ''
    ]);
  });
  const sub = STATE.orcamento.reduce((s, it)=>s+itemValor(it), 0);
  rows.push([]);
  rows.push(['','','','','','','','Subtotal',valorMoeda(sub),valorMoeda(totalComBDI(sub)),'','']);
  return rows;
}

function elaborarImportFileSelect(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  iniciarImportacaoRapidaElaborar(files);
  e.target.value = '';
}

function elaborarImportDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover-card');
  const files = Array.from(e.dataTransfer?.files || []);
  if (!files.length) return;
  iniciarImportacaoRapidaElaborar(files);
}

function iniciarImportacaoRapidaElaborar(files) {
  if (!files?.length) return;
  IMP.origemRapida = 'elaborar';
  setImportFiles(files);
  if (!IMP.files.length) return;

  const tipo = document.getElementById('imp-tipo');
  const pagIni = document.getElementById('imp-pag-ini');
  const pagFim = document.getElementById('imp-pag-fim');
  const acao = document.getElementById('imp-acao');
  const preco = document.getElementById('imp-preco-src');
  if (tipo) tipo.value = 'auto';
  if (pagIni) pagIni.value = '1';
  if (pagFim) pagFim.value = '0';
  if (acao) acao.value = STATE.orcamento.length ? 'adicionar' : 'substituir';
  if (preco) preco.value = 'edital';

  showView('importar');
  toast('Arquivo recebido. Vou extrair e abrir a revisão para envio ao orçamento.', 'info');
  setTimeout(() => iniciarExtracao(), 120);
}

// ═══════════════════════════════════════════════════════════
// BDI
// ═══════════════════════════════════════════════════════════
const BDI_LIMITES = { civil: 25, eletrica: 24, material: 15 };

function syncBDIInputsFromState() {
  const source = hasBDI() ? STATE.bdiComponents : null;
  const ids = ['ac','s','r','df','l','i'];
  ids.forEach(key => {
    const el = document.getElementById('bdi-' + key);
    if (!el) return;
    el.value = source ? String(source[key] ?? '') : '';
  });
}

function calcBDI() {
  const { values, complete } = readBDIInputs();
  if (!complete) {
    STATE.bdiDraft = null;
    STATE.bdiDraftComponents = null;
    renderBDIState();
    return null;
  }

  const bdi = calcularBDIComponents(values);
  STATE.bdiDraft = bdi;
  STATE.bdiDraftComponents = values;
  renderBDIState();
  return bdi;
}

function renderBDIState() {
  const tipo = document.getElementById('bdi-tipo').value;
  const lim = BDI_LIMITES[tipo] || 25;
  const draft = isFilledNumber(STATE.bdiDraft) ? Number(STATE.bdiDraft) : null;
  const visibleBDI = draft !== null ? draft : (hasBDI() ? bdiValue() : null);
  const isApplied = draft === null && hasBDI();

  document.getElementById('bdi-result-pct').textContent = visibleBDI !== null ? visibleBDI.toFixed(2) + '%' : 'Não configurado';
  document.getElementById('bdi-limite').textContent = lim + '%';
  document.getElementById('bdi-limite-lbl').textContent = lim + '%';
  const memBdi = document.getElementById('mem-bdi');
  if (memBdi) memBdi.value = hasBDI() ? bdiValue().toFixed(2) : '';

  const prog = document.getElementById('bdi-progress');
  const badge = document.getElementById('bdi-status-badge');
  const applyBtn = document.getElementById('bdi-apply-btn');

  if (visibleBDI === null) {
    prog.style.width = '0%';
    prog.style.background = 'var(--gold)';
    badge.textContent = 'Preencha os componentes ou escolha um modelo';
    badge.className = 'bdi-status bdi-warn';
    if (applyBtn) applyBtn.disabled = true;
    renderBDIComp();
    return;
  }

  const pct = Math.min(visibleBDI / lim * 100, 120);
  prog.style.width = Math.min(pct, 100) + '%';
  if (applyBtn) applyBtn.disabled = draft === null && !hasBDI();

  if (visibleBDI <= lim) {
    prog.style.background = 'var(--green)';
    badge.textContent = isApplied ? '✓ BDI aplicado ao orçamento' : '✓ Dentro do Limite TCU';
    badge.className = 'bdi-status bdi-ok';
  } else if (visibleBDI <= lim * 1.1) {
    prog.style.background = 'var(--gold)';
    badge.textContent = '⚠ Atenção: Próximo do Limite';
    badge.className = 'bdi-status bdi-warn';
  } else {
    prog.style.background = 'var(--red)';
    badge.textContent = '✗ ACIMA do Limite TCU!';
    badge.className = 'bdi-status bdi-bad';
  }

  renderBDIComp();
}

function renderBDIComp() {
  const bdi = isFilledNumber(STATE.bdiDraft) ? Number(STATE.bdiDraft) : (hasBDI() ? bdiValue() : null);
  const tipoAtual = document.getElementById('bdi-tipo')?.value || 'civil';
  const linhas = [
    {nome:'Obras Civis',          lim:25, key:'civil'},
    {nome:'Instalações Elétricas', lim:24, key:'eletrica'},
    {nome:'Fornecimento de Materiais', lim:15, key:'material'},
  ];
  const html = linhas.map(function(l) {
    const isSel = l.key === tipoAtual;
    const ok    = bdi !== null && bdi <= l.lim;
    let badge;
    if (isSel) {
      badge = bdi === null
        ? '<span class="badge" style="background:var(--bg3);color:var(--text3)">Pendente</span>'
        : '<span class="badge ' + (ok ? 'badge-ok' : 'badge-err') + '">' + (ok ? '✓ OK' : '✗ Excede') + '</span>';
    } else {
      badge = '<span class="badge" style="background:var(--bg3);color:var(--text3)">— Ref.</span>';
    }
    const label = l.nome + (isSel ? ' <span style="font-size:10px;color:var(--gold)">(selecionado)</span>' : '');
    const style = 'display:flex;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);'
                + (isSel ? '' : 'opacity:0.5');
    const nameStyle = 'flex:1;font-size:13px;color:var(--text' + (isSel ? ')' : '2)') + ';' + (isSel ? 'font-weight:700' : '');
    return '<div style="' + style + '">'
      + '<div style="' + nameStyle + '">' + label + '</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--text3);margin-right:12px">Lim: ' + l.lim + '%</div>'
      + badge
      + '</div>';
  }).join('');
  document.getElementById('bdi-comp-table').innerHTML = html;
}

function aplicarPreset() {
  const tipo = document.getElementById('bdi-tipo').value;
  document.getElementById('bdi-s').value = '0.50';
  document.getElementById('bdi-r').value = '1.27';
  document.getElementById('bdi-df').value = '1.23';
  if (tipo === 'material') {
    document.getElementById('bdi-ac').value = '3.00';
    document.getElementById('bdi-l').value = '5.00';
    document.getElementById('bdi-i').value = '6.50';
  } else if (tipo === 'eletrica') {
    document.getElementById('bdi-ac').value = '4.00';
    document.getElementById('bdi-l').value = '7.20';
    document.getElementById('bdi-i').value = '8.65';
  } else {
    document.getElementById('bdi-ac').value = '4.00';
    document.getElementById('bdi-l').value = '7.40';
    document.getElementById('bdi-i').value = '8.65';
  }
  calcBDI();
}

function aplicarBDIaOrcamento() {
  if (!isFilledNumber(STATE.bdiDraft) || !STATE.bdiDraftComponents) {
    const calculated = calcBDI();
    if (!isFilledNumber(calculated)) {
      toast('Preencha todos os componentes do BDI antes de aplicar.', 'error');
      return;
    }
  }
  STATE.bdi = Number(STATE.bdiDraft);
  STATE.bdiConfigured = true;
  STATE.bdiComponents = bdiComponentValues(STATE.bdiDraftComponents);
  STATE.bdiDraft = null;
  STATE.bdiDraftComponents = null;
  saveState();
  renderBDIState();
  renderElaborar();
  renderDashboard();
  toast(`BDI de ${STATE.bdi.toFixed(2)}% aplicado ao orçamento`, 'success');
}

// ═══════════════════════════════════════════════════════════
// ENCARGOS SOCIAIS
// ═══════════════════════════════════════════════════════════
const ENCARGOS = {
  nd: [
    ['INSS (20%)', 20.00],
    ['FGTS (8%)', 8.00],
    ['SAT/RAT (3%)', 3.00],
    ['SESC/SENAI/SEBRAE (3,1%)', 3.10],
    ['SECONCI (1%)', 1.00],
    ['Salário Educação (2,5%)', 2.50],
    ['Férias + 1/3 (13,33%)', 13.33],
    ['13º Salário (8,33%)', 8.33],
    ['Aviso Prévio Indenizado (0,42%)', 0.42],
    ['Incidência sobre Férias+13°+AP (18%)', 18.00],
    ['Multa FGTS (3,2%)', 3.20],
    ['Vale Transporte / Refeição (10%)', 10.00],
    ['Outros (6,62%)', 6.62],
  ],
  d: [
    ['CPRB — Contrib. Previdenciária (2% rec.)', 2.00],
    ['FGTS (8%)', 8.00],
    ['SAT/RAT (3%)', 3.00],
    ['SESC/SENAI/SEBRAE (3,1%)', 3.10],
    ['SECONCI (1%)', 1.00],
    ['Salário Educação (2,5%)', 2.50],
    ['Férias + 1/3 (13,33%)', 13.33],
    ['13º Salário (8,33%)', 8.33],
    ['Aviso Prévio Indenizado (0,42%)', 0.42],
    ['Incidência sobre Férias+13°+AP (15%)', 15.00],
    ['Multa FGTS (3,2%)', 3.20],
    ['Vale Transporte / Refeição (10%)', 10.00],
    ['Outros (4,60%)', 4.60],
  ]
};

function showEncargos(tipo) {
  document.querySelectorAll('.enc-tab').forEach((t,i)=>{
    t.classList.toggle('active', (i===0 && tipo==='nd') || (i===1 && tipo==='d'));
  });
  const lista = ENCARGOS[tipo];
  const total = lista.reduce((s,[,v])=>s+v,0);
  let rows = lista.map(([n,v])=>
    `<div class="enc-row"><span class="enc-name">${n}</span><span class="enc-val">${v.toFixed(2)}%</span></div>`
  ).join('');
  rows += `<div class="enc-row total"><span class="enc-name">TOTAL ENCARGOS SOCIAIS</span><span class="enc-val">${total.toFixed(2)}%</span></div>`;
  document.getElementById('enc-content').innerHTML = `<div class="enc-table">${rows}</div>`;
}

// ═══════════════════════════════════════════════════════════
// CURVA ABC
// ═══════════════════════════════════════════════════════════
function gerarCurvaABC() {
  const limA = parseFloat(document.getElementById('abc-limA').value) || 80;
  const limB = parseFloat(document.getElementById('abc-limB').value) || 95;
  const { items: validos, bloqueados } = orcamentoAuditadoParaRelatorio();
  const items = [...validos];

  if (!items.length) {
    const msg = bloqueados.length
      ? `${bloqueados.length} item(ns) bloqueado(s) pela auditoria. Corrija ou reimporte antes de gerar a Curva ABC.`
      : 'Orçamento vazio. Adicione itens primeiro.';
    document.getElementById('abc-tabela').innerHTML = `<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--text3)">${msg}</td></tr>`;
    return;
  }

  items.sort((a,b) => itemValor(b) - itemValor(a));
  const totalGeral = items.reduce((s,i)=>s+itemValor(i),0);

  let acum = 0;
  const rows = items.map((it,idx) => {
    const total = itemValor(it);
    const pctItem = totalGeral > 0 ? total/totalGeral*100 : 0;
    acum += pctItem;
    const classe = acum <= limA ? 'A' : acum <= limB ? 'B' : 'C';
    it._classe = classe;
    it._pctItem = pctItem;
    it._acum = acum;
    const barW = pctItem.toFixed(1);
    return `<tr>
      <td class="td-mono">${idx+1}</td>
      <td class="td-mono">${it.cod}</td>
      <td>${it.desc}</td>
      <td>${it.unid}</td>
      <td>${fmtNum(it.qtd)}</td>
      <td>${fmtMoeda(it.preco)}</td>
      <td><strong>${fmtMoeda(total)}</strong></td>
      <td>${pctItem.toFixed(2)}%</td>
      <td>${acum.toFixed(2)}%</td>
      <td><div class="abc-bar-wrap"><div class="abc-bar abc-bar-${classe}" style="width:${Math.min(barW,100)}%"></div></div></td>
      <td><span class="badge badge-${classe}">${classe}</span></td>
    </tr>`;
  });

  document.getElementById('abc-tabela').innerHTML = rows.join('');

  const cntA = items.filter(i=>i._classe==='A').length;
  const cntB = items.filter(i=>i._classe==='B').length;
  const cntC = items.filter(i=>i._classe==='C').length;
  const valA = items.filter(i=>i._classe==='A').reduce((s,i)=>s+itemValor(i),0);
  const valB = items.filter(i=>i._classe==='B').reduce((s,i)=>s+itemValor(i),0);
  const valC = items.filter(i=>i._classe==='C').reduce((s,i)=>s+itemValor(i),0);

  document.getElementById('abc-A-pct').textContent = totalGeral > 0 ? (valA/totalGeral*100).toFixed(1)+'%' : '0%';
  document.getElementById('abc-B-pct').textContent = totalGeral > 0 ? (valB/totalGeral*100).toFixed(1)+'%' : '0%';
  document.getElementById('abc-C-pct').textContent = totalGeral > 0 ? (valC/totalGeral*100).toFixed(1)+'%' : '0%';
  document.getElementById('abc-A-desc').textContent = cntA + ' itens';
  document.getElementById('abc-B-desc').textContent = cntB + ' itens';
  document.getElementById('abc-C-desc').textContent = cntC + ' itens';

  drawABCCharts(valA, valB, valC, items);
}

function drawABCCharts(valA, valB, valC, items) {
  // Pizza
  const ctx1 = document.getElementById('chartABCpizza');
  if (STATE.charts.abcPizza) STATE.charts.abcPizza.destroy();
  STATE.charts.abcPizza = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Classe A', 'Classe B', 'Classe C'],
      datasets: [{ data: [valA, valB, valC], backgroundColor: ['#e53935','#f5a623','#43a047'], borderWidth: 0 }]
    },
    options: { plugins: { legend: { labels: { color: getCSSVar('--text') } } } }
  });

  // Linha acumulada
  const ctx2 = document.getElementById('chartABClinha');
  if (STATE.charts.abcLinha) STATE.charts.abcLinha.destroy();
  const acums = [];
  let acc = 0;
  items.forEach(it => { acc += it._pctItem; acums.push(+acc.toFixed(2)); });
  STATE.charts.abcLinha = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: items.map((_,i)=>i+1),
      datasets: [{
        label: '% Acumulado',
        data: acums,
        borderColor: '#f5a623',
        backgroundColor: 'rgba(245,166,35,.1)',
        fill: true,
        tension: 0.3,
        pointRadius: items.length > 20 ? 0 : 3
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: getCSSVar('--text2') }, grid: { color: getCSSVar('--border') } },
        y: { ticks: { color: getCSSVar('--text2'), callback: v => v+'%' }, grid: { color: getCSSVar('--border') } }
      },
      plugins: { legend: { labels: { color: getCSSVar('--text') } } }
    }
  });
}

// ═══════════════════════════════════════════════════════════
// MEMÓRIA DE CÁLCULO
// ═══════════════════════════════════════════════════════════
function renderMemoria() {
  const el = document.getElementById('mem-lista');
  if (!STATE.orcamento.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Adicione itens ao orçamento para ver a memória de cálculo</p></div>';
    return;
  }
  const encPct = parseFloat(document.getElementById('mem-enc').value) || 127.5;
  const bdi = bdiValue();

  const blocks = STATE.orcamento.map((it, i) => {
    const total = itemValor(it);
    const totalBDI = total * (1 + bdi/100);
    const moEnc = it.preco / (1 + encPct/100);
    const matPreco = it.preco - moEnc;
    return `<div class="mem-block">
      <div class="mem-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
        <span class="badge badge-ok" style="font-size:10px">${it.cod}</span>
        <span class="mem-header-title" style="margin-left:8px">${it.desc}</span>
        <span style="color:var(--gold);font-weight:800">${fmtMoeda(totalBDI)}</span>
        <span style="margin-left:8px;color:var(--text3);font-size:12px">▼</span>
      </div>
      <div class="mem-body" style="display:none">
        <div class="grid grid-3" style="gap:10px;margin-bottom:12px">
          <div><span class="form-label">Quantidade</span><div style="font-size:15px;font-weight:700">${fmtNum(it.qtd)} ${it.unid}</div></div>
          <div><span class="form-label">Preço Unitário</span><div style="font-size:15px;font-weight:700">${fmtMoeda(it.preco)}</div></div>
          <div><span class="form-label">Total s/ BDI</span><div style="font-size:15px;font-weight:700">${fmtMoeda(total)}</div></div>
        </div>
        <div class="enc-table">
          <div class="enc-row"><span class="enc-name">Materiais (estimado)</span><span class="enc-val">${fmtMoeda(matPreco * it.qtd)}</span></div>
          <div class="enc-row"><span class="enc-name">Mão de Obra (estimado)</span><span class="enc-val">${fmtMoeda(moEnc * it.qtd)}</span></div>
          <div class="enc-row"><span class="enc-name">Encargos Sociais (${encPct}%)</span><span class="enc-val">${fmtMoeda(moEnc * encPct/100 * it.qtd)}</span></div>
          <div class="enc-row"><span class="enc-name">BDI (${bdiText('Não configurado')})</span><span class="enc-val">${fmtMoeda(total * bdi/100)}</span></div>
          <div class="enc-row total"><span class="enc-name">TOTAL c/ BDI</span><span class="enc-val">${fmtMoeda(totalBDI)}</span></div>
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--text3)">
          Ref. SINAPI: ${it.ref > 0 ? fmtMoeda(it.ref) : 'N/D'} | 
          Desvio: ${it.ref > 0 ? ((it.preco-it.ref)/it.ref*100).toFixed(2)+'%' : 'N/D'} |
          Fonte: SINAPI/MG/${STATE.sinapiMes}
        </div>
      </div>
    </div>`;
  });
  el.innerHTML = blocks.join('');
}

// ═══════════════════════════════════════════════════════════
// AUDITORIA
// ═══════════════════════════════════════════════════════════
let _audResultados = [];

function executarAuditoria() {
  const tol = STATE.config.tolerancia || 5;
  _audResultados = STATE.orcamento.map(it => {
    const ref = it.ref > 0 ? it.ref : (STATE.sinapiBase.find(s=>s.codigoSinapi===it.cod)?.precoMedio || 0);
    const desv = ref > 0 ? (it.preco - ref)/ref * 100 : null;
    let status = 'nf';
    if (desv !== null) status = Math.abs(desv) <= tol ? 'ok' : (desv > tol ? 'acima' : 'ok');
    return { ...it, refSinapi: ref, desvio: desv, status };
  });

  const ok = _audResultados.filter(r=>r.status==='ok').length;
  const acima = _audResultados.filter(r=>r.status==='acima').length;
  const nf = _audResultados.filter(r=>r.status==='nf').length;
  const total = _audResultados.reduce((s,r)=>s+r.qtd*r.preco, 0);

  document.getElementById('aud-total').textContent = fmtMoeda(total);
  document.getElementById('aud-ok').textContent = ok;
  document.getElementById('aud-acima').textContent = acima;
  document.getElementById('aud-nf').textContent = nf;
  document.getElementById('dash-acima').textContent = acima;

  if (acima > 0) {
    document.getElementById('auditBadge').style.display = '';
    document.getElementById('auditBadge').textContent = acima;
  } else {
    document.getElementById('auditBadge').style.display = 'none';
  }

  filtrarAuditoria();
}

function filtrarAuditoria() {
  const f = document.getElementById('aud-filtro').value;
  const lista = f ? _audResultados.filter(r=>r.status===f) : _audResultados;
  const tb = document.getElementById('aud-tabela');
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="7" style="padding:32px;text-align:center;color:var(--text3)">' + (!_audResultados.length ? 'Adicione itens ao orçamento e execute a auditoria' : 'Nenhum item neste filtro') + '</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(r => {
    const desvTxt = r.desvio !== null ? `<strong style="color:${r.desvio > 5 ? 'var(--red)' : 'var(--green)'}">${r.desvio > 0 ? '+' : ''}${r.desvio.toFixed(2)}%</strong>` : '—';
    const badge = r.status === 'ok' ? '<span class="badge badge-ok">✓ Conforme</span>'
      : r.status === 'acima' ? '<span class="badge badge-err">✗ Acima</span>'
      : '<span class="badge" style="background:var(--bg3);color:var(--text3)">Não Encontrado</span>';
    return `<tr>
      <td class="td-mono">${r.cod}</td>
      <td>${r.desc}</td>
      <td>${r.unid}</td>
      <td>${fmtMoeda(r.preco)}</td>
      <td style="color:var(--gold)">${r.refSinapi > 0 ? fmtMoeda(r.refSinapi) : '—'}</td>
      <td>${desvTxt}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// CONFORMIDADE BDI
// ═══════════════════════════════════════════════════════════
function verificarConformidade() {
  if (!hasBDI()) {
    document.getElementById('conf-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚙</div>
        <p>BDI ainda não configurado. Defina os componentes em BDI / Encargos e aplique ao orçamento.</p>
      </div>`;
    return;
  }
  const bdi = bdiValue();
  const tipo = document.getElementById('bdi-tipo')?.value || 'civil';
  const lim = BDI_LIMITES[tipo] || 25;
  const ok = bdi <= lim;
  const html = `
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;gap:12px;padding:16px;background:var(--bg3);border-radius:var(--radius)">
        <span style="font-size:32px">${ok ? '✅' : '❌'}</span>
        <div>
          <div style="font-size:18px;font-weight:800;color:${ok?'var(--green)':'var(--red)'}">${ok ? 'BDI CONFORME' : 'BDI NÃO CONFORME'}</div>
          <div style="font-size:13px;color:var(--text2)">BDI calculado: <strong>${bdi.toFixed(2)}%</strong> | Limite TCU (${tipo}): <strong>${lim}%</strong></div>
        </div>
      </div>
      ${Object.entries(BDI_LIMITES).map(([t,l])=>{
        const conf = bdi <= l;
        const isSel = t === tipo;
        let badge;
        if (isSel) {
          badge = `<span class="badge ${conf?'badge-ok':'badge-err'}">${conf?'✓ OK':'✗ Excede'}</span>`;
        } else {
          badge = `<span class="badge" style="background:var(--bg3);color:var(--text3)">— Ref.</span>`;
        }
        return `<div style="display:flex;align-items:center;padding:10px 14px;background:var(--card2);border-radius:var(--radius);border:1px solid ${isSel?'var(--gold)':'var(--border)'};opacity:${isSel?1:0.6}">
          <div style="flex:1;font-size:13px;${isSel?'font-weight:700':''}">
            ${t==='civil'?'Obras Civis':t==='eletrica'?'Instalações Elétricas':'Fornecimento de Materiais'}
            ${isSel ? ' <span style="font-size:10px;color:var(--gold)">(tipo selecionado)</span>' : ''}
          </div>
          <div style="font-size:13px;color:var(--text3);margin-right:12px">Limite: ${l}%</div>
          ${badge}
        </div>`;
      }).join('')}
      <div style="font-size:12px;color:var(--text3);padding:8px">
        ⚖ Ref.: TCU Acórdão 2622/2013 — BDI para obras públicas federais
      </div>
    </div>`;
  document.getElementById('conf-content').innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function renderDashboard() {
  const { items, bloqueados } = orcamentoAuditadoParaRelatorio();
  const sub = items.reduce((s,i)=>s+itemValor(i), 0);
  const total = totalComBDI(sub);
  const acima = items.filter(i => i.ref > 0 && i.preco > i.ref * 1.05).length;

  document.getElementById('dash-total').textContent = fmtMoeda(sub);
  document.getElementById('dash-itens').textContent = `${items.length} válidos${bloqueados.length ? ` · ${bloqueados.length} bloqueado(s)` : ''}`;
  document.getElementById('dash-bdi').textContent = bdiText('—');
  document.getElementById('dash-bdi-status').textContent = hasBDI() ? (bdiValue() <= 25 ? 'Dentro do limite TCU' : '⚠ Acima do limite') : 'Não configurado';
  document.getElementById('dash-total-bdi').textContent = fmtMoeda(total);
  document.getElementById('dash-acima').textContent = acima;

  // ABC chart
  const sorted = [...items].sort((a,b)=>itemValor(b)-itemValor(a));
  const tot = sub || 1;
  let acc=0; const classesCount = {A:0,B:0,C:0}; const classesVal = {A:0,B:0,C:0};
  sorted.forEach(it => {
    const v = itemValor(it);
    acc += v/tot*100;
    const c = acc<=80?'A':acc<=95?'B':'C';
    classesCount[c]++; classesVal[c]+=v;
  });

  const ctx1 = document.getElementById('chartABC');
  if (STATE.charts.dashABC) STATE.charts.dashABC.destroy();
  STATE.charts.dashABC = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Classe A','Classe B','Classe C'],
      datasets: [{ data:[classesVal.A,classesVal.B,classesVal.C], backgroundColor:['#e53935','#f5a623','#43a047'], borderWidth:0 }]
    },
    options: { plugins: { legend: { labels: { color: getCSSVar('--text') } } } }
  });

  // Cat chart
  const cats = {};
  items.forEach(i => { cats[i.cat] = (cats[i.cat]||0) + itemValor(i); });
  const ctx2 = document.getElementById('chartCat');
  if (STATE.charts.dashCat) STATE.charts.dashCat.destroy();
  STATE.charts.dashCat = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: Object.keys(cats),
      datasets: [{ label:'Valor (R$)', data: Object.values(cats), backgroundColor:'#f5a623' }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: getCSSVar('--text2') }, grid: { display: false } },
        y: { ticks: { color: getCSSVar('--text2'), callback: v => 'R$'+fmtMilhar(v) }, grid: { color: getCSSVar('--border') } }
      }
    }
  });

  // Top items
  const topItems = sorted.slice(0,10);
  const tb = document.getElementById('dash-tabela');
  if (!topItems.length) {
    tb.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--text3)">Nenhum item no orçamento</td></tr>';
    return;
  }
  let a2=0;
  tb.innerHTML = topItems.map((it,i) => {
    const v = itemValor(it);
    a2 += v/tot*100;
    const c = a2<=80?'A':a2<=95?'B':'C';
    return `<tr>
      <td class="td-mono">${it.cod}</td>
      <td>${it.desc}</td>
      <td>${it.unid}</td>
      <td>${fmtNum(it.qtd)}</td>
      <td>${fmtMoeda(it.preco)}</td>
      <td>${fmtMoeda(v)}</td>
      <td>${a2.toFixed(2)}%</td>
      <td><span class="badge badge-${c}">${c}</span></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// SINAPI BASE VIEW
// ═══════════════════════════════════════════════════════════
function renderSinapiBase() {
  buscarSINAPIBase('');
}

function buscarSINAPIBase(q) {
  const ul = q.toUpperCase();
  const lista = ul.length > 1
    ? STATE.sinapiBase.filter(i => i.codigoSinapi.includes(ul) || i.descricao.toUpperCase().includes(ul)).slice(0,100)
    : STATE.sinapiBase.slice(0,50);
  const tb = document.getElementById('sin-tabela');
  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--text3)">Nenhum resultado</td></tr>';
    return;
  }
  tb.innerHTML = lista.map(i => `<tr>
    <td class="td-mono" style="color:var(--gold)">${i.codigoSinapi}</td>
    <td>${i.descricao}</td>
    <td>${i.unidade}</td>
    <td><strong>${fmtMoeda(i.precoMedio)}</strong></td>
    <td style="color:var(--text3);font-size:11px">${i.dataReferencia||'—'}</td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════════════════════════
function renderRelatorioPreview() {
  const sub = STATE.orcamento.reduce((s,i)=>s+itemValor(i),0);
  const total = totalComBDI(sub);
  document.getElementById('rel-preview').innerHTML = `
    <div style="font-size:13px;color:var(--text2);line-height:1.8">
      <div><strong>Orçamento:</strong> ${document.getElementById('orcNome')?.value || '—'}</div>
      <div><strong>Itens:</strong> ${STATE.orcamento.length}</div>
      <div><strong>BDI Aplicado:</strong> ${bdiText('Não configurado')}</div>
      <div><strong>Subtotal (sem BDI):</strong> ${fmtMoeda(sub)}</div>
      <div><strong>Total c/ BDI:</strong> <span style="color:var(--gold);font-weight:800;font-size:18px">${fmtMoeda(total)}</span></div>
      <div><strong>Referência SINAPI:</strong> MG / ${STATE.sinapiMes || '—'}</div>
    </div>`;
}

function exportarJSON() {
  exportarExcelProfissional();
}

function exportarCSV() {
  exportarExcelProfissional();
}

function imprimirRelatorio() { window.print(); }

function salvarConfig() {
  STATE.config.uf = document.getElementById('cfg-uf')?.value || STATE.config.uf || 'MG';
  STATE.config.tolerancia = parseFloat(document.getElementById('cfg-tol')?.value) || 5;
  STATE.config.enc = document.getElementById('cfg-enc')?.value || STATE.config.enc || 'nd';
  STATE.config.obra = document.getElementById('cfg-obra')?.value || STATE.config.obra || 'civil';
  STATE.config.moeda = document.getElementById('cfg-moeda')?.value || STATE.config.moeda || 'BRL';
  STATE.config.moedaCotacao = parseFloat(document.getElementById('cfg-moeda-cotacao')?.value) || 1;
  STATE.config.relatorioModelo = document.getElementById('cfg-rel-modelo')?.value || STATE.config.relatorioModelo || 'publico';
  if (STATE.config.moeda === 'BRL') STATE.config.moedaCotacao = 1;
  saveState();
  renderElaborar();
  renderDashboard();
  renderRelatorioPreview();
  toast('Configurações salvas', 'success');
}

function syncConfigForm() {
  normalizeState();
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
  set('cfg-uf', STATE.config.uf || 'MG');
  set('cfg-tol', STATE.config.tolerancia ?? 5);
  set('cfg-enc', STATE.config.enc || 'nd');
  set('cfg-obra', STATE.config.obra || 'civil');
  set('cfg-moeda', STATE.config.moeda || 'BRL');
  set('cfg-moeda-cotacao', STATE.config.moedaCotacao || 1);
  set('cfg-rel-modelo', STATE.config.relatorioModelo || 'publico');
  set('rel-modelo', STATE.config.relatorioModelo || 'publico');
}

function ajustarCotacaoMoeda() {
  const moeda = document.getElementById('cfg-moeda')?.value || 'BRL';
  const cot = document.getElementById('cfg-moeda-cotacao');
  if (!cot) return;
  if (moeda === 'BRL') cot.value = '1';
  if (moeda !== 'BRL' && (!parseFloat(cot.value) || parseFloat(cot.value) <= 1)) {
    cot.value = moeda === 'USD' ? '5.30' : moeda === 'EUR' ? '5.80' : '6.80';
  }
}

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const MOEDAS = {
  BRL: { locale:'pt-BR', label:'BRL' },
  USD: { locale:'en-US', label:'USD' },
  EUR: { locale:'de-DE', label:'EUR' },
  GBP: { locale:'en-GB', label:'GBP' }
};

function moedaCodigo() {
  return MOEDAS[STATE.config?.moeda] ? STATE.config.moeda : 'BRL';
}

function moedaCotacao() {
  if (moedaCodigo() === 'BRL') return 1;
  const v = Number(STATE.config?.moedaCotacao) || 1;
  return v > 0 ? v : 1;
}

function valorMoeda(v) {
  return (Number(v) || 0) / moedaCotacao();
}

function fmtMoeda(v) {
  const code = moedaCodigo();
  const cfg = MOEDAS[code] || MOEDAS.BRL;
  return new Intl.NumberFormat(cfg.locale, { style:'currency', currency:code }).format(valorMoeda(v));
}

function moedaHeader(rotulo) {
  return `${rotulo} (${moedaCodigo()})`;
}

function fmtNum(v) { return (v||0).toLocaleString('pt-BR',{maximumFractionDigits:3}); }
function fmtMilhar(v) { return (v/1000).toLocaleString('pt-BR',{maximumFractionDigits:0})+'k'; }

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function downloadJSON(data, fname) {
  const a = document.createElement('a');
  a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  a.download = fname; a.click();
}
function downloadText(txt, fname, mime='text/plain') {
  const a = document.createElement('a');
  a.href = 'data:'+mime+';charset=utf-8,' + encodeURIComponent(txt);
  a.download = fname; a.click();
}

function safeFileName(name, fallback = 'tlplanly_export') {
  const clean = String(name || fallback)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 90);
  return clean || fallback;
}

function exportRowsToExcel(baseName, sheets) {
  if (!window.XLSX) { toast('Excel indisponível: biblioteca XLSX não carregou.', 'error'); return; }
  const wb = XLSX.utils.book_new();
  (sheets || []).filter(s => s && Array.isArray(s.rows)).forEach((sheet, idx) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    const maxCols = Math.max(1, ...sheet.rows.map(row => row.length));
    ws['!cols'] = Array.from({ length: maxCols }, (_, col) => ({
      wch: Math.min(70, Math.max(10, ...sheet.rows.map(row => String(row[col] ?? '').length + 2)))
    }));
    XLSX.utils.book_append_sheet(wb, ws, String(sheet.name || `Aba ${idx + 1}`).slice(0, 31));
  });
  const fname = `${safeFileName(baseName)}.xlsx`;
  XLSX.writeFile(wb, fname);
  toast('Excel gerado: ' + fname, 'success');
}

function rowsToHtmlTable(rows) {
  return `<table>${(rows || []).map((row, idx) => {
    if (!row || !row.length) return '<tr><td class="blank" colspan="12"></td></tr>';
    const tag = idx < 3 ? 'th' : 'td';
    return `<tr>${row.map(cell => `<${tag}>${escapeHtml(cell ?? '')}</${tag}>`).join('')}</tr>`;
  }).join('')}</table>`;
}

function markdownToRows(markdown) {
  const rows = [];
  String(markdown || '').split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) { rows.push([]); return; }
    if (/^\|[-:\s|]+\|?$/.test(trimmed)) return;
    if (trimmed.startsWith('|')) {
      rows.push(trimmed.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      return;
    }
    rows.push([trimmed.replace(/^#{1,6}\s*/, '').replace(/^[-*]\s*/, '')]);
  });
  return rows;
}

function markdownToHtml(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  let html = '';
  let table = [];
  const flushTable = () => {
    if (!table.length) return;
    html += rowsToHtmlTable(table);
    table = [];
  };
  lines.forEach(line => {
    const t = line.trim();
    if (/^\|[-:\s|]+\|?$/.test(t)) return;
    if (t.startsWith('|')) {
      table.push(t.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      return;
    }
    flushTable();
    if (!t) { html += '<br>'; return; }
    const heading = t.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      html += `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      return;
    }
    if (/^[-*]\s+/.test(t)) html += `<p>• ${escapeHtml(t.replace(/^[-*]\s+/, ''))}</p>`;
    else html += `<p>${escapeHtml(t)}</p>`;
  });
  flushTable();
  return html;
}

function exportMarkdownToExcel(markdown, baseName, sheetName = 'Memória') {
  exportRowsToExcel(baseName, [{ name: sheetName, rows: markdownToRows(markdown) }]);
}

function exportMarkdownToPDF(markdown, title, baseName) {
  exportHtmlToPDF(title, markdownToHtml(markdown), baseName);
}

function exportHtmlToPDF(title, contentHtml, baseName = 'tlplanly_pdf') {
  const w = window.open('', '_blank');
  if (!w) {
    toast('O navegador bloqueou a janela do PDF. Libere pop-ups para o TLPlanly.', 'error');
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:24px;background:#fff}
      h1{font-size:22px;margin:0 0 10px;color:#0f2742} h2{font-size:17px;margin:18px 0 8px;color:#173b63} h3{font-size:14px;margin:14px 0 6px;color:#173b63}
      p{font-size:12px;line-height:1.45;margin:5px 0} table{width:100%;border-collapse:collapse;margin:10px 0 16px;page-break-inside:auto}
      th,td{border:1px solid #c9d3df;padding:6px 7px;font-size:10.5px;vertical-align:top;text-align:left}
      th{background:#173b63;color:#fff;font-weight:700}.blank{border:0;height:8px;background:#fff}
      .cover{border-bottom:3px solid #f5a623;margin-bottom:14px;padding-bottom:8px}
      .muted{font-size:10px;color:#555}
      @page{size:A4 landscape;margin:10mm}
      @media print{button{display:none!important} body{margin:0} th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
      <div class="cover"><h1>${escapeHtml(title)}</h1><p class="muted">TLPlanly · ${new Date().toLocaleString('pt-BR')} · Arquivo sugerido: ${escapeHtml(safeFileName(baseName))}.pdf</p></div>
      ${contentHtml}
      <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
    </body></html>`);
  w.document.close();
  toast('PDF aberto para salvar/imprimir.', 'success');
}

function redrawAllCharts() {
  if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
  if (document.getElementById('view-curvaABC').classList.contains('active')) gerarCurvaABC();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  syncConfigForm();
  syncBDIInputsFromState();
  renderBDIState();
  showEncargos('nd');
  renderBDIComp();
  renderElaborar();
  renderDashboard();
  obrasRender();
  insumosRender();
  custosHorariosRender();
  cotacoesRender();
  frentesServicoRender();
  preencherSelectsOperacionais();
  pricingInit();
  cloudInit();
  if (FRONTEND_CORE_ONLY) showView('obras');
});

// ═══════════════════════════════════════════════════════════
// GESTÃO DA OBRA — PLANEJAMENTO, MEDIÇÕES, QUANTITATIVOS
// ═══════════════════════════════════════════════════════════
function getItemById(id) {
  normalizeState();
  return STATE.orcamento.find(i => i.id === id);
}

function itemLabel(item) {
  if (!item) return 'Sem vínculo';
  return `${item.cod || '—'} · ${(item.desc || '').substring(0, 70)}`;
}

function itemValor(item) {
  if (obrasServicoEhPrincipal(item)) return 0;
  const qtd = Number(item?.qtd) || 0;
  const preco = Number(item?.preco) || 0;
  const calculado = qtd * preco;
  const totalLinha = Number(item?.totalLinha) || 0;
  const veioDeImportacao = !!(item?.linhaOrigem || item?.origemArquivo || item?.origemMetodo || item?.certStatus);
  if (veioDeImportacao && totalLinha > 0) {
    const divergencia = Math.abs(totalLinha - calculado) / Math.max(totalLinha, 1);
    if (divergencia <= 0.10) return totalLinha;
  }
  return calculado;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(dateIso, days) {
  const d = new Date(dateIso || todayIso());
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const da = new Date(a || todayIso());
  const db = new Date(b || a || todayIso());
  return Math.max(1, Math.round((db - da) / 86400000) + 1);
}

function preencherSelectsOperacionais() {
  normalizeState();
  const itemOptions = STATE.orcamento.map((it, idx) =>
    `<option value="${it.id}">${idx + 1}. ${escapeHtml(itemLabel(it))}</option>`
  ).join('');

  const plan = document.getElementById('plan-item');
  if (plan) plan.innerHTML = `<option value="">Tarefa sem item direto</option>${itemOptions}`;
  const qt = document.getElementById('qt-item');
  if (qt) qt.innerHTML = itemOptions || '<option value="">Nenhum item no orçamento</option>';
  const doc = document.getElementById('doc-item');
  if (doc) doc.innerHTML = `<option value="obra">Obra / Geral</option>${itemOptions}`;
}

// ═══════════════════════════════════════════════════════════
// MELHORIAS DOS ÁUDIOS — CUSTOS, COTAÇÕES E FRENTES
// ═══════════════════════════════════════════════════════════
function readNumeroCampo(id) {
  return parseNumeroBR(document.getElementById(id)?.value || '');
}

function textoChave(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function codigoChave(value) {
  return String(value || '').trim().toUpperCase();
}

function recalcularPrecoCpu(cpu) {
  const insumos = Array.isArray(cpu?.insumos) ? cpu.insumos : [];
  const direto = insumos.reduce((s, i) => s + (Number(i.coef) || 0) * (Number(i.preco) || 0), 0);
  cpu.precoUnitario = roundUnitPrice(direto);
  return cpu.precoUnitario;
}

let EQUIPAMENTO_INSUMOS_DRAFT = [];
let MAO_OBRA_BENEFICIOS_DRAFT = [];
let ULTIMO_CALC_EQUIPAMENTO = null;
let ULTIMO_CALC_MAO_OBRA = null;
let EQUIPAMENTO_COD_ATUAL = '';

function roundCustoHorario(v, casas = 4) {
  const factor = Math.pow(10, casas);
  return Math.round((Number(v) || 0) * factor) / factor;
}

function parcelaLabel(parcela) {
  return {
    mao_obra: 'Mão de obra',
    material: 'Material',
    aluguel: 'Aluguel',
    outros: 'Outros'
  }[parcela] || 'Material';
}

function buscarReferenciaPorCodigo(cod) {
  const code = codigoChave(cod);
  if (!code) return null;
  const found = lookupPreco(code);
  if (!found?.item) return null;
  const item = found.item;
  return {
    codigo: item.codigoSinapi || item.codigo || code,
    descricao: item.descricao || item.desc || '',
    unidade: item.unidade || item.unid || 'UN',
    precoUnitario: Number(item.precoMedio ?? item.preco ?? found.preco ?? 0) || 0,
    tipo: item.tipo || item.natureza || item.categoria || '',
    fonte: found.fonte || item.fonte || item.origem || 'Base de referência',
    item
  };
}

function detectarParcelaInsumo(ref, escolha = 'auto') {
  if (escolha && escolha !== 'auto') return escolha;
  const cod = textoChave(ref?.codigo);
  const tipo = textoChave(ref?.tipo);
  const desc = textoChave(ref?.descricao);
  if (tipo === 'S' || tipo.includes('MAO') || tipo.includes('HOMEM') || cod.startsWith('IH') || cod.startsWith('MO')) return 'mao_obra';
  if (desc.includes('ALUGUEL') || desc.includes('LOCACAO') || tipo.includes('EQUIP') && desc.includes('ALUG')) return 'aluguel';
  if (tipo === 'T') return 'outros';
  return 'material';
}

function somaInsumosPorParcela(parcela) {
  return EQUIPAMENTO_INSUMOS_DRAFT
    .filter(i => i.parcela === parcela)
    .reduce((s, i) => s + (Number(i.consumo) || 0) * (Number(i.precoUnitario) || 0), 0);
}

function parcelasVazias() {
  return { depreciacao:0, juros:0, impostosSeguros:0, manutencao:0, material:0, maoObra:0, aluguel:0, outros:0 };
}

function custosEquipamentoModoChange() {
  const modo = document.getElementById('eq-modo')?.value || 'parcelas_calculadas';
  const calculado = document.getElementById('eq-calculado-panel');
  const manual = document.getElementById('eq-manual-panel');
  const insumos = document.getElementById('eq-insumos-panel');
  if (calculado) calculado.style.display = modo === 'parcelas_calculadas' ? '' : 'none';
  if (manual) manual.style.display = modo === 'parcelas_informadas' ? '' : 'none';
  if (insumos) insumos.style.display = modo === 'parcelas_calculadas' ? '' : 'none';
}

function custosEquipamentoSetCampo(id, value = '') {
  const el = document.getElementById(id);
  if (el) el.value = value === null || value === undefined ? '' : value;
}

function custosEquipamentoLimparCamposCodigo() {
  [
    'eq-nome','eq-aquisicao','eq-residual','eq-k-manutencao','eq-juros','eq-impostos','eq-combustivel','eq-operador',
    'eq-man-depreciacao','eq-man-juros','eq-man-impostos','eq-man-manutencao','eq-man-material','eq-man-mao-obra','eq-man-aluguel','eq-man-outros'
  ].forEach(id => custosEquipamentoSetCampo(id, ''));
  custosEquipamentoSetCampo('eq-vida', '10000');
  custosEquipamentoSetCampo('eq-fator', '1');
  const status = document.getElementById('eq-lookup-status');
  if (status) { status.textContent = ''; status.className = 'form-help'; }
  const preview = document.getElementById('eq-preview');
  if (preview) preview.innerHTML = '';
  const insPreview = document.getElementById('eq-ins-preview');
  if (insPreview) { insPreview.textContent = ''; insPreview.className = 'form-help'; }
  EQUIPAMENTO_INSUMOS_DRAFT = [];
  ULTIMO_CALC_EQUIPAMENTO = null;
  custosEquipamentoRenderInsumos();
}

function custosEquipamentoCodigoChange() {
  const cod = codigoChave(document.getElementById('eq-cod')?.value || '');
  if (!cod) {
    if (EQUIPAMENTO_COD_ATUAL) custosEquipamentoLimparCamposCodigo();
    EQUIPAMENTO_COD_ATUAL = '';
    return;
  }
  if (EQUIPAMENTO_COD_ATUAL && cod !== EQUIPAMENTO_COD_ATUAL) {
    custosEquipamentoLimparCamposCodigo();
    EQUIPAMENTO_COD_ATUAL = '';
  }
}

function custosEquipamentoCodigoKeydown(event) {
  if (event?.key !== 'Enter') return;
  event.preventDefault();
  custosEquipamentoLookup({ force:true });
}

function custosEquipamentoRegistroPorCodigo(cod) {
  const code = codigoChave(cod);
  return (STATE.equipamentosHorarios || []).slice().reverse().find(r => codigoChave(r.cod) === code) || null;
}

function custosEquipamentoSetParcelasManual(parcelas = {}) {
  custosEquipamentoSetCampo('eq-man-depreciacao', roundCustoHorario(parcelas.depreciacao || 0));
  custosEquipamentoSetCampo('eq-man-juros', roundCustoHorario(parcelas.juros || 0));
  custosEquipamentoSetCampo('eq-man-impostos', roundCustoHorario(parcelas.impostosSeguros || parcelas.impostos || 0));
  custosEquipamentoSetCampo('eq-man-manutencao', roundCustoHorario(parcelas.manutencao || 0));
  custosEquipamentoSetCampo('eq-man-material', roundCustoHorario(parcelas.material || 0));
  custosEquipamentoSetCampo('eq-man-mao-obra', roundCustoHorario(parcelas.maoObra || parcelas.mao_obra || 0));
  custosEquipamentoSetCampo('eq-man-aluguel', roundCustoHorario(parcelas.aluguel || 0));
  custosEquipamentoSetCampo('eq-man-outros', roundCustoHorario(parcelas.outros || 0));
}

function custosEquipamentoAplicarRegistro(registro) {
  if (!registro) return false;
  const modo = registro.modoCalculo || 'parcelas_calculadas';
  const modoEl = document.getElementById('eq-modo');
  if (modoEl) modoEl.value = ['parcelas_calculadas','parcelas_informadas','nao_calcular'].includes(modo) ? modo : 'parcelas_calculadas';
  custosEquipamentoSetCampo('eq-nome', registro.nome || registro.desc || '');
  custosEquipamentoSetCampo('eq-aquisicao', registro.aquisicao || '');
  custosEquipamentoSetCampo('eq-residual', registro.valorResidual || registro.residual || '');
  custosEquipamentoSetCampo('eq-vida', registro.vidaHoras || registro.vidaUtil || 10000);
  custosEquipamentoSetCampo('eq-fator', registro.fatorDepreciacao || 1);
  custosEquipamentoSetCampo('eq-k-manutencao', registro.fatorManutencao || '');
  custosEquipamentoSetCampo('eq-juros', registro.jurosHora || 0);
  custosEquipamentoSetCampo('eq-impostos', registro.impostosSegurosHora || 0);
  EQUIPAMENTO_INSUMOS_DRAFT = (registro.insumos || []).map(i => ({ ...i, id: i.id || makeId('eqins') }));
  const materialInsumos = somaInsumosPorParcela('material');
  const maoObraInsumos = somaInsumosPorParcela('mao_obra');
  custosEquipamentoSetCampo('eq-combustivel', roundCustoHorario(Math.max(0, (Number(registro.materialHora) || 0) - materialInsumos)));
  custosEquipamentoSetCampo('eq-operador', roundCustoHorario(Math.max(0, (Number(registro.maoObraHora) || 0) - maoObraInsumos)));
  custosEquipamentoSetParcelasManual(registro.parcelas || {
    depreciacao: registro.depreciacaoHora,
    juros: registro.jurosHora,
    impostosSeguros: registro.impostosSegurosHora,
    manutencao: registro.manutencaoHora,
    material: registro.materialHora,
    maoObra: registro.maoObraHora,
    aluguel: registro.aluguelHora,
    outros: registro.outrosHora
  });
  custosEquipamentoModoChange();
  custosEquipamentoRenderInsumos();
  custosEquipamentoCalcular();
  return true;
}

function custosEquipamentoAplicarParcelasReferencia(item) {
  const parcelas = item?.parcelasCustoHorario || item?.parcelas;
  if (!parcelas) return false;
  const modoEl = document.getElementById('eq-modo');
  if (modoEl) modoEl.value = 'parcelas_informadas';
  custosEquipamentoSetParcelasManual(parcelas);
  custosEquipamentoModoChange();
  custosEquipamentoCalcular();
  return true;
}

function custosEquipamentoLookup(options = {}) {
  const cod = document.getElementById('eq-cod')?.value?.trim();
  const status = document.getElementById('eq-lookup-status');
  if (!cod) {
    EQUIPAMENTO_COD_ATUAL = '';
    custosEquipamentoLimparCamposCodigo();
    if (status) { status.textContent = ''; status.className = 'form-help'; }
    return null;
  }
  const code = codigoChave(cod);
  if (EQUIPAMENTO_COD_ATUAL && code !== EQUIPAMENTO_COD_ATUAL) custosEquipamentoLimparCamposCodigo();
  const ref = buscarReferenciaPorCodigo(cod);
  if (!ref) {
    EQUIPAMENTO_COD_ATUAL = '';
    if (status) {
      status.textContent = 'Código não encontrado na base de insumos. Cadastre o equipamento em Insumos/Bases antes de aprovar o custo.';
      status.className = 'form-help error';
    }
    return null;
  }
  const nome = document.getElementById('eq-nome');
  if (nome) nome.value = ref.descricao;
  EQUIPAMENTO_COD_ATUAL = code;
  const registro = custosEquipamentoRegistroPorCodigo(code);
  const aplicouRegistro = custosEquipamentoAplicarRegistro(registro);
  const aplicouParcelas = !aplicouRegistro && custosEquipamentoAplicarParcelasReferencia(ref.item);
  if (status) {
    const origem = aplicouRegistro ? 'custo horário salvo carregado' : aplicouParcelas ? 'parcelas salvas carregadas' : ref.fonte;
    status.textContent = `${ref.descricao} · ${ref.unidade} · ${fmtMoeda(ref.precoUnitario)} · ${origem}`;
    status.className = 'form-help ok';
  }
  if (options.force && !aplicouRegistro && !aplicouParcelas) {
    const preview = document.getElementById('eq-preview');
    if (preview) preview.innerHTML = '';
  }
  return ref;
}

function custosMaoObraLookup() {
  const cod = document.getElementById('mo-cod')?.value?.trim();
  const status = document.getElementById('mo-lookup-status');
  if (!cod) {
    if (status) { status.textContent = ''; status.className = 'form-help'; }
    return null;
  }
  const ref = buscarReferenciaPorCodigo(cod);
  if (!ref) {
    if (status) {
      status.textContent = 'Código não encontrado na base de insumos.';
      status.className = 'form-help error';
    }
    return null;
  }
  const cargo = document.getElementById('mo-cargo');
  if (cargo && !cargo.value.trim()) cargo.value = ref.descricao;
  if (status) {
    status.textContent = `${ref.descricao} · ${ref.unidade} · ${fmtMoeda(ref.precoUnitario)} · ${ref.fonte}`;
    status.className = 'form-help ok';
  }
  return ref;
}

function custosEquipamentoAdicionarInsumo() {
  const cod = document.getElementById('eq-ins-cod')?.value?.trim();
  const consumo = readNumeroCampo('eq-ins-consumo');
  const escolha = document.getElementById('eq-ins-parcela')?.value || 'auto';
  const preview = document.getElementById('eq-ins-preview');
  const ref = buscarReferenciaPorCodigo(cod);
  if (!ref) {
    if (preview) {
      preview.textContent = 'Insumo não encontrado. Cadastre-o primeiro no banco de insumos/importação.';
      preview.className = 'form-help error';
    }
    return;
  }
  if (consumo <= 0) {
    toast('Informe o consumo/índice do insumo.', 'error');
    return;
  }
  const parcela = detectarParcelaInsumo(ref, escolha);
  EQUIPAMENTO_INSUMOS_DRAFT.push({
    id: makeId('eqins'),
    codigo: ref.codigo,
    descricao: ref.descricao,
    unidade: ref.unidade,
    tipo: ref.tipo,
    consumo,
    precoUnitario: ref.precoUnitario,
    parcela,
    fonte: ref.fonte
  });
  ['eq-ins-cod','eq-ins-consumo'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.value = idx === 1 ? '1' : '';
  });
  if (preview) {
    preview.textContent = `${ref.descricao} adicionado em ${parcelaLabel(parcela)}.`;
    preview.className = 'form-help ok';
  }
  custosEquipamentoRenderInsumos();
  custosEquipamentoCalcular();
}

function custosEquipamentoRemoverInsumo(id) {
  EQUIPAMENTO_INSUMOS_DRAFT = EQUIPAMENTO_INSUMOS_DRAFT.filter(i => i.id !== id);
  custosEquipamentoRenderInsumos();
  custosEquipamentoCalcular();
}

function custosEquipamentoLimparInsumos() {
  EQUIPAMENTO_INSUMOS_DRAFT = [];
  custosEquipamentoRenderInsumos();
  custosEquipamentoCalcular();
}

function custosEquipamentoAtualizarPrecosInsumosDraft() {
  let mudou = false;
  EQUIPAMENTO_INSUMOS_DRAFT = EQUIPAMENTO_INSUMOS_DRAFT.map(item => {
    const ref = buscarReferenciaPorCodigo(item.codigo);
    if (!ref) return item;
    const precoAtual = Number(ref.precoUnitario) || 0;
    const next = {
      ...item,
      codigo: ref.codigo || item.codigo,
      descricao: ref.descricao || item.descricao,
      unidade: ref.unidade || item.unidade,
      tipo: ref.tipo || item.tipo,
      precoUnitario: precoAtual,
      fonte: ref.fonte || item.fonte
    };
    if (Math.abs((Number(item.precoUnitario) || 0) - precoAtual) > 0.0001 || item.fonte !== next.fonte) mudou = true;
    return next;
  });
  if (mudou) custosEquipamentoRenderInsumos();
  return mudou;
}

function custosEquipamentoRenderInsumos() {
  const tbody = document.getElementById('eq-insumos-lista');
  if (!tbody) return;
  if (!EQUIPAMENTO_INSUMOS_DRAFT.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state" style="padding:14px">Nenhum insumo vinculado ao equipamento.</td></tr>';
    return;
  }
  tbody.innerHTML = EQUIPAMENTO_INSUMOS_DRAFT.map(i => {
    const total = (Number(i.consumo) || 0) * (Number(i.precoUnitario) || 0);
    return `
      <tr>
        <td class="td-mono">${escapeHtml(i.codigo)}</td>
        <td>${escapeHtml(i.descricao)}<div class="table-input-sub">${escapeHtml(i.fonte || '')}</div></td>
        <td>${escapeHtml(i.unidade)}</td>
        <td><span class="badge badge-ok">${escapeHtml(parcelaLabel(i.parcela))}</span></td>
        <td>${fmtNum(i.consumo)}</td>
        <td>${fmtMoeda(i.precoUnitario)}</td>
        <td><strong>${fmtMoeda(total)}</strong></td>
        <td><button class="btn btn-outline btn-sm" onclick="custosEquipamentoRemoverInsumo('${escapeHtml(i.id)}')">Remover</button></td>
      </tr>
    `;
  }).join('');
}

function custosEquipamentoCalcular() {
  custosEquipamentoModoChange();
  const modo = document.getElementById('eq-modo')?.value || 'parcelas_calculadas';
  const parcelas = parcelasVazias();
  let memoriaOrigem = 'Parcelas calculadas';
  const alertas = [];

  if (modo === 'nao_calcular') {
    ULTIMO_CALC_EQUIPAMENTO = { modo, parcelas, produtivo:0, improdutivo:0, custoHora:0, memoria:'Equipamento marcado como não calcular.', alertas };
  } else if (modo === 'parcelas_informadas') {
    memoriaOrigem = 'Parcelas informadas manualmente';
    parcelas.depreciacao = readNumeroCampo('eq-man-depreciacao');
    parcelas.juros = readNumeroCampo('eq-man-juros');
    parcelas.impostosSeguros = readNumeroCampo('eq-man-impostos');
    parcelas.manutencao = readNumeroCampo('eq-man-manutencao');
    parcelas.material = readNumeroCampo('eq-man-material');
    parcelas.maoObra = readNumeroCampo('eq-man-mao-obra');
    parcelas.aluguel = readNumeroCampo('eq-man-aluguel');
    parcelas.outros = readNumeroCampo('eq-man-outros');
  } else {
    custosEquipamentoAtualizarPrecosInsumosDraft();
    const aquisicao = readNumeroCampo('eq-aquisicao');
    const residual = Math.min(aquisicao, readNumeroCampo('eq-residual'));
    const vida = readNumeroCampo('eq-vida');
    const kDep = readNumeroCampo('eq-fator');
    let kMan = readNumeroCampo('eq-k-manutencao');
    if (!kMan && kDep) kMan = kDep;

    if (!aquisicao) alertas.push('Valor de aquisição não informado.');
    if (!vida) alertas.push('Vida útil não informada.');
    if (aquisicao > 0 && vida > 0) {
      parcelas.depreciacao = ((aquisicao - residual) * kDep) / vida;
      parcelas.manutencao = (aquisicao * kMan) / vida;
    }
    parcelas.juros = readNumeroCampo('eq-juros');
    parcelas.impostosSeguros = readNumeroCampo('eq-impostos');
    parcelas.material = somaInsumosPorParcela('material') + readNumeroCampo('eq-combustivel');
    parcelas.maoObra = somaInsumosPorParcela('mao_obra') + readNumeroCampo('eq-operador');
    parcelas.aluguel = somaInsumosPorParcela('aluguel');
    parcelas.outros = somaInsumosPorParcela('outros');
  }

  Object.keys(parcelas).forEach(k => { parcelas[k] = roundCustoHorario(parcelas[k]); });
  const produtivo = roundCustoHorario(parcelas.depreciacao + parcelas.juros + parcelas.impostosSeguros + parcelas.manutencao + parcelas.material + parcelas.maoObra + parcelas.aluguel + parcelas.outros);
  const improdutivo = roundCustoHorario(parcelas.depreciacao + parcelas.maoObra);
  const memoria = `${memoriaOrigem}: depreciação ${fmtMoeda(parcelas.depreciacao)}/h + juros ${fmtMoeda(parcelas.juros)}/h + impostos/seguros ${fmtMoeda(parcelas.impostosSeguros)}/h + manutenção ${fmtMoeda(parcelas.manutencao)}/h + material ${fmtMoeda(parcelas.material)}/h + mão de obra ${fmtMoeda(parcelas.maoObra)}/h + aluguel ${fmtMoeda(parcelas.aluguel)}/h + outros ${fmtMoeda(parcelas.outros)}/h. Produtivo ${fmtMoeda(produtivo)}/h; improdutivo ${fmtMoeda(improdutivo)}/h.`;
  ULTIMO_CALC_EQUIPAMENTO = { modo, parcelas, produtivo, improdutivo, custoHora:produtivo, memoria, alertas, insumos: JSON.parse(JSON.stringify(EQUIPAMENTO_INSUMOS_DRAFT)) };

  const preview = document.getElementById('eq-preview');
  if (preview) {
    const alertaHtml = alertas.length ? `<div class="form-help error">${escapeHtml(alertas.join(' '))}</div>` : '';
    preview.innerHTML = `
      <strong>Custo horário calculado</strong>
      <div class="cost-summary-grid">
        <div><span>Produtivo</span><strong>${fmtMoeda(produtivo)}</strong></div>
        <div><span>Improdutivo</span><strong>${fmtMoeda(improdutivo)}</strong></div>
      </div>
      <div class="cost-parcel-list">
        <div><span>Depreciação</span><strong>${fmtMoeda(parcelas.depreciacao)}</strong></div>
        <div><span>Manutenção</span><strong>${fmtMoeda(parcelas.manutencao)}</strong></div>
        <div><span>Material</span><strong>${fmtMoeda(parcelas.material)}</strong></div>
        <div><span>Mão de obra</span><strong>${fmtMoeda(parcelas.maoObra)}</strong></div>
        <div><span>Juros</span><strong>${fmtMoeda(parcelas.juros)}</strong></div>
        <div><span>Imp./seguros</span><strong>${fmtMoeda(parcelas.impostosSeguros)}</strong></div>
        <div><span>Aluguel</span><strong>${fmtMoeda(parcelas.aluguel)}</strong></div>
        <div><span>Outros</span><strong>${fmtMoeda(parcelas.outros)}</strong></div>
      </div>
      ${alertaHtml}
      <span>${escapeHtml(memoria)}</span>
    `;
  }
  return ULTIMO_CALC_EQUIPAMENTO;
}

function custosEquipamentoSalvar() {
  normalizeState();
  const calc = custosEquipamentoCalcular();
  const nome = document.getElementById('eq-nome')?.value?.trim();
  if (!nome || calc.custoHora <= 0) {
    toast('Informe equipamento e valores para calcular o custo horário.', 'error');
    return;
  }
  const cod = document.getElementById('eq-cod')?.value?.trim();
  if (!cod || !custosEquipamentoLookup()) {
    toast('Cadastre/localize o código do equipamento na base de insumos antes de salvar.', 'error');
    return;
  }
  const registro = {
    id: makeId('eq'),
    tipo: 'equipamento',
    cod,
    nome,
    modoCalculo: calc.modo,
    aquisicao: readNumeroCampo('eq-aquisicao'),
    valorResidual: readNumeroCampo('eq-residual'),
    vidaHoras: readNumeroCampo('eq-vida'),
    fatorDepreciacao: readNumeroCampo('eq-fator'),
    fatorManutencao: readNumeroCampo('eq-k-manutencao') || readNumeroCampo('eq-fator'),
    jurosHora: calc.parcelas.juros,
    impostosSegurosHora: calc.parcelas.impostosSeguros,
    depreciacaoHora: calc.parcelas.depreciacao,
    manutencaoHora: calc.parcelas.manutencao,
    materialHora: calc.parcelas.material,
    maoObraHora: calc.parcelas.maoObra,
    aluguelHora: calc.parcelas.aluguel,
    outrosHora: calc.parcelas.outros,
    custoHora: roundUnitPrice(calc.produtivo),
    custoProdutivo: roundCustoHorario(calc.produtivo),
    custoImprodutivo: roundCustoHorario(calc.improdutivo),
    parcelas: calc.parcelas,
    insumos: calc.insumos || [],
    memoria: calc.memoria,
    criadoEm: new Date().toISOString()
  };
  STATE.equipamentosHorarios.push(registro);
  custosEquipamentoAtualizarInsumo({ calc, cod, nome, silent:true, save:false });
  saveState();
  custosHorariosRender();
  if (typeof insumosRender === 'function') insumosRender();
  cpuRenderManualCount();
  toast('Custo horário de equipamento salvo.', 'success');
}

function custosEquipamentoAtualizarInsumo(options = {}) {
  const calc = options.calc || custosEquipamentoCalcular();
  const cod = options.cod || document.getElementById('eq-cod')?.value?.trim();
  const nome = options.nome || document.getElementById('eq-nome')?.value?.trim();
  if (!cod || !nome || calc.custoHora <= 0) {
    toast('Calcule um equipamento com código e descrição antes de atualizar o insumo.', 'error');
    return null;
  }
  const saved = insumosSalvarManualItem({
    codigo: cod,
    descricao: nome,
    unidade: 'h',
    grupo: 'E',
    preco: roundCustoHorario(calc.produtivo),
    custoImprodutivo: roundCustoHorario(calc.improdutivo),
    custoProdutivo: roundCustoHorario(calc.produtivo),
    data: new Date().toLocaleDateString('pt-BR'),
    origem: 'custos-horarios-equipamento',
    fonte: 'TLPlanly/Custos Horários',
    memoriaCustoHorario: calc.memoria,
    parcelasCustoHorario: calc.parcelas
  }, { save: options.save !== false });
  if (!saved) return null;
  if (typeof insumosRender === 'function') insumosRender();
  if (!options.silent) toast('Insumo de equipamento atualizado na base manual.', 'success');
  return saved;
}

function beneficioFatorPadrao(periodo) {
  if (periodo === 'diaria') return 22;
  if (periodo === 'semanal') return 4.33;
  if (periodo === 'viagem') return 1;
  return 1;
}

function beneficioTotalMensal(item) {
  const base = (Number(item.quantidade) || 0) * (Number(item.precoUnitario) || 0);
  const fator = Number(item.fatorMes) || beneficioFatorPadrao(item.periodicidade);
  return roundCustoHorario(base * fator);
}

function custosMaoObraAdicionarBeneficio() {
  const raw = document.getElementById('mo-ben-desc')?.value?.trim();
  const qtd = readNumeroCampo('mo-ben-qtd') || 1;
  let preco = readNumeroCampo('mo-ben-preco');
  const periodo = document.getElementById('mo-ben-periodo')?.value || 'mensal';
  const fatorMes = readNumeroCampo('mo-ben-fator') || beneficioFatorPadrao(periodo);
  const preview = document.getElementById('mo-ben-preview');
  if (!raw) {
    toast('Informe o benefício ou código do insumo.', 'error');
    return;
  }
  const ref = buscarReferenciaPorCodigo(raw);
  const descricao = ref?.descricao || raw;
  if (ref && !preco) preco = ref.precoUnitario;
  if (preco <= 0) {
    toast('Informe o preço unitário do benefício.', 'error');
    return;
  }
  MAO_OBRA_BENEFICIOS_DRAFT.push({
    id: makeId('ben'),
    codigo: ref?.codigo || '',
    descricao,
    quantidade: qtd,
    precoUnitario: preco,
    periodicidade: periodo,
    fatorMes,
    fonte: ref?.fonte || 'Informado'
  });
  ['mo-ben-desc','mo-ben-preco','mo-ben-fator'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const qtdEl = document.getElementById('mo-ben-qtd');
  if (qtdEl) qtdEl.value = '1';
  if (preview) {
    preview.textContent = `${descricao} adicionado à composição de benefícios.`;
    preview.className = 'form-help ok';
  }
  custosMaoObraRenderBeneficios();
}

function custosMaoObraRemoverBeneficio(id) {
  MAO_OBRA_BENEFICIOS_DRAFT = MAO_OBRA_BENEFICIOS_DRAFT.filter(i => i.id !== id);
  custosMaoObraRenderBeneficios();
}

function custosMaoObraLimparBeneficios() {
  MAO_OBRA_BENEFICIOS_DRAFT = [];
  custosMaoObraRenderBeneficios();
  custosMaoObraAplicarBeneficios();
}

function custosMaoObraRenderBeneficios() {
  const tbody = document.getElementById('mo-beneficios-lista');
  if (!tbody) return;
  if (!MAO_OBRA_BENEFICIOS_DRAFT.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding:14px">Nenhum benefício composto.</td></tr>';
    return;
  }
  tbody.innerHTML = MAO_OBRA_BENEFICIOS_DRAFT.map(i => `
    <tr>
      <td>${escapeHtml(i.descricao)}<div class="table-input-sub">${escapeHtml(i.codigo || i.fonte || '')}</div></td>
      <td>${fmtNum(i.quantidade)}</td>
      <td>${fmtMoeda(i.precoUnitario)}</td>
      <td>${escapeHtml(i.periodicidade)}</td>
      <td>${fmtNum(i.fatorMes)}</td>
      <td><strong>${fmtMoeda(beneficioTotalMensal(i))}</strong></td>
      <td><button class="btn btn-outline btn-sm" onclick="custosMaoObraRemoverBeneficio('${escapeHtml(i.id)}')">Remover</button></td>
    </tr>
  `).join('');
}

function custosMaoObraAplicarBeneficios() {
  const total = MAO_OBRA_BENEFICIOS_DRAFT.reduce((s, i) => s + beneficioTotalMensal(i), 0);
  const input = document.getElementById('mo-beneficios');
  if (input) input.value = total ? String(roundCustoHorario(total, 2)) : '';
  const preview = document.getElementById('mo-ben-preview');
  if (preview) {
    preview.textContent = total ? `Benefícios mensais calculados: ${fmtMoeda(total)}.` : '';
    preview.className = total ? 'form-help ok' : 'form-help';
  }
  custosMaoObraCalcular();
  return total;
}

function custosMaoObraCalcular() {
  const calc = calcularCustoMaoObraDados({
    salario: readNumeroCampo('mo-salario'),
    beneficios: readNumeroCampo('mo-beneficios'),
    encargos: readNumeroCampo('mo-encargos'),
    horas: readNumeroCampo('mo-horas'),
    beneficiosCompostos: MAO_OBRA_BENEFICIOS_DRAFT
  });
  const preview = document.getElementById('mo-preview');
  if (preview) {
    preview.innerHTML = `<strong>Custo horário:</strong> ${fmtMoeda(calc.custoHora)}<br><span>${escapeHtml(calc.memoria)}</span>`;
  }
  ULTIMO_CALC_MAO_OBRA = calc;
  return ULTIMO_CALC_MAO_OBRA;
}

function custosMaoObraSalvar() {
  normalizeState();
  const calc = custosMaoObraCalcular();
  const cargo = document.getElementById('mo-cargo')?.value?.trim();
  if (!cargo || calc.custoHora <= 0) {
    toast('Informe cargo e valores para calcular a mão de obra.', 'error');
    return;
  }
  const codInput = document.getElementById('mo-cod');
  const cod = codInput?.value?.trim() || insumosCodigoSequencial('S');
  if (codInput && !codInput.value.trim()) codInput.value = cod;
  const registro = {
    id: makeId('mo'),
    tipo: 'mao-obra',
    cod,
    cargo,
    salarioMensal: calc.salario,
    beneficiosMensais: calc.beneficios,
    beneficiosCompostos: calc.beneficiosCompostos || [],
    encargosPct: calc.encargos,
    horasProdutivasMes: calc.horas,
    custoHora: roundUnitPrice(calc.custoHora),
    memoria: calc.memoria,
    criadoEm: new Date().toISOString()
  };
  STATE.maoObraHoraria.push(registro);
  custosMaoObraAtualizarInsumo({ calc, cod, cargo, silent:true, save:false });
  saveState();
  custosHorariosRender();
  if (typeof insumosRender === 'function') insumosRender();
  cpuRenderManualCount();
  toast('Custo horário de mão de obra salvo.', 'success');
}

function custosMaoObraAtualizarInsumo(options = {}) {
  const calc = options.calc || custosMaoObraCalcular();
  const codInput = document.getElementById('mo-cod');
  const cod = options.cod || codInput?.value?.trim() || insumosCodigoSequencial('S');
  const cargo = options.cargo || document.getElementById('mo-cargo')?.value?.trim();
  if (!cargo || calc.custoHora <= 0) {
    toast('Calcule uma mão de obra com cargo e custo horário antes de atualizar o insumo.', 'error');
    return null;
  }
  if (codInput && !codInput.value.trim()) codInput.value = cod;
  const saved = insumosSalvarManualItem({
    codigo: cod,
    descricao: cargo,
    unidade: 'h',
    grupo: 'S',
    preco: roundCustoHorario(calc.custoHora),
    custoProdutivo: roundCustoHorario(calc.custoHora),
    data: new Date().toLocaleDateString('pt-BR'),
    origem: 'custos-horarios-mao-obra',
    fonte: 'TLPlanly/Custos Horários',
    memoriaCustoHorario: calc.memoria,
    salarioMensal: calc.salario,
    beneficiosMensais: calc.beneficios,
    beneficiosCompostos: calc.beneficiosCompostos || [],
    encargosPct: calc.encargos,
    horasProdutivasMes: calc.horas
  }, { save: options.save !== false });
  if (!saved) return null;
  if (typeof insumosRender === 'function') insumosRender();
  if (!options.silent) toast('Insumo de mão de obra atualizado na base manual.', 'success');
  return saved;
}

function custosMaoObraRegistrarDeInsumo(item, calc) {
  if (!item?.codigo || !item?.descricao || !calc?.custoHora) return null;
  normalizeState();
  const cod = item.codigoSinapi || item.codigo;
  const registro = {
    id: makeId('mo'),
    tipo: 'mao-obra',
    cod,
    cargo: item.descricao,
    salarioMensal: calc.salario,
    beneficiosMensais: calc.beneficios,
    beneficiosCompostos: calc.beneficiosCompostos || [],
    encargosPct: calc.encargos,
    horasProdutivasMes: calc.horas,
    custoHora: roundUnitPrice(calc.custoHora),
    memoria: calc.memoria,
    origem: 'insumo-calculado',
    criadoEm: new Date().toISOString()
  };
  STATE.maoObraHoraria = [
    ...(STATE.maoObraHoraria || []).filter(r => codigoChave(r.cod) !== codigoChave(cod)),
    registro
  ];
  if (typeof custosHorariosRender === 'function') custosHorariosRender();
  return registro;
}

function custoHorarioRegistros() {
  normalizeState();
  return [
    ...STATE.equipamentosHorarios.map(r => ({ ...r, grupo:'Equipamento', desc:r.nome, insumoTipo:'E' })),
    ...STATE.maoObraHoraria.map(r => ({ ...r, grupo:'Mão de Obra', desc:r.cargo, insumoTipo:'S' }))
  ].sort((a, b) => String(a.cod).localeCompare(String(b.cod), 'pt-BR'));
}

function custosHorariosRender() {
  custosEquipamentoModoChange();
  custosEquipamentoRenderInsumos();
  custosMaoObraRenderBeneficios();
  equipeMecanicaRender();
  const tbody = document.getElementById('custos-lista');
  if (!tbody) return;
  const rows = custoHorarioRegistros();
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="padding:24px">Nenhum custo horário salvo.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="badge badge-ok">${escapeHtml(r.grupo)}</span></td>
      <td class="td-mono">${escapeHtml(r.cod)}</td>
      <td>${escapeHtml(r.desc)}</td>
      <td><strong>${fmtMoeda(r.custoHora)}</strong></td>
      <td style="max-width:420px;color:var(--text2)">${escapeHtml(r.memoria || '')}${r.custoImprodutivo ? `<div class="table-input-sub">Produtivo ${fmtMoeda(r.custoProdutivo || r.custoHora)} · Improdutivo ${fmtMoeda(r.custoImprodutivo)}</div>` : ''}</td>
      <td><button class="btn btn-outline btn-sm" onclick="custosHorarioEnviarCPU('${escapeHtml(r.tipo)}','${escapeHtml(r.id)}')">Enviar CPU</button></td>
    </tr>
  `).join('');
}

function custosHorarioEnviarCPU(tipo, id) {
  const source = tipo === 'equipamento'
    ? STATE.equipamentosHorarios.find(r => r.id === id)
    : STATE.maoObraHoraria.find(r => r.id === id);
  if (!source) {
    toast('Registro de custo horário não encontrado.', 'error');
    return;
  }
  const desc = source.nome || source.cargo || 'Custo horário';
  const cod = source.cod || makeId('cpu');
  const insTipo = tipo === 'equipamento' ? 'E' : 'S';
  const cpu = {
    id: makeId('cpu'),
    cod,
    desc,
    unid: 'h',
    tipo: tipo === 'equipamento' ? 'Equipamentos' : 'Mão de Obra',
    prod: 1,
    encargos: STATE.config.enc || 'nd',
    encPct: tipo === 'mao-obra' ? Number(source.encargosPct || 0) : 0,
    insumos: [{ cod, desc, unid:'h', tipo:insTipo, coef:1, preco:Number(source.custoHora) || 0 }],
    precoUnitario: Number(source.custoHora) || 0,
    origem: 'custos-horarios',
    memoria: source.memoria,
    custoProdutivo: source.custoProdutivo || source.custoHora,
    custoImprodutivo: source.custoImprodutivo || 0,
    parcelas: source.parcelas || null
  };
  const idx = CPU_BIBLIOTECA.findIndex(c => codigoChave(c.cod) === codigoChave(cod));
  if (idx >= 0) CPU_BIBLIOTECA[idx] = { ...CPU_BIBLIOTECA[idx], ...cpu, id: CPU_BIBLIOTECA[idx].id };
  else CPU_BIBLIOTECA.push(cpu);
  cpuSaveLib();
  if (typeof cpuRenderBiblioteca === 'function') cpuRenderBiblioteca();
  toast('Custo horário enviado para a biblioteca de CPUs.', 'success');
}

function custosHorariosRows() {
  const rows = [
    ['CUSTOS HORÁRIOS - TLPlanly'],
    [`Emitido em ${new Date().toLocaleString('pt-BR')}`],
    [],
    ['Tipo','Código','Descrição','Custo produtivo','Custo improdutivo','Memória']
  ];
  custoHorarioRegistros().forEach(r => rows.push([r.grupo, r.cod, r.desc, valorMoeda(r.custoProdutivo || r.custoHora), valorMoeda(r.custoImprodutivo || 0), r.memoria]));
  return rows;
}

function custosHorariosExportarExcel() {
  exportRowsToExcel('custos_horarios_TLPlanly', [{ name:'Custos horários', rows:custosHorariosRows() }]);
}

function custosHorariosExportarPDF() {
  exportHtmlToPDF('Custos Horários - TLPlanly', rowsToHtmlTable(custosHorariosRows()), 'custos_horarios_TLPlanly');
}

function equipeMecanicaCalcular() {
  const producao = Math.max(0.0001, readNumeroCampo('em-producao'));
  const eficiencia = Math.max(1, Math.min(100, readNumeroCampo('em-eficiencia') || 100));
  const producaoEfetiva = producao * eficiencia / 100;
  const equipamentos = readNumeroCampo('em-equip');
  const maoObra = readNumeroCampo('em-mo');
  const materiais = readNumeroCampo('em-mat');
  const auxiliares = readNumeroCampo('em-aux');
  const custoHora = roundCustoHorario(equipamentos + maoObra + materiais + auxiliares);
  const custoUnitario = roundUnitPrice(custoHora / Math.max(0.0001, producaoEfetiva));
  const memoria = `Equipamentos ${fmtMoeda(equipamentos)}/h + mão de obra ${fmtMoeda(maoObra)}/h + materiais ${fmtMoeda(materiais)}/h + auxiliares ${fmtMoeda(auxiliares)}/h = ${fmtMoeda(custoHora)}/h. Produção efetiva ${fmtNum(producaoEfetiva)} un/h (${fmtNum(eficiencia)}%). Custo unitário ${fmtMoeda(custoUnitario)}.`;
  const preview = document.getElementById('em-preview');
  if (preview) {
    preview.innerHTML = `<strong>Custo unitário:</strong> ${fmtMoeda(custoUnitario)}<br><span>${escapeHtml(memoria)}</span>`;
  }
  return { producao, eficiencia, producaoEfetiva, equipamentos, maoObra, materiais, auxiliares, custoHora, custoUnitario, memoria };
}

function equipeMecanicaSalvar() {
  normalizeState();
  const calc = equipeMecanicaCalcular();
  const cod = document.getElementById('em-cod')?.value?.trim() || `EM-${String((STATE.equipesMecanicas || []).length + 1).padStart(3, '0')}`;
  const desc = document.getElementById('em-desc')?.value?.trim();
  const unid = document.getElementById('em-unid')?.value?.trim() || 'un';
  if (!desc || calc.custoUnitario <= 0) {
    toast('Informe descrição, produção e custos da equipe mecânica.', 'error');
    return;
  }
  const registro = {
    id: makeId('em'),
    cod,
    desc,
    unid,
    ...calc,
    criadoEm: new Date().toISOString()
  };
  STATE.equipesMecanicas = [...(STATE.equipesMecanicas || []).filter(e => codigoChave(e.cod) !== codigoChave(cod)), registro];
  saveState();
  equipeMecanicaRender();
  toast('Equipe mecânica salva.', 'success');
}

function equipeMecanicaLimpar() {
  ['em-desc','em-equip','em-mo','em-mat','em-aux','em-producao'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const cod = document.getElementById('em-cod');
  if (cod) cod.value = `EM-${String((STATE.equipesMecanicas || []).length + 1).padStart(3, '0')}`;
  const unid = document.getElementById('em-unid');
  if (unid) unid.value = 'm³';
  const efi = document.getElementById('em-eficiencia');
  if (efi) efi.value = '100';
  const preview = document.getElementById('em-preview');
  if (preview) preview.innerHTML = '';
}

function equipeMecanicaExcluir(id) {
  STATE.equipesMecanicas = (STATE.equipesMecanicas || []).filter(e => e.id !== id);
  saveState();
  equipeMecanicaRender();
  toast('Equipe mecânica excluída.', 'info');
}

function equipeMecanicaEnviarCPU(id) {
  const equipe = (STATE.equipesMecanicas || []).find(e => e.id === id);
  if (!equipe) return;
  const cpu = {
    id: makeId('cpu'),
    cod: equipe.cod,
    desc: equipe.desc,
    unid: equipe.unid || 'un',
    tipo: 'Equipe Mecânica',
    prod: equipe.producaoEfetiva || 1,
    encargos: STATE.config.enc || 'nd',
    encPct: 0,
    insumos: [
      { cod:`${equipe.cod}-EQ`, desc:'Equipamentos da equipe', unid:'h', tipo:'E', coef:1, preco:equipe.equipamentos || 0 },
      { cod:`${equipe.cod}-MO`, desc:'Mão de obra da equipe', unid:'h', tipo:'S', coef:1, preco:equipe.maoObra || 0 },
      { cod:`${equipe.cod}-MAT`, desc:'Materiais da equipe', unid:'h', tipo:'M', coef:1, preco:equipe.materiais || 0 },
      { cod:`${equipe.cod}-AUX`, desc:'Auxiliares da equipe', unid:'h', tipo:'T', coef:1, preco:equipe.auxiliares || 0 }
    ].filter(i => Number(i.preco) > 0),
    precoUnitario: equipe.custoUnitario,
    memoria: equipe.memoria,
    criadaEm: new Date().toLocaleDateString('pt-BR'),
    origem: 'equipe-mecanica'
  };
  cpuRecalcularComposicaoSalva(cpu);
  const idx = CPU_BIBLIOTECA.findIndex(c => codigoChave(c.cod) === codigoChave(cpu.cod));
  if (idx >= 0) CPU_BIBLIOTECA[idx] = { ...CPU_BIBLIOTECA[idx], ...cpu, id: CPU_BIBLIOTECA[idx].id };
  else CPU_BIBLIOTECA.push(cpu);
  cpuSaveLib();
  cpuRenderBiblioteca();
  toast('Equipe mecânica enviada para a biblioteca de CPUs.', 'success');
}

function equipeMecanicaRender() {
  const tbody = document.getElementById('em-lista');
  if (!tbody) return;
  const rows = STATE.equipesMecanicas || [];
  const cod = document.getElementById('em-cod');
  if (cod && !cod.value) cod.value = `EM-${String(rows.length + 1).padStart(3, '0')}`;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state" style="padding:18px">Nenhuma equipe mecânica salva.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(e => `<tr>
    <td class="td-mono">${escapeHtml(e.cod)}</td>
    <td>${escapeHtml(e.desc)}<div class="table-input-sub">${escapeHtml(e.memoria || '')}</div></td>
    <td>${fmtNum(e.producaoEfetiva || e.producao)} ${escapeHtml(e.unid || 'un')}/h</td>
    <td>${fmtMoeda(e.custoHora)}</td>
    <td><strong>${fmtMoeda(e.custoUnitario)}</strong></td>
    <td><div class="obra-row-actions"><button class="btn btn-outline btn-sm" onclick="equipeMecanicaEnviarCPU('${escapeHtml(e.id)}')">Enviar CPU</button><button class="btn btn-outline btn-sm" onclick="equipeMecanicaExcluir('${escapeHtml(e.id)}')">Excluir</button></div></td>
  </tr>`).join('');
}

function nucleoRowsObras() {
  return [['Número','Projeto','Cliente','Data','Banco','Lotes','Itens','Total'],
    ...(STATE.obras || []).map(obra => {
      const r = obraResumo(obra);
      return [obra.numero, obra.nome, obra.cliente || '', obra.data || '', obra.bancoBase || '', r.lotes, r.itens, valorMoeda(r.total)];
    })];
}

function nucleoRowsInsumos() {
  return [['Código','Descrição','Grupo','Unidade','Preço','Improdutivo','Fonte'],
    ...insumosTodasBases({ somenteManual:false }).map(item => {
      const code = item.codigoSinapi || item.codigo || '';
      const grupo = insumosGrupoNormalizado(item.grupo || item.tipo, code, item.descricao);
      return [code, item.descricao || '', insumosGrupoLabel(grupo), item.unidade || item.unid || 'UN', valorMoeda(insumosPrecoItem(item)), valorMoeda(insumosCustoImprodutivo(item)), item._base || item.fonte || ''];
    })];
}

function nucleoRowsCpus() {
  const rows = [['Código','Descrição','Unidade','Tipo','Produção','Encargos %','Custo unitário','Qtd insumos']];
  (CPU_BIBLIOTECA || []).forEach(cpu => rows.push([cpu.cod, cpu.desc, cpu.unid, cpu.tipo, cpu.prod || 1, cpu.encPct || 0, valorMoeda(cpu.precoUnitario), (cpu.insumos || []).length]));
  return rows;
}

function nucleoRowsCpuInsumos() {
  const rows = [['CPU','Código insumo','Descrição','Unidade','Tipo','Coeficiente','Preço','Subtotal']];
  (CPU_BIBLIOTECA || []).forEach(cpu => (cpu.insumos || []).forEach(ins => rows.push([
    cpu.cod, ins.cod, ins.desc || ins.descricao || '', ins.unid || ins.unidade || '', ins.tipo || '', Number(ins.coef) || 0, valorMoeda(ins.preco), valorMoeda((Number(ins.coef) || 0) * (Number(ins.preco) || 0))
  ])));
  return rows;
}

function nucleoRowsCustos() {
  return [['Tipo','Código','Descrição','Produtivo','Improdutivo','Memória'],
    ...custoHorarioRegistros().map(r => [r.grupo, r.cod, r.desc, valorMoeda(r.custoProdutivo || r.custoHora), valorMoeda(r.custoImprodutivo || 0), r.memoria || ''])];
}

function nucleoRowsEquipes() {
  return [['Código','Descrição','Unidade','Produção/h','Custo/h','Custo unitário','Memória'],
    ...(STATE.equipesMecanicas || []).map(e => [e.cod, e.desc, e.unid, e.producaoEfetiva || e.producao, valorMoeda(e.custoHora), valorMoeda(e.custoUnitario), e.memoria || ''])];
}

function nucleoRowsBancos() {
  return [['Banco externo','Composição','Descrição','Unidade','Custo unitário','Qtd insumos'],
    ...(STATE.cpuBancosExternos || []).flatMap(b => (b.composicoes || []).map(cpu => [b.nome, cpu.cod, cpu.desc, cpu.unid, valorMoeda(cpu.precoUnitario), (cpu.insumos || []).length]))];
}

function nucleoExportarExcel() {
  exportRowsToExcel('TLPlanly_Nucleo_Orcamento', [
    { name:'Obras', rows:nucleoRowsObras() },
    { name:'Insumos', rows:nucleoRowsInsumos() },
    { name:'CPUs', rows:nucleoRowsCpus() },
    { name:'CPU_Insumos', rows:nucleoRowsCpuInsumos() },
    { name:'Custos_Horarios', rows:nucleoRowsCustos() },
    { name:'Equipes_Mecanicas', rows:nucleoRowsEquipes() },
    { name:'Bancos_Externos', rows:nucleoRowsBancos() }
  ]);
}

function nucleoExportarPDF() {
  const html = [
    '<h2>Obras</h2>', rowsToHtmlTable(nucleoRowsObras()),
    '<h2>Insumos</h2>', rowsToHtmlTable(nucleoRowsInsumos().slice(0, 120)),
    '<h2>Composições</h2>', rowsToHtmlTable(nucleoRowsCpus()),
    '<h2>Custos Horários</h2>', rowsToHtmlTable(nucleoRowsCustos()),
    '<h2>Equipes Mecânicas</h2>', rowsToHtmlTable(nucleoRowsEquipes()),
    '<h2>Bancos Externos</h2>', rowsToHtmlTable(nucleoRowsBancos().slice(0, 120))
  ].join('');
  exportHtmlToPDF('Núcleo de Orçamento - TLPlanly', html, 'TLPlanly_Nucleo_Orcamento');
}

function cotacaoAdicionar() {
  normalizeState();
  const preco = readNumeroCampo('cot-preco');
  const cod = document.getElementById('cot-cod')?.value?.trim();
  const desc = document.getElementById('cot-desc')?.value?.trim();
  if ((!cod && !desc) || preco <= 0) {
    toast('Informe código/descrição e preço da cotação.', 'error');
    return;
  }
  STATE.cotacoesCustos.push({
    id: makeId('cot'),
    cod,
    desc,
    fornecedor: document.getElementById('cot-fornecedor')?.value?.trim() || 'Fornecedor não informado',
    unid: document.getElementById('cot-unid')?.value?.trim() || 'UN',
    preco,
    grupo: document.getElementById('cot-grupo')?.value || 'Material',
    origem: 'manual',
    criadoEm: new Date().toISOString()
  });
  ['cot-cod','cot-desc','cot-fornecedor','cot-unid','cot-preco'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  saveState();
  cotacoesRender();
  toast('Cotação adicionada.', 'success');
}

function cotacaoMapHeader(header) {
  const map = {};
  const aliases = {
    cod: ['codigo','cod','referencia','item','insumo'],
    desc: ['descricao','descrição','produto','servico','serviço','item cotado'],
    fornecedor: ['fornecedor','empresa','loja','origem'],
    unid: ['un','unid','unidade'],
    preco: ['preco','preço','valor','custo','unitario','unitário'],
    grupo: ['grupo','categoria','tipo','classe']
  };
  header.forEach((h, idx) => {
    const n = textoChave(h).toLowerCase();
    Object.entries(aliases).forEach(([field, words]) => {
      if (map[field] !== undefined) return;
      if (words.some(w => n.includes(textoChave(w).toLowerCase()))) map[field] = idx;
    });
  });
  return map;
}

async function cotacaoImportFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    let rows = [];
    if (/\.csv$/i.test(file.name)) {
      const text = await file.text();
      rows = text.split(/\r?\n/).filter(Boolean).map(line => line.split(/;|,/));
    } else {
      if (!window.XLSX) throw new Error('Biblioteca XLSX não carregou.');
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type:'array', raw:false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });
    }
    const headerIdx = rows.findIndex(r => (r || []).filter(Boolean).length >= 3);
    const header = rows[headerIdx] || [];
    const map = cotacaoMapHeader(header);
    const dataRows = rows.slice(headerIdx + 1);
    let count = 0;
    dataRows.forEach(r => {
      const preco = parseNumeroBR(r[map.preco] ?? '');
      const cod = String(r[map.cod] ?? '').trim();
      const desc = String(r[map.desc] ?? '').trim();
      if ((!cod && !desc) || preco <= 0) return;
      STATE.cotacoesCustos.push({
        id: makeId('cot'),
        cod,
        desc,
        fornecedor: String(r[map.fornecedor] ?? file.name).trim() || file.name,
        unid: String(r[map.unid] ?? 'UN').trim() || 'UN',
        preco,
        grupo: String(r[map.grupo] ?? 'Material').trim() || 'Material',
        origem: file.name,
        criadoEm: new Date().toISOString()
      });
      count++;
    });
    saveState();
    cotacoesRender();
    toast(`${count} cotações importadas.`, count ? 'success' : 'error');
  } catch (err) {
    toast('Erro ao importar cotações: ' + err.message, 'error');
  } finally {
    event.target.value = '';
  }
}

function cotacoesRender() {
  const tbody = document.getElementById('cot-lista');
  const count = document.getElementById('cot-count');
  if (!tbody) return;
  normalizeState();
  if (count) count.textContent = `${STATE.cotacoesCustos.length} registros`;
  if (!STATE.cotacoesCustos.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding:24px">Nenhuma cotação cadastrada.</td></tr>';
    return;
  }
  tbody.innerHTML = STATE.cotacoesCustos.map(c => `
    <tr>
      <td class="td-mono">${escapeHtml(c.cod || '—')}</td>
      <td>${escapeHtml(c.desc || '—')}</td>
      <td>${escapeHtml(c.fornecedor || '—')}</td>
      <td>${escapeHtml(c.unid || 'UN')}</td>
      <td><strong>${fmtMoeda(c.preco)}</strong></td>
      <td>${escapeHtml(c.grupo || '—')}</td>
      <td><button class="btn btn-outline btn-sm" onclick="cotacaoRemover('${escapeHtml(c.id)}')">Remover</button></td>
    </tr>
  `).join('');
}

function cotacaoRemover(id) {
  STATE.cotacoesCustos = STATE.cotacoesCustos.filter(c => c.id !== id);
  saveState();
  cotacoesRender();
}

function cotacaoEscolherPreco(cod, desc, criterio, margemPct = 0) {
  const keyCod = codigoChave(cod);
  const keyDesc = textoChave(desc);
  const candidatas = STATE.cotacoesCustos.filter(c => {
    const cCod = codigoChave(c.cod);
    const cDesc = textoChave(c.desc);
    return (keyCod && cCod === keyCod) || (!keyCod && keyDesc && cDesc === keyDesc) || (keyDesc && cDesc && (cDesc.includes(keyDesc) || keyDesc.includes(cDesc)));
  }).map(c => Number(c.preco) || 0).filter(v => v > 0).sort((a, b) => a - b);
  if (!candidatas.length) return null;
  let preco = candidatas[0];
  if (criterio === 'media') preco = candidatas.reduce((s, v) => s + v, 0) / candidatas.length;
  if (criterio === 'mediana') preco = candidatas[Math.floor(candidatas.length / 2)];
  if (criterio === 'menor-seguranca') preco = candidatas[0] * (1 + margemPct / 100);
  return roundUnitPrice(preco);
}

function cotacaoAplicar() {
  normalizeState();
  if (!STATE.cotacoesCustos.length) {
    toast('Cadastre ou importe cotações antes de aplicar.', 'error');
    return;
  }
  const criterio = document.getElementById('cot-criterio')?.value || 'menor';
  const margem = readNumeroCampo('cot-margem');
  const alvo = document.getElementById('cot-alvo')?.value || 'ambos';
  let atualizadosCpu = 0;
  let atualizadosOrc = 0;

  if (alvo === 'ambos' || alvo === 'cpu') {
    CPU_BIBLIOTECA.forEach(cpu => {
      let mudou = false;
      (cpu.insumos || []).forEach(ins => {
        const preco = cotacaoEscolherPreco(ins.cod, ins.desc, criterio, margem);
        if (preco !== null) {
          ins.preco = preco;
          ins.origemCotacao = criterio;
          atualizadosCpu++;
          mudou = true;
        }
      });
      if (mudou) recalcularPrecoCpu(cpu);
    });
    cpuSaveLib();
    if (typeof cpuRenderBiblioteca === 'function') cpuRenderBiblioteca();
  }

  if (alvo === 'ambos' || alvo === 'orcamento') {
    const snapshot = STATE.orcamento.map(it => ({ id:it.id, preco:it.preco, totalLinha:it.totalLinha }));
    STATE.orcamento.forEach(it => {
      const preco = cotacaoEscolherPreco(it.cod, it.desc, criterio, margem);
      if (preco !== null) {
        it.preco = preco;
        it.totalLinha = 0;
        it.origemCotacao = criterio;
        atualizadosOrc++;
      }
    });
    if (atualizadosOrc) {
      invalidarDescontoPregao('preços atualizados por cotação');
      STATE.ultimaAtualizacaoCotacao = { aplicadoEm:new Date().toISOString(), criterio, margem, alvo, atualizadosOrc, snapshot };
    }
  }

  saveState();
  renderElaborar();
  renderDashboard();
  cotacoesRender();
  const msg = `${atualizadosCpu} insumos de CPU e ${atualizadosOrc} itens do orçamento atualizados.`;
  const box = document.getElementById('cot-aplicacao');
  if (box) box.textContent = msg;
  toast(msg, (atualizadosCpu || atualizadosOrc) ? 'success' : 'info');
}

function cotacoesRows() {
  const rows = [
    ['BANCO DE COTAÇÕES - TLPlanly'],
    [`Emitido em ${new Date().toLocaleString('pt-BR')}`],
    [],
    ['Código','Descrição','Fornecedor','Unidade','Preço','Grupo','Origem']
  ];
  STATE.cotacoesCustos.forEach(c => rows.push([c.cod, c.desc, c.fornecedor, c.unid, valorMoeda(c.preco), c.grupo, c.origem || 'manual']));
  return rows;
}

function cotacoesExportarExcel() {
  exportRowsToExcel('cotacoes_TLPlanly', [{ name:'Cotações', rows:cotacoesRows() }]);
}

function cotacoesExportarPDF() {
  exportHtmlToPDF('Banco de Cotações - TLPlanly', rowsToHtmlTable(cotacoesRows()), 'cotacoes_TLPlanly');
}

function frentesAdicionar() {
  normalizeState();
  const nome = document.getElementById('fr-nome')?.value?.trim();
  if (!nome) {
    toast('Informe a descrição da frente de serviço.', 'error');
    return;
  }
  const cod = document.getElementById('fr-cod')?.value?.trim() || `F${String(STATE.frentesServico.length + 1).padStart(2, '0')}`;
  STATE.frentesServico.push({
    id: makeId('fr'),
    cod,
    nome,
    realizado: readNumeroCampo('fr-realizado'),
    criadoEm: new Date().toISOString()
  });
  ['fr-cod','fr-nome','fr-realizado'].forEach(id => { const el = document.getElementById(id); if (el) el.value = id === 'fr-realizado' ? '0' : ''; });
  saveState();
  frentesServicoRender();
  toast('Frente de serviço cadastrada.', 'success');
}

function frentesAutoCriar() {
  normalizeState();
  const existentes = new Set(STATE.frentesServico.map(f => textoChave(f.nome)));
  const capitulos = [...new Set(STATE.orcamento.map(it => it.capitulo || it.cat || 'Serviços'))].filter(Boolean);
  let count = 0;
  capitulos.forEach((cap, idx) => {
    if (existentes.has(textoChave(cap))) return;
    STATE.frentesServico.push({ id:makeId('fr'), cod:`F${String(STATE.frentesServico.length + 1).padStart(2, '0')}`, nome:cap, realizado:0, criadoEm:new Date().toISOString() });
    count++;
  });
  saveState();
  frentesServicoRender();
  toast(`${count} frentes criadas por capítulo.`, count ? 'success' : 'info');
}

function frentePlanejado(frenteId) {
  return STATE.orcamento.filter(it => it.frenteId === frenteId).reduce((s, it) => s + itemValor(it), 0);
}

function frenteVincularItem(itemId, frenteId) {
  const item = STATE.orcamento.find(it => it.id === itemId);
  if (!item) return;
  item.frenteId = frenteId || '';
  saveState();
  frentesServicoRender();
}

function frenteRemover(id) {
  STATE.frentesServico = STATE.frentesServico.filter(f => f.id !== id);
  STATE.orcamento.forEach(it => { if (it.frenteId === id) it.frenteId = ''; });
  saveState();
  frentesServicoRender();
}

function frentesServicoRender() {
  const lista = document.getElementById('fr-lista');
  const itens = document.getElementById('fr-itens');
  if (!lista && !itens) return;
  normalizeState();
  const fronts = STATE.frentesServico;
  const vinculados = STATE.orcamento.filter(it => it.frenteId).length;
  const valorVinculado = STATE.orcamento.filter(it => it.frenteId).reduce((s, it) => s + itemValor(it), 0);
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('fr-kpi-count', fronts.length);
  setText('fr-kpi-itens', vinculados);
  setText('fr-kpi-valor', fmtMoeda(valorVinculado));
  setText('fr-kpi-pendente', Math.max(0, STATE.orcamento.length - vinculados));

  if (lista) {
    if (!fronts.length) {
      lista.innerHTML = '<tr><td colspan="6" class="empty-state" style="padding:24px">Nenhuma frente cadastrada.</td></tr>';
    } else {
      lista.innerHTML = fronts.map(f => {
        const planejado = frentePlanejado(f.id);
        const realizado = Number(f.realizado) || 0;
        const pct = planejado > 0 ? Math.min(999, realizado / planejado * 100) : 0;
        const status = planejado > 0 ? `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : 'Sem itens';
        return `<tr>
          <td class="td-mono">${escapeHtml(f.cod)}</td>
          <td>${escapeHtml(f.nome)}</td>
          <td>${fmtMoeda(planejado)}</td>
          <td><input class="table-input num" value="${Number(f.realizado || 0)}" onchange="frenteAtualizarRealizado('${escapeHtml(f.id)}', this.value)"/></td>
          <td><span class="badge ${pct > 100 ? 'badge-warn' : 'badge-ok'}">${escapeHtml(status)}</span></td>
          <td><button class="btn btn-outline btn-sm" onclick="frenteRemover('${escapeHtml(f.id)}')">Remover</button></td>
        </tr>`;
      }).join('');
    }
  }

  if (itens) {
    if (!STATE.orcamento.length) {
      itens.innerHTML = '<tr><td colspan="4" class="empty-state" style="padding:24px">Importe ou elabore um orçamento para vincular itens.</td></tr>';
    } else {
      const options = `<option value="">Sem frente</option>${fronts.map(f => `<option value="${f.id}">${escapeHtml(f.cod)} - ${escapeHtml(f.nome)}</option>`).join('')}`;
      itens.innerHTML = STATE.orcamento.map((it, idx) => `
        <tr>
          <td class="td-mono">${idx + 1}</td>
          <td>${escapeHtml((it.desc || '').slice(0, 90))}</td>
          <td>${fmtMoeda(itemValor(it))}</td>
          <td><select class="form-select" onchange="frenteVincularItem('${escapeHtml(it.id)}', this.value)">${options.replace(`value="${it.frenteId || ''}"`, `value="${it.frenteId || ''}" selected`)}</select></td>
        </tr>
      `).join('');
    }
  }
}

function frenteAtualizarRealizado(id, value) {
  const f = STATE.frentesServico.find(x => x.id === id);
  if (!f) return;
  f.realizado = parseNumeroBR(value);
  saveState();
  frentesServicoRender();
}

function frentesRows() {
  const rows = [
    ['FRENTES DE SERVIÇO - TLPlanly'],
    [`Emitido em ${new Date().toLocaleString('pt-BR')}`],
    [],
    ['Código','Frente','Planejado','Realizado','Itens vinculados']
  ];
  STATE.frentesServico.forEach(f => rows.push([
    f.cod,
    f.nome,
    valorMoeda(frentePlanejado(f.id)),
    valorMoeda(f.realizado || 0),
    STATE.orcamento.filter(it => it.frenteId === f.id).length
  ]));
  rows.push([], ['Item','Descrição','Total sem BDI','Frente']);
  STATE.orcamento.forEach((it, idx) => {
    const f = STATE.frentesServico.find(x => x.id === it.frenteId);
    rows.push([idx + 1, it.desc, valorMoeda(itemValor(it)), f ? `${f.cod} - ${f.nome}` : 'Sem frente']);
  });
  return rows;
}

function frentesExportarExcel() {
  exportRowsToExcel('frentes_servico_TLPlanly', [{ name:'Frentes', rows:frentesRows() }]);
}

function frentesExportarPDF() {
  exportHtmlToPDF('Frentes de Serviço - TLPlanly', rowsToHtmlTable(frentesRows()), 'frentes_servico_TLPlanly');
}

function exportarDashboardHTML() {
  normalizeState();
  const sub = orcamentoSubtotalAtual();
  const total = totalComBDI(sub);
  const porCat = {};
  STATE.orcamento.forEach(it => {
    const key = it.cat || it.capitulo || 'Sem categoria';
    porCat[key] = (porCat[key] || 0) + itemValor(it);
  });
  const top = [...STATE.orcamento].map((it, idx) => ({ ...it, idx, total:itemValor(it) })).sort((a, b) => b.total - a.total).slice(0, 15);
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Dashboard TLPlanly</title><style>
    body{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#f5f7fb;color:#172033}
    header{background:#102a43;color:#fff;padding:24px 32px} h1{margin:0;font-size:26px} main{padding:28px;max-width:1180px;margin:auto}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.card{background:#fff;border:1px solid #d9e2ec;border-radius:10px;padding:18px}
    .k{font-size:12px;text-transform:uppercase;color:#63758a;font-weight:700}.v{font-size:26px;font-weight:900;margin-top:6px}.gold{color:#a86400}
    table{width:100%;border-collapse:collapse;background:#fff;margin-top:18px}th,td{border:1px solid #d9e2ec;padding:9px;text-align:left;font-size:13px}th{background:#e7eef7}
    .bar{height:10px;background:#f5a623;border-radius:999px}
  </style></head><body><header><h1>Dashboard TLPlanly</h1><p>${escapeHtml(document.getElementById('orcNome')?.value || 'Orçamento ativo')} · ${new Date().toLocaleString('pt-BR')}</p></header><main>
    <section class="grid">
      <div class="card"><div class="k">Itens</div><div class="v">${STATE.orcamento.length}</div></div>
      <div class="card"><div class="k">Subtotal</div><div class="v">${fmtMoeda(sub)}</div></div>
      <div class="card"><div class="k">BDI</div><div class="v gold">${bdiText('N/C')}</div></div>
      <div class="card"><div class="k">Total com BDI</div><div class="v">${fmtMoeda(total)}</div></div>
    </section>
    <h2>Distribuição por categoria</h2>
    <table><tr><th>Categoria</th><th>Total</th><th>Participação</th></tr>${Object.entries(porCat).sort((a,b)=>b[1]-a[1]).map(([cat,val]) => `<tr><td>${escapeHtml(cat)}</td><td>${fmtMoeda(val)}</td><td><div class="bar" style="width:${Math.max(2, total ? val / sub * 100 : 0)}%"></div></td></tr>`).join('')}</table>
    <h2>Top itens de custo</h2>
    <table><tr><th>#</th><th>Código</th><th>Descrição</th><th>Total</th></tr>${top.map((it, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(it.cod)}</td><td>${escapeHtml(it.desc)}</td><td>${fmtMoeda(it.total)}</td></tr>`).join('')}</table>
  </main></body></html>`;
  downloadText(html, `${safeFileName(document.getElementById('orcNome')?.value || 'dashboard')}_dashboard_TLPlanly.html`, 'text/html');
  toast('Dashboard HTML exportado.', 'success');
}

function planejamentoGerarDoOrcamento() {
  normalizeState();
  if (!STATE.orcamento.length) { toast('Adicione itens ao orçamento antes de gerar o planejamento.', 'error'); return; }
  const inicio = document.getElementById('plan-ini')?.value || todayIso();
  let cursor = inicio;
  STATE.planejamento = STATE.orcamento.map((it, idx) => {
    const dur = Math.max(1, Math.min(20, Math.ceil((Number(it.qtd) || 1) / 10)));
    const ini = idx === 0 ? cursor : addDaysIso(cursor, 1);
    const fim = addDaysIso(ini, dur - 1);
    cursor = fim;
    return {
      id: makeId('plan'),
      code: 'T' + (idx + 1),
      itemId: it.id,
      desc: it.desc,
      inicio: ini,
      fim,
      deps: idx > 0 ? ['T' + idx] : [],
      produtividade: 0,
      progresso: 0
    };
  });
  saveState();
  planejamentoRender();
  toast('Planejamento gerado a partir do orçamento.', 'success');
}

function planejamentoAdicionarTarefa() {
  const desc = document.getElementById('plan-desc')?.value?.trim();
  if (!desc) { toast('Informe a descrição da tarefa.', 'error'); return; }
  const code = 'T' + (STATE.planejamento.length + 1);
  const inicio = document.getElementById('plan-ini')?.value || todayIso();
  const fim = document.getElementById('plan-fim')?.value || inicio;
  STATE.planejamento.push({
    id: makeId('plan'),
    code,
    itemId: document.getElementById('plan-item')?.value || '',
    desc,
    inicio,
    fim,
    deps: (document.getElementById('plan-deps')?.value || '').split(',').map(s => s.trim()).filter(Boolean),
    produtividade: parseFloat(document.getElementById('plan-prod')?.value) || 0,
    progresso: Math.max(0, Math.min(100, parseFloat(document.getElementById('plan-prog')?.value) || 0))
  });
  saveState();
  planejamentoRender();
  toast('Tarefa adicionada ao planejamento.', 'success');
}

function planejamentoRemover(id) {
  STATE.planejamento = STATE.planejamento.filter(t => t.id !== id);
  saveState();
  planejamentoRender();
}

function planejamentoCriticos() {
  const byCode = Object.fromEntries(STATE.planejamento.map(t => [t.code, t]));
  const memo = {};
  const dur = t => daysBetween(t.inicio, t.fim);
  const score = t => {
    if (!t) return 0;
    if (memo[t.code]) return memo[t.code];
    const depScore = (t.deps || []).reduce((m, d) => Math.max(m, score(byCode[d])), 0);
    memo[t.code] = depScore + dur(t);
    return memo[t.code];
  };
  let endTask = null, maxScore = 0;
  STATE.planejamento.forEach(t => {
    const s = score(t);
    if (s > maxScore) { maxScore = s; endTask = t; }
  });
  const critical = new Set();
  while (endTask) {
    critical.add(endTask.code);
    const deps = endTask.deps || [];
    endTask = deps.map(d => byCode[d]).filter(Boolean).sort((a,b) => score(b) - score(a))[0];
  }
  return critical;
}

function planejamentoRender() {
  normalizeState();
  preencherSelectsOperacionais();
  const tb = document.getElementById('plan-tabela');
  if (!tb) return;
  const tasks = STATE.planejamento;
  const critical = planejamentoCriticos();
  const totalValor = tasks.reduce((s, t) => s + itemValor(getItemById(t.itemId)), 0);
  const minDate = tasks.length ? tasks.map(t => t.inicio).sort()[0] : todayIso();
  const maxDate = tasks.length ? tasks.map(t => t.fim).sort().slice(-1)[0] : minDate;
  const totalDias = tasks.length ? daysBetween(minDate, maxDate) : 0;

  document.getElementById('plan-kpi-tarefas').textContent = tasks.length;
  document.getElementById('plan-kpi-dias').textContent = totalDias;
  document.getElementById('plan-kpi-critico').textContent = critical.size;
  document.getElementById('plan-kpi-valor').textContent = fmtMoeda(totalValor);

  if (!tasks.length) {
    tb.innerHTML = '<tr><td colspan="10" style="padding:28px;text-align:center;color:var(--text3)">Gere tarefas a partir do orçamento ou adicione uma tarefa manual.</td></tr>';
    document.getElementById('plan-gantt').innerHTML = '<div class="empty-state" style="padding:24px">Sem tarefas planejadas.</div>';
    renderCurvaS([]);
    return;
  }

  tb.innerHTML = tasks.map(t => {
    const item = getItemById(t.itemId);
    const prog = Math.max(0, Math.min(100, Number(t.progresso) || 0));
    return `<tr>
      <td class="td-mono">${t.code}</td>
      <td>${escapeHtml(t.desc)}</td>
      <td>${escapeHtml(itemLabel(item))}</td>
      <td>${t.inicio}</td>
      <td>${t.fim}</td>
      <td>${daysBetween(t.inicio, t.fim)}</td>
      <td>${(t.deps || []).join(', ') || '—'}</td>
      <td>${fmtMoeda(itemValor(item))}</td>
      <td><div class="progress-bar"><div class="progress-fill" style="width:${prog}%;background:var(--green)"></div></div>${prog}%</td>
      <td><button class="btn btn-danger btn-sm" onclick="planejamentoRemover('${t.id}')">×</button></td>
    </tr>`;
  }).join('');

  const range = Math.max(1, daysBetween(minDate, maxDate));
  document.getElementById('plan-gantt').innerHTML = tasks.map(t => {
    const left = Math.max(0, (daysBetween(minDate, t.inicio) - 1) / range * 100);
    const width = Math.max(3, daysBetween(t.inicio, t.fim) / range * 100);
    const prog = Math.max(0, Math.min(100, Number(t.progresso) || 0));
    return `<div class="gantt-row">
      <div class="gantt-label" title="${escapeHtml(t.desc)}">${t.code} · ${escapeHtml(t.desc)}</div>
      <div class="gantt-track"><div class="gantt-bar ${critical.has(t.code) ? 'critical' : ''}" style="left:${left}%;width:${width}%"><div class="gantt-progress" style="width:${prog}%"></div></div></div>
    </div>`;
  }).join('');
  renderCurvaS(tasks);
}

function renderCurvaS(tasks) {
  const canvas = document.getElementById('chartCurvaS');
  if (!canvas || !window.Chart) return;
  if (STATE.charts.curvaS) STATE.charts.curvaS.destroy();
  const ordered = [...tasks].sort((a,b) => a.fim.localeCompare(b.fim));
  let acum = 0;
  const labels = ordered.map(t => t.fim);
  const data = ordered.map(t => {
    acum += itemValor(getItemById(t.itemId));
    return acum;
  });
  STATE.charts.curvaS = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ label:'Valor planejado acumulado', data, borderColor:getCSSVar('--gold'), backgroundColor:'rgba(245,166,35,.12)', tension:.3, fill:true }] },
    options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:v=>fmtMilhar(v)}}} }
  });
}

function planejamentoExportar() {
  planejamentoExportarExcel();
}

function planejamentoRows() {
  const lines = ['# Planejamento TLPlanly', '', '| ID | Tarefa | Início | Fim | Dependências | Progresso |', '|---|---|---:|---:|---|---:|'];
  STATE.planejamento.forEach(t => lines.push(`| ${t.code} | ${mdCell(t.desc)} | ${t.inicio} | ${t.fim} | ${(t.deps || []).join(', ') || '-'} | ${t.progresso || 0}% |`));
  return markdownToRows(lines.join('\n'));
}

function planejamentoExportarExcel() {
  exportRowsToExcel('planejamento_tlplanly', [{ name:'Planejamento', rows: planejamentoRows() }]);
}

function planejamentoExportarPDF() {
  exportHtmlToPDF('Planejamento Físico-Financeiro - TLPlanly', rowsToHtmlTable(planejamentoRows()), 'planejamento_tlplanly');
}

function medicoesCriarPeriodo() {
  const nome = document.getElementById('med-periodo')?.value?.trim() || `Medição ${STATE.medicoes.length + 1}`;
  const data = document.getElementById('med-data')?.value || todayIso();
  const med = { id: makeId('med'), nome, data, itens: {} };
  STATE.medicoes.push(med);
  saveState();
  medicoesRender(med.id);
  toast('Período de medição criado.', 'success');
}

function medicoesSelectAtivo(forcedId) {
  return forcedId || document.getElementById('med-select')?.value || STATE.medicoes[0]?.id || '';
}

function medicoesSalvarAtual() {
  const id = medicoesSelectAtivo();
  const med = STATE.medicoes.find(m => m.id === id);
  if (!med) { toast('Crie um período de medição primeiro.', 'error'); return; }
  STATE.orcamento.forEach(it => {
    med.itens[it.id] = parseFloat(document.getElementById('med-qtd-' + it.id)?.value) || 0;
  });
  saveState();
  medicoesRender(id);
  toast('Medição salva.', 'success');
}

function medicoesRemoverAtual() {
  const id = medicoesSelectAtivo();
  if (!id) { toast('Nenhum período selecionado.', 'error'); return; }
  if (!confirm('Remover o período de medição selecionado?')) return;
  STATE.medicoes = STATE.medicoes.filter(m => m.id !== id);
  saveState();
  medicoesRender();
  toast('Período de medição removido.', 'info');
}

function medicoesAcumulado(itemId) {
  return STATE.medicoes.reduce((s, m) => s + (Number(m.itens?.[itemId]) || 0), 0);
}

function medicoesRender(forcedId) {
  normalizeState();
  const sel = document.getElementById('med-select');
  if (!sel) return;
  sel.innerHTML = STATE.medicoes.map(m => `<option value="${m.id}">${escapeHtml(m.nome)} · ${m.data}</option>`).join('');
  const activeId = medicoesSelectAtivo(forcedId);
  if (activeId) sel.value = activeId;
  const med = STATE.medicoes.find(m => m.id === activeId);
  const tb = document.getElementById('med-tabela');

  if (!STATE.orcamento.length) {
    tb.innerHTML = '<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--text3)">Adicione itens ao orçamento para medir execução.</td></tr>';
    return;
  }
  if (!med) {
    tb.innerHTML = '<tr><td colspan="7" style="padding:28px;text-align:center;color:var(--text3)">Crie um período de medição.</td></tr>';
  } else {
    tb.innerHTML = STATE.orcamento.map(it => {
      const exec = Number(med.itens?.[it.id]) || 0;
      const acumulado = medicoesAcumulado(it.id);
      const saldo = (Number(it.qtd) || 0) - acumulado;
      const excedido = acumulado > (Number(it.qtd) || 0);
      return `<tr>
        <td class="td-mono">${it.cod}</td>
        <td>${escapeHtml(it.desc)}</td>
        <td>${fmtNum(it.qtd)} ${it.unid}</td>
        <td><input id="med-qtd-${it.id}" class="form-input" type="number" step="0.001" value="${exec}" style="max-width:120px"/></td>
        <td>${fmtNum(saldo)} ${it.unid}</td>
        <td>${fmtMoeda(exec * (Number(it.preco) || 0))}</td>
        <td class="${excedido ? 'status-excedido' : saldo <= 0 ? 'status-ok' : 'status-pendente'}">${excedido ? 'Excedido' : saldo <= 0 ? 'Concluído' : 'Em execução'}</td>
      </tr>`;
    }).join('');
  }

  const totalOrc = STATE.orcamento.reduce((s, it) => s + itemValor(it), 0);
  const totalExec = STATE.orcamento.reduce((s, it) => s + medicoesAcumulado(it.id) * (Number(it.preco) || 0), 0);
  const exced = STATE.orcamento.filter(it => medicoesAcumulado(it.id) > (Number(it.qtd) || 0)).length;
  document.getElementById('med-kpi-periodo').textContent = med ? med.nome.replace(/^Medição\s*/i, '') : '—';
  document.getElementById('med-kpi-exec').textContent = fmtMoeda(totalExec);
  document.getElementById('med-kpi-avanco').textContent = totalOrc ? (totalExec / totalOrc * 100).toFixed(1) + '%' : '0%';
  document.getElementById('med-kpi-exced').textContent = exced;
}

function quantRender() {
  normalizeState();
  preencherSelectsOperacionais();
  quantRenderForm();
  const resumo = document.getElementById('qt-resumo');
  if (!resumo) return;
  const vinculados = Object.entries(STATE.quantitativos).filter(([, linhas]) => linhas?.length);
  resumo.innerHTML = vinculados.length ? `<div class="op-list">${vinculados.map(([itemId, linhas]) => {
    const item = getItemById(itemId);
    const total = linhas.reduce((s, l) => s + (Number(l.resultado) || 0), 0);
    return `<div class="op-row"><div class="op-row-main"><div class="op-title">${escapeHtml(itemLabel(item))}</div><div class="op-meta">${linhas.length} linha(s) de memória</div></div><div class="op-value">${fmtNum(total)}</div></div>`;
  }).join('')}</div>` : '<div class="empty-state" style="padding:24px">Nenhuma memória quantitativa vinculada.</div>';
}

function quantRenderForm() {
  const itemId = document.getElementById('qt-item')?.value;
  const lista = document.getElementById('qt-lista');
  if (!lista) return;
  const linhas = STATE.quantitativos[itemId] || [];
  const total = linhas.reduce((s, l) => s + (Number(l.resultado) || 0), 0);
  document.getElementById('qt-total').textContent = fmtNum(total);
  lista.innerHTML = linhas.length ? `<div class="op-list">${linhas.map(l => `<div class="op-row">
    <div class="op-row-main"><div class="op-title">${escapeHtml(l.desc)}</div><div class="op-meta"><span class="formula-chip">${escapeHtml(l.formula)}</span></div></div>
    <div class="op-value">${fmtNum(l.resultado)}</div>
    <button class="btn btn-danger btn-sm" onclick="quantRemoverLinha('${itemId}','${l.id}')">×</button>
  </div>`).join('')}</div>` : '<div class="empty-state" style="padding:24px">Nenhuma linha para este serviço.</div>';
}

function calcFormulaSegura(formula) {
  const expr = String(formula || '').replace(/,/g, '.');
  if (!/^[\d\s+\-*/().]+$/.test(expr)) throw new Error('Use apenas números e operadores + - * / ( ).');
  const result = Function('"use strict";return (' + expr + ')')();
  if (!Number.isFinite(result)) throw new Error('Resultado inválido.');
  return result;
}

function quantAdicionarLinha() {
  const itemId = document.getElementById('qt-item')?.value;
  if (!itemId) { toast('Selecione um serviço.', 'error'); return; }
  const desc = document.getElementById('qt-desc')?.value?.trim() || 'Linha de quantitativo';
  const formula = document.getElementById('qt-formula')?.value?.trim();
  if (!formula) { toast('Informe a fórmula.', 'error'); return; }
  try {
    const resultado = calcFormulaSegura(formula);
    if (!STATE.quantitativos[itemId]) STATE.quantitativos[itemId] = [];
    STATE.quantitativos[itemId].push({ id: makeId('qt'), desc, formula, resultado });
    saveState();
    quantRender();
    document.getElementById('qt-desc').value = '';
    document.getElementById('qt-formula').value = '';
  } catch(err) {
    toast(err.message, 'error');
  }
}

function quantRemoverLinha(itemId, lineId) {
  STATE.quantitativos[itemId] = (STATE.quantitativos[itemId] || []).filter(l => l.id !== lineId);
  saveState();
  quantRender();
}

function quantAplicarNoOrcamento() {
  const itemId = document.getElementById('qt-item')?.value;
  const item = getItemById(itemId);
  if (!item) return;
  const total = (STATE.quantitativos[itemId] || []).reduce((s, l) => s + (Number(l.resultado) || 0), 0);
  item.qtd = total;
  saveState();
  renderElaborar();
  renderDashboard();
  quantRender();
  toast('Quantidade aplicada ao item do orçamento.', 'success');
}

let DOCS_CENTRAL_FILES = [];

function docsCentralFileSelect(e) {
  docsCentralSetFiles(Array.from(e.target.files || []));
  e.target.value = '';
}

function docsCentralDrop(e) {
  e.preventDefault();
  document.getElementById('docCentralUploadZone')?.classList.remove('dragover');
  docsCentralSetFiles(Array.from(e.dataTransfer?.files || []));
}

function docsCentralSetFiles(files) {
  const validos = files.filter(f => IMPORT_EXTS.includes(getFileExt(f)));
  if (!validos.length) { toast('Selecione documentos em PDF, imagem, Excel ou CSV.', 'error'); return; }
  if (validos.length !== files.length) toast('Alguns arquivos foram ignorados por formato não suportado.', 'info');
  DOCS_CENTRAL_FILES = validos;
  docsCentralRenderFiles();
}

function docsCentralRenderFiles() {
  const el = document.getElementById('docs-central-file-chip');
  if (!el) return;
  if (!DOCS_CENTRAL_FILES.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${DOCS_CENTRAL_FILES.map((f, idx) => `<div class="file-chip">${getImportFileIcon(f)} <span>${escapeHtml(f.name)}</span> <span style="color:var(--text3)">(${(f.size/1024).toFixed(0)} KB)</span> <span class="chip-remove" onclick="docsCentralRemoverArquivo(${idx})">×</span></div>`).join('')}
    </div>
    <small style="display:block;margin-top:4px;color:var(--text3)">${DOCS_CENTRAL_FILES.length} arquivo(s) prontos para análise. O OCR entra automaticamente quando necessário.</small>`;
}

function docsCentralRemoverArquivo(idx) {
  DOCS_CENTRAL_FILES.splice(idx, 1);
  docsCentralRenderFiles();
}

async function docsCentralAnalisar() {
  if (!DOCS_CENTRAL_FILES.length) { toast('Selecione um lote de documentos primeiro.', 'error'); return; }
  ANALISADOR.files = [...DOCS_CENTRAL_FILES];
  DOCS_CENTRAL_FILES = [];
  docsCentralRenderFiles();
  analisadorRenderFiles();
  showView('analisador');
  await analisadorProcessar();
}

function docsAbrirUltimaRevisao() {
  normalizeState();
  const revisao = [...STATE.extracoes].find(e => e.status === 'pendente') || STATE.extracoes[0];
  if (!revisao) { toast('Nenhuma extração disponível para revisão.', 'info'); return; }
  docsAbrirRevisao(revisao.id);
}

function docsAbrirRevisao(id) {
  const ext = STATE.extracoes.find(e => e.id === id);
  if (!ext) return;
  if (ext.tipo === 'importacao') docsAbrirImportacao(id);
  else docsAbrirAnalise(id);
}

function docsAbrirAnalise(id) {
  const ext = STATE.extracoes.find(e => e.id === id);
  if (!ext) return;
  ANALISADOR = {
    files: [],
    docs: (ext.docs || []).map(d => ({ ...d, text:d.textPreview || '', items:[] })),
    services: (ext.services || []).map(s => ({ ...s })),
    escopo: ext.escopo || [],
    especificacoes: ext.especificacoes || [],
    memoria: ext.memoria || '',
    audit: ext.audit || certificarItensExtraidosLocal(ext.services || [], { modo: 'estimativa', maxRodadas: 1 }).relatorio,
    extracaoId: ext.id
  };
  showView('analisador');
  analisadorRenderFiles();
  analisadorRender();
  toast('Revisão carregada. Valide os itens antes de enviar ao orçamento.', 'info');
}

function docsAbrirImportacao(id) {
  const ext = STATE.extracoes.find(e => e.id === id);
  if (!ext) return;
  IMP.files = [];
  IMP.file = null;
  IMP.rawItems = ext.items || [];
  IMP.reviewed = (ext.reviewed || ext.items || []).map(r => ({ ...r }));
  IMP.importResults = ext.docs || [];
  IMP.markdown = ext.memoria || gerarMemoriaImportacao(IMP.importResults);
  IMP.audit = ext.audit || certificarItensExtraidosLocal(IMP.reviewed, { modo: 'planilha', maxRodadas: 1 }).relatorio;
  IMP.extracaoId = ext.id;
  IMP.origemRapida = 'elaborar';
  showView('importar');
  mostrarRevisao();
  toast('Revisão de importação carregada. Confirme antes de enviar ao orçamento.', 'info');
}

function docsAdicionar() {
  const targetId = document.getElementById('doc-item')?.value || 'obra';
  const titulo = document.getElementById('doc-titulo')?.value?.trim();
  if (!titulo) { toast('Informe o título do anexo/especificação.', 'error'); return; }
  const files = Array.from(document.getElementById('doc-files')?.files || []).map(f => ({ name:f.name, size:f.size, type:f.type }));
  STATE.documentos.push({
    id: makeId('doc'),
    targetId,
    tipo: document.getElementById('doc-tipo')?.value || 'Outro',
    titulo,
    texto: document.getElementById('doc-texto')?.value || '',
    files,
    origem: 'manual',
    status: 'manual',
    criadoEm: new Date().toLocaleString('pt-BR')
  });
  saveState();
  docsRender();
  document.getElementById('doc-titulo').value = '';
  document.getElementById('doc-texto').value = '';
  document.getElementById('doc-files').value = '';
  toast('Anexo/especificação registrado.', 'success');
}

function docsRender() {
  normalizeState();
  preencherSelectsOperacionais();
  docsRenderKpis();
  docsRenderExtracoes();
  const el = document.getElementById('docs-lista');
  if (!el) return;
  el.innerHTML = STATE.documentos.length ? `<div class="op-list">${STATE.documentos.map(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    const status = d.status || (d.origem === 'manual' ? 'manual' : 'pendente');
    const statusLabel = status === 'enviado' ? 'Enviado ao orçamento' : status === 'manual' ? 'Manual' : 'Aguardando revisão';
    const statusClass = status === 'enviado' ? 'doc-status-enviado' : status === 'manual' ? 'doc-status-manual' : 'doc-status-pendente';
    const origem = d.origem === 'analisador' ? 'Analisador' : d.origem === 'importacao' ? 'Importação' : 'Registro manual';
    return `<div class="op-row">
      <div class="op-row-main">
        <div class="op-title">${escapeHtml(d.titulo)}</div>
        <div class="op-meta">${escapeHtml(d.tipo)} · ${escapeHtml(origem)} · ${d.criadoEm || '—'} · ${d.targetId === 'obra' ? 'Obra / Geral' : escapeHtml(itemLabel(item))}</div>
        ${d.metodo ? `<div class="op-meta">Método: ${escapeHtml(d.metodo)}${d.confianca ? ` · Confiança: ${d.confianca}%` : ''}${d.itensExtraidos !== undefined ? ` · ${d.itensExtraidos} item(ns) explícito(s)` : ''}</div>` : ''}
        ${d.texto ? `<div class="doc-preview">${escapeHtml(d.texto)}</div>` : ''}
        ${d.files?.length ? `<div class="op-meta" style="margin-top:6px">Arquivos: ${d.files.map(f => escapeHtml(f.name)).join(', ')}</div>` : ''}
      </div>
      <div class="doc-card-actions">
        <span class="doc-status ${statusClass}">${statusLabel}</span>
        ${d.extracaoId ? `<button class="btn btn-outline btn-sm" onclick="docsAbrirRevisao('${d.extracaoId}')">Revisar</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="docsRemover('${d.id}')">×</button>
      </div>
    </div>`;
  }).join('')}</div>` : '<div class="empty-state" style="padding:24px">Nenhum anexo ou especificação registrado.</div>';
}

function docsRenderKpis() {
  const docs = STATE.documentos || [];
  const ext = STATE.extracoes || [];
  setText('docs-kpi-total', docs.length);
  setText('docs-kpi-lotes', ext.length);
  setText('docs-kpi-ocr', docs.filter(d => /ocr/i.test(d.metodo || '')).length);
  setText('docs-kpi-pend', ext.filter(e => e.status === 'pendente').length);
}

function docsRenderExtracoes() {
  const el = document.getElementById('docs-extracoes-lista');
  if (!el) return;
  const extracoes = STATE.extracoes || [];
  if (!extracoes.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px">Nenhuma extração registrada. Selecione um lote ou importe uma planilha/PDF.</div>';
    return;
  }
  el.innerHTML = `<div class="op-list">${extracoes.map(e => {
    const statusClass = e.status === 'enviado' ? 'doc-status-enviado' : 'doc-status-pendente';
    const statusLabel = e.status === 'enviado' ? 'Enviado ao orçamento' : 'Aguardando revisão';
    const total = e.tipo === 'importacao' ? (e.reviewed?.length || e.items?.length || 0) : (e.services?.length || 0);
    const selected = e.tipo === 'importacao'
      ? (e.reviewed || []).filter(i => i.selecionado !== false).length
      : (e.services || []).filter(i => i.selecionado !== false).length;
    return `<div class="op-row">
      <div class="op-row-main">
        <div class="op-title">${escapeHtml(e.titulo || 'Extração de documentos')}</div>
        <div class="op-meta">${escapeHtml(e.tipo === 'importacao' ? 'Importação de planilha/PDF' : 'Análise de documentos')} · ${escapeHtml(e.criadoEm || '—')} · ${e.docs?.length || 0} documento(s)</div>
        <div class="op-meta">${selected}/${total} item(ns) selecionado(s) para revisão · ${e.enviadoEm ? 'Enviado em ' + escapeHtml(e.enviadoEm) : 'não enviado'}</div>
      </div>
      <div class="doc-card-actions">
        <span class="doc-status ${statusClass}">${statusLabel}</span>
        <button class="btn btn-outline btn-sm" onclick="docsAbrirRevisao('${e.id}')">Abrir revisão</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function docsRemover(id) {
  STATE.documentos = STATE.documentos.filter(d => d.id !== id);
  saveState();
  docsRender();
}

function docsExportarDossie() {
  docsExportarDossieExcel();
}

function docsDossieMarkdown() {
  const lines = ['# Dossiê Técnico TLPlanly', '', `Gerado em: ${new Date().toLocaleString('pt-BR')}`, ''];
  STATE.documentos.forEach(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    lines.push(`## ${d.titulo}`, '', `- Tipo: ${d.tipo}`, `- Vínculo: ${d.targetId === 'obra' ? 'Obra / Geral' : itemLabel(item)}`, `- Criado em: ${d.criadoEm}`, '');
    if (d.texto) lines.push(d.texto, '');
    if (d.files?.length) lines.push('Arquivos: ' + d.files.map(f => f.name).join(', '), '');
  });
  lines.push('', '## Revisões e extrações', '');
  (STATE.extracoes || []).forEach(e => {
    lines.push(`### ${e.titulo || 'Extração'}`, '', `- Tipo: ${e.tipo}`, `- Status: ${e.status}`, `- Criado em: ${e.criadoEm}`, `- Documentos: ${e.docs?.length || 0}`, `- Itens/serviços: ${(e.reviewed || e.services || e.items || []).length}`, '');
  });
  return lines.join('\n');
}

function docsExportarDossieExcel() {
  const docsRows = [['Tipo','Título','Vínculo','Texto/Observação','Arquivos','Criado em']];
  STATE.documentos.forEach(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    docsRows.push([d.tipo, d.titulo, d.targetId === 'obra' ? 'Obra / Geral' : itemLabel(item), d.texto || '', (d.files || []).map(f => f.name).join(', '), d.criadoEm]);
  });
  const extrRows = [['Título','Tipo','Status','Criado em','Documentos','Itens/Serviços']];
  (STATE.extracoes || []).forEach(e => {
    extrRows.push([e.titulo || 'Extração', e.tipo, e.status, e.criadoEm, e.docs?.length || 0, (e.reviewed || e.services || e.items || []).length]);
  });
  exportRowsToExcel('dossie_tecnico_tlplanly', [
    { name:'Documentos', rows: docsRows },
    { name:'Extrações', rows: extrRows }
  ]);
}

function docsExportarDossiePDF() {
  exportMarkdownToPDF(docsDossieMarkdown(), 'Dossiê Técnico - TLPlanly', 'dossie_tecnico_tlplanly');
}

function docsCompactDoc(doc) {
  return {
    id: doc.id || makeId('docmeta'),
    fileName: doc.fileName || doc.name || 'Documento da obra',
    name: doc.fileName || doc.name || 'Documento da obra',
    size: doc.size || 0,
    ext: doc.ext || '',
    metodo: doc.metodo || '',
    tipo: doc.tipo || 'Documento Técnico',
    confianca: doc.confianca || 0,
    itemsCount: doc.items?.length || doc.itemsCount || 0,
    textPreview: String(doc.text || doc.rawText || '').slice(0, 1400)
  };
}

function docsCompactItems(list, max = 500) {
  return (list || []).slice(0, max).map(i => ({
    selecionado: i.selecionado !== false,
    cod: i.cod || i.sugestao || '',
    sugestao: i.sugestao || '',
    desc: i.desc || '',
    unid: i.unid || i.refUnid || 'UN',
    qtd: Number(i.qtd) || 1,
    preco: Number(i.preco) || 0,
    ref: Number(i.ref || i.refSinapi) || 0,
    refSinapi: Number(i.refSinapi || i.ref) || 0,
    refDesc: i.refDesc || '',
    refUnid: i.refUnid || '',
    matchTipo: i.matchTipo || 'nenhum',
    cat: i.cat || 'Serviços',
    origemArquivo: i.origemArquivo || '',
    origemMetodo: i.origemMetodo || '',
    metodo: i.metodo || '',
    composicao: i.composicao || [],
    pendencias: i.pendencias || [],
    confidence: Number(i.confidence || i.confianca) || 0,
    certStatus: i.certStatus || '',
    certScore: Number(i.certScore) || 0,
    certMotivos: i.certMotivos || [],
    certCorrecoes: i.certCorrecoes || [],
    totalLinha: Number(i.totalLinha) || 0,
    linhaOrigem: i.linhaOrigem || '',
    numerosOrigem: i.numerosOrigem || []
  }));
}

function docsUpsertDocumentoFromMeta(meta, origem, extracaoId, status = 'pendente') {
  const key = `${origem}:${meta.fileName || meta.name}:${meta.size || 0}`;
  const idx = STATE.documentos.findIndex(d => d.docKey === key);
  const doc = {
    id: idx >= 0 ? STATE.documentos[idx].id : makeId('doc'),
    docKey: key,
    targetId: 'obra',
    tipo: meta.tipo || 'Documento Técnico',
    titulo: meta.fileName || meta.name || 'Documento da obra',
    texto: meta.textPreview || '',
    files: [{ name: meta.fileName || meta.name || 'arquivo', size: meta.size || 0, type: meta.ext || '' }],
    origem,
    status,
    metodo: meta.metodo || '',
    confianca: meta.confianca || 0,
    itensExtraidos: meta.itemsCount || 0,
    extracaoId,
    criadoEm: idx >= 0 ? STATE.documentos[idx].criadoEm : new Date().toLocaleString('pt-BR')
  };
  if (idx >= 0) STATE.documentos[idx] = { ...STATE.documentos[idx], ...doc };
  else STATE.documentos.unshift(doc);
}

function docsPersistirExtracao(payload) {
  normalizeState();
  const currentId = payload.id || makeId('ext');
  const record = {
    id: currentId,
    tipo: payload.tipo || 'analisador',
    titulo: payload.titulo || 'Extração de documentos',
    status: payload.status || 'pendente',
    criadoEm: payload.criadoEm || new Date().toLocaleString('pt-BR'),
    enviadoEm: payload.enviadoEm || '',
    docs: payload.docs || [],
    services: docsCompactItems(payload.services || []),
    items: docsCompactItems(payload.items || []),
    reviewed: docsCompactItems(payload.reviewed || []),
    audit: payload.audit || null,
    escopo: payload.escopo || [],
    especificacoes: payload.especificacoes || [],
    memoria: String(payload.memoria || '').slice(0, 12000)
  };
  const idx = STATE.extracoes.findIndex(e => e.id === currentId);
  if (idx >= 0) STATE.extracoes[idx] = { ...STATE.extracoes[idx], ...record };
  else STATE.extracoes.unshift(record);
  STATE.extracoes = STATE.extracoes.slice(0, 20);
  record.docs.forEach(d => docsUpsertDocumentoFromMeta(d, record.tipo === 'importacao' ? 'importacao' : 'analisador', record.id, record.status));
  saveState();
  docsRender();
  return record.id;
}

function docsMarcarExtracaoEnviada(id, servicesOrItems) {
  const ext = STATE.extracoes.find(e => e.id === id);
  if (!ext) return;
  ext.status = 'enviado';
  ext.enviadoEm = new Date().toLocaleString('pt-BR');
  if (ext.tipo === 'importacao') ext.reviewed = docsCompactItems(servicesOrItems || ext.reviewed || ext.items || []);
  else ext.services = docsCompactItems(servicesOrItems || ext.services || []);
  STATE.documentos.forEach(d => { if (d.extracaoId === id) d.status = 'enviado'; });
}

function backupPayload() {
  return {
    orcamento: STATE.orcamento,
    planejamento: STATE.planejamento,
    medicoes: STATE.medicoes,
    quantitativos: STATE.quantitativos,
    documentos: STATE.documentos,
    extracoes: STATE.extracoes,
    gruposCusto: STATE.gruposCusto,
    insumosImportados: STATE.insumosImportados,
    insumosManuais: STATE.insumosManuais,
    cpuBiblioteca: STATE.cpuBiblioteca,
    equipamentosHorarios: STATE.equipamentosHorarios,
    maoObraHoraria: STATE.maoObraHoraria,
    cotacoesCustos: STATE.cotacoesCustos,
    frentesServico: STATE.frentesServico,
    obras: STATE.obras,
    obraAtivaId: STATE.obraAtivaId,
    obrasRecentes: STATE.obrasRecentes,
    bdi: STATE.bdi,
    bdiConfigured: STATE.bdiConfigured,
    bdiComponents: STATE.bdiComponents,
    config: STATE.config
  };
}

function backupCriar() {
  const desc = document.getElementById('backup-desc')?.value?.trim() || 'Ponto de restauração';
  STATE.backups.unshift({ id: makeId('bkp'), desc, criadoEm: new Date().toLocaleString('pt-BR'), payload: backupPayload() });
  STATE.backups = STATE.backups.slice(0, 20);
  saveState();
  backupRender();
  toast('Backup criado.', 'success');
}

function backupRestaurar(id) {
  const b = STATE.backups.find(x => x.id === id);
  if (!b || !confirm('Restaurar este ponto? O estado atual será substituído.')) return;
  Object.assign(STATE, b.payload);
  STATE.backups = [b, ...STATE.backups.filter(x => x.id !== id)];
  normalizeState();
  saveState();
  renderElaborar();
  renderDashboard();
  custosHorariosRender();
  cotacoesRender();
  frentesServicoRender();
  obrasRender();
  preencherSelectsOperacionais();
  backupRender();
  toast('Backup restaurado.', 'success');
}

function backupRemover(id) {
  STATE.backups = STATE.backups.filter(b => b.id !== id);
  saveState();
  backupRender();
}

function backupRender() {
  const el = document.getElementById('backup-lista');
  if (!el) return;
  el.innerHTML = STATE.backups.length ? `<div class="op-list">${STATE.backups.map(b => `<div class="op-row">
    <div class="op-row-main"><div class="op-title">${escapeHtml(b.desc)}</div><div class="op-meta">${b.criadoEm} · ${b.payload?.orcamento?.length || 0} itens · ${b.payload?.planejamento?.length || 0} tarefas</div></div>
    <button class="btn btn-outline btn-sm" onclick="backupRestaurar('${b.id}')">Restaurar</button>
    <button class="btn btn-danger btn-sm" onclick="backupRemover('${b.id}')">×</button>
  </div>`).join('')}</div>` : '<div class="empty-state" style="padding:24px">Nenhum backup criado.</div>';
}

function backupExportarEstado() {
  downloadJSON({ exportadoEm: new Date().toISOString(), ...backupPayload() }, 'tlplanly_estado_completo.json');
}

// ═══════════════════════════════════════════════════════════
// FASE 2A — IMPORTADOR DE EDITAL
// ═══════════════════════════════════════════════════════════
let IMP = {
  file: null,
  files: [],
  rawItems: [],      // itens extraídos brutos
  reviewed: [],      // itens com match SINAPI
  importResults: [],
  markdown: '',
  audit: null,
  filtro: 'todos',
  extracaoId: '',
  origemRapida: '',
  sheetMapping: null
};

const IMPORT_EXTS = ['pdf','xlsx','xls','ods','csv','png','jpg','jpeg','tif','tiff'];
const IMAGE_EXTS = ['png','jpg','jpeg','tif','tiff'];
const SPREADSHEET_EXTS = ['xlsx','xls','ods','csv'];
const UNIDADES_IMPORTACAO = new Set(['UN','M','M2','M3','M2KM','M3KM','TKM','KG','T','L','H','HR','VG','VB','CJ','GL','MES','PONTO','KM','M2XMES']);
const CODIGO_IMPORTACAO_RE = /(?:\b(ED-\d{3,6})\b|\b(CPU-\d+)\b|\b([A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2})\b|(?<![,.])\b(\d{3,7})(?=\s+(?:SINAPI|SICRO|SICOR|ORSE|DNIT|SUDECAP)\b)(?![,.])|(?<![,.])\b(\d{5,7})\b(?![,.]))/i;
const NUM_IMPORT_RE_SRC = String.raw`-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?`;
const UNIDADE_TAIL_IMPORT_RE_SRC = String.raw`M2XMES|M2KM|M3KM|TKM|M²|M2|M³|M3|MÊS|MES|UNID|UND|UN|KG|T|VG|VB|CJ|GL|HR|H|L|PONTO|KM|M`;
const ITEM_TAIL_IMPORT_RE = new RegExp(String.raw`\b(${UNIDADE_TAIL_IMPORT_RE_SRC})\b\s+(${NUM_IMPORT_RE_SRC})\s+(?:R\$\s*)?(${NUM_IMPORT_RE_SRC})\s*(?:R\$)?\s+(?:R\$\s*)?(${NUM_IMPORT_RE_SRC})\s*(?:R\$)?`, 'gi');
const SHEET_PURPOSES = ['grupos', 'orcamento', 'insumos', 'composicoes'];
const SHEET_FIELDS = {
  grupos: [
    { key:'cod', label:'Código do grupo', hint:'E, M, S, T ou código próprio', required:true, aliases:['codigo','cod','codigo grupo','grupo','grupo custo','grupo de custo'] },
    { key:'nome', label:'Nome do grupo', hint:'Equipamento, Material, Mão de Obra, Transporte ou Serviços', required:true, aliases:['nome','descricao','descrição','grupo','grupo custo','grupo de custo','classe'] },
    { key:'tipo', label:'Tipo normalizado', hint:'E, M, S, T ou Serviços', aliases:['tipo','natureza','classificacao','classificação','categoria'] },
    { key:'descricao', label:'Descrição complementar', hint:'Opcional', aliases:['observacao','observação','descricao complementar','descrição complementar','detalhe'] },
  ],
  orcamento: [
    { key:'cod', label:'Código', hint:'Código do item ou composição', aliases:['codigo','cod','item','codigo item','codigo servico','codigo composicao'] },
    { key:'desc', label:'Descrição', hint:'Serviço, insumo ou especificação', required:true, aliases:['descricao','descrição','servico','serviço','especificacao','especificação','insumo'] },
    { key:'unid', label:'Unidade', hint:'UN, M2, M3, H, KG...', aliases:['unidade','unid','und','un'] },
    { key:'qtd', label:'Quantidade', hint:'Quantidade do orçamento', numeric:true, aliases:['quantidade','quant','qtd','qtde'] },
    { key:'precoVenda', label:'Venda unitária', hint:'Preço de venda unitário, quando existir', numeric:true, aliases:['venda unit','venda unitario','venda unitária','preco venda','preço venda','preco de venda','preço de venda','preco venda unit','preço venda unit','valor venda','valor de venda','pv unit','p venda'] },
    { key:'preco', label:'Custo unitário', hint:'Preço unitário sem BDI', numeric:true, aliases:['preco','preço','preco unit','preço unit','preco unitario','preço unitário','valor unit','valor unitário','valor unitario','custo unit','custo unitario','custo unitário','custo un','p unit','p unitario','p unitário','unitario','unitário'] },
    { key:'totalVenda', label:'Total venda', hint:'Total de venda da linha, quando existir', numeric:true, aliases:['total venda','venda total','preco venda total','preço venda total','valor venda total','total preco venda','total preço venda'] },
    { key:'total', label:'Total custo', hint:'Opcional, usado para conferência', numeric:true, aliases:['total','total custo','custo total','preco total','preço total','valor total','total da linha'] },
    { key:'categoria', label:'Categoria/capítulo', hint:'Grupo do item', aliases:['categoria','grupo','classe','capitulo','capítulo'] },
  ],
  insumos: [
    { key:'cod', label:'Código do insumo', hint:'Obrigatório', required:true, aliases:['codigo','cod','codigo insumo','insumo','item'] },
    { key:'desc', label:'Descrição do insumo', hint:'Obrigatório', required:true, aliases:['descricao','descrição','insumo','especificacao','especificação'] },
    { key:'preco', label:'Custo unitário', hint:'Obrigatório', required:true, numeric:true, aliases:['preco','preço','custo','valor','preco unitario','preço unitário','custo unitario','valor unitario'] },
    { key:'unid', label:'Unidade', hint:'UN, M2, H...', aliases:['unidade','unid','und','un'] },
    { key:'tipo', label:'Tipo do insumo', hint:'Material, mão de obra, equipamento ou transporte', aliases:['tipo','classe','categoria','natureza','classificacao','classificação'] },
    { key:'grupo', label:'Grupo de custo', hint:'Código do grupo cadastrado na etapa anterior', aliases:['grupo','grupo custo','grupo de custo','codigo grupo','cod grupo'] },
  ],
  composicoes: [
    { key:'cpuCod', label:'Cod. Composição', hint:'Obrigatório', required:true, aliases:['cod composicao','cod composição','codigo cpu','cod cpu','composicao','composição','codigo composicao','codigo composição','codigo servico'] },
    { key:'cpuDesc', label:'Desc. Composição', hint:'Descrição abreviada do serviço composto', aliases:['desc composicao','desc composição','descricao cpu','descrição cpu','descricao composicao','descrição composição','servico','serviço'] },
    { key:'cpuDescCompleta', label:'Desc. Compl. Comp', hint:'Descrição completa da composição', aliases:['desc compl comp','desc completa comp','descricao completa composicao','descrição completa composição','descricao completa','descrição completa','memorial composicao'] },
    { key:'cpuUnid', label:'Unid. Composição', hint:'Unidade do serviço', aliases:['unid','unidade','unidade cpu','unid cpu','unidade servico','unidade serviço','unid composicao','unid composição'] },
    { key:'prod', label:'Prod. Equipe', hint:'Produção da equipe por hora', numeric:true, aliases:['prod equipe','produção equipe','producao equipe','producao da equipe','produção da equipe','produtividade','produção por hora','producao por hora'] },
    { key:'insumoCod', label:'Cod. Insumo', hint:'Obrigatório para vincular', required:true, aliases:['cod insumo','codigo insumo','código insumo','insumo','codigo recurso','código recurso','recurso'] },
    { key:'insumoDesc', label:'Desc. Insumo', hint:'Opcional se o código já existir', aliases:['desc insumo','descricao insumo','descrição insumo','descricao recurso','descrição recurso','recurso descricao'] },
    { key:'insumoUnid', label:'Unid. Insumo', hint:'UN, H, KG...', aliases:['unid insumo','unidade insumo','unid recurso','unidade recurso'] },
    { key:'preco', label:'Preço Insumo', hint:'Custo produtivo do insumo', numeric:true, aliases:['preco insumo','preço insumo','preco produtivo','preço produtivo','preco','preço','custo','valor','preco unitario','custo unitario'] },
    { key:'precoImprod', label:'Preço Improd.', hint:'Custo improdutivo do equipamento/recurso', numeric:true, aliases:['preco improd','preço improd','preco improdutivo','preço improdutivo','custo improd','custo improdutivo','valor improd'] },
    { key:'coef', label:'Índice', hint:'Consumo produtivo do insumo por unidade da CPU', required:true, numeric:true, aliases:['indice','índice','coeficiente','coef','consumo','indice produtivo','índice produtivo','quantidade insumo'] },
    { key:'coefImprod', label:'Índice Improd.', hint:'Consumo improdutivo do recurso', numeric:true, aliases:['indice improd','índice improd','indice improdutivo','índice improdutivo','coef improd','coeficiente improd','consumo improd'] },
    { key:'qtdEquip', label:'Qtde Equip.', hint:'Quantidade de equipamentos/recursos na equipe', numeric:true, aliases:['qtde equip','qtd equip','quant equip','quantidade equip','quantidade equipamento','qtd equipe','qtde equipe'] },
    { key:'tipo', label:'Tipo do insumo', hint:'M, S, E ou T', aliases:['tipo','classe','categoria','grupo','natureza'] },
  ]
};

function parseNumeroBR(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const clean = String(valor ?? '')
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d,.\-]/g, '');
  if (!clean || clean === '-' || clean === ',' || clean === '.') return 0;
  if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');
    const normalizado = lastComma > lastDot
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean.replace(/,/g, '');
    return Number(normalizado) || 0;
  }
  if (clean.includes(',')) return Number(clean.replace(',', '.')) || 0;
  if ((clean.match(/\./g) || []).length > 1) return Number(clean.replace(/\./g, '')) || 0;
  return Number(clean) || 0;
}

function parseNumeroImportacaoCandidatos(valor) {
  const base = parseNumeroBR(valor);
  const candidatos = [base];
  if (typeof valor === 'number') return candidatos;
  const clean = String(valor ?? '')
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d,.\-]/g, '');
  if (/^-?\d{1,3}[,.]\d{3}$/.test(clean) && !/^-?0[,.]/.test(clean)) {
    const milhares = Number(clean.replace(/[,.]/g, '')) || 0;
    if (milhares && !candidatos.some(n => Math.abs(n - milhares) < 0.000001)) candidatos.push(milhares);
  }
  return candidatos;
}

function escolherQuantidadePrecoPorTotal(qtdRaw, precoRaw, totalRaw) {
  const total = parseNumeroBR(totalRaw);
  const qtdBase = parseNumeroBR(qtdRaw);
  const precoBase = parseNumeroBR(precoRaw);
  if (!(total > 0)) return { qtd: qtdBase, preco: precoBase, total };
  let melhor = { qtd: qtdBase, preco: precoBase, total, diff: Math.abs((qtdBase * precoBase) - total) };
  parseNumeroImportacaoCandidatos(qtdRaw).forEach(qtd => {
    parseNumeroImportacaoCandidatos(precoRaw).forEach(preco => {
      const diff = Math.abs((qtd * preco) - total);
      if (diff < melhor.diff) melhor = { qtd, preco, total, diff };
    });
  });
  return melhor;
}

function normalizarUnidadeImportacao(unid) {
  return String(unid || 'UN').trim().toUpperCase()
    .replace('M²','M2')
    .replace('M³','M3')
    .replace(/^UND$/,'UN')
    .replace(/^UNID$/,'UN')
    .replace(/^MÊS$/,'MES') || 'UN';
}

function sheetNormText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sheetColumnLetter(index) {
  let n = Number(index) + 1;
  let out = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    out = String.fromCharCode(65 + m) + out;
    n = Math.floor((n - m) / 26);
  }
  return out || '?';
}

function sheetNormalizeRows(rawRows) {
  return (rawRows || []).map(row => Array.isArray(row) ? row.map(cell => String(cell ?? '').replace(/\s+/g, ' ').trim()) : []);
}

function sheetScoreHeader(cell, aliases) {
  const norm = sheetNormText(cell);
  if (!norm) return 0;
  return (aliases || []).reduce((best, alias) => {
    const a = sheetNormText(alias);
    if (!a) return best;
    if (norm === a) return Math.max(best, 6);
    if (norm.includes(a)) return Math.max(best, 4);
    if (a.includes(norm) && norm.length >= 3) return Math.max(best, 2);
    return best;
  }, 0);
}

function sheetDefaultMapping(purpose, maxCols) {
  const map = {};
  const set = (key, idx) => { if (idx < maxCols) map[key] = idx; };
  if (purpose === 'grupos') {
    set('cod', 0); set('nome', 1); set('tipo', 2); set('descricao', 3);
  } else if (purpose === 'insumos') {
    set('cod', 0); set('desc', 1); set('preco', 2); set('unid', 3); set('tipo', 4); set('grupo', 5);
  } else if (purpose === 'composicoes') {
    set('cpuCod', 0); set('cpuDesc', 1); set('cpuDescCompleta', 2); set('cpuUnid', 3); set('prod', 4);
    set('insumoCod', 5); set('insumoDesc', 6); set('insumoUnid', 7); set('preco', 8); set('precoImprod', 9);
    set('coef', 10); set('coefImprod', 11); set('qtdEquip', 12);
  } else {
    set('cod', 0); set('desc', 1); set('unid', 2); set('qtd', 3); set('preco', 4); set('total', 5); set('categoria', 6);
  }
  return map;
}

function sheetBuildColumns(rows, maxCols, headerRow) {
  const start = headerRow >= 0 ? headerRow + 1 : 0;
  return Array.from({ length: maxCols }, (_, index) => ({
    index,
    letra: sheetColumnLetter(index),
    header: headerRow >= 0 ? (rows[headerRow]?.[index] || `Coluna ${sheetColumnLetter(index)}`) : `Coluna ${sheetColumnLetter(index)}`,
    amostras: rows.slice(start, start + 4).map(row => row[index] || '').filter(Boolean).slice(0, 3)
  }));
}

function sheetSuggestMapping(rawRows, purpose = 'orcamento') {
  const rows = sheetNormalizeRows(rawRows);
  const fields = SHEET_FIELDS[purpose] || SHEET_FIELDS.orcamento;
  const maxCols = Math.max(0, ...rows.slice(0, 50).map(row => row.length));
  let best = { row: -1, score: -1, mapping: {} };
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] || [];
    const used = new Set();
    const mapping = {};
    let score = 0;
    fields.forEach(field => {
      let bestCol = -1, bestScore = 0;
      row.forEach((cell, ci) => {
        if (used.has(ci)) return;
        const s = sheetScoreHeader(cell, field.aliases);
        if (s > bestScore) { bestScore = s; bestCol = ci; }
      });
      if (bestCol >= 0 && bestScore > 0) {
        mapping[field.key] = bestCol;
        used.add(bestCol);
        score += bestScore + (field.required ? 2 : 0);
      }
    });
    score += fields.filter(f => f.required && mapping[f.key] >= 0).length * 4;
    if (score > best.score) best = { row: r, score, mapping };
  }
  const minScore = purpose === 'composicoes' ? 10 : 7;
  const headerRow = best.score >= minScore ? best.row : -1;
  const mapping = headerRow >= 0 ? best.mapping : sheetDefaultMapping(purpose, maxCols);
  const requiredMissing = fields.filter(f => f.required && !(mapping[f.key] >= 0)).map(f => f.key);
  const confidence = Math.max(15, Math.min(98, Math.round(best.score * 7 + (requiredMissing.length ? -20 : 10))));
  return {
    purpose,
    headerRow,
    startRow: headerRow >= 0 ? headerRow + 1 : 0,
    confidence,
    colunas: sheetBuildColumns(rows, maxCols, headerRow),
    mapping,
    requiredMissing
  };
}

function sheetGuessPurpose(rawRows) {
  const guesses = SHEET_PURPOSES.map(purpose => sheetSuggestMapping(rawRows, purpose));
  guesses.sort((a, b) => {
    const scoreA = a.confidence + (a.headerRow >= 0 ? 8 : 0) - (a.requiredMissing?.length || 0) * 20;
    const scoreB = b.confidence + (b.headerRow >= 0 ? 8 : 0) - (b.requiredMissing?.length || 0) * 20;
    return scoreB - scoreA;
  });
  return guesses[0] || sheetSuggestMapping(rawRows, 'orcamento');
}

function sheetCell(row, idx) {
  return idx !== undefined && idx >= 0 ? String(row[idx] ?? '').trim() : '';
}

function normalizarTipoInsumoImportacao(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (/^IH/.test(raw)) return 'S';
  if (/^IE/.test(raw)) return 'E';
  if (/^IT/.test(raw)) return 'T';
  if (/^IM/.test(raw)) return 'M';
  if (/^IS/.test(raw)) return 'SV';
  const n = sheetNormText(value);
  if (/mao|mdo|obra|pedreiro|servente|oficial|horista|carpinteiro|eletricista|encanador|pintor/.test(n)) return 'S';
  if (/equip|maquina|caminhao|trator|escavadeira|betoneira|andaime|guindaste/.test(n)) return 'E';
  if (/transp|frete|dmt/.test(n)) return 'T';
  if (/servic|terceir|empreitad/.test(n)) return 'SV';
  return 'M';
}

function normalizarGrupoCustoImportacao(value) {
  const raw = String(value || '').trim().toUpperCase();
  const n = sheetNormText(value);
  if (raw === 'E' || /equip|maquina|ferramenta/.test(n)) return 'E';
  if (raw === 'S' || /mao|mdo|obra|pessoal|horista|mensalista/.test(n)) return 'S';
  if (raw === 'T' || /transp|frete|dmt/.test(n)) return 'T';
  if (raw === 'SV' || raw === 'SERV' || /servic|composicao|cpu/.test(n)) return 'SV';
  return 'M';
}

function sheetParseMappedRows(rawRows, mapping, purpose = 'orcamento', headerRow = -1) {
  const rows = sheetNormalizeRows(rawRows);
  const start = headerRow >= 0 ? headerRow + 1 : 0;
  const result = { grupos: [], items: [], insumos: [], composicoes: [], issues: [] };
  const cpuMap = new Map();
  rows.slice(start).forEach((row, offset) => {
    const rowNumber = start + offset + 1;
    if (!row || row.every(cell => !String(cell || '').trim())) return;
    const joined = row.map(cell => String(cell || '')).join(' ').trim();
    if (!joined || linhaImportacaoIgnorada(joined)) return;

    if (purpose === 'grupos') {
      const codigo = limparCodigo(sheetCell(row, mapping.cod)).toUpperCase();
      const nome = sheetCell(row, mapping.nome);
      const grupo = {
        codigo,
        nome,
        tipo: normalizarGrupoCustoImportacao(sheetCell(row, mapping.tipo) || nome || codigo),
        descricao: sheetCell(row, mapping.descricao),
        importado: true
      };
      if (!grupo.codigo || !grupo.nome) {
        result.issues.push(`Linha ${rowNumber}: grupo de custo sem código ou nome.`);
        return;
      }
      result.grupos.push(grupo);
      return;
    }

    if (purpose === 'orcamento') {
      const qtdRaw = sheetCell(row, mapping.qtd);
      const unidRawOriginal = sheetCell(row, mapping.unid);
      const unidRaw = /^(0|[-—])$/i.test(unidRawOriginal) ? '' : unidRawOriginal;
      const precoRaw = sheetCell(row, mapping.preco);
      const totalRaw = sheetCell(row, mapping.total);
      const ajustadoPorTotal = escolherQuantidadePrecoPorTotal(qtdRaw, precoRaw, totalRaw);
      const qtdInformada = String(qtdRaw ?? '').trim() !== '' && ajustadoPorTotal.qtd > 0;
      const qtd = qtdInformada ? ajustadoPorTotal.qtd : 0;
      const preco = ajustadoPorTotal.preco;
      const precoVenda = parseNumeroBR(sheetCell(row, mapping.precoVenda));
      const totalLinha = ajustadoPorTotal.total;
      const totalVendaLinha = parseNumeroBR(sheetCell(row, mapping.totalVenda));
      const semUnidQtd = !unidRaw && !qtdInformada;
      const item = {
        cod: limparCodigo(sheetCell(row, mapping.cod)),
        desc: sheetCell(row, mapping.desc),
        unid: unidRaw ? normalizarUnidadeImportacao(unidRaw) : '',
        qtd,
        quantidadeEmBranco: !qtdInformada,
        preco,
        precoVenda: precoVenda || preco,
        totalLinha,
        totalVendaLinha: totalVendaLinha || totalLinha,
        cat: sheetCell(row, mapping.categoria) || 'Serviços',
        capitulo: sheetCell(row, mapping.categoria) || 'Serviços',
        origem: 'excel',
        linhaOrigem: joined,
        semUnidQtd
      };
      if (!item.desc || item.desc.length < 3) return;
      if (!item.semUnidQtd && qtdRaw && !qtdInformada) result.issues.push(`Linha ${rowNumber}: quantidade vazia ou zerada mantida em branco.`);
      if (!Number.isFinite(preco) || preco < 0) result.issues.push(`Linha ${rowNumber}: custo unitário inválido.`);
      result.items.push(item);
      return;
    }

    if (purpose === 'insumos') {
      const cod = limparCodigo(sheetCell(row, mapping.cod));
      const grupoCusto = sheetCell(row, mapping.grupo) || sheetCell(row, mapping.tipo);
      const tipo = normalizarTipoInsumoImportacao(sheetCell(row, mapping.tipo) || grupoCusto);
      const ins = {
        codigoSinapi: cod,
        codigo: cod,
        descricao: sheetCell(row, mapping.desc),
        unidade: normalizarUnidadeImportacao(sheetCell(row, mapping.unid) || 'UN'),
        precoMedio: parseNumeroBR(sheetCell(row, mapping.preco)),
        tipo,
        grupoCusto: String(grupoCusto || tipo).trim().toUpperCase(),
        fonte: 'IMPORTADO/TLPLANLY',
        dataReferencia: new Date().toLocaleDateString('pt-BR'),
        importado: true
      };
      if (!ins.codigoSinapi || !ins.descricao) {
        result.issues.push(`Linha ${rowNumber}: insumo sem código ou descrição.`);
        return;
      }
      if (!ins.precoMedio) result.issues.push(`Linha ${rowNumber}: custo unitário ausente ou zerado.`);
      result.insumos.push(ins);
      return;
    }

    const cpuCod = limparCodigo(sheetCell(row, mapping.cpuCod));
    const insumoCod = limparCodigo(sheetCell(row, mapping.insumoCod));
    if (!cpuCod || !insumoCod) {
      result.issues.push(`Linha ${rowNumber}: composição sem código de CPU ou código de insumo.`);
      return;
    }
    const lookup = lookupPreco(insumoCod);
    const insumoDesc = sheetCell(row, mapping.insumoDesc) || lookup?.item?.descricao || insumoCod;
    const precoMapeado = parseNumeroBR(sheetCell(row, mapping.preco));
    const precoImprodMapeado = parseNumeroBR(sheetCell(row, mapping.precoImprod));
    const precoImprodLookup = Number(lookup?.item?.custoImprodutivo ?? lookup?.item?.precoImprodutivo ?? lookup?.item?.improdutivo ?? 0) || 0;
    const coef = parseNumeroBR(sheetCell(row, mapping.coef));
    const coefImprod = parseNumeroBR(sheetCell(row, mapping.coefImprod));
    const qtdEquip = parseNumeroBR(sheetCell(row, mapping.qtdEquip));
    const insumo = {
      cod: insumoCod,
      desc: insumoDesc,
      unid: normalizarUnidadeImportacao(sheetCell(row, mapping.insumoUnid) || lookup?.item?.unidade || 'UN'),
      tipo: normalizarTipoInsumoImportacao(sheetCell(row, mapping.tipo) || insumoCod || insumoDesc),
      coef,
      indice: coef,
      coefImprod,
      indiceImprodutivo: coefImprod,
      qtdEquip,
      quantidadeEquipamento: qtdEquip,
      preco: precoMapeado || lookup?.preco || 0,
      precoImprod: precoImprodMapeado || precoImprodLookup || 0,
      precoImprodutivo: precoImprodMapeado || precoImprodLookup || 0
    };
    if (!insumo.coef && !insumo.coefImprod) result.issues.push(`Linha ${rowNumber}: índice produtivo/improdutivo ausente ou zerado.`);
    const cpu = cpuMap.get(cpuCod) || {
      id: makeId('cpu'),
      cod: cpuCod,
      desc: sheetCell(row, mapping.cpuDesc) || cpuCod,
      descCompleta: sheetCell(row, mapping.cpuDescCompleta),
      descricaoCompleta: sheetCell(row, mapping.cpuDescCompleta),
      unid: normalizarUnidadeImportacao(sheetCell(row, mapping.cpuUnid) || 'UN'),
      tipo: 'Serviços',
      encargos: 'importado',
      encPct: 0,
      prod: parseNumeroBR(sheetCell(row, mapping.prod)) || 1,
      producaoEquipe: parseNumeroBR(sheetCell(row, mapping.prod)) || 1,
      modeloCalculo: 'compor',
      importadoCompor: true,
      insumos: [],
      precoUnitario: 0,
      criadaEm: new Date().toLocaleDateString('pt-BR')
    };
    cpu.insumos.push(insumo);
    cpu.precoUnitario = cpuEditorCalcularDetalhes(cpu).custoUnitario;
    cpuMap.set(cpuCod, cpu);
  });
  result.composicoes = [...cpuMap.values()];
  return result;
}

async function lerPlanilhasArquivo(file) {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array', raw: false, cellDates: false });
  return wb.SheetNames.map(sheetName => {
    const ws = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    return {
      id: `${file.name}::${sheetName}`,
      fileName: file.name,
      sheetName,
      size: file.size,
      raw
    };
  }).filter(entry => entry.raw.some(row => Array.isArray(row) && row.some(cell => String(cell || '').trim())));
}

function linhaImportacaoIgnorada(line) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return true;
  const norm = cleaned.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^(item|codigo|cod\.?|referencia|descricao|descri|unid|quant|preco|valor)\b/.test(norm)) return true;
  if (/\b(codigo\s+referencia\s+descricao|codigo\s+servico|preco\s+unitario|valor\s+unitario)\b/.test(norm)) return true;
  if (/\b(total\s+(sem|com)\s+bdi|subtotal|total\s+geral|valor\s+global|valor\s+total\s+do\s+orcamento)\b/.test(norm)) return true;
  if (/\b(procv|vlookup)\s*\(/.test(norm) || norm.includes('=procv')) return true;
  if (/^(total|subtotal)\b/.test(norm)) return true;
  if (/^rev-\d+/.test(norm)) return true;
  if (/^\d{2}\s+(?!de\b)[a-z]/.test(norm)) return true;
  if (/\b(prefeitura municipal|secretaria municipal|comprasnet|uasg|cnpj|telefone|anexo|planilha de estimativa|planilha orcamentaria|data base|responsavel tecnico)\b/.test(norm)) return true;
  if (/^(pagina|page)\s+\d+/.test(norm)) return true;
  return false;
}

function extrairNumerosOperacionais(text) {
  const re = /(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?/g;
  const values = [];
  for (const m of String(text || '').matchAll(re)) {
    const token = m[0];
    const index = m.index || 0;
    const before = String(text).slice(Math.max(0, index - 8), index).toUpperCase();
    const after = String(text).slice(index + token.length, index + token.length + 8).toUpperCase();
    if (/AF_$/.test(before) || /^[/-]\d{2,4}/.test(after)) continue;
    const n = parseNumeroBR(token);
    if (Number.isFinite(n)) values.push(n);
  }
  return values;
}

function parsearLinhaOrcamentaria(line) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  if (linhaImportacaoIgnorada(cleaned)) return null;
  const codMatch = cleaned.match(CODIGO_IMPORTACAO_RE);
  if (!codMatch || codMatch.index === undefined) return null;

  let cod = (codMatch.slice(1).find(Boolean) || '').toUpperCase();
  let afterCode = cleaned.slice(codMatch.index + cod.length).trim();
  const cpuAposCodigoAuxiliar = afterCode.match(/^(CPU-\d+)\b/i);
  if (/^[A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2}$/i.test(cod) && cpuAposCodigoAuxiliar) {
    cod = cpuAposCodigoAuxiliar[1].toUpperCase();
    afterCode = afterCode.slice(cpuAposCodigoAuxiliar[1].length).trim();
  }
  let desc = afterCode;
  let unid = 'UN';
  let qtd = 1;
  let preco = 0;
  let totalLinha = 0;
  let numeros = [];

  const tails = [...afterCode.matchAll(ITEM_TAIL_IMPORT_RE)];
  const tail = tails.length ? tails[tails.length - 1] : null;
  if (tail && tail.index !== undefined) {
    unid = normalizarUnidadeImportacao(tail[1]);
    qtd = parseNumeroBR(tail[2]);
    preco = parseNumeroBR(tail[3]);
    totalLinha = parseNumeroBR(tail[4]);
    numeros = [qtd, preco, totalLinha];
    desc = afterCode.slice(0, tail.index)
      .replace(/^(SINAPI|SICOR|SICRO|SUDECAP|ORSE|DNIT)\b/i, '')
      .replace(/\b(AF_\d{2}\/\d{4}|SEDI|CANT|COMPOSICAO|COMPOSIÇÃO)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  } else {
    numeros = extrairNumerosOperacionais(afterCode).filter(n => n > 0);
    if (numeros.length >= 3) {
      qtd = numeros[numeros.length - 3]; preco = numeros[numeros.length - 2]; totalLinha = numeros[numeros.length - 1];
    } else if (numeros.length >= 2) {
      qtd = numeros[numeros.length - 2]; preco = numeros[numeros.length - 1];
    }
    desc = afterCode
      .replace(/\b(SINAPI|SICRO|ORSE|DNIT)\b/gi, ' ')
      .replace(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  desc = desc.replace(/\bTOTAL\b.*$/i, '').replace(/\s+/g, ' ').trim();
  if (desc.length < 3) return null;
  return { cod, desc: desc.substring(0,240), unid, qtd: qtd > 0 ? qtd : 1, preco: preco > 0 ? preco : 0, totalLinha, linhaOrigem: cleaned, numerosOrigem: numeros, origem: 'pdf' };
}

function certAvaliarItem(item, modo = 'planilha') {
  const motivos = [];
  const correcoes = Array.isArray(item.certCorrecoes) ? [...item.certCorrecoes] : [];
  const desc = String(item.desc || '').trim();
  const origem = `${item.linhaOrigem || ''} ${item.origem || ''} ${item.origemMetodo || ''} ${item.metodo || ''} ${item.capitulo || ''} ${desc}`;
  const qtd = Number(item.qtd) || 0;
  const preco = Number(item.preco) || 0;
  const totalLinha = Number(item.totalLinha) || 0;
  const totalCalculado = qtd * preco;
  const unid = normalizarUnidadeImportacao(item.unid);
  const origemNorm = copilotNormText(origem);
  const quantidadePareceAno = Number.isInteger(qtd) && qtd >= 1900 && qtd <= 2100;
  const estimativaInferida = modo === 'estimativa' && /inferido|analisador|estimativa por documentos/.test(origemNorm);
  let bloqueios = 0;
  let alertas = 0;

  if (linhaImportacaoIgnorada(origem)) { motivos.push('Linha parece ser cabecalho, rodape ou total da planilha.'); bloqueios++; }
  if (/[=]\s*procv|procv\s*\(|vlookup\s*\(|\bR\$\s*R\$/i.test(origem)) { motivos.push('Descricao contem formula, marcador monetario quebrado ou resto de extracao.'); bloqueios++; }
  if (desc.length < 5) { motivos.push('Descricao insuficiente para validar o item.'); bloqueios++; }
  if (!qtd || qtd <= 0) { motivos.push('Quantidade ausente ou zerada.'); bloqueios++; }
  if (preco < 0 || (!preco && modo === 'planilha')) { motivos.push('Preco unitario ausente ou invalido.'); modo === 'planilha' ? bloqueios++ : alertas++; }
  if (qtd > 1000000) { motivos.push('Quantidade muito alta para importacao automatica.'); bloqueios++; }
  if (preco > 10000000) { motivos.push('Preco unitario muito alto para importacao automatica.'); bloqueios++; }
  if (totalCalculado > 100000000 && modo === 'planilha') { motivos.push('Total calculado fora da escala esperada; exige correcao antes do orcamento.'); bloqueios++; }
  if (modo === 'estimativa' && quantidadePareceAno) { motivos.push('Quantidade parece ser ano/data extraída do documento; validar manualmente.'); bloqueios++; }
  if (estimativaInferida && !totalLinha && totalCalculado > 500000) { motivos.push('Estimativa inferida com total muito alto; exige memória de cálculo antes de entrar no orçamento.'); bloqueios++; }
  if (totalLinha > 0 && totalCalculado > 0) {
    const divergencia = Math.abs(totalCalculado - totalLinha) / Math.max(totalLinha, 1);
    if (divergencia > 0.05) { motivos.push(`Quantidade x preco nao fecha com o total da linha (${Math.round(divergencia * 100)}% de divergencia).`); bloqueios++; }
  }
  if (!UNIDADES_IMPORTACAO.has(unid)) { motivos.push('Unidade nao reconhecida automaticamente; validar manualmente.'); alertas++; }
  if (item.matchTipo === 'parcial') { motivos.push('Referencia encontrada por descricao; validar codigo sugerido.'); alertas++; }
  if (item.matchTipo === 'nenhum') { motivos.push('Sem correspondencia automatica na base SINAPI carregada.'); alertas++; }

  let certStatus = 'aprovado';
  if (bloqueios > 0) certStatus = 'bloqueado';
  else if (alertas > 0) certStatus = 'pendente';
  else if (correcoes.length > 0) certStatus = 'corrigido';
  return {
    certStatus,
    certScore: Math.max(0, Math.min(100, 100 - bloqueios * 35 - alertas * 10)),
    certMotivos: motivos,
    certCorrecoes: correcoes,
    selecionado: certStatus !== 'bloqueado' && item.selecionado !== false
  };
}

function certTentarCorrigir(item) {
  const next = { ...item, certCorrecoes: Array.isArray(item.certCorrecoes) ? [...item.certCorrecoes] : [] };
  const nums = Array.isArray(next.numerosOrigem) ? next.numerosOrigem.filter(n => n > 0) : [];
  if (nums.length >= 3) {
    const [qtd, preco, total] = nums.slice(-3);
    const atualFecha = Math.abs((Number(next.qtd) || 0) * (Number(next.preco) || 0) - (Number(next.totalLinha) || 0));
    const novoFecha = Math.abs(qtd * preco - total);
    if (!next.totalLinha || novoFecha < atualFecha) {
      next.qtd = qtd; next.preco = preco; next.totalLinha = total;
      next.certCorrecoes.push('Recalculado pela sequencia quantidade, preco unitario e total da linha.');
    }
  }
  const totalLinha = Number(next.totalLinha) || 0;
  const preco = Number(next.preco) || 0;
  if (totalLinha > 0 && preco > 0) {
    const qtdCalculada = totalLinha / preco;
    const divergencia = Math.abs((Number(next.qtd) || 0) * preco - totalLinha) / Math.max(totalLinha, 1);
    if (divergencia > 0.05 && qtdCalculada > 0 && qtdCalculada < 1000000) {
      next.qtd = Math.round(qtdCalculada * 10000) / 10000;
      next.certCorrecoes.push('Quantidade recalculada a partir do total da linha.');
    }
  }
  next.unid = normalizarUnidadeImportacao(next.unid);
  return next;
}

function certificarItensExtraidosLocal(itens, options = {}) {
  const modo = options.modo || 'planilha';
  const maxRodadas = options.maxRodadas || 3;
  let rodadas = 0;
  let atuais = itens.map(i => ({ ...i, unid: normalizarUnidadeImportacao(i.unid) }));

  for (let round = 1; round <= maxRodadas; round++) {
    rodadas = round;
    let mudou = false;
    atuais = atuais.map(item => {
      const aval = certAvaliarItem(item, modo);
      if (aval.certStatus !== 'bloqueado') return { ...item, ...aval };
      const corrigido = certTentarCorrigir(item);
      const mudouItem = JSON.stringify(corrigido) !== JSON.stringify(item);
      mudou = mudou || mudouItem;
      return { ...corrigido, ...certAvaliarItem(corrigido, modo) };
    });
    if (!mudou || atuais.every(i => i.certStatus !== 'bloqueado')) break;
  }

  const certificados = atuais.map(item => ({ ...item, ...certAvaliarItem(item, modo) }));
  const count = status => certificados.filter(i => i.certStatus === status).length;
  const bloqueado = count('bloqueado');
  const pendente = count('pendente');
  const corrigido = count('corrigido');
  const aprovado = count('aprovado');
  const score = certificados.length ? Math.round(certificados.reduce((s, i) => s + i.certScore, 0) / certificados.length) : 0;
  const status = bloqueado ? 'bloqueado' : pendente ? 'pendente' : corrigido ? 'corrigido' : 'aprovado';
  const motivos = [...new Set(certificados.flatMap(i => i.certMotivos || []))].slice(0, 8);
  return { itens: certificados, relatorio: { status, score, rodadas, total: certificados.length, aprovado, corrigido, pendente, bloqueado, motivos } };
}

function certBadge(status) {
  if (status === 'bloqueado') return '<span class="cert-badge cert-bad">Bloqueado</span>';
  if (status === 'pendente') return '<span class="cert-badge cert-warn">Revisar</span>';
  if (status === 'corrigido') return '<span class="cert-badge cert-fix">Corrigido</span>';
  return '<span class="cert-badge cert-ok">Certificado</span>';
}

function renderCertResumo(relatorio, targetId = 'imp-audit-summary') {
  const el = document.getElementById(targetId);
  if (!el || !relatorio) return;
  const statusLabel = relatorio.status === 'bloqueado' ? 'Bloqueios encontrados'
    : relatorio.status === 'pendente' ? 'Revisao necessaria'
    : relatorio.status === 'corrigido' ? 'Corrigido automaticamente'
    : 'Certificado';
  el.innerHTML = `
    <div class="cert-summary cert-${relatorio.status}">
      <div>
        <strong>Loop de auditoria da extracao: ${statusLabel}</strong>
        <span>${relatorio.rodadas} rodada(s) · score ${relatorio.score}% · ${relatorio.aprovado} aprovado(s), ${relatorio.corrigido} corrigido(s), ${relatorio.pendente} pendente(s), ${relatorio.bloqueado} bloqueado(s)</span>
      </div>
      ${relatorio.motivos?.length ? `<small>${relatorio.motivos.map(escapeHtml).join(' · ')}</small>` : ''}
    </div>`;
}

function handleFileSelect(e) {
  setImportFiles(Array.from(e.target.files || []));
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone').classList.remove('dragover');
  setImportFiles(Array.from(e.dataTransfer.files || []));
}

function setImportFile(f) {
  setImportFiles(f ? [f] : []);
}

function setImportFiles(files) {
  const validos = files.filter(f => IMPORT_EXTS.includes(getFileExt(f)));
  if (!validos.length) {
    toast('Selecione PDF, Excel, CSV ou imagem digitalizada.', 'error');
    return;
  }
  if (validos.length !== files.length) {
    toast('Alguns arquivos foram ignorados por formato não suportado.', 'info');
  }

  IMP.files = validos;
  IMP.file = validos[0] || null;
  IMP.sheetMapping = null;
  IMP.markdown = '';
  renderImportFileChips();
  document.getElementById('btnExtract').disabled = !IMP.files.length;
}

function getFileExt(file) {
  return (file?.name || '').split('.').pop().toLowerCase();
}

function getImportFileIcon(file) {
  const ext = getFileExt(file);
  if (ext === 'pdf') return '📄';
  if (IMAGE_EXTS.includes(ext)) return '🖼️';
  return '📊';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineJsArg(value) {
  return escapeHtml(JSON.stringify(String(value ?? '')));
}

function renderImportFileChips() {
  const chip = document.getElementById('imp-file-chip');
  if (!chip) return;
  if (!IMP.files.length) {
    chip.style.display = 'none';
    chip.innerHTML = '';
    return;
  }

  chip.style.display = 'block';
  chip.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${IMP.files.map((f, idx) => `<div class="file-chip">${getImportFileIcon(f)} <span>${escapeHtml(f.name)}</span> <span style="color:var(--text3)">(${(f.size/1024).toFixed(0)} KB)</span> <span class="chip-remove" onclick="removerArquivo(${idx})">×</span></div>`).join('')}
    </div>
    <small style="display:block;margin-top:4px;color:var(--text3)">${IMP.files.length} arquivo(s) selecionado(s). PDFs escaneados e imagens serão processados por OCR.</small>
  `;
}

function removerArquivo(index = null) {
  if (Number.isInteger(index)) IMP.files.splice(index, 1);
  else IMP.files = [];

  IMP.file = IMP.files[0] || null;
  renderImportFileChips();
  document.getElementById('btnExtract').disabled = !IMP.files.length;
  const input = document.getElementById('fileInput');
  if (input && !IMP.files.length) input.value = '';
}

function resetarImportacao() {
  removerArquivo();
  document.getElementById('imp-card-progress').style.display = 'none';
  document.getElementById('imp-card-review').style.display = 'none';
  document.getElementById('imp-card-mapping').style.display = 'none';
  document.getElementById('imp-card-upload').style.display = 'block';
  IMP.rawItems = []; IMP.reviewed = []; IMP.importResults = []; IMP.markdown = ''; IMP.audit = null; IMP.extracaoId = ''; IMP.origemRapida = ''; IMP.sheetMapping = null;
}

function setStep(steps, idx, status, statusText) {
  const el = document.getElementById('imp-step-' + idx);
  if (!el) return;
  const num = el.querySelector('.imp-step-num');
  const st = el.querySelector('.imp-step-status');
  num.className = 'imp-step-num ' + (status === 'done' ? 'done' : status === 'spin' ? 'spin' : '');
  if (status === 'done') num.textContent = '✓';
  if (status === 'spin') num.textContent = '⋯';
  if (st) st.textContent = statusText || '';
}

function setProgress(pct, label) {
  document.getElementById('imp-prog-fill').style.width = pct + '%';
  document.getElementById('imp-prog-pct').textContent = pct + '%';
  document.getElementById('imp-prog-label').textContent = label;
}

async function prepararMapeamentoPlanilha(files) {
  document.getElementById('imp-card-upload').style.display = 'none';
  document.getElementById('imp-card-progress').style.display = 'block';
  document.getElementById('imp-card-review').style.display = 'none';
  document.getElementById('imp-card-mapping').style.display = 'none';
  document.getElementById('imp-steps').innerHTML = '';
  setProgress(10, 'Lendo planilhas...');

  const entries = [];
  for (const file of files) {
    const sheets = await lerPlanilhasArquivo(file);
    entries.push(...sheets);
  }
  if (!entries.length) throw new Error('Nenhuma aba com dados foi encontrada nas planilhas.');

  entries.forEach((entry, idx) => {
    entry.index = idx;
    entry.suggestion = sheetGuessPurpose(entry.raw);
    entry.purpose = entry.suggestion.purpose || 'orcamento';
    entry.headerRow = entry.suggestion.headerRow;
    entry.mapping = { ...entry.suggestion.mapping };
    entry.columns = entry.suggestion.colunas;
  });

  IMP.sheetMapping = { entries, currentIndex: 0, purpose: entries[0]?.purpose || 'orcamento' };
  setProgress(100, 'Mapeamento pronto.');
  await sleep(80);
  document.getElementById('imp-card-progress').style.display = 'none';
  document.getElementById('imp-card-mapping').style.display = 'block';
  renderMapeamentoPlanilha();
}

function impCurrentSheetEntry() {
  return IMP.sheetMapping?.entries?.[IMP.sheetMapping.currentIndex || 0] || null;
}

function renderMapeamentoPlanilha() {
  const state = IMP.sheetMapping;
  if (!state?.entries?.length) return;
  const entry = impCurrentSheetEntry();
  const source = document.getElementById('imp-map-source');
  const purpose = document.getElementById('imp-map-purpose');
  const header = document.getElementById('imp-map-header');
  if (source) {
    source.innerHTML = state.entries.map((e, idx) => `<option value="${idx}"${idx === state.currentIndex ? ' selected' : ''}>${escapeHtml(e.fileName)} — ${escapeHtml(e.sheetName)} (${e.raw.length} linhas)</option>`).join('');
  }
  if (purpose) purpose.value = entry.purpose || state.purpose || 'orcamento';
  if (header) {
    const rows = sheetNormalizeRows(entry.raw);
    const opts = ['<option value="-1">Sem cabeçalho: dados começam na linha 1</option>'];
    rows.slice(0, 15).forEach((row, idx) => {
      const sample = row.slice(0, 5).join(' | ').substring(0, 100) || '(linha vazia)';
      opts.push(`<option value="${idx}"${idx === entry.headerRow ? ' selected' : ''}>Linha ${idx + 1}: ${escapeHtml(sample)}</option>`);
    });
    header.innerHTML = opts.join('');
  }
  renderMapFields(entry);
  renderMapPreview(entry);
  renderMapStatus(entry);
}

function renderMapFields(entry) {
  const el = document.getElementById('imp-map-fields');
  if (!el || !entry) return;
  const fields = SHEET_FIELDS[entry.purpose] || SHEET_FIELDS.orcamento;
  const columns = entry.columns || sheetBuildColumns(sheetNormalizeRows(entry.raw), Math.max(0, ...entry.raw.map(r => r.length)), entry.headerRow);
  const options = ['<option value="-1">Não importar</option>'].concat(columns.map(c => {
    const sample = c.amostras?.length ? ` — ${c.amostras.join(' / ').substring(0, 60)}` : '';
    return `<option value="${c.index}">${c.letra} · ${escapeHtml(c.header)}${escapeHtml(sample)}</option>`;
  })).join('');
  el.innerHTML = fields.map(field => `
    <div class="sheet-map-field">
      <label>${escapeHtml(field.label)}${field.required ? ' *' : ''}<small>${escapeHtml(field.hint || '')}</small></label>
      <select class="form-select" onchange="impAtualizarCampoMapeado('${field.key}', this.value)">
        ${options.replace(`value="${entry.mapping?.[field.key]}"`, `value="${entry.mapping?.[field.key]}" selected`)}
      </select>
    </div>`).join('');
}

function renderMapPreview(entry) {
  const el = document.getElementById('imp-map-preview');
  if (!el || !entry) return;
  const rows = sheetNormalizeRows(entry.raw).slice(0, 14);
  const maxCols = Math.max(0, ...rows.map(r => r.length), ...(entry.columns || []).map(c => c.index + 1));
  if (!rows.length || !maxCols) {
    el.innerHTML = '<div class="empty-state" style="padding:24px">Sem dados para pré-visualizar.</div>';
    return;
  }
  const head = Array.from({ length: maxCols }, (_, idx) => `<th>${sheetColumnLetter(idx)}</th>`).join('');
  const body = rows.map((row, idx) => {
    const cls = idx === entry.headerRow ? 'header-row' : idx < (entry.headerRow || -1) ? 'skip-row' : '';
    return `<tr class="${cls}">${Array.from({ length: maxCols }, (_, ci) => `<td>${escapeHtml(row[ci] || '')}</td>`).join('')}</tr>`;
  }).join('');
  el.innerHTML = `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderMapStatus(entry) {
  const badge = document.getElementById('imp-map-confidence');
  const issuesEl = document.getElementById('imp-map-issues');
  if (!entry) return;
  const parsed = sheetParseMappedRows(entry.raw, entry.mapping || {}, entry.purpose, entry.headerRow);
  const count = entry.purpose === 'grupos' ? parsed.grupos.length : entry.purpose === 'insumos' ? parsed.insumos.length : entry.purpose === 'composicoes' ? parsed.composicoes.length : parsed.items.length;
  const missing = (SHEET_FIELDS[entry.purpose] || []).filter(f => f.required && !(entry.mapping?.[f.key] >= 0)).map(f => f.label);
  if (badge) {
    const conf = entry.suggestion?.confidence || 0;
    badge.textContent = `${conf}% de confiança · ${count} registro(s)`;
    badge.style.color = conf >= 70 && !missing.length ? 'var(--green)' : 'var(--gold)';
  }
  if (issuesEl) {
    const msgs = [];
    if (missing.length) msgs.push(`Campos obrigatórios sem coluna: ${missing.join(', ')}.`);
    msgs.push(...parsed.issues.slice(0, 5));
    issuesEl.innerHTML = msgs.length
      ? `<div class="sheet-map-warning">${msgs.map(escapeHtml).join('<br>')}</div>`
      : `<div class="sheet-map-ok">Mapeamento pronto: ${count} registro(s) válidos para importação.</div>`;
  }
}

function impSelecionarPlanilhaMapeada(value) {
  if (!IMP.sheetMapping) return;
  IMP.sheetMapping.currentIndex = Number(value) || 0;
  renderMapeamentoPlanilha();
}

function impAlterarFinalidadeMapeamento(value) {
  if (!IMP.sheetMapping || !SHEET_PURPOSES.includes(value)) return;
  const entry = impCurrentSheetEntry();
  if (!entry) return;
  entry.purpose = value;
  entry.suggestion = sheetSuggestMapping(entry.raw, value);
  entry.headerRow = entry.suggestion.headerRow;
  entry.mapping = { ...entry.suggestion.mapping };
  entry.columns = entry.suggestion.colunas;
  IMP.sheetMapping.purpose = value;
  renderMapeamentoPlanilha();
}

function impAlterarLinhaCabecalho(value) {
  const entry = impCurrentSheetEntry();
  if (!entry) return;
  entry.headerRow = Number(value);
  const rows = sheetNormalizeRows(entry.raw);
  const maxCols = Math.max(0, ...rows.slice(0, 50).map(row => row.length));
  entry.columns = sheetBuildColumns(rows, maxCols, entry.headerRow);
  renderMapeamentoPlanilha();
}

function impAtualizarCampoMapeado(field, value) {
  const entry = impCurrentSheetEntry();
  if (!entry) return;
  entry.mapping = { ...(entry.mapping || {}), [field]: Number(value) };
  if (entry.mapping[field] < 0) delete entry.mapping[field];
  renderMapFields(entry);
  renderMapStatus(entry);
}

function impReaplicarSugestao() {
  const entry = impCurrentSheetEntry();
  if (!entry) return;
  entry.suggestion = sheetSuggestMapping(entry.raw, entry.purpose);
  entry.headerRow = entry.suggestion.headerRow;
  entry.mapping = { ...entry.suggestion.mapping };
  entry.columns = entry.suggestion.colunas;
  renderMapeamentoPlanilha();
}

function impVoltarUpload() {
  document.getElementById('imp-card-mapping').style.display = 'none';
  document.getElementById('imp-card-upload').style.display = 'block';
}

async function confirmarMapeamentoPlanilha() {
  const state = IMP.sheetMapping;
  if (!state?.entries?.length) return;
  const results = [];
  let grupos = [], items = [], insumos = [], composicoes = [], issues = [];
  state.entries.forEach(entry => {
    const parsed = sheetParseMappedRows(entry.raw, entry.mapping || {}, entry.purpose || 'orcamento', entry.headerRow);
    grupos = grupos.concat(parsed.grupos);
    items = items.concat(parsed.items);
    insumos = insumos.concat(parsed.insumos);
    composicoes = composicoes.concat(parsed.composicoes);
    issues = issues.concat(parsed.issues.map(msg => `${entry.sheetName}: ${msg}`));
    results.push({
      fileName: entry.fileName,
      sheetName: entry.sheetName,
      ext: getFileExt({ name: entry.fileName }),
      metodo: `Planilha mapeada (${entry.purpose})`,
      grupos: parsed.grupos,
      items: parsed.items,
      insumos: parsed.insumos,
      composicoes: parsed.composicoes,
      issues: parsed.issues,
      rawText: ''
    });
  });

  const contagens = { grupos:0, insumos:0, composicoes:0 };
  if (grupos.length) contagens.grupos = registrarGruposCustoImportados(grupos);
  if (insumos.length) contagens.insumos = registrarInsumosImportados(insumos);
  if (composicoes.length) contagens.composicoes = registrarComposicoesImportadas(composicoes);
  IMP.importResults = results;
  IMP.markdown = gerarMemoriaImportacao(results);

  if (!items.length && (contagens.grupos || contagens.insumos || contagens.composicoes)) {
    persistirImportacaoComoExtracao('enviado');
    const msg = [
      contagens.grupos ? `${contagens.grupos} grupo(s) de custo` : '',
      contagens.insumos ? `${contagens.insumos} insumo(s)` : '',
      contagens.composicoes ? `${contagens.composicoes} composição(ões) CPU` : ''
    ].filter(Boolean).join(' · ');
    document.getElementById('imp-map-issues').innerHTML = `<div class="sheet-map-ok">Importação concluída: ${msg}. Sequência recomendada: Grupos de Custo → Insumos → Composições.</div>`;
    toast(`Importação concluída: ${msg}`, 'success');
    if (contagens.composicoes) showView('cpu');
    return;
  }

  if (!items.length) { toast('Nenhum item de orçamento válido foi encontrado no mapeamento.', 'error'); return; }
  document.getElementById('imp-card-mapping').style.display = 'none';
  document.getElementById('imp-card-progress').style.display = 'block';
  setProgress(70, 'Normalizando itens mapeados...');
  await sleep(80);
  IMP.rawItems = items;
  IMP.importResults = results;
  IMP.markdown = gerarMemoriaImportacao(results);
  const matched = items.map(it => matchSINAPI(it));
  setProgress(92, 'Rodando auditoria de extração...');
  const certified = certificarItensExtraidosLocal(matched, { modo: 'planilha', maxRodadas: 3 });
  IMP.reviewed = certified.itens;
  IMP.audit = certified.relatorio;
  setProgress(100, issues.length ? 'Concluído com alertas.' : 'Concluído.');
  await sleep(120);
  mostrarRevisao();
}

function registrarGruposCustoImportados(grupos) {
  normalizeState();
  const atuais = new Map(STATE.gruposCusto.map(g => [String(g.codigo || '').toUpperCase(), g]));
  grupos.forEach(grupo => {
    const codigo = String(grupo.codigo || '').toUpperCase();
    if (!codigo) return;
    atuais.set(codigo, {
      ...(atuais.get(codigo) || {}),
      ...grupo,
      codigo,
      tipo: normalizarGrupoCustoImportacao(grupo.tipo || grupo.nome || codigo),
      importado: true
    });
  });
  STATE.gruposCusto = [...atuais.values()];
  saveState();
  return grupos.length;
}

function registrarInsumosImportados(insumos) {
  normalizeState();
  const byCode = new Map(STATE.insumosImportados.map(i => [String(i.codigoSinapi || i.codigo || '').toUpperCase(), i]));
  insumos.forEach(ins => {
    const code = String(ins.codigoSinapi || ins.codigo || '').toUpperCase();
    if (!code) return;
    byCode.set(code, { ...(byCode.get(code) || {}), ...ins, codigoSinapi: code, codigo: code, importado: true });
  });
  STATE.insumosImportados = [...byCode.values()];
  atualizarCpusPorInsumosImportados(insumos);
  saveState();
  return insumos.length;
}

function registrarComposicoesImportadas(composicoes) {
  let count = 0;
  composicoes.forEach(comp => {
    const idx = CPU_BIBLIOTECA.findIndex(c => String(c.cod).toUpperCase() === String(comp.cod).toUpperCase());
    const normalizada = { ...comp, id: idx >= 0 ? CPU_BIBLIOTECA[idx].id : (comp.id || makeId('cpu')) };
    normalizada.insumos = (normalizada.insumos || []).map(ins => {
      const lookup = lookupPreco(ins.cod);
      const precoImprod = Number(ins.precoImprod ?? ins.precoImprodutivo ?? lookup?.item?.custoImprodutivo ?? lookup?.item?.precoImprodutivo ?? 0) || 0;
      return {
        ...ins,
        preco: Number(ins.preco) || lookup?.preco || 0,
        precoImprod,
        precoImprodutivo: precoImprod,
        desc: ins.desc || lookup?.item?.descricao || ins.cod,
        unid: ins.unid || lookup?.item?.unidade || 'UN',
        tipo: cpuTipoManual(ins.cod || ins.codigo || ins.tipo || lookup?.item?.tipo, ins.desc || lookup?.item?.descricao || '')
      };
    });
    cpuRecalcularComposicaoSalva(normalizada);
    if (idx >= 0) CPU_BIBLIOTECA[idx] = normalizada;
    else CPU_BIBLIOTECA.push(normalizada);
    count++;
  });
  cpuSaveLib();
  cpuRenderBiblioteca();
  return count;
}

function atualizarCpusPorInsumosImportados(insumos) {
  if (!Array.isArray(CPU_BIBLIOTECA) || !CPU_BIBLIOTECA.length) return;
  const byCode = new Map(insumos.map(i => [String(i.codigoSinapi || i.codigo || '').toUpperCase(), i]));
  let mudou = false;
  CPU_BIBLIOTECA.forEach(cpu => {
    (cpu.insumos || []).forEach(ins => {
      const ref = byCode.get(String(ins.cod || '').toUpperCase());
      if (!ref) return;
      ins.desc = ref.descricao || ins.desc;
      ins.unid = ref.unidade || ins.unid;
      ins.tipo = cpuTipoManual(ins.cod || ref.codigoSinapi || ref.codigo || ref.tipo || ins.tipo, ref.descricao || ins.desc || '');
      ins.preco = Number(ref.precoMedio) || Number(ins.preco) || 0;
      const improd = Number(ref.custoImprodutivo ?? ref.precoImprodutivo ?? ref.improdutivo ?? 0) || 0;
      if (improd) {
        ins.precoImprod = improd;
        ins.precoImprodutivo = improd;
      }
      mudou = true;
    });
    if (mudou) cpuRecalcularComposicaoSalva(cpu);
  });
  if (mudou) {
    cpuSaveLib();
    if (document.getElementById('cpu-biblioteca')) cpuRenderBiblioteca();
  }
}

async function iniciarExtracao() {
  const files = IMP.files.length ? IMP.files : (IMP.file ? [IMP.file] : []);
  if (!files.length) return;

  const somentePlanilhas = files.length > 0 && files.every(f => SPREADSHEET_EXTS.includes(getFileExt(f)));
  if (somentePlanilhas && !IMP.sheetMapping) {
    try {
      await prepararMapeamentoPlanilha(files);
    } catch (err) {
      toast('Erro ao mapear planilha: ' + err.message, 'error');
      document.getElementById('imp-card-progress').style.display = 'none';
      document.getElementById('imp-card-upload').style.display = 'block';
    }
    return;
  }

  // Show progress card
  document.getElementById('imp-card-upload').style.display = 'none';
  document.getElementById('imp-card-mapping').style.display = 'none';
  document.getElementById('imp-card-progress').style.display = 'block';
  document.getElementById('imp-card-review').style.display = 'none';

  const stepsHtml = [
    ['Lendo lote', `${files.length} arquivo(s)`],
    ['Extraindo linhas / OCR', 'Aguardando'],
    ['Normalizando itens', 'Aguardando'],
    ['Match com SINAPI', 'Aguardando'],
    ['Auditoria em loop', 'Aguardando'],
  ].map((s, i) => `<div class="imp-step" id="imp-step-${i}">
    <div class="imp-step-num">${i+1}</div>
    <div class="imp-step-text">${s[0]}</div>
    <div class="imp-step-status" style="color:var(--text3)">${s[1]}</div>
  </div>`).join('');
  document.getElementById('imp-steps').innerHTML = stepsHtml;

  setProgress(5, 'Iniciando...');
  await sleep(80);

  try {
    let items = [];
    let results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStep(null, 0, 'spin', `${i+1}/${files.length}`);
      setStep(null, 1, 'spin', file.name);
      setProgress(Math.min(15 + Math.round((i / files.length) * 55), 65), `Extraindo ${i+1}/${files.length}: ${file.name}`);

      const result = await extrairArquivoImportacao(file, i, files.length);
      results.push(result);
      items = items.concat(result.items);
    }

    IMP.rawItems = items;
    IMP.importResults = results;
    IMP.markdown = gerarMemoriaImportacao(results);

    if (!items.length) {
      throw new Error('Nenhum item orçamentário foi identificado. Verifique a qualidade do arquivo ou tente uma imagem/PDF com melhor resolução.');
    }

    setStep(null, 0, 'done', `${files.length} arquivo(s)`);
    setStep(null, 1, 'done', `${items.length} itens`);
    setStep(null, 2, 'spin', 'Preparando revisão...');
    setProgress(70, 'Normalizando itens...');
    await sleep(100);
    setStep(null, 2, 'done', 'OK');
    setProgress(80, 'Fazendo match com SINAPI...');
    await sleep(50);

    // Match SINAPI
    const matched = items.map(it => matchSINAPI(it));
    setStep(null, 3, 'done', `${matched.filter(r=>r.matchTipo==='ok').length} matches`);
    setStep(null, 4, 'spin', 'Validando itens...');
    setProgress(92, 'Rodando auditoria de extracao...');
    await sleep(80);
    const certified = certificarItensExtraidosLocal(matched, { modo: 'planilha', maxRodadas: 3 });
    IMP.reviewed = certified.itens;
    IMP.audit = certified.relatorio;
    setStep(null, 3, 'done', `${matched.filter(r=>r.matchTipo==='ok').length} matches`);
    setStep(null, 4, IMP.audit.bloqueado ? 'spin' : 'done', IMP.audit.bloqueado ? `${IMP.audit.bloqueado} bloqueado(s)` : 'Certificado');
    setProgress(100, 'Concluido com auditoria.');
    await sleep(200);

    mostrarRevisao();
  } catch(err) {
    setProgress(0, 'Erro: ' + err.message);
    toast('Erro na extração: ' + err.message, 'error');
    console.error(err);
  }
}

async function extrairArquivoImportacao(file, index = 0, total = 1) {
  const ext = getFileExt(file);
  let metodo = 'desconhecido';
  let items = [];
  let rawText = '';
  let aviso = '';

  if (ext === 'pdf') {
    metodo = 'PDF digital';
    try {
      items = await extrairDePDF(file);
    } catch (err) {
      aviso = `Falha na extração digital: ${err.message}`;
      items = [];
    }

    if (items.length < 1) {
      metodo = 'OCR';
      const ocr = await extrairDeOCRImportacao(file, index, total);
      items = ocr.items;
      rawText = ocr.text;
    }
  } else if (IMAGE_EXTS.includes(ext)) {
    metodo = 'OCR imagem';
    const ocr = await extrairDeOCRImportacao(file, index, total);
    items = ocr.items;
    rawText = ocr.text;
  } else if (SPREADSHEET_EXTS.includes(ext)) {
    metodo = 'Planilha';
    items = await extrairDeExcel(file);
  } else {
    throw new Error(`Formato não suportado: ${file.name}`);
  }

  items = items.map((it, itemIndex) => ({
    ...it,
    origemArquivo: file.name,
    origemMetodo: metodo,
    origemIndice: itemIndex + 1,
    origem: it.origem || metodo.toLowerCase()
  }));

  return { fileName: file.name, size: file.size, ext, metodo, aviso, items, rawText };
}

async function extrairDeOCRImportacao(file, fileIndex = 0, totalFiles = 1) {
  if (!window.Tesseract) {
    throw new Error('OCR indisponível: Tesseract.js não carregou.');
  }
  if (!window.pdfjsLib && getFileExt(file) === 'pdf') {
    throw new Error('PDF.js não carregou para converter o PDF escaneado.');
  }

  const lang = document.getElementById('ocr-lang')?.value || 'por';
  const psm = document.getElementById('ocr-mode')?.value || '6';
  const ext = getFileExt(file);
  let fullText = '';

  if (ext === 'pdf') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const pagIni = parseInt(document.getElementById('imp-pag-ini').value) || 1;
    const pagFimRaw = parseInt(document.getElementById('imp-pag-fim').value) || 0;
    const fim = pagFimRaw === 0 ? pdf.numPages : Math.min(pagFimRaw, pdf.numPages);

    for (let p = pagIni; p <= fim; p++) {
      const pctArquivo = (p - pagIni + 1) / Math.max(1, fim - pagIni + 1);
      const pctLote = (fileIndex + pctArquivo) / Math.max(1, totalFiles);
      setProgress(Math.min(20 + Math.round(pctLote * 50), 70), `OCR ${file.name} - página ${p}/${fim}`);

      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

      const result = await Tesseract.recognize(canvas, lang, { tessedit_pageseg_mode: psm });
      fullText += `\n\n--- Página ${p} ---\n${result.data.text}`;
      await sleep(20);
    }
  } else {
    setProgress(Math.min(20 + Math.round((fileIndex / Math.max(1, totalFiles)) * 50), 70), `OCR ${file.name}`);
    const result = await Tesseract.recognize(file, lang, {
      tessedit_pageseg_mode: psm,
      logger: m => {
        if (m.status === 'recognizing text') {
          const pctLote = (fileIndex + m.progress) / Math.max(1, totalFiles);
          setProgress(Math.min(20 + Math.round(pctLote * 50), 70), `OCR ${file.name}`);
        }
      }
    });
    fullText = result.data.text;
  }

  const items = parsearLinhas(fullText.split('\n')).map(it => ({ ...it, origem: 'ocr' }));
  return { items, text: fullText };
}

function gerarMemoriaImportacao(results) {
  const linhas = [
    '# Memória de Importação - TLPlanly',
    '',
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    '',
    '## Arquivos processados',
    ''
  ];

  results.forEach((r, idx) => {
    const count = (r.grupos?.length || 0) + (r.items?.length || 0) + (r.insumos?.length || 0) + (r.composicoes?.length || 0) || r.itemsCount || 0;
    linhas.push(`${idx + 1}. **${r.fileName || r.name || 'Documento'}** - ${r.metodo || 'Extração'} - ${count} registro(s)`);
    if (r.aviso) linhas.push(`   - Aviso: ${r.aviso}`);
    (r.issues || []).slice(0, 5).forEach(issue => linhas.push(`   - Validação: ${issue}`));
  });

  if (results.some(r => r.grupos?.length)) {
    linhas.push('', '## Grupos de custo importados', '');
    linhas.push('| Arquivo | Código | Nome | Tipo | Descrição |');
    linhas.push('|---|---:|---|---:|---|');
    results.forEach(r => {
      (r.grupos || []).forEach(g => {
        linhas.push(`| ${mdCell(r.fileName || r.name)} | ${mdCell(g.codigo || '-')} | ${mdCell(g.nome || '-')} | ${mdCell(g.tipo || '-')} | ${mdCell(g.descricao || '-')} |`);
      });
    });
  }

  linhas.push('', '## Itens extraídos', '');
  linhas.push('| Arquivo | Método | Código | Descrição | Unid. | Qtd. | Preço |');
  linhas.push('|---|---|---:|---|---:|---:|---:|');

  results.forEach(r => {
    (r.items || []).forEach(item => {
      linhas.push(`| ${mdCell(r.fileName || r.name)} | ${mdCell(r.metodo)} | ${mdCell(item.cod || '-')} | ${mdCell(item.desc || '-')} | ${mdCell(item.unid || 'UN')} | ${item.qtd || 0} | ${item.preco || 0} |`);
    });
  });

  if (results.some(r => r.insumos?.length)) {
    linhas.push('', '## Insumos importados para a base local', '');
    linhas.push('| Arquivo | Código | Tipo | Descrição | Unid. | Custo unitário |');
    linhas.push('|---|---:|---|---|---:|---:|');
    results.forEach(r => {
      (r.insumos || []).forEach(ins => {
        linhas.push(`| ${mdCell(r.fileName || r.name)} | ${mdCell(ins.codigoSinapi || ins.codigo || '-')} | ${mdCell(ins.tipo || '-')} | ${mdCell(ins.descricao || '-')} | ${mdCell(ins.unidade || 'UN')} | ${ins.precoMedio || ins.preco || 0} |`);
      });
    });
  }

  if (results.some(r => r.composicoes?.length)) {
    linhas.push('', '## Composições importadas para a biblioteca CPU', '');
    linhas.push('| Arquivo | CPU | Descrição | Unid. | Insumos vinculados | Custo unitário |');
    linhas.push('|---|---:|---|---:|---:|---:|');
    results.forEach(r => {
      (r.composicoes || []).forEach(cpu => {
        linhas.push(`| ${mdCell(r.fileName || r.name)} | ${mdCell(cpu.cod || '-')} | ${mdCell(cpu.desc || '-')} | ${mdCell(cpu.unid || 'UN')} | ${(cpu.insumos || []).length} | ${cpu.precoUnitario || 0} |`);
      });
    });
  }

  linhas.push('', '## Observação técnica', '');
  linhas.push('O Markdown é usado como memória de conferência e rastreabilidade. A importação operacional usa dados estruturados para preservar código, descrição, unidade, quantidade, preço, origem e vínculos entre insumos e composições.');

  return linhas.join('\n');
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function exportarMemoriaImportacao() {
  exportarMemoriaImportacaoExcel();
}

function memoriaImportacaoMarkdownAtual() {
  if (!IMP.markdown && IMP.importResults.length) IMP.markdown = gerarMemoriaImportacao(IMP.importResults);
  if (!IMP.markdown) {
    toast('Extraia os arquivos antes de gerar a memória em Excel/PDF.', 'error');
    return '';
  }
  return IMP.markdown;
}

function exportarMemoriaImportacaoExcel() {
  const md = memoriaImportacaoMarkdownAtual();
  if (!md) return;
  exportMarkdownToExcel(md, `memoria_importacao_tlplanly_${new Date().toISOString().slice(0,10)}`, 'Memória');
}

function exportarMemoriaImportacaoPDF() {
  const md = memoriaImportacaoMarkdownAtual();
  if (!md) return;
  exportMarkdownToPDF(md, 'Memória de Importação - TLPlanly', `memoria_importacao_tlplanly_${new Date().toISOString().slice(0,10)}`);
}

// ─── PDF PARSER ────────────────────────────────────────────
async function extrairDePDF(file) {
  setStep(null, 0, 'spin', 'Lendo...');
  setProgress(10, 'Carregando PDF...');

  // Configure worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const arrayBuffer = await file.arrayBuffer();
  setProgress(20, 'Parseando páginas...');

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pagIni = parseInt(document.getElementById('imp-pag-ini').value) || 1;
  const pagFim = parseInt(document.getElementById('imp-pag-fim').value) || pdf.numPages;
  const fim = pagFim === 0 ? pdf.numPages : Math.min(pagFim, pdf.numPages);

  setStep(null, 0, 'done', `${pdf.numPages} págs`);
  setStep(null, 1, 'spin', 'Extraindo...');

  let allLines = [];
  for (let p = pagIni; p <= fim; p++) {
    setProgress(20 + Math.floor((p-pagIni)/(fim-pagIni+1)*40), `Página ${p}/${fim}...`);
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();

    // Group items by Y position (same line = same row)
    const byY = {};
    tc.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!byY[y]) byY[y] = [];
      byY[y].push({ x: Math.round(item.transform[4]), text: item.str.trim() });
    });

    // Sort by Y descending (top to bottom), then by X
    const ys = Object.keys(byY).map(Number).sort((a,b)=>b-a);
    ys.forEach(y => {
      const rowItems = byY[y].sort((a,b)=>a.x-b.x);
      const line = rowItems.map(r=>r.text).join(' ').trim();
      if (line) allLines.push(line);
    });
    await sleep(10);
  }

  setStep(null, 1, 'done', `${allLines.length} linhas`);
  setProgress(65, 'Detectando padrão de planilha...');

  return parsearLinhas(allLines);
}

// ─── EXCEL PARSER ──────────────────────────────────────────
async function extrairDeExcel(file) {
  setStep(null, 0, 'spin', 'Lendo...');
  setProgress(15, 'Lendo arquivo Excel...');

  const sheets = await lerPlanilhasArquivo(file);
  const first = sheets[0];
  if (!first) return [];
  const raw = first.raw;

  setStep(null, 0, 'done', `${raw.length} linhas`);
  setStep(null, 1, 'spin', 'Detectando cabeçalho...');
  setProgress(40, 'Detectando colunas...');

  const sugestao = sheetSuggestMapping(raw, 'orcamento');
  const parsed = sheetParseMappedRows(raw, sugestao.mapping, 'orcamento', sugestao.headerRow);

  setStep(null, 1, 'done', sugestao.headerRow >= 0 ? `Cabeçalho L${sugestao.headerRow+1}` : 'Layout livre');
  setStep(null, 2, 'done', `${parsed.items.length} itens`);
  setProgress(70, 'Concluído');

  return parsed.items;
}

// ─── PDF LINE PARSER ───────────────────────────────────────
function parsearLinhas(lines) {
  const items = [];
  let buffer = null;
  let prefixoPendente = [];

  const processarLinha = (line, nextLine = '') => {
    const cleaned = String(line || '').replace(/\s+/g,' ').trim();
    if (!cleaned || cleaned.length < 4) return;

    if (linhaImportacaoIgnorada(cleaned)) {
      if (buffer) {
        const item = finalizarBuffer(buffer);
        if (item) items.push(item);
        buffer = null;
      }
      prefixoPendente = [];
      return;
    }

    const codMatch = linhaIniciaComCodigoImportacao(cleaned) ? cleaned.match(CODIGO_IMPORTACAO_RE) : null;
    if (codMatch) {
      if (buffer) {
        const item = finalizarBuffer(buffer);
        if (item) items.push(item);
      }
      const cod = (codMatch.slice(1).find(Boolean) || '').toUpperCase();
      buffer = { cod, desc: '', unid: 'UN', qtd: 1, preco: 0, origem: 'pdf', linhas: [cleaned], prefixo: prefixoPendente };
      prefixoPendente = [];
    } else if (buffer && linhaProvavelPrefixoProximoItemImportacao(cleaned, nextLine)) {
      const item = finalizarBuffer(buffer);
      if (item) items.push(item);
      buffer = null;
      prefixoPendente.push(cleaned);
      if (prefixoPendente.length > 4) prefixoPendente = prefixoPendente.slice(-4);
    } else if (buffer) {
      buffer.linhas.push(cleaned);
    } else if (linhaComplementarDescricaoImportacao(cleaned)) {
      prefixoPendente.push(cleaned);
      if (prefixoPendente.length > 4) prefixoPendente = prefixoPendente.slice(-4);
    }
  };

  const segmentos = [];
  lines.forEach(line => {
    const cleaned = String(line || '').replace(/\s+/g,' ').trim();
    segmentarLinhaImportacao(cleaned).forEach(segment => segmentos.push(segment));
  });
  segmentos.forEach((segment, idx) => {
    processarLinha(segment, segmentos[idx + 1] || '');
  });
  if (buffer) {
    const item = finalizarBuffer(buffer);
    if (item) items.push(item);
  }

  if (!items.length) {
    lines.forEach(line => {
      const cleaned = String(line || '').replace(/\s+/g,' ').trim();
      if (linhaImportacaoIgnorada(cleaned)) return;
      const parsed = parsearLinhaOrcamentaria(cleaned);
      if (parsed) { items.push(parsed); return; }
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 3) {
        const cod = limparCodigo(parts[0]);
        const desc = parts[1] || '';
        if (desc.length > 3) {
          const nums = extrairNumerosOperacionais(line).filter(n => n > 0);
          const preco = nums.length > 0 ? nums[nums.length-1] : 0;
          const qtd = nums.length > 1 ? nums[0] : 1;
          items.push({ cod, desc: desc.trim(), unid: 'UN', qtd: qtd||1, preco, origem:'pdf', linhaOrigem: cleaned, numerosOrigem: nums });
        }
      }
    });
  }

  return items.filter(i => i && i.desc && i.desc.length > 3 && !linhaImportacaoIgnorada(i.desc));
}

function segmentarLinhaImportacao(line) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const re = new RegExp(CODIGO_IMPORTACAO_RE.source, 'gi');
  const matches = [...cleaned.matchAll(re)].filter(m => m.index !== undefined && codigoImportacaoSegmentavel(cleaned, m));
  if (matches.length <= 1) return [cleaned];
  return matches.map((m, idx) => {
    const start = m.index || 0;
    const end = idx + 1 < matches.length ? (matches[idx + 1].index || cleaned.length) : cleaned.length;
    return cleaned.slice(start, end).trim();
  }).filter(Boolean);
}

function codigoImportacaoSegmentavel(line, match) {
  const token = match[0] || '';
  const index = match.index || 0;
  if (index === 0) return true;
  const prefix = line.slice(0, index);
  if (/^\d{1,3}\s+$/.test(prefix) && /^[A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2}$/i.test(token)) return true;
  const before = line.slice(Math.max(0, index - 40), index);
  return /(?:R\$\s*|\d{1,3}(?:\.\d{3})*,\d{2}\s*)$/.test(before);
}

function linhaIniciaComCodigoImportacao(line) {
  const match = String(line || '').match(CODIGO_IMPORTACAO_RE);
  if (!match || match.index === undefined) return false;
  if (match.index === 0) return true;
  const prefix = String(line || '').slice(0, match.index);
  return /^\d{1,3}\s+$/.test(prefix) && /^[A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2}$/i.test(match[0] || '');
}

function finalizarBuffer(buf) {
  const linhas = (buf.linhas || []).map(l => String(l || '').replace(/\s+/g,' ').trim()).filter(l => l && !linhaImportacaoIgnorada(l));
  if (!linhas.length) return null;
  const fullText = montarTextoBufferImportacao(linhas, buf.prefixo || []);
  const parsed = parsearLinhaOrcamentaria(fullText);
  if (parsed) return parsed;

  const nums = extrairNumerosOperacionais(fullText).filter(n => n > 0);
  let qtd = 1;
  let preco = 0;
  let totalLinha = 0;
  if (nums.length >= 3) {
    qtd = nums[nums.length - 3];
    preco = nums[nums.length - 2];
    totalLinha = nums[nums.length - 1];
  } else if (nums.length >= 2) {
    qtd = nums[nums.length - 2];
    preco = nums[nums.length - 1];
  }
  const unidades = [...fullText.matchAll(/\b(m2xmes|m2|m²|m³|m3|kg|kgf|t|vb|cj|un|unid|gl|hr|h|l|litro|mes|mês|ponto|km|m)\b/gi)];
  const unidMatch = unidades.length ? unidades[unidades.length - 1] : null;
  const unid = normalizarUnidadeImportacao(unidMatch ? unidMatch[1] : 'UN');
  let desc = fullText.replace(buf.cod, '').trim();
  desc = desc.replace(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?/g, ' ').replace(/\s+/g,' ').trim();
  desc = desc.replace(new RegExp(`\\b${unid}\\b`, 'i'), '').trim().substring(0, 220);
  if (!desc || linhaImportacaoIgnorada(desc)) return null;
  return { cod: buf.cod, desc, unid, qtd: qtd > 0 && qtd < 1e7 ? qtd : 1, preco, totalLinha, origem: 'pdf', linhaOrigem: fullText, numerosOrigem: nums };
}

function linhaComplementarDescricaoImportacao(line) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned.length < 3) return false;
  if (linhaImportacaoIgnorada(cleaned)) return false;
  if (linhaIniciaComCodigoImportacao(cleaned)) return false;
  if (/^\d{1,2}\s+[A-ZÀ-Ú\s/.()-]{3,60}$/.test(cleaned)) return false;
  return true;
}

function linhaProvavelPrefixoProximoItemImportacao(line, nextLine) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  const next = String(nextLine || '').replace(/\s+/g, ' ').trim();
  if (!linhaComplementarDescricaoImportacao(cleaned)) return false;
  if (!linhaIniciaComCodigoImportacao(next)) return false;
  if (linhaContinuidadeFinalItemImportacao(cleaned)) return false;
  return cleaned.length >= 20;
}

function linhaContinuidadeFinalItemImportacao(line) {
  const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return true;
  if (cleaned.length < 18) return true;
  if (new RegExp(ITEM_TAIL_IMPORT_RE.source, 'i').test(cleaned)) return true;
  if (/^AF_\d{2}\/\d{4}/i.test(cleaned)) return true;
  if (/AF_\d{2}\/\d{4}/i.test(cleaned) && cleaned.length <= 90) return true;
  if (/^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(cleaned)) return true;
  if (/^(?:M|MM|CM|KG|UN|M2|M3)\s*\.?\s*AF_/i.test(cleaned)) return true;
  return false;
}

function montarTextoBufferImportacao(linhas, prefixo = []) {
  const partes = (linhas || []).map(l => String(l || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const primeira = partes[0] || '';
  if (!primeira) return '';
  const complementos = [...(prefixo || []), ...partes.slice(1)].filter(linhaComplementarDescricaoImportacao);
  const extras = complementos.join(' ').trim();
  if (!extras) return primeira;

  const tails = [...primeira.matchAll(ITEM_TAIL_IMPORT_RE)];
  const tail = tails.length ? tails[tails.length - 1] : null;
  if (tail && tail.index !== undefined) {
    const antes = primeira.slice(0, tail.index).trim();
    const depois = primeira.slice(tail.index).trim();
    return `${antes} ${extras} ${depois}`.replace(/\s+/g, ' ').trim();
  }
  return `${primeira} ${extras}`.replace(/\s+/g, ' ').trim();
}

function limparCodigo(s) {
  return String(s).replace(/[^0-9A-Za-z.\-]/g,'').trim();
}

// ─── MATCH SINAPI ──────────────────────────────────────────
function matchSINAPI(item) {
  const allRefs = typeof getAllItems === 'function'
    ? getAllItems()
    : [...(STATE.insumosManuais || []), ...(STATE.insumosImportados || []), ...STATE.sinapiBase];
  const ref = allRefs.find(s => (s.codigoSinapi || s.codigo || '').toString().toUpperCase() === String(item.cod || '').toUpperCase());

  if (ref) {
    return { ...item, refSinapi: ref.precoMedio || ref.preco || 0, refDesc: ref.descricao, refUnid: ref.unidade, matchTipo: 'ok', matchFonte: ref._base || ref.fonte || 'Base', selecionado: true };
  }

  // Partial match by description keywords
  const words = item.desc.toUpperCase().split(/\s+/).filter(w => w.length > 4);
  let bestScore = 0, bestRef = null;
  allRefs.forEach(s => {
    const up = String(s.descricao || '').toUpperCase();
    let score = 0;
    words.forEach(w => { if (up.includes(w)) score++; });
    if (score > bestScore && score >= 2) { bestScore = score; bestRef = s; }
  });

  if (bestRef) {
    return { ...item, refSinapi: bestRef.precoMedio || bestRef.preco || 0, refDesc: bestRef.descricao, refUnid: bestRef.unidade,
             sugestao: bestRef.codigoSinapi || bestRef.codigo, matchTipo: 'parcial', selecionado: true };
  }

  return { ...item, refSinapi: 0, matchTipo: 'nenhum', selecionado: true };
}

// ─── REVISÃO UI ────────────────────────────────────────────
function mostrarRevisao() {
  document.getElementById('imp-card-progress').style.display = 'none';
  document.getElementById('imp-card-review').style.display = 'block';
  if (IMP.origemRapida === 'elaborar') {
    const acao = document.getElementById('imp-acao');
    const preco = document.getElementById('imp-preco-src');
    if (acao) acao.value = STATE.orcamento.length ? 'adicionar' : 'substituir';
    if (preco) preco.value = 'edital';
  }
  filtrarRevisao('todos');
  atualizarStatsRevisao();
  renderCertResumo(IMP.audit);
  persistirImportacaoComoExtracao();
}

function persistirImportacaoComoExtracao(status = '') {
  if (!IMP.reviewed.length && !IMP.importResults.length) return;
  const atual = STATE.extracoes.find(e => e.id === IMP.extracaoId);
  const docs = (IMP.importResults || []).map(r => docsCompactDoc({
    ...r,
    fileName: r.fileName || r.name,
    tipo: r.tipo || (SPREADSHEET_EXTS.includes(r.ext) ? 'Planilha Orçamentária' : 'Documento Técnico'),
    confianca: r.confianca || (r.metodo && /ocr/i.test(r.metodo) ? 72 : 86),
    itemsCount: (r.grupos?.length || 0) + (r.items?.length || 0) + (r.insumos?.length || 0) + (r.composicoes?.length || 0) || r.itemsCount || 0,
    text: r.rawText || r.textPreview || ''
  }));
  IMP.extracaoId = docsPersistirExtracao({
    id: IMP.extracaoId || '',
    tipo: 'importacao',
    titulo: `Importação de ${docs.length || 1} arquivo(s)`,
    status: status || atual?.status || 'pendente',
    enviadoEm: atual?.enviadoEm || '',
    docs,
    items: IMP.rawItems,
    reviewed: IMP.reviewed,
    audit: IMP.audit,
    memoria: IMP.markdown || gerarMemoriaImportacao(IMP.importResults)
  });
}

function filtrarRevisao(f) {
  IMP.filtro = f;
  ['todos','ok','parcial','nenhum','aprovado','pendente','bloqueado'].forEach(id => {
    const btn = document.getElementById('rfilt-'+id);
    if (btn) btn.style.borderColor = id === f ? 'var(--gold)' : '';
    if (btn) btn.style.color = id === f ? 'var(--gold)' : '';
  });
  renderRevisao();
}

function renderRevisao() {
  const certFilters = ['aprovado','corrigido','pendente','bloqueado'];
  const lista = IMP.filtro === 'todos' ? IMP.reviewed
    : certFilters.includes(IMP.filtro)
      ? IMP.reviewed.filter(r => (r.certStatus || 'pendente') === IMP.filtro || (IMP.filtro === 'aprovado' && r.certStatus === 'corrigido'))
      : IMP.reviewed.filter(r => r.matchTipo === IMP.filtro);

  const el = document.getElementById('imp-rev-lista');
  if (!lista.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text3)">Nenhum item neste filtro</div>';
    return;
  }

  el.innerHTML = lista.map((r, i) => {
    const globalIdx = IMP.reviewed.indexOf(r);
    const matchLabel = r.matchTipo==='ok' ? '<span class="rev-match rev-match-ok">✓ Match</span>'
      : r.matchTipo==='parcial' ? '<span class="rev-match rev-match-partial">~ Parcial</span>'
      : '<span class="rev-match rev-match-none">✗ Sem match</span>';

    const refCol = r.refSinapi > 0
      ? `<span style="color:var(--gold);font-weight:700">${fmtMoeda(r.refSinapi)}</span>`
      : '<span style="color:var(--text3)">—</span>';

    const sugestaoHtml = r.matchTipo === 'parcial'
      ? `<div style="font-size:10px;color:var(--gold);margin-top:2px">Sugestão: ${r.sugestao} — ${r.refDesc?.substring(0,50)}</div>`
      : '';
    const origemHtml = r.origemArquivo
      ? `<div style="font-size:10px;color:var(--text3);margin-top:2px">Origem: ${escapeHtml(r.origemArquivo)}${r.origemMetodo ? ' · ' + escapeHtml(r.origemMetodo) : ''}</div>`
      : '';
    const certHtml = certBadge(r.certStatus);
    const certMotivos = (r.certMotivos || []).slice(0, 2).map(escapeHtml).join(' ');
    const certInfo = certMotivos
      ? `<div style="font-size:10px;color:${r.certStatus === 'bloqueado' ? 'var(--red)' : 'var(--text3)'};margin-top:2px">${certMotivos}</div>`
      : '';
    const locked = r.certStatus === 'bloqueado';

    return `<div class="rev-row ${locked ? 'rev-row-blocked' : ''}">
      <input type="checkbox" ${r.selecionado && !locked?'checked':''} ${locked ? 'disabled' : ''} onchange="IMP.reviewed[${globalIdx}].selecionado=this.checked;atualizarStatsRevisao()"/>
      <span style="width:80px;font-family:monospace;font-size:11px;color:var(--gold);flex-shrink:0">${r.cod||'—'}</span>
      <span style="flex:1;min-width:0">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${r.desc}">${r.desc}</div>
        ${sugestaoHtml}
        ${origemHtml}
        ${certInfo}
      </span>
      <span style="width:45px;flex-shrink:0;color:var(--text2)">${r.unid}</span>
      <span style="width:60px;flex-shrink:0;color:var(--text2)">${fmtNum(r.qtd)}</span>
      <span style="width:80px;flex-shrink:0">${r.preco > 0 ? fmtMoeda(r.preco) : '<span style="color:var(--text3)">—</span>'}</span>
      <span style="width:80px;flex-shrink:0">${refCol}</span>
      <span style="width:75px;flex-shrink:0">${matchLabel}</span>
      <span style="width:100px;flex-shrink:0">${certHtml}</span>
    </div>`;
  }).join('');
}

function selecionarTodosRev(sel) {
  IMP.reviewed.forEach(r => { r.selecionado = r.certStatus === 'bloqueado' ? false : sel; });
  renderRevisao();
  atualizarStatsRevisao();
}

function atualizarStatsRevisao() {
  const sel = IMP.reviewed.filter(r=>r.selecionado).length;
  const ok = IMP.reviewed.filter(r=>r.matchTipo==='ok').length;
  const parcial = IMP.reviewed.filter(r=>r.matchTipo==='parcial').length;
  const nenhum = IMP.reviewed.filter(r=>r.matchTipo==='nenhum').length;
  const bloqueados = IMP.reviewed.filter(r=>r.certStatus==='bloqueado').length;
  document.getElementById('imp-rev-stats').textContent =
    `${sel} selecionados | ${ok} match | ${parcial} parcial | ${nenhum} sem match | ${bloqueados} bloqueado(s)`;
  renderCertResumo(IMP.audit);
}

function confirmarImportacao(destino = STATE.mode === 'auditor' ? 'auditoria' : 'elaborar') {
  const recert = certificarItensExtraidosLocal(IMP.reviewed, { modo: 'planilha', maxRodadas: 2 });
  IMP.reviewed = recert.itens;
  IMP.audit = recert.relatorio;
  const bloqueadosSelecionados = IMP.reviewed.filter(r => r.selecionado && r.certStatus === 'bloqueado');
  if (bloqueadosSelecionados.length) {
    renderRevisao();
    atualizarStatsRevisao();
    toast(`${bloqueadosSelecionados.length} item(ns) bloqueado(s). Revise os motivos antes de enviar ao orçamento.`, 'error');
    return;
  }
  const selecionados = IMP.reviewed.filter(r => r.selecionado && r.certStatus !== 'bloqueado');
  if (!selecionados.length) { toast('Selecione pelo menos 1 item', 'error'); return; }

  const cat = document.getElementById('imp-cat').value;
  const precoSrc = document.getElementById('imp-preco-src').value;
  const acao = document.getElementById('imp-acao').value;

  const novos = selecionados.map(r => {
    let preco = r.preco;
    if (precoSrc === 'sinapi' && r.refSinapi > 0) preco = r.refSinapi;
    if (precoSrc === 'menor') preco = r.refSinapi > 0 ? Math.min(r.preco||Infinity, r.refSinapi) : r.preco;

    // Use suggested SINAPI code if partial match and no original code
    const cod = r.cod || r.sugestao || 'IMP';
    return {
      id: makeId('orc'),
      cod,
      desc: r.desc,
      unid: normalizarUnidadeImportacao(r.unid),
      qtd: r.qtd,
      preco: preco||0,
      ref: r.refSinapi||0,
      cat,
      capitulo: cat,
      origemArquivo: r.origemArquivo || '',
      origemMetodo: r.origemMetodo || '',
      certStatus: r.certStatus,
      certScore: r.certScore,
      certMotivos: r.certMotivos || [],
      totalLinha: r.totalLinha || 0
    };
  });

  if (acao === 'substituir') {
    STATE.orcamento = novos;
    STATE.descontoProposta = null;
  } else {
    STATE.orcamento = [...STATE.orcamento, ...novos];
    invalidarDescontoPregao('itens importados ao orçamento');
  }

  if (IMP.extracaoId) docsMarcarExtracaoEnviada(IMP.extracaoId, IMP.reviewed);
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();

  const alvo = destino === 'auditoria' ? 'auditoria' : 'elaborar';
  const destinoLabel = alvo === 'auditoria' ? 'Auditoria' : 'Elaboração';
  const pendentes = selecionados.filter(r => r.certStatus === 'pendente').length;
  toast(`${novos.length} itens importados e enviados para ${destinoLabel}.${pendentes ? ' Ha itens pendentes para validacao manual.' : ''}`, pendentes ? 'info' : 'success');
  IMP.origemRapida = '';
  showView(alvo);
}

// ═══════════════════════════════════════════════════════════
// ANALISADOR DE DOCUMENTOS DA OBRA
// ═══════════════════════════════════════════════════════════
let ANALISADOR = {
  files: [],
  docs: [],
  services: [],
  escopo: [],
  especificacoes: [],
  memoria: '',
  audit: null,
  extracaoId: ''
};

const ANALISADOR_CATALOGO = [
  { desc:'Administração local da obra', unid:'mês', cat:'Serviços', keywords:['administração local','administracao local','engenheiro residente','mestre de obras','equipe técnica'], comp:['Engenheiro civil','Mestre de obras','Técnico de segurança','Apoio administrativo'] },
  { desc:'Canteiro de obras e serviços preliminares', unid:'m²', cat:'Serviços', keywords:['canteiro','barracão','tapume','placa de obra','instalação provisória','serviços preliminares'], comp:['Tapume','Placa de obra','Barracão provisório','Instalações provisórias'] },
  { desc:'Demolições e remoções', unid:'m²', cat:'Serviços', keywords:['demolição','demolicao','remoção','remocao','retirada','bota fora'], comp:['Mão de obra de demolição','Caçamba','Transporte de entulho','Equipamento manual'] },
  { desc:'Movimento de terra e escavação', unid:'m³', cat:'Serviços', keywords:['escavação','escavacao','aterro','reaterro','terraplenagem','movimento de terra'], comp:['Escavação manual/mecânica','Reaterro compactado','Transporte de material','Compactador'] },
  { desc:'Fundações rasas em concreto', unid:'m³', cat:'Serviços', keywords:['fundação','fundacao','sapata','baldrame','bloco de fundação','radier'], comp:['Concreto','Forma','Armadura CA-50','Escavação','Lastro'] },
  { desc:'Estrutura de concreto armado', unid:'m³', cat:'Serviços', keywords:['estrutura','concreto armado','pilar','viga','laje','armação','armacao'], comp:['Concreto usinado','Aço CA-50/CA-60','Forma de madeira','Escoramento','Mão de obra estrutural'] },
  { desc:'Alvenaria de vedação', unid:'m²', cat:'Serviços', keywords:['alvenaria','tijolo','bloco cerâmico','bloco de concreto','parede'], comp:['Bloco cerâmico/concreto','Argamassa de assentamento','Pedreiro','Servente'] },
  { desc:'Cobertura e telhamento', unid:'m²', cat:'Serviços', keywords:['cobertura','telha','telhamento','rufo','calha','estrutura metálica de cobertura'], comp:['Telhas','Madeiramento ou estrutura metálica','Rufos','Calhas','Fixadores'] },
  { desc:'Revestimento de paredes e tetos', unid:'m²', cat:'Serviços', keywords:['chapisco','emboço','reboco','revestimento','argamassa','massa única'], comp:['Argamassa','Cimento','Areia','Pedreiro','Servente'] },
  { desc:'Pisos e pavimentações internas', unid:'m²', cat:'Serviços', keywords:['piso','contrapiso','cerâmica','porcelanato','granilite','rodapé'], comp:['Contrapiso','Revestimento de piso','Argamassa colante','Rejunte','Rodapé'] },
  { desc:'Pintura e acabamento', unid:'m²', cat:'Serviços', keywords:['pintura','tinta','selador','massa corrida','acabamento'], comp:['Selador','Massa corrida','Tinta acrílica/PVA','Pintor','Lixa'] },
  { desc:'Esquadrias e ferragens', unid:'un', cat:'Serviços', keywords:['porta','janela','esquadria','alumínio','vidro','ferragem'], comp:['Portas','Janelas','Vidros','Ferragens','Instalação'] },
  { desc:'Instalações elétricas', unid:'ponto', cat:'Serviços', keywords:['instalação elétrica','instalacao eletrica','tomada','interruptor','quadro de distribuição','eletroduto','luminária'], comp:['Eletroduto','Cabos','Quadro elétrico','Disjuntores','Tomadas e interruptores','Luminárias'] },
  { desc:'Instalações hidrossanitárias', unid:'ponto', cat:'Serviços', keywords:['hidrossanitária','hidrossanitaria','água fria','agua fria','esgoto','louça sanitária','bacia sanitária','lavatório'], comp:['Tubos PVC/PPR','Conexões','Registros','Louças e metais','Mão de obra hidráulica'] },
  { desc:'Drenagem pluvial', unid:'m', cat:'Serviços', keywords:['drenagem','águas pluviais','aguas pluviais','sarjeta','canaleta','tubo de drenagem'], comp:['Tubo de drenagem','Caixa de passagem','Canaleta','Escavação','Reaterro'] },
  { desc:'Pavimentação externa', unid:'m²', cat:'Serviços', keywords:['pavimentação','pavimentacao','calçamento','calcamento','intertravado','asfalto','passeio'], comp:['Base compactada','Piso intertravado/asfalto','Meio-fio','Areia de assentamento','Compactação'] },
  { desc:'Limpeza final da obra', unid:'m²', cat:'Serviços', keywords:['limpeza final','limpeza da obra','entrega da obra','desmobilização'], comp:['Servente','Material de limpeza','Remoção de resíduos'] }
];

function analisadorFileSelect(e) {
  analisadorSetFiles(Array.from(e.target.files || []));
  e.target.value = '';
}

function analisadorDrop(e) {
  e.preventDefault();
  document.getElementById('anaUploadZone')?.classList.remove('dragover');
  analisadorSetFiles(Array.from(e.dataTransfer?.files || []));
}

function analisadorSetFiles(files) {
  const validos = files.filter(f => IMPORT_EXTS.includes(getFileExt(f)));
  if (!validos.length) { toast('Selecione documentos em PDF, imagem, Excel ou CSV.', 'error'); return; }
  ANALISADOR.files = validos;
  analisadorRenderFiles();
  analisadorRender();
}

function analisadorRenderFiles() {
  const el = document.getElementById('ana-file-chip');
  if (!el) return;
  if (!ANALISADOR.files.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${ANALISADOR.files.map((f, idx) => `<div class="file-chip">${getImportFileIcon(f)} <span>${escapeHtml(f.name)}</span> <span style="color:var(--text3)">(${(f.size/1024).toFixed(0)} KB)</span> <span class="chip-remove" onclick="analisadorRemoverArquivo(${idx})">×</span></div>`).join('')}
    </div>
    <small style="display:block;margin-top:4px;color:var(--text3)">${ANALISADOR.files.length} documento(s) aguardando análise.</small>`;
}

function analisadorRemoverArquivo(idx) {
  ANALISADOR.files.splice(idx, 1);
  analisadorRenderFiles();
  analisadorRender();
}

function analisadorLimpar() {
  ANALISADOR = { files: [], docs: [], services: [], escopo: [], especificacoes: [], memoria: '', audit: null, extracaoId: '' };
  const input = document.getElementById('anaFileInput');
  if (input) input.value = '';
  analisadorRenderFiles();
  analisadorRender();
}

function setAnaProgress(pct, label) {
  const card = document.getElementById('ana-progress-card');
  if (card) card.style.display = 'block';
  const fill = document.getElementById('ana-progress-fill');
  const pctEl = document.getElementById('ana-progress-pct');
  const labelEl = document.getElementById('ana-progress-label');
  if (fill) fill.style.width = pct + '%';
  if (pctEl) pctEl.textContent = pct + '%';
  if (labelEl) labelEl.textContent = label;
}

async function analisadorProcessar() {
  if (!ANALISADOR.files.length) { toast('Anexe os documentos da obra primeiro.', 'error'); return; }
  ANALISADOR.docs = [];
  ANALISADOR.services = [];
  ANALISADOR.escopo = [];
  ANALISADOR.especificacoes = [];
  ANALISADOR.memoria = '';

  try {
    for (let i = 0; i < ANALISADOR.files.length; i++) {
      const file = ANALISADOR.files[i];
      setAnaProgress(Math.round((i / ANALISADOR.files.length) * 65), `Lendo ${i+1}/${ANALISADOR.files.length}: ${file.name}`);
      const doc = await analisadorExtrairDocumento(file, i, ANALISADOR.files.length);
      ANALISADOR.docs.push(doc);
    }

    setAnaProgress(72, 'Classificando documentos e extraindo escopo...');
    const textos = ANALISADOR.docs.map(d => d.text).join('\n\n');
    ANALISADOR.escopo = analisadorExtrairEscopo(textos);
    ANALISADOR.especificacoes = analisadorExtrairEspecificacoes(textos);

    setAnaProgress(84, 'Gerando serviços e composições preliminares...');
    ANALISADOR.services = analisadorGerarServicos(ANALISADOR.docs);
    const cert = certificarItensExtraidosLocal(ANALISADOR.services, { modo: 'estimativa', maxRodadas: 2 });
    ANALISADOR.services = cert.itens;
    ANALISADOR.audit = cert.relatorio;
    ANALISADOR.memoria = analisadorGerarMemoria();
    ANALISADOR.extracaoId = docsPersistirExtracao({
      id: ANALISADOR.extracaoId || '',
      tipo: 'analisador',
      titulo: `Análise de ${ANALISADOR.docs.length} documento(s) da obra`,
      status: 'pendente',
      docs: ANALISADOR.docs.map(d => docsCompactDoc(d)),
      services: ANALISADOR.services,
      audit: ANALISADOR.audit,
      escopo: ANALISADOR.escopo,
      especificacoes: ANALISADOR.especificacoes,
      memoria: ANALISADOR.memoria
    });

    setAnaProgress(100, 'Análise concluída.');
    analisadorRender();
    toast(`${ANALISADOR.services.length} serviços sugeridos para revisão.`, 'success');
  } catch(err) {
    setAnaProgress(0, 'Erro: ' + err.message);
    toast('Erro na análise: ' + err.message, 'error');
    console.error(err);
  }
}

async function analisadorExtrairDocumento(file, index, total) {
  const ext = getFileExt(file);
  let text = '';
  let metodo = 'Texto';
  let items = [];

  if (SPREADSHEET_EXTS.includes(ext)) {
    metodo = 'Planilha';
    text = await analisadorTextoPlanilha(file);
    items = await extrairDeExcel(file);
  } else if (ext === 'pdf') {
    metodo = 'PDF digital';
    text = await analisadorTextoPDF(file);
    items = parsearLinhas(text.split('\n'));
    if (text.replace(/\s+/g, '').length < 250) {
      metodo = 'OCR PDF';
      const ocr = await analisadorOCR(file, index, total);
      text = ocr;
      items = parsearLinhas(text.split('\n'));
    }
  } else if (IMAGE_EXTS.includes(ext)) {
    metodo = 'OCR imagem';
    text = await analisadorOCR(file, index, total);
    items = parsearLinhas(text.split('\n'));
  } else {
    throw new Error(`Formato não suportado: ${file.name}`);
  }

  const tipo = analisadorClassificarDocumento(file.name, text, ext);
  return {
    id: makeId('docana'),
    fileName: file.name,
    size: file.size,
    ext,
    metodo,
    tipo: tipo.tipo,
    confianca: tipo.confianca,
    text,
    items
  };
}

async function analisadorTextoPDF(file) {
  if (!window.pdfjsLib) throw new Error('PDF.js não carregou.');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const txt = content.items.map(i => i.str).join(' ');
    pages.push(`--- Página ${p} ---\n${txt}`);
    setAnaProgress(Math.min(65, Math.round((p / Math.max(1, pdf.numPages)) * 55)), `Extraindo texto PDF página ${p}/${pdf.numPages}`);
  }
  return pages.join('\n');
}

async function analisadorTextoPlanilha(file) {
  if (!window.XLSX) throw new Error('SheetJS não carregou.');
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type:'array' });
  return wb.SheetNames.map(name => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header:1, defval:'' });
    return `--- Aba ${name} ---\n` + rows.map(r => r.join(' | ')).join('\n');
  }).join('\n\n');
}

async function analisadorOCR(file, index, total) {
  if (!window.Tesseract) throw new Error('OCR indisponível: Tesseract.js não carregou.');
  const ext = getFileExt(file);
  let fullText = '';
  const lang = 'por';

  if (ext === 'pdf') {
    if (!window.pdfjsLib) throw new Error('PDF.js não carregou para converter o PDF escaneado.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2.1 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      setAnaProgress(Math.min(75, 20 + Math.round(((index + p / pdf.numPages) / Math.max(1, total)) * 55)), `OCR ${file.name} página ${p}/${pdf.numPages}`);
      const result = await Tesseract.recognize(canvas, lang, { tessedit_pageseg_mode:'6' });
      fullText += `\n--- Página ${p} ---\n${result.data.text}`;
    }
  } else {
    const result = await Tesseract.recognize(file, lang, {
      tessedit_pageseg_mode:'6',
      logger: m => {
        if (m.status === 'recognizing text') {
          setAnaProgress(Math.min(75, 20 + Math.round(((index + m.progress) / Math.max(1, total)) * 55)), `OCR ${file.name}`);
        }
      }
    });
    fullText = result.data.text;
  }
  return fullText;
}

function analisadorClassificarDocumento(fileName, text, ext) {
  const norm = copilotNormText(fileName + ' ' + text.slice(0, 8000));
  const rules = [
    ['Termo de Referência', ['termo de referencia','tr','objeto da contratacao','justificativa da contratacao']],
    ['ETP', ['estudo tecnico preliminar','etp','necessidade da contratacao','alternativas possiveis']],
    ['Projeto Básico', ['projeto basico','solucao escolhida','elementos tecnicos','criterios de medicao']],
    ['Edital', ['edital','licitacao','concorrencia','pregao','habilitacao','proposta comercial']],
    ['Memorial Descritivo', ['memorial descritivo','especificacao tecnica','acabamento','materiais empregados']],
    ['Projetos / Pranchas', ['planta baixa','corte','fachada','prancha','escala','detalhe construtivo']],
    ['Planilha Orçamentária', ['planilha orcamentaria','codigo','quantidade','preco unitario','bdi']]
  ];
  if (SPREADSHEET_EXTS.includes(ext)) return { tipo:'Planilha Orçamentária', confianca:90 };
  let best = { tipo:'Documento Técnico', confianca:45, hits:0 };
  rules.forEach(([tipo, keys]) => {
    const hits = keys.filter(k => norm.includes(k)).length;
    if (hits > best.hits) best = { tipo, confianca: Math.min(95, 50 + hits * 12), hits };
  });
  return best;
}

function analisadorExtrairEscopo(text) {
  const lines = text.split(/\n|(?<=\.)\s+/).map(l => l.trim()).filter(l => l.length > 30);
  const keys = ['objeto','escopo','execução de','execucao de','contratação de','contratacao de','obra de','reforma','construção','construcao','ampliação','ampliacao'];
  return lines.filter(l => keys.some(k => copilotNormText(l).includes(copilotNormText(k)))).slice(0, 8);
}

function analisadorExtrairEspecificacoes(text) {
  const lines = text.split(/\n|(?<=\.)\s+/).map(l => l.trim()).filter(l => l.length > 25);
  const keys = ['material','acabamento','pintura','cerâmica','ceramica','concreto','argamassa','esquadria','cobertura','telha','instalação','instalacao','norma','abnt'];
  return lines.filter(l => keys.some(k => copilotNormText(l).includes(copilotNormText(k)))).slice(0, 10);
}

function analisadorGerarServicos(docs) {
  const allText = docs.map(d => d.text).join('\n\n');
  const norm = copilotNormText(allText);
  const area = analisadorExtrairArea(allText);
  const explicit = [];
  docs.forEach(d => {
    (d.items || []).forEach(it => {
      if (!it.desc || it.desc.length < 4) return;
      const m = matchSINAPI(it);
      explicit.push(analisadorServicoFromMatch({
        desc: it.desc,
        unid: it.unid || 'UN',
        qtd: Number(it.qtd) || 1,
        preco: Number(it.preco) || 0,
        cod: it.cod || '',
        cat: 'Serviços',
        origem: d.fileName,
        metodo: 'Item explícito na planilha/documento',
        composicao: ['Item extraído diretamente do documento'],
        pendencias: [],
        baseConf: m.matchTipo === 'ok' ? 92 : 76
      }, m));
    });
  });

  const inferred = ANALISADOR_CATALOGO
    .map((svc, idx) => {
      const hits = svc.keywords.filter(k => norm.includes(copilotNormText(k)));
      if (!hits.length) return null;
      const qtdInfo = analisadorEstimativaQtd(svc, allText, area);
      const m = matchSINAPI({ cod:'', desc:svc.desc, unid:svc.unid, qtd:qtdInfo.qtd, preco:0, origem:'analisador' });
      const pendencias = [];
      if (!qtdInfo.explicita) pendencias.push('quantidade estimada; validar por projeto/memória de cálculo');
      if (m.matchTipo === 'nenhum') pendencias.push('sem referência SINAPI automática; escolher composição/base manualmente');
      const baseConf = 42 + hits.length * 9 + (qtdInfo.explicita ? 18 : 0) + (m.matchTipo === 'ok' ? 22 : m.matchTipo === 'parcial' ? 12 : 0);
      return analisadorServicoFromMatch({
        desc: svc.desc,
        unid: svc.unid,
        qtd: qtdInfo.qtd,
        preco: 0,
        cod: '',
        cat: svc.cat,
        origem: hits.join(', '),
        metodo: 'Inferido por especificação/projeto',
        composicao: svc.comp,
        pendencias,
        baseConf
      }, m, idx);
    })
    .filter(Boolean);

  return analisadorDedupServicos([...explicit, ...inferred]).slice(0, 80);
}

function analisadorServicoFromMatch(base, match, idx = 0) {
  const cod = base.cod || match.sugestao || '';
  const preco = Number(base.preco) || Number(match.refSinapi) || 0;
  const confidence = Math.max(25, Math.min(98, Math.round(base.baseConf || 50)));
  return {
    id: makeId('anasvc'),
    selecionado: true,
    cod: cod || `EST-${String(idx + 1).padStart(3,'0')}`,
    desc: base.desc,
    unid: match.refUnid || base.unid || 'UN',
    qtd: base.qtd,
    preco,
    ref: Number(match.refSinapi) || 0,
    refDesc: match.refDesc || '',
    matchTipo: match.matchTipo || 'nenhum',
    cat: base.cat || 'Serviços',
    origem: base.origem || '',
    metodo: base.metodo || '',
    composicao: base.composicao || [],
    pendencias: base.pendencias || [],
    confidence
  };
}

function analisadorDedupServicos(list) {
  const seen = new Map();
  list.forEach(s => {
    const key = copilotNormText((s.cod && !s.cod.startsWith('EST-') ? s.cod : '') + ' ' + s.desc).slice(0, 90);
    const current = seen.get(key);
    if (!current || s.confidence > current.confidence) seen.set(key, s);
  });
  return [...seen.values()].sort((a,b) => b.confidence - a.confidence);
}

function analisadorExtrairArea(text) {
  const nums = [...text.matchAll(/(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:\.\d+)?)\s*(m²|m2|metros quadrados)/gi)]
    .map(m => Number(String(m[1]).replace(/\./g,'').replace(',','.')))
    .filter(n => n > 5 && n < 100000);
  return nums.length ? Math.max(...nums) : 1;
}

function analisadorEstimativaQtd(svc, text, area) {
  const norm = copilotNormText(text);
  const explicit = svc.keywords.map(k => analisadorQtdProxima(text, k, svc.unid)).find(v => v > 0);
  if (explicit) return { qtd: explicit, explicita:true };
  if (['m²','m2'].includes(String(svc.unid).toLowerCase())) return { qtd: area || 1, explicita: area > 1 };
  if (['m³','m3'].includes(String(svc.unid).toLowerCase())) return { qtd: Math.max(1, Math.round((area || 1) * 0.08 * 100) / 100), explicita:false };
  if (svc.unid === 'mês') return { qtd: norm.includes('prazo') ? 1 : 1, explicita:false };
  return { qtd: 1, explicita:false };
}

function analisadorQtdProxima(text, keyword, unid) {
  const idx = copilotNormText(text).indexOf(copilotNormText(keyword));
  if (idx < 0) return 0;
  const trecho = text.slice(Math.max(0, idx - 160), idx + 220);
  const unit = String(unid || '').replace('²','[²2]').replace('³','[³3]');
  const re = new RegExp('(\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?|\\d+(?:\\.\\d+)?)\\s*(' + unit + '|m²|m2|m³|m3|m|un|ponto|mês|mes)', 'i');
  const m = trecho.match(re);
  if (!m) return 0;
  const n = Number(String(m[1]).replace(/\./g,'').replace(',','.'));
  return Number.isFinite(n) ? n : 0;
}

function analisadorRender() {
  const docs = ANALISADOR.docs || [];
  const services = ANALISADOR.services || [];
  const selected = services.filter(s => s.selecionado).length;
  const avg = services.length ? Math.round(services.reduce((s,i)=>s+i.confidence,0)/services.length) : 0;
  const pend = services.filter(s => s.pendencias?.length).length;
  setText('ana-kpi-docs', docs.length);
  setText('ana-kpi-serv', services.length);
  setText('ana-kpi-conf', avg + '%');
  setText('ana-kpi-pend', pend);
  setText('ana-review-stats', `${selected} selecionados | ${services.length} sugeridos | ${pend} com pendência`);
  renderCertResumo(ANALISADOR.audit, 'ana-audit-summary');
  analisadorRenderDocs();
  analisadorRenderEscopo();
  analisadorRenderServicos();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function analisadorRenderDocs() {
  const el = document.getElementById('ana-docs-list');
  if (!el) return;
  if (!ANALISADOR.docs.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px">Nenhum documento analisado.</div>';
    return;
  }
  el.innerHTML = ANALISADOR.docs.map(d => `<div class="op-row">
    <div class="op-row-main">
      <div class="op-title">${escapeHtml(d.fileName)}</div>
      <div class="op-meta">${escapeHtml(d.tipo)} · ${escapeHtml(d.metodo)} · ${(d.size/1024).toFixed(0)} KB · ${d.items.length} item(ns) explícito(s)</div>
    </div>
    <div class="op-value">${d.confianca}%</div>
  </div>`).join('');
}

function analisadorRenderEscopo() {
  const escopo = document.getElementById('ana-escopo');
  const specs = document.getElementById('ana-especificacoes');
  if (escopo) escopo.innerHTML = ANALISADOR.escopo.length
    ? '<strong>Escopo identificado:</strong><br>' + ANALISADOR.escopo.map(x => '• ' + escapeHtml(x)).join('<br>')
    : 'Aguardando análise dos documentos.';
  if (specs) specs.innerHTML = ANALISADOR.especificacoes.length
    ? '<strong>Especificações relevantes:</strong><br>' + ANALISADOR.especificacoes.map(x => '• ' + escapeHtml(x)).join('<br>')
    : '';
}

function analisadorRenderServicos() {
  const el = document.getElementById('ana-services-list');
  if (!el) return;
  if (!ANALISADOR.services.length) {
    el.innerHTML = '<div class="empty-state" style="padding:24px">A análise vai listar serviços sugeridos, confiança, referência SINAPI e composição preliminar.</div>';
    return;
  }
  el.innerHTML = `<div class="ana-service" style="font-size:11px;font-weight:800;color:var(--text3);text-transform:uppercase">
    <span></span><span>Serviço</span><span>Qtd/Un</span><span>Preço</span><span>Confiança</span><span>Composição / Pendência</span>
  </div>` + ANALISADOR.services.map((s, idx) => `<div class="ana-service">
    <input type="checkbox" ${s.selecionado ? 'checked' : ''} onchange="analisadorEditarServico(${idx},'selecionado',this.checked)"/>
    <div>
      <input class="table-input table-input-desc" value="${escapeHtml(s.desc)}" onchange="analisadorEditarServico(${idx},'desc',this.value)"/>
      <div class="ana-service-meta">${escapeHtml(s.cod)} · ${escapeHtml(s.matchTipo)} · ${escapeHtml(s.metodo)}</div>
      ${s.refDesc ? `<div class="ana-service-meta">Ref.: ${escapeHtml(s.refDesc.substring(0,110))}</div>` : ''}
    </div>
    <div>
      <input class="table-input num" type="number" min="0" step="0.001" value="${Number(s.qtd)||0}" onchange="analisadorEditarServico(${idx},'qtd',this.value)"/>
      <input class="table-input compact" value="${escapeHtml(s.unid)}" onchange="analisadorEditarServico(${idx},'unid',this.value)"/>
    </div>
    <div>
      <input class="table-input num" type="number" min="0" step="0.01" value="${Number(s.preco)||0}" onchange="analisadorEditarServico(${idx},'preco',this.value)"/>
      <div class="ana-service-meta">${s.ref ? 'Ref. ' + fmtMoeda(s.ref) : 'Sem ref.'}</div>
    </div>
    <div>
      <span class="ana-chip">${s.confidence}%</span>
      <div style="margin-top:5px">${certBadge(s.certStatus)}</div>
      <div class="confidence-bar"><div class="confidence-fill" style="width:${s.confidence}%"></div></div>
    </div>
    <div>
      <div class="ana-service-meta">${(s.composicao || []).map(escapeHtml).join(' · ') || 'Composição a definir'}</div>
      ${s.pendencias?.length ? `<div class="ana-pending">${s.pendencias.map(p => '• ' + escapeHtml(p)).join('<br>')}</div>` : '<div class="ana-service-meta" style="color:var(--green)">Sem pendência crítica automática</div>'}
      ${s.certMotivos?.length ? `<div class="ana-pending">${s.certMotivos.map(p => '• ' + escapeHtml(p)).join('<br>')}</div>` : ''}
    </div>
  </div>`).join('');
}

function analisadorEditarServico(idx, campo, valor) {
  const svc = ANALISADOR.services[idx];
  if (!svc) return;
  if (campo === 'selecionado') svc.selecionado = !!valor;
  else if (['qtd','preco','ref','confidence'].includes(campo)) svc[campo] = parseFloat(String(valor).replace(',','.')) || 0;
  else svc[campo] = String(valor || '').trim();
  analisadorRender();
}

function analisadorSelecionarTodos(flag) {
  ANALISADOR.services.forEach(s => { s.selecionado = s.certStatus === 'bloqueado' ? false : !!flag; });
  analisadorRender();
}

function analisadorEnviarOrcamento() {
  const recert = certificarItensExtraidosLocal(ANALISADOR.services, { modo: 'estimativa', maxRodadas: 2 });
  ANALISADOR.services = recert.itens;
  ANALISADOR.audit = recert.relatorio;
  const bloqueadosSelecionados = ANALISADOR.services.filter(s => s.selecionado && s.certStatus === 'bloqueado');
  if (bloqueadosSelecionados.length) {
    analisadorRender();
    toast(`${bloqueadosSelecionados.length} serviço(s) bloqueado(s). Revise os motivos antes de enviar ao orçamento.`, 'error');
    return;
  }
  const selecionados = ANALISADOR.services.filter(s => s.selecionado && s.certStatus !== 'bloqueado');
  if (!selecionados.length) { toast('Selecione pelo menos um serviço sugerido.', 'error'); return; }
  const novos = selecionados.map((s, idx) => ({
    id: makeId('orc'),
    cod: s.cod || `EST-${String(idx+1).padStart(3,'0')}`,
    desc: s.desc,
    unid: s.unid || 'UN',
    qtd: Number(s.qtd) || 1,
    preco: Number(s.preco) || 0,
    ref: Number(s.ref) || 0,
    cat: s.cat || 'Serviços',
    capitulo: 'Estimativa por documentos',
    ordem: STATE.orcamento.length + idx + 1,
    origemArquivo: 'Analisador de Documentos',
    origemMetodo: s.metodo,
    confianca: s.confidence,
    pendencias: s.pendencias,
    certStatus: s.certStatus,
    certScore: s.certScore,
    certMotivos: s.certMotivos || []
  }));
  STATE.orcamento = [...STATE.orcamento, ...novos];
  invalidarDescontoPregao('serviços do analisador adicionados ao orçamento');
  if (ANALISADOR.extracaoId) docsMarcarExtracaoEnviada(ANALISADOR.extracaoId, ANALISADOR.services);
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast(`${novos.length} serviços enviados para Elaboração. Revise quantidades e composições antes de exportar.`, 'success');
  showView('elaborar');
}

function analisadorGerarMemoria() {
  const lines = ['# Memória do Analisador de Documentos - TLPlanly', '', `Gerado em: ${new Date().toLocaleString('pt-BR')}`, ''];
  lines.push('## Documentos classificados', '');
  ANALISADOR.docs.forEach(d => lines.push(`- ${d.fileName}: ${d.tipo} (${d.confianca}%) via ${d.metodo}`));
  lines.push('', '## Escopo identificado', '');
  (ANALISADOR.escopo || []).forEach(x => lines.push('- ' + x));
  lines.push('', '## Especificações relevantes', '');
  (ANALISADOR.especificacoes || []).forEach(x => lines.push('- ' + x));
  lines.push('', '## Serviços sugeridos', '');
  lines.push('| Serviço | Un | Qtd | Preço | Ref | Confiança | Pendências |');
  lines.push('|---|---:|---:|---:|---:|---:|---|');
  ANALISADOR.services.forEach(s => {
    lines.push(`| ${mdCell(s.desc)} | ${mdCell(s.unid)} | ${s.qtd} | ${s.preco} | ${s.ref || 0} | ${s.confidence}% | ${mdCell((s.pendencias || []).join('; ') || '-')} |`);
  });
  lines.push('', '## Nota técnica', '', 'Esta é uma estimativa preliminar revisável. Quantidades, composições e preços devem ser confirmados por responsável técnico antes de uso em licitação, contratação ou medição.');
  return lines.join('\n');
}

function analisadorExportarMemoria() {
  analisadorExportarMemoriaExcel();
}

function analisadorMemoriaAtual() {
  const md = ANALISADOR.memoria || analisadorGerarMemoria();
  return md;
}

function analisadorExportarMemoriaExcel() {
  const servRows = [['Serviço','Un','Qtd','Preço','Referência','Confiança','Pendências','Origem','Método']];
  (ANALISADOR.services || []).forEach(s => servRows.push([
    s.desc, s.unid, s.qtd, s.preco, s.ref || 0, `${s.confidence}%`, (s.pendencias || []).join('; ') || '-', s.origem || '', s.metodo || ''
  ]));
  exportRowsToExcel(`memoria_analisador_documentos_tlplanly_${new Date().toISOString().slice(0,10)}`, [
    { name:'Escopo', rows: [['Escopo identificado'], ...(ANALISADOR.escopo || []).map(x => [x])] },
    { name:'Especificações', rows: [['Especificações relevantes'], ...(ANALISADOR.especificacoes || []).map(x => [x])] },
    { name:'Serviços', rows: servRows },
    { name:'Memória', rows: markdownToRows(analisadorMemoriaAtual()) }
  ]);
}

function analisadorExportarMemoriaPDF() {
  exportMarkdownToPDF(analisadorMemoriaAtual(), 'Memória do Analisador de Documentos - TLPlanly', `memoria_analisador_documentos_tlplanly_${new Date().toISOString().slice(0,10)}`);
}

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }


// ═══════════════════════════════════════════════════════════
// FASE 2B — MULTI-BASE + SICRO 3 + OCR
// ═══════════════════════════════════════════════════════════

// Multi-base registry
let BASES = {
  sinapi:   { nome: 'SINAPI', tipo: 'federal', items: [], loaded: false },
  sicro:    { nome: 'SICRO 3', tipo: 'federal', items: [], loaded: false },
  estadual: { nome: 'Base Estadual', tipo: 'estadual', items: [], loaded: false, subtipo: 'seinfra-mg' }
};

// Priority order for lookup
let PRIORIDADE_BASES = ['estadual', 'sinapi', 'sicro'];

const LINKS_ESTADUAIS = {
  'seinfra-mg': { nome: 'DER-MG / SEINFRA-MG', url: 'https://portal.der.mg.gov.br/portal-servicos-frontend/dynamic-menu/10', desc: 'Planilha estadual de preços — DER-MG / Minas Gerais' },
  'orse-se':    { nome: 'ORSE-SE',    url: 'https://orse.cehop.se.gov.br/',                                                         desc: 'CEHOP — Sergipe' },
  'emop-rj':    { nome: 'EMOP-RJ',    url: 'https://www.rj.gov.br/emop/catalogos-emop',                                             desc: 'Empresa de Obras Públicas — Rio de Janeiro' },
  'seinfra-ce': { nome: 'SEINFRA-CE', url: 'https://www.seinfra.ce.gov.br/tabela-de-custos/',                                       desc: 'Secretaria de Infraestrutura — Ceará' },
  'sudecap-bh': { nome: 'SUDECAP-BH', url: 'https://prefeitura.pbh.gov.br/sudecap/tabela-de-precos',                                desc: 'Superintendência de Obras — Belo Horizonte' },
  'goinfra':    { nome: 'GOINFRA',    url: 'https://www.goinfra.go.gov.br/tabela-de-composicao/114',                                desc: 'Agência Goiana de Infraestrutura' },
  'daer-rs':    { nome: 'DAER-RS',    url: 'https://www.daer.rs.gov.br/referencial-de-obra',                                        desc: 'Depto. Autônomo de Estradas — RS' },
  'outro':      { nome: 'Outro',      url: '#',                                                                                      desc: 'Planilha XLSX genérica' }
};

// ─── LOOKUP UNIFICADO ──────────────────────────────────────
function lookupPreco(cod) {
  const code = String(cod || '').toUpperCase();
  const manual = escolherItemReferencia((STATE.insumosManuais || []).filter(i => String(i.codigoSinapi || i.codigo || '').toUpperCase() === code));
  if (manual) return { preco: manual.precoMedio || manual.preco || 0, fonte: 'Base manual', item: manual };
  const imported = escolherItemReferencia((STATE.insumosImportados || []).filter(i => String(i.codigoSinapi || i.codigo || '').toUpperCase() === code));
  if (imported) return { preco: imported.precoMedio || imported.preco || 0, fonte: 'Base importada', item: imported };
  // Returns { preco, fonte, item } searching in priority order
  for (const baseKey of PRIORIDADE_BASES) {
    const base = BASES[baseKey];
    if (!base.loaded || !base.items.length) continue;
    const found = escolherItemReferencia(base.items.filter(i => String(i.codigoSinapi || i.codigo || '').toUpperCase() === code));
    if (found) return { preco: found.precoMedio || found.preco || 0, fonte: base.nome, item: found };
  }
  // Fallback to STATE.sinapiBase (original)
  const fb = escolherItemReferencia(STATE.sinapiBase.filter(i => String(i.codigoSinapi || i.codigo || '').toUpperCase() === code));
  if (fb) return { preco: fb.precoMedio, fonte: 'SINAPI (padrão)', item: fb };
  return null;
}

function baseRegimeScore(item) {
  const regime = baseNormText(item?.regime || (item?.desonerado ? 'desonerado' : 'onerado'));
  const enc = STATE.config?.enc === 'd' ? 'desonerado' : 'onerado';
  const isDesonerado = regime.includes('desonerado') && !regime.includes('nao');
  const isOnerado = regime.includes('onerado') && !isDesonerado || regime.includes('nao');
  if (enc === 'desonerado' && isDesonerado) return 3;
  if (enc === 'onerado' && isOnerado) return 3;
  if (regime.includes('nao informado')) return 1;
  return 0;
}

function escolherItemReferencia(items) {
  return (items || []).slice().sort((a, b) => baseRegimeScore(b) - baseRegimeScore(a))[0] || null;
}

function getAllItems() {
  // Merge all base items for search
  const all = [];
  (STATE.insumosManuais || []).forEach(i => all.push({ ...i, _base: 'Base manual', _baseTipo: 'manual' }));
  (STATE.insumosImportados || []).forEach(i => all.push({ ...i, _base: 'Base importada', _baseTipo: 'local' }));
  // Original sinapiBase first, but avoid duplicating it again through BASES.sinapi.
  STATE.sinapiBase.forEach(i => all.push({ ...i, _base: 'SINAPI', _baseTipo: 'federal' }));
  Object.entries(BASES).forEach(([key, base]) => {
    if (key === 'sinapi') return;
    if (base.loaded) {
      base.items.forEach(i => all.push({ ...i, _base: base.nome, _baseTipo: base.tipo }));
    }
  });
  return dedupeBaseItems(all).sort((a, b) => baseRegimeScore(b) - baseRegimeScore(a));
}

function dedupeBaseItems(items) {
  const byKey = new Map();
  (items || []).forEach(item => {
    const cod = String(item.codigoSinapi || item.codigo || '').trim().toUpperCase();
    const desc = String(item.descricao || '').trim().toUpperCase();
    const key = [
      cod || desc.slice(0, 80),
      String(item.fonte || item._base || '').trim().toUpperCase(),
      String(item.regime || '').trim().toUpperCase(),
      String(item.natureza || item.categoria || '').trim().toUpperCase()
    ].join('|');
    if (!byKey.has(key)) byKey.set(key, item);
  });
  return [...byKey.values()];
}

function baseNormText(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseBaseNumber(value) {
  return parseNumeroBR(value);
}

function detectarRegimeBase(fileName = '', sheetName = '') {
  const n = baseNormText(fileName + ' ' + sheetName);
  if (/\b(isd|csd|nao\s*desonerad|naodesonerad|onerad[ao]?)\b/.test(n)) return 'onerado';
  if (/\b(icd|ccd|desonerad[ao]?)\b/.test(n)) return 'desonerado';
  return 'não informado';
}

function detectarNaturezaBase(fileName = '', sheetName = '') {
  const n = baseNormText(fileName + ' ' + sheetName);
  if (/\b(servic|servico|compos|cpu|csd|ccd|custo\s+unitario|preco\s+unitario\s+de\s+serv)\b/.test(n)) return 'serviços/composições';
  if (/\b(produt|insum|material|isd|icd|preco\s+ref\s+insum)\b/.test(n)) return 'produtos/insumos';
  return 'itens';
}

function detectarBaseArquivo(file, sheets, forced = 'auto') {
  if (forced && forced !== 'auto') return forced;
  const sample = (sheets || []).slice(0, 4).map(s => {
    const rows = (s.raw || []).slice(0, 12).map(r => (r || []).join(' ')).join(' ');
    return s.name + ' ' + rows;
  }).join(' ');
  const n = baseNormText(file.name + ' ' + sample);
  if (/\b(sicro|dnit|sicor)\b/.test(n)) return 'sicro';
  if (/\b(sinapi|caixa|ibge|isd|icd|csd|ccd)\b/.test(n)) return 'sinapi';
  return 'estadual';
}

async function lerPlanilhaBase(file) {
  const ext = getFileExt(file);
  if (ext === 'zip') {
    throw new Error('ZIP ainda deve ser extraído antes do envio. Arraste os XLSX internos.');
  }
  if (!window.XLSX) throw new Error('Biblioteca XLSX não carregou.');
  const data = ext === 'csv' ? await file.text() : await file.arrayBuffer();
  const wb = XLSX.read(data, { type: ext === 'csv' ? 'string' : 'array', raw: false, cellDates: false });
  return wb.SheetNames.map(name => ({
    name,
    raw: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: false })
  }));
}

function encontrarCabecalhoGenerico(raw, maxRows = 25) {
  let headerRow = -1, colCod = -1, colDesc = -1, colUnid = -1, colPreco = -1, colCat = -1;
  for (let r = 0; r < Math.min(maxRows, raw.length); r++) {
    const row = (raw[r] || []).map(c => baseNormText(c));
    row.forEach((cell, ci) => {
      if (/\b(cod|codigo|item|referencia)\b/.test(cell) && colCod < 0) colCod = ci;
      if (/\b(desc|descricao|especific|servic|insum|produto)\b/.test(cell) && colDesc < 0) colDesc = ci;
      if (/\b(unid|unidade|^un$|^und$)\b/.test(cell) && colUnid < 0) colUnid = ci;
      if (/\b(prec|preco|custo|unit|valor)\b/.test(cell) && colPreco < 0) colPreco = ci;
      if (/\b(categ|categoria|tipo|classe|grupo|familia)\b/.test(cell) && colCat < 0) colCat = ci;
    });
    if (colCod >= 0 && colDesc >= 0) { headerRow = r; break; }
  }
  return { headerRow, colCod, colDesc, colUnid, colPreco, colCat };
}

function parseBaseGenerica(sheets, file, options = {}) {
  const items = [];
  (sheets || []).forEach(sheet => {
    const raw = sheet.raw || [];
    const cols = encontrarCabecalhoGenerico(raw, 25);
    if (cols.headerRow < 0) return;
    const regime = detectarRegimeBase(file.name, sheet.name);
    const natureza = detectarNaturezaBase(file.name, sheet.name);
    for (let r = cols.headerRow + 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row || row.every(c => c === null || c === undefined || c === '')) continue;
      const cod = String(row[cols.colCod] || '').trim();
      const desc = cols.colDesc >= 0 ? String(row[cols.colDesc] || '').trim() : '';
      if (!cod && !desc) continue;
      if (desc.length < 3) continue;
      const unid = cols.colUnid >= 0 ? normalizarUnidadeImportacao(row[cols.colUnid] || 'UN') : 'UN';
      const preco = cols.colPreco >= 0 ? parseBaseNumber(row[cols.colPreco]) : 0;
      const cat = cols.colCat >= 0 ? String(row[cols.colCat] || '').trim() : sheet.name;
      items.push({
        codigoSinapi: cod,
        codigo: cod,
        descricao: desc,
        unidade: unid || 'UN',
        precoMedio: preco,
        dataReferencia: new Date().toLocaleDateString('pt-BR'),
        desonerado: regime === 'desonerado',
        regime,
        natureza,
        categoria: cat || natureza,
        fonte: options.fonte || file.name,
        origemArquivo: file.name,
        aba: sheet.name
      });
    }
  });
  return dedupeBaseItems(items);
}

function parseSinapiSheets(sheets, file) {
  const uf = (STATE.config.uf || 'MG').toUpperCase();
  const items = [];
  (sheets || []).forEach(sheet => {
    const raw = sheet.raw || [];
    const regime = detectarRegimeBase(file.name, sheet.name);
    const natureza = detectarNaturezaBase(file.name, sheet.name);
    let headerRow = -1, colCod = -1, colDesc = -1, colUnid = -1, colPreco = -1;

    for (let r = 0; r < Math.min(20, raw.length); r++) {
      const rowStr = (raw[r] || []).map(c => String(c).trim().toUpperCase());
      const ufIdx = rowStr.findIndex(c => c === uf);
      if (ufIdx >= 0) {
        headerRow = r;
        colPreco = ufIdx;
        colCod = rowStr.findIndex(c => /COD|CODIGO|CÓDIGO/.test(c));
        colDesc = rowStr.findIndex(c => /DESC|DESCRICAO|DESCRIÇÃO/.test(c));
        colUnid = rowStr.findIndex(c => /UNID|UNIDADE|^UN$/.test(c));
        if (colCod < 0) colCod = 1;
        if (colDesc < 0) colDesc = 2;
        if (colUnid < 0) colUnid = 3;
        break;
      }
    }

    if (headerRow < 0) {
      const cols = encontrarCabecalhoGenerico(raw, 25);
      headerRow = cols.headerRow;
      colCod = cols.colCod;
      colDesc = cols.colDesc;
      colUnid = cols.colUnid;
      colPreco = cols.colPreco;
    }
    if (headerRow < 0 || colCod < 0 || colDesc < 0) return;

    for (let r = headerRow + 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row || row.every(c => c === null || c === undefined || c === '')) continue;
      const cod = String(row[colCod] || '').trim();
      const desc = String(row[colDesc] || '').trim();
      const preco = parseBaseNumber(row[colPreco] || 0);
      if (!cod || desc.length < 3 || preco <= 0) continue;
      items.push({
        codigoSinapi: cod,
        codigo: cod,
        descricao: desc,
        unidade: colUnid >= 0 ? normalizarUnidadeImportacao(row[colUnid] || 'UN') : 'UN',
        precoMedio: preco,
        dataReferencia: new Date().toLocaleDateString('pt-BR'),
        desonerado: regime === 'desonerado',
        regime,
        natureza,
        categoria: natureza,
        fonte: `SINAPI/CAIXA/${sheet.name}/${uf}`,
        origemArquivo: file.name,
        aba: sheet.name
      });
    }
  });
  return dedupeBaseItems(items);
}

function baseItemKey(item) {
  return [
    String(item.codigoSinapi || item.codigo || '').trim().toUpperCase(),
    String(item.fonte || '').trim().toUpperCase(),
    String(item.regime || '').trim().toUpperCase(),
    String(item.natureza || item.categoria || '').trim().toUpperCase()
  ].join('|');
}

function mergeBaseItems(baseKey, items, options = {}) {
  const base = BASES[baseKey];
  if (!base || !items.length) return 0;
  const existing = options.replace ? [] : (base.items || []);
  const byKey = new Map(existing.map(i => [baseItemKey(i), i]));
  items.forEach(i => byKey.set(baseItemKey(i), i));
  base.items = [...byKey.values()];
  base.loaded = base.items.length > 0;
  if (options.nome) base.nome = options.nome;
  if (options.subtipo) base.subtipo = options.subtipo;
  if (baseKey === 'sinapi') {
    STATE.sinapiBase = base.items;
    STATE.sinapiMes = new Date().toLocaleDateString('pt-BR', { month:'2-digit', year:'numeric' });
  }
  return items.length;
}

function resumoVariantesBase(items) {
  const grupos = new Map();
  (items || []).forEach(i => {
    const label = [i.regime || 'regime não informado', i.natureza || 'itens'].filter(Boolean).join(' · ');
    grupos.set(label, (grupos.get(label) || 0) + 1);
  });
  return [...grupos.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => `${count.toLocaleString('pt-BR')} ${label}`)
    .join(' | ');
}

function atualizarCardsBases() {
  if (BASES.sinapi.loaded || STATE.sinapiBase.length) {
    const count = BASES.sinapi.items.length || STATE.sinapiBase.length;
    setText('sinapi-count-b', count.toLocaleString('pt-BR'));
    const el = document.getElementById('sinapi-count-b');
    if (el) el.className = 'base-stat base-loaded';
    setText('sinapi-mes-b', resumoVariantesBase(BASES.sinapi.items || STATE.sinapiBase) || `insumos — ${STATE.sinapiMes || ''}`);
    const dot = document.getElementById('sinapi-status-dot');
    if (dot) { dot.textContent = '● Carregado'; dot.style.color = 'var(--green)'; }
  }
  if (BASES.sicro.loaded) {
    setText('sicro-count', BASES.sicro.items.length.toLocaleString('pt-BR'));
    const el = document.getElementById('sicro-count');
    if (el) el.className = 'base-stat base-loaded';
    setText('sicro-info', resumoVariantesBase(BASES.sicro.items) || 'insumos e composições SICRO 3');
    const dot = document.getElementById('sicro-status-dot');
    if (dot) { dot.textContent = '● Carregado'; dot.style.color = 'var(--green)'; }
    document.getElementById('base-card-sicro')?.classList.add('active');
  }
  if (BASES.estadual.loaded) {
    const info = LINKS_ESTADUAIS[BASES.estadual.subtipo] || {};
    setText('est-count', BASES.estadual.items.length.toLocaleString('pt-BR'));
    const el = document.getElementById('est-count');
    if (el) el.className = 'base-stat base-loaded';
    setText('est-info', resumoVariantesBase(BASES.estadual.items) || `itens — ${BASES.estadual.nome}`);
    setText('est-nome', BASES.estadual.nome || info.nome || 'Base Estadual');
    setText('est-desc', info.desc || '');
    const dot = document.getElementById('est-status-dot');
    if (dot) { dot.textContent = '● Carregado'; dot.style.color = 'var(--green)'; }
    document.getElementById('base-card-estadual')?.classList.add('active');
  }
  renderPrioridade();
  atualizarTotalBases();
}

function basesRenderArquivos(files, resultados = []) {
  const chip = document.getElementById('bases-file-chip');
  if (chip) {
    if (!files?.length) {
      chip.style.display = 'none';
      chip.innerHTML = '';
    } else {
      chip.style.display = 'block';
      chip.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">
        ${files.map((f, idx) => `<div class="file-chip">📊 <span>${escapeHtml(f.name)}</span> <span style="color:var(--text3)">(${(f.size/1024).toFixed(0)} KB)</span></div>`).join('')}
      </div>`;
    }
  }
  const status = document.getElementById('bases-lote-status');
  if (!status) return;
  if (!resultados.length) { status.style.display = 'none'; status.innerHTML = ''; return; }
  status.style.display = 'block';
  status.innerHTML = resultados.map(r => `
    <div class="base-lote-row ${r.ok ? 'ok' : 'bad'}">
      <strong>${escapeHtml(r.fileName)}</strong>
      <span>${r.ok ? `${escapeHtml(r.baseNome)} · ${r.count.toLocaleString('pt-BR')} itens · ${escapeHtml(r.resumo || '')}` : escapeHtml(r.erro || 'Erro')}</span>
    </div>
  `).join('');
}

async function carregarBasesArquivos(files, forced = 'auto') {
  const validos = (files || []).filter(f => ['xlsx','xls','csv','zip'].includes(getFileExt(f)));
  if (!validos.length) { toast('Selecione planilhas .xlsx, .xls ou .csv.', 'error'); return; }
  basesRenderArquivos(validos);
  toast(`Carregando ${validos.length} arquivo(s) de base...`, 'info');
  const resultados = [];

  for (const file of validos) {
    try {
      const sheets = await lerPlanilhaBase(file);
      const tipo = detectarBaseArquivo(file, sheets, forced);
      const subtipo = tipo === 'estadual' ? (document.getElementById('est-tipo')?.value || 'seinfra-mg') : '';
      const infoEst = LINKS_ESTADUAIS[subtipo] || {};
      let items = [];
      let baseNome = '';

      if (tipo === 'sinapi') {
        items = parseSinapiSheets(sheets, file);
        baseNome = 'SINAPI';
        mergeBaseItems('sinapi', items, { nome: 'SINAPI' });
      } else if (tipo === 'sicro') {
        items = parseBaseGenerica(sheets, file, { fonte: 'SICRO3/DNIT' });
        baseNome = 'SICRO 3';
        mergeBaseItems('sicro', items, { nome: 'SICRO 3' });
      } else {
        items = parseBaseGenerica(sheets, file, { fonte: infoEst.nome || subtipo || file.name });
        baseNome = infoEst.nome || 'Base Estadual';
        mergeBaseItems('estadual', items, { nome: baseNome, subtipo });
      }

      if (!items.length) throw new Error('Nenhum item reconhecido no layout.');
      resultados.push({ ok: true, fileName: file.name, base: tipo, baseNome, count: items.length, resumo: resumoVariantesBase(items) });
    } catch(err) {
      resultados.push({ ok: false, fileName: file.name, erro: err.message || String(err) });
    }
    basesRenderArquivos(validos, resultados);
  }

  atualizarCardsBases();
  saveState();
  const ok = resultados.filter(r => r.ok);
  const fail = resultados.length - ok.length;
  toast(`${ok.length} arquivo(s) carregado(s).${fail ? ` ${fail} com erro.` : ''}`, fail ? 'info' : 'success');
}

function basesFileSelect(event) {
  const files = Array.from(event.target.files || []);
  carregarBasesArquivos(files, 'auto');
  event.target.value = '';
}

function basesDrop(event) {
  event.preventDefault();
  document.getElementById('basesUploadZone')?.classList.remove('dragover');
  carregarBasesArquivos(Array.from(event.dataTransfer?.files || []), 'auto');
}

async function carregarSICRO(event) {
  await carregarBasesArquivos(Array.from(event.target.files || []), 'sicro');
  event.target.value = '';
}

async function carregarSINAPI(event) {
  await carregarBasesArquivos(Array.from(event.target.files || []), 'sinapi');
  event.target.value = '';
}

async function carregarEstadual(event) {
  await carregarBasesArquivos(Array.from(event.target.files || []), 'estadual');
  event.target.value = '';
}

function atualizarLinksEstadual() {
  const subtipo = document.getElementById('est-tipo').value;
  const info = LINKS_ESTADUAIS[subtipo] || {};
  const link = document.getElementById('est-link');
  if (link) { link.href = info.url || '#'; link.textContent = `Acessar ${info.nome || 'site'} ↗`; }
}

// ─── PRIORIDADE UI ─────────────────────────────────────────
function renderPrioridade() {
  const el = document.getElementById('prioridade-lista');
  if (!el) return;
  const ordemNomes = {
    estadual: BASES.estadual.nome || 'Base Estadual',
    sinapi: 'SINAPI',
    sicro: 'SICRO 3'
  };
  const ordemBase = [
    { key: 'estadual', n: 1 },
    { key: 'sinapi', n: 2 },
    { key: 'sicro', n: 3 }
  ];
  el.innerHTML = ordemBase.map(({ key, n }) => {
    const base = BASES[key];
    const loaded = base.loaded || (key === 'sinapi' && STATE.sinapiBase.length > 0);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--${loaded?'card2':'bg3'});border-radius:var(--radius);border:1px solid var(--${loaded?'border2':'border'})">
      <div style="width:24px;height:24px;border-radius:50%;background:${loaded?'var(--gold)':'var(--bg4)'};color:${loaded?'#050505':'var(--text3)'};font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center">${n}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:700;color:var(--text)">${ordemNomes[key]}</div>
        <div style="font-size:11px;color:var(--text3)">${loaded ? (base.items?.length || STATE.sinapiBase.length).toLocaleString('pt-BR') + ' itens' : 'Não carregado — será ignorado na busca'}</div>
      </div>
      <span class="badge ${loaded ? 'badge-ok' : ''}" style="${!loaded ? 'background:var(--bg4);color:var(--text3)' : ''}">${loaded ? '✓ Ativo' : 'Inativo'}</span>
    </div>`;
  }).join('');
}

function atualizarTotalBases() {
  const total = STATE.sinapiBase.length
    + (BASES.sicro.loaded ? BASES.sicro.items.length : 0)
    + (BASES.estadual.loaded ? BASES.estadual.items.length : 0);
  const el = document.getElementById('total-bases-count');
  if (el) el.textContent = total.toLocaleString('pt-BR') + ' itens em todas as bases';
}

// ─── BUSCA UNIFICADA ───────────────────────────────────────
function buscarUnificado(q) {
  const tb = document.getElementById('uni-tabela');
  if (!q || q.length < 2) {
    tb.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text3)">Digite pelo menos 2 caracteres para buscar</td></tr>';
    return;
  }
  const ul = q.toUpperCase();
  const all = getAllItems();
  const matches = all.filter(i =>
    (i.codigoSinapi||i.codigo||'').toUpperCase().includes(ul) ||
    (i.descricao||'').toUpperCase().includes(ul)
  ).slice(0, 60);

  if (!matches.length) {
    tb.innerHTML = '<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text3)">Nenhum resultado encontrado</td></tr>';
    return;
  }

  const baseColors = { 'SINAPI':'var(--blue,#1976d2)', 'SICRO 3':'var(--green)', federal:'#1976d2', estadual:'var(--green)', municipal:'var(--gold)' };

  tb.innerHTML = matches.map(i => {
    const cor = baseColors[i._base] || baseColors[i._baseTipo] || 'var(--text3)';
    return `<tr>
      <td class="td-mono" style="color:var(--gold)">${i.codigoSinapi||i.codigo||'—'}</td>
      <td>${i.descricao||''}</td>
      <td>${i.unidade||'UN'}</td>
      <td><strong>${fmtMoeda(i.precoMedio||0)}</strong></td>
      <td><span style="font-size:11px;font-weight:700;color:${cor}">${i._base||i.fonte||'—'}</span></td>
      <td style="font-size:11px;color:var(--text3)">${i.dataReferencia||'—'}</td>
    </tr>`;
  }).join('');
}

// ─── OCR (Tesseract.js) ────────────────────────────────────
function handleOcrDrop(e) {
  e.preventDefault();
  document.getElementById('ocrUploadZone').classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) iniciarOCR(f);
}

async function iniciarOCR(file) {
  if (!file) return;
  if (!window.Tesseract) { toast('Tesseract.js não carregado ainda, aguarde...', 'error'); return; }

  const prog = document.getElementById('ocr-progress');
  prog.style.display = 'block';

  const lang = document.getElementById('ocr-lang').value;
  const psm = document.getElementById('ocr-mode').value;

  try {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      // Convert PDF pages to images then OCR each
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      const nPages = pdf.numPages;

      // Build page grid
      let pageGrid = '';
      for (let p = 1; p <= nPages; p++) pageGrid += `<div class="ocr-page-thumb" id="ocr-pg-${p}">Pág ${p}</div>`;
      document.getElementById('ocr-pages-grid').innerHTML = pageGrid;

      let fullText = '';
      for (let p = 1; p <= nPages; p++) {
        document.getElementById(`ocr-pg-${p}`).className = 'ocr-page-thumb active';
        updateOCRProg(Math.round((p-1)/nPages*100), `OCR página ${p} de ${nPages}...`);

        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

        const result = await Tesseract.recognize(canvas, lang, {
          tessedit_pageseg_mode: psm
        });
        fullText += result.data.text + '\n';

        document.getElementById(`ocr-pg-${p}`).className = 'ocr-page-thumb done';
      }

      updateOCRProg(95, 'Parseando texto extraído...');
      const items = parsearLinhas(fullText.split('\n')).map((it, itemIndex) => ({
        ...it,
        origemArquivo: file.name,
        origemMetodo: 'OCR',
        origemIndice: itemIndex + 1,
        origem: 'ocr'
      }));
      const reviewed = items.map(it => matchSINAPI(it));
      updateOCRProg(100, `OCR concluído: ${reviewed.length} itens`);

      // Hand off to review flow
      IMP.files = [file];
      IMP.rawItems = items;
      IMP.reviewed = reviewed;
      IMP.file = file;
      IMP.importResults = [{ fileName: file.name, size: file.size, ext, metodo: 'OCR', aviso: '', items, rawText: fullText }];
      IMP.markdown = gerarMemoriaImportacao(IMP.importResults);
      mostrarRevisao();
      showView('importar');
      toast(`OCR concluído: ${reviewed.length} itens extraídos`, 'success');

    } else {
      // Direct image OCR
      updateOCRProg(20, 'Reconhecendo imagem...');
      document.getElementById('ocr-pages-grid').innerHTML = '<div class="ocr-page-thumb active">Imagem</div>';
      const result = await Tesseract.recognize(file, lang, {
        tessedit_pageseg_mode: psm,
        logger: m => {
          if (m.status === 'recognizing text') updateOCRProg(Math.round(20 + m.progress*75), 'Reconhecendo...');
        }
      });
      document.getElementById('ocr-pages-grid').innerHTML = '<div class="ocr-page-thumb done">Imagem</div>';
      updateOCRProg(95, 'Parseando...');
      const items = parsearLinhas(result.data.text.split('\n')).map((it, itemIndex) => ({
        ...it,
        origemArquivo: file.name,
        origemMetodo: 'OCR imagem',
        origemIndice: itemIndex + 1,
        origem: 'ocr'
      }));
      const reviewed = items.map(it => matchSINAPI(it));
      updateOCRProg(100, `OCR concluído: ${reviewed.length} itens`);
      IMP.files = [file];
      IMP.rawItems = items;
      IMP.reviewed = reviewed;
      IMP.file = file;
      IMP.importResults = [{ fileName: file.name, size: file.size, ext, metodo: 'OCR imagem', aviso: '', items, rawText: result.data.text }];
      IMP.markdown = gerarMemoriaImportacao(IMP.importResults);
      mostrarRevisao();
      showView('importar');
      toast(`OCR: ${reviewed.length} itens extraídos`, 'success');
    }
  } catch(err) {
    toast('Erro no OCR: ' + err.message, 'error');
    updateOCRProg(0, 'Erro: ' + err.message);
    console.error(err);
  }
}

function updateOCRProg(pct, label) {
  const fill = document.getElementById('ocr-prog-fill');
  const txt = document.getElementById('ocr-status-txt');
  const pctTxt = document.getElementById('ocr-pct-txt');
  if (fill) fill.style.width = pct + '%';
  if (txt) txt.textContent = label;
  if (pctTxt) pctTxt.textContent = pct + '%';
}

// ─── PATCH buscarSINAPI to use unified lookup ──────────────
const _origBuscarSINAPI = buscarSINAPI;
function buscarSINAPI(q) {
  const res = document.getElementById('sinapiResults');
  if (!q || q.length < 2) { res.classList.remove('open'); return; }
  const ul = q.toUpperCase();
  const all = getAllItems();
  const matches = all.filter(i =>
    (i.codigoSinapi||i.codigo||'').toUpperCase().includes(ul) ||
    (i.descricao||'').toUpperCase().includes(ul)
  ).slice(0, 20);
  if (!matches.length) { res.classList.remove('open'); return; }
  res.innerHTML = matches.map(i => {
    const cod = i.codigoSinapi || i.codigo || '';
    return `<div class="search-item" onclick="selecionarInsumo('${cod}')">
      <span class="search-item-code">${cod}</span>
      ${i.descricao||''}
      <span class="search-item-unit">${i.unidade||'UN'}</span>
      <span style="float:right;font-size:10px;color:var(--text3)">${i._base||i.fonte||''}</span>
      <span style="float:right;color:var(--gold);font-weight:700;margin-left:8px">${fmtMoeda(i.precoMedio||0)}</span>
    </div>`;
  }).join('');
  res.classList.add('open');
}

// Patch selecionarInsumo to search all bases
const _origSelecionarInsumo = selecionarInsumo;
function selecionarInsumo(cod) {
  const all = getAllItems();
  const item = all.find(i => (i.codigoSinapi||i.codigo||'') === cod);
  if (!item) return;
  document.getElementById('sinapiSearch').value = item.descricao||'';
  document.getElementById('sinapiResults').classList.remove('open');
  document.getElementById('addCod').value = item.codigoSinapi||item.codigo||'';
  document.getElementById('addDesc').value = item.descricao||'';
  document.getElementById('addUnid').value = item.unidade||'UN';
  document.getElementById('addPreco').value = (item.precoMedio||0).toFixed(2);
  document.getElementById('addRef').value = (item.precoMedio||0).toFixed(2);
  document.getElementById('addItemPanel').style.display = 'block';
}

// ─── INIT 2B ───────────────────────────────────────────────
(function init2B() {
  // Update sinapi base card when STATE.sinapiBase loads
  const orig = loadSinapiBase;
  loadSinapiBase = async function() {
    await orig();
    if (STATE.sinapiBase.length > 0) {
      BASES.sinapi.items = STATE.sinapiBase;
      BASES.sinapi.loaded = true;
    }
    atualizarCardsBases();
    atualizarLinksEstadual();
  };
})();


// ═══════════════════════════════════════════════════════════
// FASE 2C — EXPORTAÇÃO PROFISSIONAL
// ═══════════════════════════════════════════════════════════

const RELATORIO_MODELOS = {
  publico: {
    titulo:'PLANILHA ORÇAMENTÁRIA',
    subtitulo:'Decreto nº 7.983/2013 · TCU Acórdão 2622/2013 · Base de preços pública',
    resumo:'RESUMO EXECUTIVO DO ORÇAMENTO'
  },
  construtora: {
    titulo:'ORÇAMENTO EXECUTIVO DA OBRA',
    subtitulo:'Proposta técnica e comercial · Custos, BDI, quantitativos e planejamento',
    resumo:'RESUMO EXECUTIVO DA PROPOSTA'
  },
  medicao: {
    titulo:'BOLETIM DE MEDIÇÃO E ACOMPANHAMENTO',
    subtitulo:'Previsto x executado · Saldos contratuais · Curva S e medições',
    resumo:'RESUMO DE MEDIÇÃO'
  },
  auditoria: {
    titulo:'RELATÓRIO DE AUDITORIA ORÇAMENTÁRIA',
    subtitulo:'Conformidade de preços · SINAPI/SICRO/ORSE/DNIT · BDI e desvios',
    resumo:'RESUMO DE AUDITORIA'
  }
};

function relatorioModeloAtual() {
  const id = document.getElementById('rel-modelo')?.value || STATE.config.relatorioModelo || 'publico';
  return RELATORIO_MODELOS[id] || RELATORIO_MODELOS.publico;
}

function aplicarModeloRelatorio(id) {
  STATE.config.relatorioModelo = id || 'publico';
  const cfg = document.getElementById('cfg-rel-modelo');
  if (cfg) cfg.value = STATE.config.relatorioModelo;
  saveState();
  renderRelatorioPreview();
  toast('Modelo de relatório aplicado', 'success');
}

function abrirExpTab(id) {
  document.querySelectorAll('.exp-tab').forEach((t,i)=>{
    const ids = ['planilha','bdi-rel','abc-rel','resumo-rel'];
    t.classList.toggle('active', ids[i] === id);
  });
  document.querySelectorAll('.exp-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('exp-'+id).classList.add('active');
  if (id==='planilha') renderPreviewPlanilha();
  if (id==='bdi-rel') renderPreviewBDI();
  if (id==='abc-rel') renderPreviewABC();
  if (id==='resumo-rel') renderPreviewResumo();
}

// ─── META helpers ──────────────────────────────────────────
function getMeta() {
  return {
    obra:   document.getElementById('rel-obra')?.value  || 'Sem identificação',
    orgao:  document.getElementById('rel-orgao')?.value || '',
    edital: document.getElementById('rel-edital')?.value|| '',
    rt:     document.getElementById('rel-rt')?.value    || '',
    crea:   document.getElementById('rel-crea')?.value  || '',
    art:    document.getElementById('rel-art')?.value   || '',
    local:  document.getElementById('rel-local')?.value || '',
    data:   document.getElementById('rel-data')?.value  || new Date().toLocaleDateString('pt-BR',{month:'2-digit',year:'numeric'}),
    fonte:  document.getElementById('rel-fonte')?.value || 'SINAPI/CAIXA',
    modelo: document.getElementById('rel-modelo')?.value || STATE.config.relatorioModelo || 'publico',
  };
}

function itemOrcamentoCorrompido(it) {
  if (!it) return true;
  if (it.certStatus === 'bloqueado') return true;
  const text = `${it.linhaOrigem || ''} ${it.origemArquivo || ''} ${it.origemMetodo || ''} ${it.capitulo || ''} ${it.desc || ''}`;
  const normText = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/[=]\s*procv|procv\s*\(|vlookup\s*\(|\bR\$\s*R\$/i.test(text)) return true;
  if (/\b(prefeitura municipal|secretaria municipal|codigo\s+referencia\s+descricao|total\s+(sem|com)\s+bdi)\b/i.test(normText)) return true;
  if (!String(it.desc || '').trim() || !String(it.cod || '').trim()) return true;
  const qtd = Number(it.qtd) || 0;
  const preco = Number(it.preco) || 0;
  const total = qtd * preco;
  const inferidoPorAnalisador = /analisador|estimativa por documentos|inferido/.test(normText);
  if (qtd < 0 || preco < 0) return true;
  if (qtd === 0 && preco > 0) return true;
  if (inferidoPorAnalisador && Number.isInteger(qtd) && qtd >= 1900 && qtd <= 2100) return true;
  if (inferidoPorAnalisador && !Number(it.totalLinha || 0) && total > 500000) return true;
  if (total > 10000000 && /SINAPI|SICOR|SUDECAP|R\$/i.test(text)) return true;
  return false;
}

function orcamentoAuditadoParaRelatorio() {
  const all = Array.isArray(STATE.orcamento) ? STATE.orcamento : [];
  const bloqueados = all.filter(itemOrcamentoCorrompido);
  const items = all.filter(it => !itemOrcamentoCorrompido(it));
  return { items, bloqueados };
}

// ─── PREVIEW PLANILHA ORÇAMENTÁRIA ────────────────────────
function renderPreviewPlanilha() {
  const meta = getMeta();
  const modelo = relatorioModeloAtual();
  const { items, bloqueados } = orcamentoAuditadoParaRelatorio();
  const sub  = items.reduce((s,i)=>s+itemValor(i), 0);
  const bdi  = bdiValue();
  const total = totalComBDI(sub);
  const bdiLabel = bdiText('Não configurado');
  const now  = new Date().toLocaleDateString('pt-BR');

  document.getElementById('rel-info-count').textContent = `${items.length} itens válidos${bloqueados.length ? ` · ${bloqueados.length} bloqueado(s) pela auditoria de extração` : ''} · Subtotal: ${fmtMoeda(sub)} · Total c/ BDI: ${fmtMoeda(total)}`;

  let metaRows = `
    <tr class="sh-meta"><td class="lbl">Obra:</td><td colspan="3">${meta.obra}</td><td class="lbl">Órgão:</td><td colspan="3">${meta.orgao}</td></tr>
    <tr class="sh-meta"><td class="lbl">Edital/Processo:</td><td colspan="3">${meta.edital}</td><td class="lbl">Local:</td><td colspan="3">${meta.local}</td></tr>
    <tr class="sh-meta"><td class="lbl">Resp. Técnico:</td><td>${meta.rt}</td><td class="lbl">CREA/CAU:</td><td>${meta.crea}</td><td class="lbl">ART/RRT:</td><td colspan="3">${meta.art}</td></tr>
    <tr class="sh-meta"><td class="lbl">Data Base:</td><td>${meta.data}</td><td class="lbl">Fonte:</td><td>${meta.fonte}</td><td class="lbl">Emissão:</td><td colspan="3">${now}</td></tr>`;

  let itemRows = '';
  if (!items.length) {
    itemRows = '<tr class="sh-row"><td colspan="11" style="text-align:center;padding:20px;color:#999">Nenhum item no orçamento</td></tr>';
  } else {
    items.forEach((it, i) => {
      const total_it = itemValor(it);
      const total_bdi = totalComBDI(total_it);
      const desv = it.ref > 0 ? ((it.preco - it.ref)/it.ref*100).toFixed(1)+'%' : '—';
      const desvColor = it.ref > 0 && it.preco > it.ref*1.05 ? 'color:#c00;font-weight:700' : '';
      itemRows += `<tr class="sh-row">
        <td style="text-align:center">${i+1}</td>
        <td style="font-family:monospace">${it.cod}</td>
        <td style="max-width:280px">${it.desc}</td>
        <td style="text-align:center">${it.unid}</td>
        <td style="text-align:right">${fmtNum(it.qtd)}</td>
        <td style="text-align:right">${fmtMoeda(it.preco)}</td>
        <td style="text-align:right;color:#666">${it.ref > 0 ? fmtMoeda(it.ref) : '—'}</td>
        <td style="text-align:right;${desvColor}">${desv}</td>
        <td style="text-align:right">${bdiLabel}</td>
        <td style="text-align:right">${fmtMoeda(total_bdi/it.qtd)}</td>
        <td style="text-align:right;font-weight:700">${fmtMoeda(total_bdi)}</td>
      </tr>`;
    });
  }

  const html = `<table>
    <tr><td colspan="11" class="sh-header">${modelo.titulo}</td></tr>
    <tr><td colspan="11" class="sh-sub">${modelo.subtitulo} · Base de preços: ${meta.fonte} · Moeda: ${moedaCodigo()}</td></tr>
    ${metaRows}
    ${bloqueados.length ? `<tr class="sh-row"><td colspan="11" style="background:#fff4e5;color:#7a3e00!important;font-weight:700;padding:8px 10px;border:1px solid #f0c27a">Auditoria de extração: ${bloqueados.length} linha(s) bloqueada(s) por indício de cabeçalho, fórmula, valor deslocado ou resto de PDF. Reimporte o arquivo para recompor estes itens.</td></tr>` : ''}
    ${descontoPregaoRelatorioHtml(11)}
    <tr class="sh-col-header">
      <th style="width:35px">Item</th><th style="width:80px">Código</th><th>Descrição do Serviço/Insumo</th>
      <th style="width:40px">Un</th><th style="width:60px">Qtd</th>
      <th style="width:90px">${moedaHeader('P.Unit')}</th><th style="width:90px">Ref.SINAPI</th>
      <th style="width:60px">Desvio</th><th style="width:55px">BDI%</th>
      <th style="width:100px">P.Unit c/BDI</th><th style="width:100px">${moedaHeader('Total c/BDI')}</th>
    </tr>
    ${itemRows}
    <tr class="sh-total">
      <td colspan="4">SUBTOTAL (Preço de Custo Direto)</td>
      <td colspan="6" style="text-align:right">Sem BDI:</td>
      <td style="text-align:right">${fmtMoeda(sub)}</td>
    </tr>
    <tr class="sh-bdi">
      <td colspan="10" style="text-align:right">BDI (${bdiLabel}) — Decreto 7983/2013:</td>
      <td style="text-align:right;color:#2a6b00;font-weight:700">${fmtMoeda(sub * bdi/100)}</td>
    </tr>
    <tr class="sh-total">
      <td colspan="10" style="text-align:right;font-size:13px">TOTAL GERAL (Preço de Venda com BDI):</td>
      <td style="text-align:right;font-size:14px">${fmtMoeda(total)}</td>
    </tr>
    <tr><td colspan="11" style="padding:4px 10px;font-size:10px;color:#666;border:1px solid #ddd">
      * Preços em conformidade com a tabela ${meta.fonte} · Data base: ${meta.data} · BDI: ${bdiLabel} (limite TCU Acórdão 2622/2013: 25%) · Cotação: 1 ${moedaCodigo()} = R$ ${moedaCotacao().toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}
    </td></tr>
    <tr class="sh-sign">
      <td colspan="11">
        <table style="width:100%;margin-top:10px">
          <tr>
            <td style="width:50%;padding:10px;text-align:center;border-top:1px solid #333">
              <div style="font-size:11px;color:#555">${meta.rt}</div>
              <div style="font-size:11px;color:#555">${meta.crea} · ${meta.art}</div>
              <div style="font-size:10px;color:#888">Responsável Técnico</div>
            </td>
            <td style="width:50%;padding:10px;text-align:center;border-top:1px solid #333">
              <div style="font-size:11px;color:#555">${meta.local}, ${new Date().toLocaleDateString('pt-BR')}</div>
              <div style="font-size:10px;color:#888">Contratante / Fiscal de Obra</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
  document.getElementById('preview-planilha').innerHTML = html;
}

// ─── PREVIEW BDI ───────────────────────────────────────────
function renderPreviewBDI() {
  const meta = getMeta();
  const c = bdiComponentValues(STATE.bdiComponents);
  const bdi = bdiValue();
  const tipo = document.getElementById('bdi-tipo')?.value || 'civil';
  const lim = BDI_LIMITES[tipo] || 25;

  const rows = [
    ['AC', 'Administração Central', c.ac],
    ['S',  'Seguros e Garantias', c.s],
    ['R',  'Risco', c.r],
    ['DF', 'Despesas Financeiras', c.df],
    ['L',  'Lucro', c.l],
    ['I',  'Tributos (ISS+PIS+COFINS)', c.i],
  ].map(([sigla, nome, val]) => `<tr class="sh-row">
    <td style="font-weight:700;text-align:center">${sigla}</td>
    <td>${nome}</td>
    <td style="text-align:right">${val.toFixed(2)}%</td>
    <td style="text-align:right;color:#666">${(val/100).toFixed(4)}</td>
  </tr>`).join('');

  const status = hasBDI() ? (bdi <= lim ? 'CONFORME' : 'NÃO CONFORME') : 'NÃO CONFIGURADO';
  const statusColor = !hasBDI() ? '#996600' : (bdi <= lim ? '#2a6b00' : '#c00');
  const bdiLabel = bdiText('Não configurado');

  document.getElementById('preview-bdi-rel').innerHTML = `<table>
    <tr><td colspan="4" class="sh-header">COMPOSIÇÃO DO BDI</td></tr>
    <tr><td colspan="4" class="sh-sub">Decreto nº 7.983/2013, Art. 9º · TCU Acórdão 2622/2013</td></tr>
    <tr class="sh-meta"><td class="lbl">Obra:</td><td colspan="3">${meta.obra}</td></tr>
    <tr class="sh-meta"><td class="lbl">Tipo de Obra:</td><td>${tipo==='civil'?'Obras Civis':tipo==='eletrica'?'Instalações Elétricas':'Fornecimento de Materiais'}</td>
      <td class="lbl">Limite TCU:</td><td>${lim}%</td></tr>
    <tr class="sh-col-header"><th>Componente</th><th>Descrição</th><th>Percentual (%)</th><th>Fator</th></tr>
    ${rows}
    <tr class="sh-total">
      <td colspan="2">BDI CALCULADO — Fórmula: [(1+AC+S+R)(1+DF)(1+L)/(1-I)-1]×100</td>
      <td style="text-align:right;font-size:14px">${bdiLabel}</td>
      <td style="text-align:right;color:${statusColor};font-weight:800">${status}</td>
    </tr>
    <tr class="sh-bdi">
      <td colspan="4" style="font-size:10px;color:#555;padding:8px 10px">
        Limite TCU Acórdão 2622/2013 para ${tipo==='civil'?'obras civis':tipo==='eletrica'?'instalações elétricas':'fornecimento de materiais'}: ${lim}%
        · BDI apurado: ${bdiLabel} · Status: <strong style="color:${statusColor}">${status}</strong>
      </td>
    </tr>
    <tr class="sh-sign"><td colspan="4" style="padding:20px 10px;text-align:center;border-top:1px solid #333;font-size:11px">
      ${meta.rt} — ${meta.crea} · ${meta.art}<br>
      <span style="font-size:10px;color:#888">Responsável Técnico pelo Orçamento</span>
    </td></tr>
  </table>`;
}

// ─── PREVIEW CURVA ABC ─────────────────────────────────────
function renderPreviewABC() {
  const meta = getMeta();
  const { items: validos } = orcamentoAuditadoParaRelatorio();
  const items = [...validos].sort((a,b)=>itemValor(b)-itemValor(a));
  const totalG = items.reduce((s,i)=>s+itemValor(i), 0);
  let acum = 0;

  if (!items.length) {
    document.getElementById('preview-abc-rel').innerHTML = '<div style="padding:24px;text-align:center;color:#999">Nenhum item no orçamento</div>';
    return;
  }

  const rows = items.map((it, i) => {
    const v = itemValor(it);
    const pct = totalG > 0 ? v/totalG*100 : 0;
    acum += pct;
    const cls = acum <= 80 ? 'A' : acum <= 95 ? 'B' : 'C';
    const clsColor = cls==='A' ? '#c00' : cls==='B' ? '#b87000' : '#2a6b00';
    return `<tr class="sh-row">
      <td style="text-align:center">${i+1}</td>
      <td style="font-family:monospace">${it.cod}</td>
      <td>${it.desc.substring(0,60)}</td>
      <td style="text-align:center">${it.unid}</td>
      <td style="text-align:right">${fmtNum(it.qtd)}</td>
      <td style="text-align:right">${fmtMoeda(it.preco)}</td>
      <td style="text-align:right;font-weight:700">${fmtMoeda(v)}</td>
      <td style="text-align:right">${pct.toFixed(2)}%</td>
      <td style="text-align:right">${acum.toFixed(2)}%</td>
      <td style="text-align:center">
        <div style="background:#eee;border-radius:3px;height:8px;overflow:hidden">
          <div style="background:${clsColor};height:100%;width:${Math.min(pct,100)}%"></div>
        </div>
      </td>
      <td style="text-align:center;font-weight:800;color:${clsColor}">${cls}</td>
    </tr>`;
  }).join('');

  document.getElementById('preview-abc-rel').innerHTML = `<table>
    <tr><td colspan="11" class="sh-header">CURVA ABC — ANÁLISE DE REPRESENTATIVIDADE</td></tr>
    <tr><td colspan="11" class="sh-sub">Obra: ${meta.obra} · Data: ${new Date().toLocaleDateString('pt-BR')}</td></tr>
    <tr class="sh-col-header">
      <th>#</th><th>Código</th><th>Descrição</th><th>Un</th><th>Qtd</th>
      <th>P.Unit</th><th>${moedaHeader('Total')}</th><th>% Item</th><th>% Acum.</th><th style="width:80px">Participação</th><th>Classe</th>
    </tr>
    ${rows}
    <tr class="sh-total">
      <td colspan="6" style="text-align:right">TOTAL GERAL:</td>
      <td style="text-align:right">${fmtMoeda(totalG)}</td>
      <td colspan="4" style="text-align:center">A≤80% | B≤95% | C≤100%</td>
    </tr>
  </table>`;
}

// ─── PREVIEW RESUMO EXECUTIVO ──────────────────────────────
function renderPreviewResumo() {
  const meta = getMeta();
  const modelo = relatorioModeloAtual();
  const { items, bloqueados } = orcamentoAuditadoParaRelatorio();
  const sub = items.reduce((s,i)=>s+itemValor(i), 0);
  const bdi = bdiValue();
  const total = totalComBDI(sub);
  const bdiLabel = bdiText('Não configurado');

  // Totais por categoria
  const cats = {};
  items.forEach(i => {
    cats[i.cat] = (cats[i.cat]||0) + itemValor(i);
  });
  const catRows = Object.entries(cats).map(([cat, val]) =>
    `<tr class="sh-row"><td>${cat}</td><td style="text-align:right">${fmtMoeda(val)}</td>
     <td style="text-align:right">${(sub > 0 ? val/sub*100 : 0).toFixed(1)}%</td>
     <td style="text-align:right">${fmtMoeda(totalComBDI(val))}</td></tr>`
  ).join('');

  // Auditoria summary
  const acima = items.filter(i => i.ref > 0 && i.preco > i.ref*1.05).length;
  const conforme = items.filter(i => i.ref > 0 && i.preco <= i.ref*1.05).length;
  const nf = items.filter(i => !i.ref || i.ref === 0).length;

  document.getElementById('preview-resumo-rel').innerHTML = `<table>
    <tr><td colspan="4" class="sh-header">${modelo.resumo}</td></tr>
    <tr><td colspan="4" class="sh-sub">Obra: ${meta.obra} | ${meta.orgao} | Processo: ${meta.edital} | Moeda: ${moedaCodigo()}</td></tr>
    ${bloqueados.length ? `<tr class="sh-row"><td colspan="4" style="background:#fff4e5;color:#7a3e00!important;font-weight:700;padding:8px 10px;border:1px solid #f0c27a">Auditoria de extração: ${bloqueados.length} linha(s) bloqueada(s) e fora dos totais.</td></tr>` : ''}
    ${descontoPregaoRelatorioHtml(4)}
    <tr class="sh-meta"><td class="lbl">Responsável:</td><td>${meta.rt} — ${meta.crea}</td><td class="lbl">ART/RRT:</td><td>${meta.art}</td></tr>
    <tr class="sh-meta"><td class="lbl">Local:</td><td>${meta.local}</td><td class="lbl">Data Base:</td><td>${meta.data}</td></tr>
    <tr class="sh-meta"><td class="lbl">Fonte:</td><td>${meta.fonte}</td><td class="lbl">Emissão:</td><td>${new Date().toLocaleDateString('pt-BR')}</td></tr>

    <tr><td colspan="4" style="padding:8px 10px;background:#e8f0f8;font-weight:800;font-size:12px;border:1px solid #ccc">1. RESUMO FINANCEIRO</td></tr>
    <tr class="sh-col-header"><th>Descrição</th><th colspan="3" style="text-align:right">${moedaHeader('Valor')}</th></tr>
    <tr class="sh-row"><td>Custo Direto (sem BDI)</td><td colspan="3" style="text-align:right">${fmtMoeda(sub)}</td></tr>
    <tr class="sh-row"><td>BDI — ${bdiLabel} (Decreto 7983/2013)</td><td colspan="3" style="text-align:right">${fmtMoeda(sub*bdi/100)}</td></tr>
    <tr class="sh-total"><td>TOTAL GERAL COM BDI</td><td colspan="3" style="text-align:right;font-size:14px">${fmtMoeda(total)}</td></tr>

    <tr><td colspan="4" style="padding:8px 10px;background:#e8f0f8;font-weight:800;font-size:12px;border:1px solid #ccc">2. DISTRIBUIÇÃO POR CATEGORIA</td></tr>
    <tr class="sh-col-header"><th>Categoria</th><th>Subtotal s/ BDI</th><th>% Part.</th><th>Total c/ BDI</th></tr>
    ${catRows || '<tr class="sh-row"><td colspan="4" style="text-align:center">—</td></tr>'}

    <tr><td colspan="4" style="padding:8px 10px;background:#e8f0f8;font-weight:800;font-size:12px;border:1px solid #ccc">3. CONFORMIDADE SINAPI</td></tr>
    <tr class="sh-col-header"><th>Status</th><th style="text-align:right">Qtd Itens</th><th colspan="2">Observação</th></tr>
    <tr class="sh-row"><td style="color:#2a6b00;font-weight:700">✓ Conformes (≤ ref. SINAPI + 5%)</td><td style="text-align:right">${conforme}</td><td colspan="2">Preço dentro do parâmetro</td></tr>
    <tr class="sh-row"><td style="color:#c00;font-weight:700">✗ Acima do limite (&gt; ref. SINAPI + 5%)</td><td style="text-align:right">${acima}</td><td colspan="2">${acima > 0 ? 'ATENÇÃO: justificar desvios' : 'Nenhum item acima'}</td></tr>
    <tr class="sh-row"><td style="color:#888">— Sem referência SINAPI</td><td style="text-align:right">${nf}</td><td colspan="2">Preço de mercado / composição própria</td></tr>
    <tr class="sh-row"><td style="font-weight:700">Total de itens orçados</td><td style="text-align:right;font-weight:700">${items.length}</td><td colspan="2"></td></tr>

    <tr class="sh-sign"><td colspan="4" style="padding:20px 10px;border-top:2px solid #1a3a5c">
      <table style="width:100%"><tr>
        <td style="width:50%;text-align:center;padding:10px;border-top:1px solid #333">
          <strong>${meta.rt}</strong><br>${meta.crea}<br>${meta.art}
          <br><span style="font-size:10px;color:#888">Responsável Técnico</span>
        </td>
        <td style="width:50%;text-align:center;padding:10px;border-top:1px solid #333">
          <br><br>______________________________<br>
          <span style="font-size:10px;color:#888">Fiscal / Aprovação — ${meta.orgao}</span>
        </td>
      </tr></table>
    </td></tr>
  </table>`;
}

// ─── EXCEL PROFISSIONAL (SheetJS) ──────────────────────────
function exportarExcelProfissional() {
  if (!window.XLSX) { toast('SheetJS não carregado', 'error'); return; }
  const meta = getMeta();
  const modelo = relatorioModeloAtual();
  const { items, bloqueados } = orcamentoAuditadoParaRelatorio();
  const bdi = bdiValue();
  const bdiLabel = bdiText('Não configurado');
  const wb = XLSX.utils.book_new();

  // ── Aba 1: Planilha Orçamentária ──
  const planData = [
    [modelo.titulo + ' — TLPlanly'],
    ['Obra:', meta.obra, '', 'Órgão:', meta.orgao],
    ['Edital/Processo:', meta.edital, '', 'Local:', meta.local],
    ['Resp. Técnico:', meta.rt, '', 'CREA/CAU:', meta.crea],
    ['ART/RRT:', meta.art, '', 'Data Base:', meta.data],
    ['Fonte de Preços:', meta.fonte, '', 'Emissão:', new Date().toLocaleDateString('pt-BR')],
    ['Modelo:', meta.modelo, '', 'Moeda:', moedaCodigo(), 'Cotação:', moedaCotacao()],
    ...(descontoPregaoAtivo() ? [[descontoPregaoRelatorioTexto()], ['Ajuste de centavos:', STATE.descontoProposta.itemAjuste || 'Não necessário']] : []),
    ...(bloqueados.length ? [[`Auditoria de extração: ${bloqueados.length} linha(s) bloqueada(s) e excluída(s) dos totais.`], []] : [[]]),
    ['Item','Capítulo','Código SINAPI','Descrição','Un','Qtd',moedaHeader('P.Unit'),moedaHeader('Ref.SINAPI'),'Desvio %','BDI %',moedaHeader('P.Unit c/BDI'),moedaHeader('Total c/BDI'),'Categoria'],
  ];
  let sub = 0;
  items.forEach((it, i) => {
    const v = itemValor(it);
    sub += v;
    const desv = it.ref > 0 ? ((it.preco - it.ref)/it.ref*100).toFixed(2) : '';
    planData.push([
      i+1, it.capitulo || it.cat || 'Serviços', it.cod, it.desc, it.unid,
      it.qtd, valorMoeda(it.preco), it.ref > 0 ? valorMoeda(it.ref) : '',
      desv !== '' ? parseFloat(desv) : '',
      hasBDI() ? parseFloat(bdi.toFixed(2)) : '',
      parseFloat(valorMoeda(totalComBDI(it.preco)).toFixed(2)),
      parseFloat(valorMoeda(totalComBDI(v)).toFixed(2)),
      it.cat
    ]);
  });
  planData.push([]);
  planData.push(['','','','','','SUBTOTAL (sem BDI):','','','','',valorMoeda(sub)]);
  planData.push(['','','','','','BDI ('+bdiLabel+'):', '', '', '', '', valorMoeda(sub*bdi/100)]);
  planData.push(['','','','','','TOTAL GERAL c/ BDI:','','','','',valorMoeda(totalComBDI(sub))]);

  const ws1 = XLSX.utils.aoa_to_sheet(planData);
  ws1['!cols'] = [
    {wch:5},{wch:22},{wch:12},{wch:45},{wch:6},{wch:10},{wch:14},{wch:14},{wch:10},{wch:8},{wch:16},{wch:16},{wch:12}
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilha Orçamentária');

  // ── Aba 2: Composição BDI ──
  const c = bdiComponentValues(STATE.bdiComponents);
  const bdiData = [
    ['COMPOSIÇÃO DO BDI — Decreto nº 7.983/2013, Art. 9º'],
    ['Obra:', meta.obra],
    [],
    ['Componente','Descrição','Percentual (%)'],
    ['AC','Administração Central', c.ac],
    ['S', 'Seguros e Garantias', c.s],
    ['R', 'Risco', c.r],
    ['DF','Despesas Financeiras', c.df],
    ['L', 'Lucro', c.l],
    ['I', 'Tributos (ISS+PIS+COFINS)', c.i],
    [],
    ['','BDI CALCULADO:', hasBDI() ? parseFloat(bdi.toFixed(2)) : 'Não configurado'],
    ['','Fórmula: [(1+AC+S+R)(1+DF)(1+L)/(1-I)-1]×100',''],
    ['','Limite TCU Acórdão 2622/2013:', 25],
    ['','Status:', hasBDI() ? (bdi <= 25 ? 'CONFORME' : 'NÃO CONFORME') : 'NÃO CONFIGURADO'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(bdiData);
  ws2['!cols'] = [{wch:10},{wch:35},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws2, 'BDI');

  // ── Aba 3: Curva ABC ──
  const abcItems = [...items].sort((a,b)=>itemValor(b)-itemValor(a));
  const totalG = abcItems.reduce((s,i)=>s+itemValor(i),0);
  let acum = 0;
  const abcData = [
    ['CURVA ABC — ANÁLISE DE REPRESENTATIVIDADE'],
    ['Obra:', meta.obra],
    [],
    ['#','Código','Descrição','Un','Qtd',moedaHeader('P.Unit'),moedaHeader('Total'),'% Item','% Acumulado','Classe'],
  ];
  abcItems.forEach((it, i) => {
    const v = itemValor(it);
    const pct = totalG > 0 ? v/totalG*100 : 0;
    acum += pct;
    const cls = acum <= 80 ? 'A' : acum <= 95 ? 'B' : 'C';
    abcData.push([i+1, it.cod, it.desc, it.unid, it.qtd, valorMoeda(it.preco),
      parseFloat(valorMoeda(v).toFixed(2)), parseFloat(pct.toFixed(2)), parseFloat(acum.toFixed(2)), cls]);
  });
  abcData.push([]);
  abcData.push(['','','','','','TOTAL:', parseFloat(valorMoeda(totalG).toFixed(2)),'100.00%','','']);
  const ws3 = XLSX.utils.aoa_to_sheet(abcData);
  ws3['!cols'] = [{wch:5},{wch:12},{wch:45},{wch:6},{wch:10},{wch:14},{wch:14},{wch:10},{wch:12},{wch:8}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Curva ABC');

  // ── Aba 4: Encargos Sociais ──
  const enc = ENCARGOS['nd'];
  const encTot = enc.reduce((s,[,v])=>s+v,0);
  const encData = [['ENCARGOS SOCIAIS — Não Desonerado'],['Componente','%']];
  enc.forEach(([n,v]) => encData.push([n, v]));
  encData.push([]);
  encData.push(['TOTAL:', encTot]);
  const ws4 = XLSX.utils.aoa_to_sheet(encData);
  ws4['!cols'] = [{wch:40},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws4, 'Encargos Sociais');

  // ── Aba 5: Planejamento ──
  const planObraData = [['PLANEJAMENTO FÍSICO-FINANCEIRO'], ['Obra:', meta.obra], [], ['ID','Tarefa','Serviço vinculado','Início','Fim','Dias','Dependências',moedaHeader('Valor'),'Progresso (%)']];
  STATE.planejamento.forEach(t => {
    const item = getItemById(t.itemId);
    planObraData.push([t.code, t.desc, itemLabel(item), t.inicio, t.fim, daysBetween(t.inicio, t.fim), (t.deps || []).join(', '), valorMoeda(itemValor(item)), t.progresso || 0]);
  });
  const ws5 = XLSX.utils.aoa_to_sheet(planObraData);
  ws5['!cols'] = [{wch:8},{wch:38},{wch:42},{wch:12},{wch:12},{wch:8},{wch:18},{wch:14},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws5, 'Planejamento');

  // ── Aba 6: Medições ──
  const medData = [['MEDIÇÕES E ACOMPANHAMENTO'], ['Obra:', meta.obra], [], ['Período','Data','Código','Descrição','Qtd contratada','Qtd medida','Qtd acumulada',moedaHeader('Valor medido'),'Status']];
  STATE.medicoes.forEach(m => {
    items.forEach(it => {
      const qtdMed = Number(m.itens?.[it.id]) || 0;
      const acumMed = medicoesAcumulado(it.id);
      medData.push([m.nome, m.data, it.cod, it.desc, it.qtd, qtdMed, acumMed, valorMoeda(qtdMed * (Number(it.preco) || 0)), acumMed > it.qtd ? 'EXCEDIDO' : acumMed >= it.qtd ? 'CONCLUÍDO' : 'EM EXECUÇÃO']);
    });
  });
  const ws6 = XLSX.utils.aoa_to_sheet(medData);
  ws6['!cols'] = [{wch:20},{wch:12},{wch:12},{wch:45},{wch:14},{wch:12},{wch:14},{wch:16},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws6, 'Medições');

  // ── Aba 7: Quantitativos ──
  const qtData = [['MEMÓRIAS QUANTITATIVAS'], ['Obra:', meta.obra], [], ['Código','Serviço','Linha','Fórmula','Resultado']];
  Object.entries(STATE.quantitativos).forEach(([itemId, linhas]) => {
    const item = getItemById(itemId);
    (linhas || []).forEach(l => qtData.push([item?.cod || '', item?.desc || '', l.desc, l.formula, l.resultado]));
  });
  const ws7 = XLSX.utils.aoa_to_sheet(qtData);
  ws7['!cols'] = [{wch:12},{wch:45},{wch:30},{wch:24},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws7, 'Quantitativos');

  // ── Aba 8: Anexos e especificações ──
  const docData = [['ANEXOS E ESPECIFICAÇÕES'], ['Obra:', meta.obra], [], ['Tipo','Título','Vínculo','Texto','Arquivos','Criado em']];
  STATE.documentos.forEach(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    docData.push([d.tipo, d.titulo, d.targetId === 'obra' ? 'Obra / Geral' : itemLabel(item), d.texto || '', (d.files || []).map(f => f.name).join(', '), d.criadoEm]);
  });
  const ws8 = XLSX.utils.aoa_to_sheet(docData);
  ws8['!cols'] = [{wch:20},{wch:32},{wch:42},{wch:60},{wch:32},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws8, 'Anexos');

  // ── Abas operacionais: custos, cotações e frentes ──
  if ((STATE.equipamentosHorarios || []).length || (STATE.maoObraHoraria || []).length) {
    const wsCustos = XLSX.utils.aoa_to_sheet(custosHorariosRows());
    wsCustos['!cols'] = [{wch:18},{wch:16},{wch:42},{wch:16},{wch:70}];
    XLSX.utils.book_append_sheet(wb, wsCustos, 'Custos Horários');
  }

  if ((STATE.cotacoesCustos || []).length) {
    const wsCot = XLSX.utils.aoa_to_sheet(cotacoesRows());
    wsCot['!cols'] = [{wch:16},{wch:48},{wch:28},{wch:10},{wch:16},{wch:18},{wch:26}];
    XLSX.utils.book_append_sheet(wb, wsCot, 'Cotações');
  }

  if ((STATE.frentesServico || []).length) {
    const wsFr = XLSX.utils.aoa_to_sheet(frentesRows());
    wsFr['!cols'] = [{wch:12},{wch:42},{wch:18},{wch:18},{wch:18}];
    XLSX.utils.book_append_sheet(wb, wsFr, 'Frentes');
  }

  if (bloqueados.length) {
    const bloqData = [
      ['LINHAS BLOQUEADAS PELA AUDITORIA DE EXTRAÇÃO'],
      ['Estas linhas foram excluídas dos totais para evitar orçamento inflado. Reimporte ou corrija manualmente antes de usar como planilha final.'],
      [],
      ['Código','Descrição','Un','Qtd','Preço','Total calculado','Motivo','Linha de origem'],
    ];
    bloqueados.forEach(it => {
      bloqData.push([
        it.cod || '',
        it.desc || '',
        it.unid || '',
        Number(it.qtd) || 0,
        valorMoeda(Number(it.preco) || 0),
        valorMoeda(itemValor(it)),
        (it.certMotivos || []).join('; ') || 'Indício de cabeçalho, fórmula, valor deslocado ou resto de PDF.',
        String(it.linhaOrigem || '').slice(0, 500)
      ]);
    });
    const wsBloq = XLSX.utils.aoa_to_sheet(bloqData);
    wsBloq['!cols'] = [{wch:14},{wch:50},{wch:8},{wch:12},{wch:14},{wch:16},{wch:48},{wch:80}];
    XLSX.utils.book_append_sheet(wb, wsBloq, 'Linhas bloqueadas');
  }

  if (descontoPregaoAtivo()) {
    const d = STATE.descontoProposta;
    const pregData = [
      ['READEQUAÇÃO DE PROPOSTA DO PREGÃO'],
      ['Obra:', meta.obra],
      ['Edital/Processo:', meta.edital],
      ['Aplicado em:', new Date(d.aplicadoEm).toLocaleString('pt-BR')],
      [],
      ['Campo','Valor'],
      ['Valor estimado do edital', valorMoeda(d.original)],
      ['Valor vencedor', valorMoeda(d.final)],
      ['Desconto informado (%)', Number(d.percentual || 0)],
      ['Desconto real sobre total atual (%)', Number(d.descontoRealSistema || d.percentual || 0)],
      ['Base de cálculo', descontoPregaoBaseLabel(d.base)],
      ['Fator aplicado aos preços unitários (%)', Number(((Number(d.fatorAplicacao) || 0) * 100).toFixed(6))],
      ['Subtotal antes', valorMoeda(d.subtotalAntes)],
      ['Total com BDI antes', valorMoeda(d.totalAntes)],
      ['Subtotal depois', valorMoeda(d.subtotalDepois)],
      ['Total com BDI depois', valorMoeda(d.totalDepois)],
      ['Ajuste de centavos', d.itemAjuste || 'Não necessário'],
      ['Resíduo final técnico', Number(d.residuoFinal || 0)],
      [],
      ['Observação'],
      ['Os preços unitários foram recalculados proporcionalmente para fechar o valor vencedor informado, preservando quantidades e estrutura da planilha.']
    ];
    const wsPreg = XLSX.utils.aoa_to_sheet(pregData);
    wsPreg['!cols'] = [{wch:36},{wch:48}];
    XLSX.utils.book_append_sheet(wb, wsPreg, 'Readequação Pregão');
  }

  // Save
  const fname = (meta.obra || 'orcamento').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'') + '_TLPlanly.xlsx';
  XLSX.writeFile(wb, fname);
  toast('Excel profissional gerado: ' + fname, 'success');
}

function exportarExcelBDI() {
  if (!window.XLSX) return;
  const meta = getMeta();
  const c = bdiComponentValues(STATE.bdiComponents);
  const bdi = bdiValue();
  const wb = XLSX.utils.book_new();
  const data = [
    ['COMPOSIÇÃO DO BDI — Decreto nº 7.983/2013, Art. 9º'],
    ['Obra:', meta.obra, 'RT:', meta.rt],
    ['CREA/CAU:', meta.crea, 'ART/RRT:', meta.art],
    [],
    ['Componente','Descrição','(%)'],
    ['AC','Administração Central', c.ac],
    ['S', 'Seguros e Garantias', c.s],
    ['R', 'Risco', c.r],
    ['DF','Despesas Financeiras', c.df],
    ['L', 'Lucro', c.l],
    ['I', 'Tributos (ISS+PIS+COFINS)', c.i],
    [],
    ['','BDI CALCULADO:', hasBDI() ? parseFloat(bdi.toFixed(2)) : 'Não configurado'],
    ['','Limite TCU:', 25],
    ['','Status:', hasBDI() ? (bdi <= 25 ? 'CONFORME' : 'NÃO CONFORME') : 'NÃO CONFIGURADO'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{wch:10},{wch:35},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws, 'BDI');
  XLSX.writeFile(wb, 'BDI_' + (meta.obra||'obra').replace(/\s+/g,'_') + '.xlsx');
  toast('Excel BDI exportado', 'success');
}

function exportarExcelABC() {
  if (!window.XLSX) return;
  exportarExcelProfissional(); // Includes ABC sheet
}

function imprimirRelatorio() {
  exportarPDFProfissional();
}

function exportarPDFProfissional(tabId = '') {
  const active = tabId || ['planilha','bdi-rel','abc-rel','resumo-rel'].find(id => document.getElementById('exp-' + id)?.classList.contains('active')) || 'planilha';
  const renderers = {
    'planilha': renderPreviewPlanilha,
    'bdi-rel': renderPreviewBDI,
    'abc-rel': renderPreviewABC,
    'resumo-rel': renderPreviewResumo
  };
  const previewIds = {
    'planilha': 'preview-planilha',
    'bdi-rel': 'preview-bdi-rel',
    'abc-rel': 'preview-abc-rel',
    'resumo-rel': 'preview-resumo-rel'
  };
  renderers[active]?.();
  const el = document.getElementById(previewIds[active] || 'preview-planilha');
  const meta = getMeta();
  const titles = {
    'planilha': 'Planilha Orçamentária - TLPlanly',
    'bdi-rel': 'Composição do BDI - TLPlanly',
    'abc-rel': 'Curva ABC - TLPlanly',
    'resumo-rel': 'Resumo Executivo - TLPlanly'
  };
  exportHtmlToPDF(titles[active] || 'Relatório TLPlanly', `<div class="preview-sheet">${el?.innerHTML || ''}</div>`, `${safeFileName(meta.obra || 'relatorio')}_${active}_TLPlanly`);
}

// Patch renderRelatorioPreview to use new system
function renderRelatorioPreview() {
  renderPreviewPlanilha();
}

// Init relatorio when view opens
const _origShowView = showView;
showView = function(id) {
  _origShowView(id);
  if (id === 'relatorio') {
    renderPreviewPlanilha();
  }
};


// ═══════════════════════════════════════════════════════════
// FASE 3 — COMPOSIÇÕES ANALÍTICAS (CPU)
// ═══════════════════════════════════════════════════════════
let CPU = {
  cod: '', desc: '', unid: 'm²', tipo: 'Serviços Gerais', prod: 1.0,
  insumos: [],   // { cod, desc, unid, tipo, coef, preco }
  encargos: 'nd',
  encPct: 127.5,
};

let CPU_BIBLIOTECA = Array.isArray(STATE.cpuBiblioteca) ? STATE.cpuBiblioteca : [];   // composições salvas
let CPU_EDITOR = { activeId: null, stack: [], selectedIndex: 0 };
let CPU_OP_SELECTED = new Set();
let CPU_IMPORT_BIBLIOTECA = { file: null, sheets: [], currentIndex: 0 };

// Persiste biblioteca
function cpuSaveLib() {
  STATE.cpuBiblioteca = Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
  try { localStorage.setItem('tlplanly_cpu_lib', JSON.stringify(STATE.cpuBiblioteca)); } catch(e){}
  cpuEditorRender();
  cpuBancoExternoRender();
  saveState();
}
function cpuLoadLib() {
  try {
    if (Array.isArray(STATE.cpuBiblioteca) && STATE.cpuBiblioteca.length) {
      CPU_BIBLIOTECA = STATE.cpuBiblioteca;
    } else {
      const s = localStorage.getItem('tlplanly_cpu_lib');
      if (s) CPU_BIBLIOTECA = JSON.parse(s);
    }
    STATE.cpuBiblioteca = Array.isArray(CPU_BIBLIOTECA) ? CPU_BIBLIOTECA : [];
  } catch(e){}
}

function cpuRenderManualCount() {
  const el = document.getElementById('cpu-manual-count');
  if (el) el.textContent = `${(STATE.insumosManuais || []).length} insumo(s) manuais salvos`;
}

function cpuTipoManual(value, desc = '') {
  const code = String(value || '').trim().toUpperCase();
  if (/^IH/.test(code)) return 'S';
  if (/^IE/.test(code)) return 'E';
  if (/^IT/.test(code)) return 'T';
  if (/^IM/.test(code)) return 'M';
  if (/^IS/.test(code)) return 'SV';
  const direto = textoChave(value || '');
  if (['S','MO','MAO OBRA','MAO DE OBRA','HOMEM'].includes(direto)) return 'S';
  if (['E','EQ','EQUIP','EQUIPAMENTO'].includes(direto)) return 'E';
  if (['M','MAT','MATERIAL'].includes(direto)) return 'M';
  if (['T','TR','TRANSP','TRANSPORTE','FRETE'].includes(direto)) return 'T';
  if (['SV','SERV','SERVICO','SERVICOS'].includes(direto)) return 'SV';
  const raw = textoChave(`${value || ''} ${desc || ''}`);
  if (raw.includes('MAO DE OBRA') || raw.includes('MAO OBRA') || raw.includes('HOMEM')) return 'S';
  if (raw.includes('EQUIP') || raw.includes('EQUIPAMENTO') || raw.includes('MAQUINA')) return 'E';
  if (raw.includes('TRANSP') || raw.includes('TRANSPORTE') || raw.includes('FRETE')) return 'T';
  if (raw.includes('SERVICO') || raw.includes('SERVICOS') || raw.includes('TERCEIR')) return 'SV';
  return 'M';
}

function cpuTipoDescricao(tipo) {
  return { M:'Material', E:'Equipamento', S:'Mão de obra', SV:'Serviço', T:'Transporte' }[tipo] || 'Material';
}

function cpuCodigoManual(codigo, desc = '') {
  const raw = String(codigo || '').trim().toUpperCase();
  if (raw) return raw.replace(/[^A-Z0-9_.\-\/]/g, '-').slice(0, 40);
  const base = textoChave(desc).replace(/\s+/g, '-').slice(0, 18) || 'INSUMO';
  const seq = String((STATE.insumosManuais || []).length + 1).padStart(4, '0');
  return `MAN-${base}-${seq}`;
}

function cpuNormalizarInsumoManual(raw, options = {}) {
  const desc = String(raw.descricao || raw.desc || '').trim();
  const preco = Number(raw.precoMedio ?? raw.preco ?? raw.valor ?? 0) || 0;
  const cod = cpuCodigoManual(raw.codigoSinapi || raw.codigo || raw.cod, desc);
  const tipo = cpuTipoManual(cod || raw.tipo || raw.natureza || raw.categoria, desc);
  return {
    codigoSinapi: cod,
    codigo: cod,
    descricao: desc,
    unidade: String(raw.unidade || raw.unid || raw.un || 'UN').trim() || 'UN',
    tipo,
    natureza: tipo,
    categoria: raw.categoria || cpuTipoDescricao(tipo),
    precoMedio: preco,
    preco,
    fonte: String(raw.fonte || raw.fornecedor || options.fonte || 'Cadastro manual').trim(),
    origemArquivo: options.origemArquivo || raw.origemArquivo || '',
    manual: true,
    importado: !!options.importado,
    dataReferencia: new Date().toLocaleDateString('pt-BR')
  };
}

function cpuSalvarInsumoManual(item) {
  if (!item?.codigo || !item?.descricao) return false;
  return !!insumosSalvarManualItem(item);
}

function cpuAdicionarInsumoNaComposicao(item, coef) {
  const tipo = cpuTipoManual(item.codigoSinapi || item.codigo || item.tipo || item.natureza || item.categoria, item.descricao);
  CPU.insumos.push({
    cod: item.codigoSinapi || item.codigo || '',
    desc: item.descricao || '',
    unid: item.unidade || 'UN',
    tipo,
    coef: Number(coef) || 1,
    preco: Number(item.precoMedio ?? item.preco ?? 0) || 0,
    fonte: item.fonte || (item.manual ? 'Base manual' : item._base || '')
  });
}

function cpuAdicionarInsumoManual() {
  const raw = {
    codigo: document.getElementById('cpu-man-cod')?.value,
    descricao: document.getElementById('cpu-man-desc')?.value,
    unidade: document.getElementById('cpu-man-unid')?.value,
    tipo: document.getElementById('cpu-man-tipo')?.value,
    preco: readNumeroCampo('cpu-man-preco'),
    fonte: document.getElementById('cpu-man-fonte')?.value
  };
  const coef = readNumeroCampo('cpu-man-coef') || 1;
  const item = cpuNormalizarInsumoManual(raw);
  if (!item.descricao) { toast('Informe a descrição do insumo manual.', 'error'); return; }
  if (item.precoMedio < 0) { toast('Preço unitário inválido.', 'error'); return; }
  if (document.getElementById('cpu-man-salvar')?.checked) cpuSalvarInsumoManual(item);
  cpuAdicionarInsumoNaComposicao(item, coef);
  cpuRenderInsumos();
  cpuLimparInsumoManual({ keepTipo:true });
  toast('Insumo manual adicionado à CPU', 'success');
}

function cpuLimparInsumoManual(options = {}) {
  ['cpu-man-cod','cpu-man-desc','cpu-man-fonte'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const unid = document.getElementById('cpu-man-unid');
  if (unid) unid.value = 'UN';
  const coef = document.getElementById('cpu-man-coef');
  if (coef) coef.value = '1.000';
  const preco = document.getElementById('cpu-man-preco');
  if (preco) preco.value = '0.00';
  if (!options.keepTipo) {
    const tipo = document.getElementById('cpu-man-tipo');
    if (tipo) tipo.value = 'M';
  }
  const prev = document.getElementById('cpu-man-preview');
  if (prev) prev.textContent = '';
}

function cpuCriarDoZero() {
  const cod = document.getElementById('cpu-cod');
  if (cod && !cod.value.trim()) cod.value = `CPU-PROP-${String(CPU_BIBLIOTECA.length + 1).padStart(3, '0')}`;
  cpuIrPasso(1);
  setTimeout(() => document.getElementById('cpu-man-desc')?.focus(), 50);
  toast('CPU pronta para montagem com insumos manuais ou Excel.', 'info');
}

function cpuHeaderKey(value) {
  return textoChave(value).replace(/\s+/g, '_');
}

function cpuFindColumn(headers, patterns) {
  return headers.findIndex(h => patterns.some(pattern => pattern.test(cpuHeaderKey(h))));
}

function cpuFindHeaderRow(raw) {
  for (let i = 0; i < Math.min(raw.length, 20); i++) {
    const keys = (raw[i] || []).map(cpuHeaderKey);
    const joined = keys.join('|');
    if (/COD|CODIGO/.test(joined) && /DESC|DESCRICAO|DESCRI/.test(joined)) return i;
    if (/DESCRICAO|DESCRI/.test(joined) && /PRECO|VALOR|CUSTO/.test(joined)) return i;
  }
  return -1;
}

function cpuParseInsumosManualRows(raw, fileName) {
  const headerRow = cpuFindHeaderRow(raw);
  const hasHeader = headerRow >= 0;
  const headers = hasHeader ? (raw[headerRow] || []).map(v => String(v || '').trim()) : [];
  const colCod = cpuFindColumn(headers, [/^COD/, /CODIGO/, /ITEM/, /INSUMO/]);
  const colDesc = cpuFindColumn(headers, [/DESC/, /DESCRICAO/, /NOME/]);
  const colUnid = cpuFindColumn(headers, [/^UN$/, /UNID/, /UNIDADE/]);
  const colTipo = cpuFindColumn(headers, [/TIPO/, /NATUREZA/, /CATEGORIA/]);
  const colCoef = cpuFindColumn(headers, [/COEF/, /INDICE/, /CONSUMO/, /QTD/, /QUANT/]);
  const colPreco = cpuFindColumn(headers, [/PRECO/, /VALOR/, /CUSTO/, /UNIT/]);
  const colFonte = cpuFindColumn(headers, [/FONTE/, /FORNEC/, /ORIGEM/, /COTACAO/]);
  const rows = [];
  for (let r = hasHeader ? headerRow + 1 : 0; r < raw.length; r++) {
    const row = raw[r] || [];
    const desc = String(row[colDesc >= 0 ? colDesc : 1] || '').trim();
    const fallbackPrecoCol = !hasHeader && parseNumeroBR(row[3] || 0) > 0 ? 3 : 4;
    const fallbackTipoCol = !hasHeader && fallbackPrecoCol === 3 ? -1 : 3;
    const preco = parseNumeroBR(row[colPreco >= 0 ? colPreco : fallbackPrecoCol] || 0);
    if (!desc || desc.length < 2 || preco < 0) continue;
    const item = cpuNormalizarInsumoManual({
      codigo: row[colCod >= 0 ? colCod : 0],
      descricao: desc,
      unidade: row[colUnid >= 0 ? colUnid : 2],
      tipo: row[colTipo >= 0 ? colTipo : fallbackTipoCol],
      preco,
      fonte: row[colFonte >= 0 ? colFonte : -1]
    }, { fonte: `Excel manual: ${fileName}`, origemArquivo: fileName, importado:true });
    item.coefDefault = parseNumeroBR(row[colCoef >= 0 ? colCoef : -1] || 1) || 1;
    rows.push(item);
  }
  return rows;
}

async function cpuImportarInsumosExcel() {
  if (!window.XLSX) { toast('Biblioteca XLSX não carregada.', 'error'); return; }
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.xlsx,.xls,.csv';
  inp.multiple = true;
  inp.onchange = async (event) => {
    const files = Array.from(event.target.files || []);
    let total = 0;
    for (const file of files) {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type:'array' });
      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
        const items = cpuParseInsumosManualRows(raw, `${file.name}/${sheetName}`);
        items.forEach(item => { if (cpuSalvarInsumoManual(item)) total++; });
      });
    }
    const preview = document.getElementById('cpu-man-preview');
    if (preview) {
      preview.textContent = total ? `${total} insumo(s) importado(s) para a base manual.` : 'Nenhum insumo válido encontrado no Excel.';
      preview.className = total ? 'form-help ok' : 'form-help error';
    }
    toast(total ? `${total} insumo(s) importado(s) do Excel` : 'Nenhum insumo válido encontrado', total ? 'success' : 'warning');
  };
  inp.click();
}

function cpuBaixarModeloInsumos() {
  const rows = [
    ['Código','Descrição','Unidade','Tipo','Coeficiente','Preço unitário','Fonte/Fornecedor'],
    ['MAT-001','Material local exemplo','UN','Material',1,12.5,'Fornecedor A'],
    ['MO-001','Equipe própria exemplo','H','Mão de obra',0.5,35,'Histórico interno'],
    ['EQ-001','Equipamento próprio exemplo','H','Equipamento',0.25,180,'Custo horário interno']
  ];
  exportRowsToExcel('TLPlanly_Modelo_Insumos_Manuais', [{ name:'Insumos', rows }]);
}

// ─── STEPPER ───────────────────────────────────────────────
function cpuIrPasso(n) {
  [0,1,2,3].forEach(i => {
    const el = document.getElementById('cpu-passo-'+i);
    if (el) el.style.display = i === n ? 'block' : 'none';
    const step = document.getElementById('cpu-step-'+i);
    if (step) {
      step.className = 'cpu-step' + (i === n ? ' active' : i < n ? ' done' : '');
    }
  });
  CPU.prod = Math.max(0.0001, readNumeroCampo('cpu-prod') || Number(CPU.prod) || 1);
  if (n === 2) cpuCalcEncargos();
  if (n === 3) cpuRenderResultado();
}

// ─── BUSCA INSUMO ──────────────────────────────────────────
function cpuBuscarInsumo(q) {
  const res = document.getElementById('cpu-search-results');
  if (!q || q.length < 2) { res.classList.remove('open'); return; }
  const ul = q.toUpperCase();
  const all = getAllItems ? getAllItems() : STATE.sinapiBase.map(i=>({...i,_base:'SINAPI'}));
  const matches = all.filter(i =>
    (i.codigoSinapi||i.codigo||'').includes(ul) ||
    (i.descricao||'').toUpperCase().includes(ul)
  ).slice(0, 15);
  if (!matches.length) { res.classList.remove('open'); return; }
  res.innerHTML = matches.map(i => {
    const cod = i.codigoSinapi || i.codigo || '';
    const preco = Number(i.precoMedio ?? i.preco ?? 0) || 0;
    const fonte = i._base || i.fonte || (i.manual ? 'Base manual' : '');
    const clickCod = String(cod).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<div class="search-item" onclick="cpuSelecionarInsumo('${clickCod}')">
      <span class="search-item-code">${escapeHtml(cod)}</span>
      ${escapeHtml(i.descricao||'')}
      <span class="search-item-unit">${i.unidade||'UN'}</span>
      <span style="float:right;color:var(--gold);font-weight:700">${fmtMoeda(preco)}</span>
      <span style="float:right;font-size:10px;color:var(--text3);margin-right:8px">${escapeHtml(fonte)}</span>
    </div>`;
  }).join('');
  res.classList.add('open');
}

let _cpuInsumoSelecionado = null;
function cpuSelecionarInsumo(cod) {
  const all = getAllItems ? getAllItems() : STATE.sinapiBase.map(i=>({...i,_base:'SINAPI'}));
  const item = all.find(i => (i.codigoSinapi||i.codigo||'') === cod);
  if (!item) return;
  _cpuInsumoSelecionado = item;
  document.getElementById('cpu-search').value = item.descricao || '';
  document.getElementById('cpu-search-results').classList.remove('open');
  // Auto-detect tipo: mão de obra keywords
  const desc = (item.descricao||'').toUpperCase();
  const tipoSel = document.getElementById('cpu-ins-tipo');
  const tipoItem = cpuTipoManual(item.codigoSinapi || item.codigo || item.tipo || item.natureza || item.categoria, item.descricao);
  if (item.manual || item.importado || item.tipo) {
    tipoSel.value = tipoItem;
  } else if (/SERVENTE|PEDREIRO|MESTRE|OFICIAL|CARPINTEIRO|FERREI|ENCANADOR|ELETRICISTA|PINTOR|AJUDANTE/.test(desc)) {
    tipoSel.value = 'S';
  } else if (/CAMINHÃO|BETONEIRA|COMPACTADOR|RETROESCAVADEIRA|ESCAVADEIRA|GUINDASTE|ANDAIME/.test(desc)) {
    tipoSel.value = 'E';
  } else {
    tipoSel.value = 'M';
  }
  const prev = document.getElementById('cpu-ins-preview');
  const preco = Number(item.precoMedio ?? item.preco ?? 0) || 0;
  const fonte = item._base || item.fonte || (item.manual ? 'Base manual' : 'Base');
  prev.style.display = 'block';
  prev.innerHTML = `<span class="enc-auto-badge">&#9432; ${escapeHtml(item.descricao)} · ${escapeHtml(item.unidade || 'UN')} · ${fmtMoeda(preco)} · ${escapeHtml(fonte)}</span>`;
}

function cpuAdicionarInsumo() {
  if (!_cpuInsumoSelecionado) { toast('Selecione um insumo da base ou use o cadastro manual.', 'error'); return; }
  const coef = parseFloat(document.getElementById('cpu-ins-coef').value) || 1;
  const tipo = document.getElementById('cpu-ins-tipo').value;
  const item = _cpuInsumoSelecionado;
  CPU.insumos.push({
    cod: item.codigoSinapi || item.codigo || '',
    desc: item.descricao || '',
    unid: item.unidade || 'UN',
    tipo,
    coef,
    preco: Number(item.precoMedio ?? item.preco ?? 0) || 0,
    fonte: item.fonte || item._base || ''
  });
  _cpuInsumoSelecionado = null;
  document.getElementById('cpu-search').value = '';
  document.getElementById('cpu-ins-preview').style.display = 'none';
  document.getElementById('cpu-ins-coef').value = '1.000';
  cpuRenderInsumos();
  toast('Insumo adicionado', 'success');
}

function cpuRemoverInsumo(idx) {
  CPU.insumos.splice(idx, 1);
  cpuRenderInsumos();
}

function cpuRenderInsumos() {
  const el = document.getElementById('cpu-insumos-lista');
  if (!CPU.insumos.length) {
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:13px">Adicione insumos à composição</div>';
    document.getElementById('cpu-custo-direto').style.display = 'none';
    return;
  }
  let cd = 0;
  el.innerHTML = CPU.insumos.map((ins, i) => {
    const coef = Number(ins.coef) || 0;
    const preco = Number(ins.preco) || 0;
    const sub = coef * preco;
    cd += sub;
    const tagColors = { M:'cpu-tag-M', E:'cpu-tag-E', S:'cpu-tag-S', SV:'cpu-tag-M', T:'cpu-tag-T' };
    const tagLabels = { M:'Material', E:'Equip.', S:'MO', SV:'Serv.', T:'Transp.' };
    return `<div class="cpu-insumo-row">
      <span class="td-mono" style="color:var(--gold);font-size:11px">${escapeHtml(ins.cod)}</span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(ins.desc)}">
        <span class="cpu-tag ${tagColors[ins.tipo] || 'cpu-tag-M'}" style="margin-right:4px">${tagLabels[ins.tipo] || 'Mat.'}</span>${escapeHtml(ins.desc)}
      </span>
      <span style="color:var(--text2)">${escapeHtml(ins.unid)}</span>
      <input type="number" value="${coef}" step="0.001" min="0.0001"
        class="form-input" style="padding:4px 6px;font-size:12px;text-align:right"
        onchange="CPU.insumos[${i}].coef=parseFloat(this.value)||0;cpuRenderInsumos()"/>
      <input type="number" value="${preco.toFixed(2)}" step="0.01" min="0"
        class="form-input" style="padding:4px 6px;font-size:12px;text-align:right"
        onchange="CPU.insumos[${i}].preco=parseFloat(this.value)||0;cpuRenderInsumos()"/>
      <span style="font-weight:700;text-align:right">${fmtMoeda(sub)}</span>
      <button onclick="cpuRemoverInsumo(${i})" class="btn btn-danger btn-sm" style="padding:3px 7px;font-size:11px">&#215;</button>
    </div>`;
  }).join('');
  document.getElementById('cpu-custo-direto').style.display = 'flex';
  document.getElementById('cpu-cd-val').textContent = fmtMoeda(cd);
}

// ─── ENCARGOS ──────────────────────────────────────────────
function cpuSetEncargos(tipo) {
  CPU.encargos = tipo;
  CPU.encPct = tipo === 'nd' ? 127.5 : 96.8;
  document.getElementById('cpu-enc-nd').classList.toggle('active', tipo === 'nd');
  document.getElementById('cpu-enc-d').classList.toggle('active', tipo === 'd');
  cpuCalcEncargos();
}

function cpuCalcEncargos() {
  const moInsumos = CPU.insumos.filter(i => i.tipo === 'S');
  const moBase = moInsumos.reduce((s, i) => s + i.coef * i.preco, 0);
  const encVal = moBase * CPU.encPct / 100;
  document.getElementById('cpu-mo-base').textContent = fmtMoeda(moBase);
  document.getElementById('cpu-enc-pct-label').textContent = CPU.encPct + '%';
  document.getElementById('cpu-enc-valor').textContent = fmtMoeda(encVal);
  document.getElementById('cpu-mo-total').textContent = fmtMoeda(moBase + encVal);
}

// ─── RESULTADO ─────────────────────────────────────────────
function cpuCalcPrecoUnitario() {
  const grupos = { M: 0, E: 0, S: 0, SV: 0, T: 0, AX: 0 };
  CPU.insumos.forEach(i => {
    const tipo = ['M','E','S','SV','T','AX'].includes(i.tipo) ? i.tipo : 'M';
    grupos[tipo] += i.coef * i.preco;
  });
  const moComEnc = grupos.S * (1 + CPU.encPct / 100);
  const prod = Math.max(0.0001, Number(CPU.prod) || readNumeroCampo('cpu-prod') || 1);
  const custoTotal = grupos.M + grupos.SV + grupos.T + grupos.AX + ((grupos.E + moComEnc) / prod);
  return { grupos, moComEnc, prod, custoTotal };
}

function cpuRenderResultado() {
  const cod  = document.getElementById('cpu-cod').value  || 'CPU-001';
  const desc = document.getElementById('cpu-desc').value || 'Composição sem descrição';
  const unid = document.getElementById('cpu-unid').value || 'm²';
  const tipo = document.getElementById('cpu-tipo').value || 'Serviços Gerais';
  const prod = Math.max(0.0001, readNumeroCampo('cpu-prod') || Number(CPU.prod) || 1);
  CPU.cod = cod; CPU.desc = desc; CPU.unid = unid; CPU.tipo = tipo; CPU.prod = prod;

  const { grupos, moComEnc, custoTotal } = cpuCalcPrecoUnitario();

  const linhas = [
    ['Materiais (M)', grupos.M],
    ['Mão de Obra s/ encargos (S)', grupos.S],
    ['Encargos Sociais (' + CPU.encPct + '%)', grupos.S * CPU.encPct / 100],
    ['Mão de Obra c/ Encargos', moComEnc],
    ['Equipamentos (E)', grupos.E],
    ['Serviços (IS)', grupos.SV],
    ['Composições Auxiliares', grupos.AX],
    ['Transportes (T)', grupos.T],
  ].filter(([,v]) => v > 0);

  const rows = linhas.map(([nome, val]) => {
    const pct = custoTotal > 0 ? val/custoTotal*100 : 0;
    return `<div style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid var(--border);font-size:13px">
      <span style="flex:1;color:var(--text2)">${nome}</span>
      <div class="progress-bar" style="width:100px;margin:0 12px">
        <div class="progress-fill" style="background:var(--gold);width:${pct.toFixed(1)}%"></div>
      </div>
      <span style="color:var(--text3);width:45px;text-align:right;font-size:11px">${pct.toFixed(1)}%</span>
      <span style="font-weight:700;min-width:90px;text-align:right">${fmtMoeda(val)}</span>
    </div>`;
  }).join('');

  document.getElementById('cpu-resultado-detalhado').innerHTML = `
    <div style="background:var(--bg3);border-radius:var(--radius);padding:12px;margin-bottom:12px;font-size:13px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div><span style="color:var(--text3)">Código:</span> <strong>${cod}</strong></div>
        <div><span style="color:var(--text3)">Unidade:</span> <strong>${unid}</strong></div>
        <div style="grid-column:span 2"><span style="color:var(--text3)">Descrição:</span> <strong>${desc}</strong></div>
        <div><span style="color:var(--text3)">Tipo:</span> <strong>${tipo}</strong></div>
        <div><span style="color:var(--text3)">Encargos:</span> <strong>${CPU.encPct}% (${CPU.encargos==='nd'?'Não desonerado':'Desonerado'})</strong></div>
        <div><span style="color:var(--text3)">Produção da equipe:</span> <strong>${fmtNum(prod)} ${unid}/h</strong></div>
      </div>
    </div>
    <div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:12px">
      <div style="background:var(--bg3);padding:8px 12px;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">Composição de Custos</div>
      ${rows}
    </div>
    <div class="cpu-total-bar">
      <div>
        <div class="cpu-total-label">Custo Unitário Total (CPU)</div>
        <div style="font-size:11px;color:var(--text3)">${CPU.insumos.length} insumos · ${unid}</div>
      </div>
      <div class="cpu-total-value">${fmtMoeda(custoTotal)}</div>
    </div>`;
}

// ─── SALVAR / BIBLIOTECA ───────────────────────────────────
function cpuSalvarNaBiblioteca() {
  const { custoTotal } = cpuCalcPrecoUnitario();
  const composicao = {
    id: Date.now(),
    cod: CPU.cod, desc: CPU.desc, unid: CPU.unid,
    tipo: CPU.tipo, encargos: CPU.encargos, encPct: CPU.encPct,
    prod: Math.max(0.0001, Number(CPU.prod) || readNumeroCampo('cpu-prod') || 1),
    insumos: JSON.parse(JSON.stringify(CPU.insumos)),
    precoUnitario: custoTotal,
    criadaEm: new Date().toLocaleDateString('pt-BR'),
  };
  // Update if same code exists
  const idx = CPU_BIBLIOTECA.findIndex(c => c.cod === composicao.cod);
  if (idx >= 0) CPU_BIBLIOTECA[idx] = composicao;
  else CPU_BIBLIOTECA.push(composicao);
  cpuSaveLib();
  cpuRenderBiblioteca();
  toast('Composição "' + composicao.cod + '" salva na biblioteca', 'success');
}

function cpuEnviarParaOrcamento() {
  const { custoTotal } = cpuCalcPrecoUnitario();
  if (!CPU.cod) { toast('Defina um código para a composição', 'error'); return; }
  STATE.orcamento.push({
    id: makeId('orc'),
    cod: CPU.cod, desc: CPU.desc, unid: CPU.unid,
    qtd: 1, preco: custoTotal, ref: 0, cat: CPU.tipo, capitulo: CPU.tipo, ordem: STATE.orcamento.length + 1
  });
  invalidarDescontoPregao('CPU adicionada ao orçamento');
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('CPU "' + CPU.cod + '" adicionada ao orçamento (qtd=1, ajuste a quantidade)', 'success');
  showView('elaborar');
}

function cpuNova() {
  CPU = { cod:'', desc:'', unid:'m²', tipo:'Serviços Gerais', prod:1.0, insumos:[], encargos:'nd', encPct:127.5 };
  ['cpu-cod','cpu-desc'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  cpuRenderInsumos();
  cpuIrPasso(0);
}

// ─── BIBLIOTECA RENDER ─────────────────────────────────────
let _cpuLibFiltro = '';
function cpuFiltrarLib(f) { _cpuLibFiltro = f; cpuRenderBiblioteca(); }

function cpuRenderBiblioteca(q) {
  const search = (q || document.getElementById('cpu-lib-search')?.value || '').toUpperCase();
  const lista = CPU_BIBLIOTECA.filter(c => {
    const matchSearch = !search || String(c.cod || '').toUpperCase().includes(search) || String(c.desc || '').toUpperCase().includes(search);
    const matchFiltro = !_cpuLibFiltro || c.tipo === _cpuLibFiltro;
    return matchSearch && matchFiltro;
  });

  document.getElementById('cpu-lib-count').textContent = CPU_BIBLIOTECA.length + ' composições';

  const el = document.getElementById('cpu-biblioteca');
  if (!lista.length) {
    el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text3)"><div style="font-size:28px;margin-bottom:8px">⚙</div>Nenhuma composição encontrada.</div>';
    return;
  }
  el.innerHTML = lista.map(c => `
    <div class="cpu-lib-item" onclick="cpuVerFicha(${inlineJsArg(c.id)})">
      <span class="cpu-lib-code">${escapeHtml(c.cod)}</span>
      <div style="flex:1;min-width:0">
        <div class="cpu-lib-desc" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(c.desc)}</div>
        <div style="font-size:10px;color:var(--text3)">${escapeHtml(c.tipo)} · ${(c.insumos || []).length} insumos · prod. ${fmtNum(c.prod || 1)} · ${escapeHtml(c.criadaEm || '')}</div>
      </div>
      <span class="cpu-lib-un">${escapeHtml(c.unid)}</span>
      <span class="cpu-lib-preco">${fmtMoeda(c.precoUnitario)}</span>
      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();cpuEditorAbrir(${inlineJsArg(c.id)})">Abrir</button>
    </div>`).join('');
}

function cpuEditorFindById(id) {
  return (CPU_BIBLIOTECA || []).find(cpu => String(cpu.id) === String(id)) || null;
}

function cpuEditorFindByCode(cod) {
  const code = codigoChave(cod);
  return (CPU_BIBLIOTECA || []).find(cpu => codigoChave(cpu.cod) === code) || null;
}

function cpuInsumoIndiceImprodutivo(ins) {
  return Number(ins?.coefImprod ?? ins?.indiceImprodutivo ?? ins?.indiceImprod ?? 0) || 0;
}

function cpuInsumoPrecoImprodutivo(ins) {
  return Number(ins?.precoImprod ?? ins?.precoImprodutivo ?? ins?.custoImprodutivo ?? ins?.improdutivo ?? 0) || 0;
}

function cpuInsumoQtdEquipamento(ins) {
  return Math.max(1, Number(ins?.qtdEquip ?? ins?.quantidadeEquipamento ?? ins?.qtdeEquip ?? 1) || 1);
}

function cpuInsumoTipo(ins, usarCompor = false) {
  const code = codigoChave(ins?.cod || ins?.codigo || ins?.codigoSinapi);
  if (usarCompor && code && !code.startsWith('I')) return 'AX';
  return cpuTipoManual(code || ins?.tipo || ins?.natureza || ins?.categoria, ins?.desc || ins?.descricao || '');
}

function cpuUsaModeloCompor(cpu) {
  return !!(cpu?.modeloCalculo === 'compor' || cpu?.importadoCompor || (cpu?.insumos || []).some(ins =>
    cpuInsumoIndiceImprodutivo(ins) || cpuInsumoPrecoImprodutivo(ins) || Number(ins?.qtdEquip ?? ins?.quantidadeEquipamento ?? 0)
  ));
}

function cpuInsumoTotalHora(ins, tipo, usarCompor = false) {
  const coef = Number(ins?.coef ?? ins?.indice ?? 0) || 0;
  const preco = Number(ins?.preco ?? ins?.precoUnitario ?? 0) || 0;
  if (!usarCompor || tipo !== 'E') return coef * preco;
  const improd = cpuInsumoIndiceImprodutivo(ins) * cpuInsumoPrecoImprodutivo(ins);
  return cpuInsumoQtdEquipamento(ins) * ((coef * preco) + improd);
}

function cpuEditorAbrir(id, options = {}) {
  const cpu = cpuEditorFindById(id);
  if (!cpu) { toast('Composição não encontrada na biblioteca.', 'error'); return; }
  if (!options.fromStack && CPU_EDITOR.activeId && String(CPU_EDITOR.activeId) !== String(id)) {
    CPU_EDITOR.stack = [{ id: CPU_EDITOR.activeId, selectedIndex: CPU_EDITOR.selectedIndex || 0 }, ...(CPU_EDITOR.stack || [])].slice(0, 12);
  }
  CPU_EDITOR.activeId = cpu.id;
  CPU_EDITOR.selectedIndex = 0;
  cpuEditorRender();
  toast('Composição aberta: ' + (cpu.cod || ''), 'info');
}

function cpuEditorCalcularDetalhes(cpu) {
  const grupos = { E:0, S:0, M:0, SV:0, T:0, AX:0 };
  const encPct = Number(cpu?.encPct) || 0;
  const prod = Math.max(0.0001, Number(cpu?.prod) || 1);
  const usarCompor = cpuUsaModeloCompor(cpu);
  const encargoObraPct = obraEncargosMaoObraPct();
  const maoEncPct = encargoObraPct > 0 ? encargoObraPct : (usarCompor ? 0 : encPct);
  (cpu?.insumos || []).forEach(ins => {
    const tipo = cpuEditorFindByCode(ins.cod) ? 'AX' : cpuInsumoTipo(ins, usarCompor);
    const total = cpuInsumoTotalHora(ins, tipo, usarCompor);
    grupos[tipo] = (grupos[tipo] || 0) + total;
  });
  const maoComEnc = grupos.S * (1 + maoEncPct / 100);
  const equipamentoProd = grupos.E / prod;
  const maoProd = maoComEnc / prod;
  const custoUnitario = roundUnitPrice(grupos.M + grupos.SV + grupos.T + grupos.AX + equipamentoProd + maoProd);
  return { grupos, encPct, encargoObraPct, maoEncPct, prod, maoComEnc, equipamentoProd, maoProd, custoUnitario, usarCompor };
}

function cpuEditorRender() {
  const empty = document.getElementById('cpu-editor-empty');
  const content = document.getElementById('cpu-editor-content');
  const cpu = cpuEditorFindById(CPU_EDITOR.activeId);
  if (!empty || !content) return;
  if (!cpu) {
    empty.style.display = '';
    content.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  content.style.display = '';
  const detalhes = cpuEditorCalcularDetalhes(cpu);
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('cpu-editor-cod', cpu.cod || '—');
  setText('cpu-editor-unid', cpu.unid || '—');
  setText('cpu-editor-total', fmtMoeda(detalhes.custoUnitario));
  const prodInput = document.getElementById('cpu-editor-prod');
  if (prodInput && document.activeElement !== prodInput) prodInput.value = detalhes.prod;
  const crumb = document.getElementById('cpu-editor-breadcrumb');
  if (crumb) {
    const stack = (CPU_EDITOR.stack || []).map(s => cpuEditorFindById(s.id)?.cod).filter(Boolean);
    crumb.textContent = [...stack.reverse(), cpu.cod].join(' > ') || 'Composição aberta';
  }
  const gruposEl = document.getElementById('cpu-editor-grupos');
  if (gruposEl) {
    gruposEl.innerHTML = [
      ['Equipamentos/h', detalhes.grupos.E, detalhes.equipamentoProd],
      ['Mão de obra/h', detalhes.maoComEnc, detalhes.maoProd],
      ['Materiais', detalhes.grupos.M, detalhes.grupos.M],
      ['Serviços', detalhes.grupos.SV, detalhes.grupos.SV],
      ['Auxiliares', detalhes.grupos.AX, detalhes.grupos.AX],
      ['Transporte', detalhes.grupos.T, detalhes.grupos.T]
    ].map(([label, hora, unit]) => `<div><span>${escapeHtml(label)}</span><strong>${fmtMoeda(hora)}</strong><small>${fmtMoeda(unit)} no unitário</small></div>`).join('');
  }
  const tbody = document.getElementById('cpu-editor-insumos');
  if (!tbody) return;
  const rows = cpu.insumos || [];
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="12" class="empty-state" style="padding:18px">Esta composição não possui insumos.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map((ins, idx) => {
    const aux = cpuEditorFindByCode(ins.cod);
    const tipo = aux ? 'AX' : cpuInsumoTipo(ins, detalhes.usarCompor);
    const coef = Number(ins.coef) || 0;
    const coefImprod = cpuInsumoIndiceImprodutivo(ins);
    const qtdEquip = tipo === 'E' ? cpuInsumoQtdEquipamento(ins) : 0;
    const preco = Number(ins.preco) || 0;
    const precoImprod = cpuInsumoPrecoImprodutivo(ins);
    const totalBase = cpuInsumoTotalHora(ins, tipo, detalhes.usarCompor);
    const total = tipo === 'S' ? totalBase * (1 + detalhes.maoEncPct / 100) : totalBase;
    const totalProd = (tipo === 'E' || tipo === 'S') ? total / detalhes.prod : total;
    return `<tr class="${CPU_EDITOR.selectedIndex === idx ? 'cpu-editor-selected' : ''}">
      <td><input type="radio" name="cpu-editor-row" ${CPU_EDITOR.selectedIndex === idx ? 'checked' : ''} onchange="cpuEditorSelecionarLinha(${idx})"/></td>
      <td class="td-mono">${escapeHtml(ins.cod || '')}</td>
      <td>${escapeHtml(ins.desc || ins.descricao || '')}${aux ? '<div class="table-input-sub">Composição auxiliar disponível</div>' : ''}</td>
      <td>${escapeHtml(ins.unid || ins.unidade || '')}</td>
      <td><span class="badge">${tipo === 'AX' ? 'Auxiliar' : escapeHtml(cpuTipoDescricao(tipo))}</span></td>
      <td>${fmtNum(coef)}</td>
      <td>${coefImprod ? fmtNum(coefImprod) : '—'}</td>
      <td>${qtdEquip ? fmtNum(qtdEquip) : '—'}</td>
      <td>${fmtMoeda(preco)}</td>
      <td>${precoImprod ? fmtMoeda(precoImprod) : '—'}</td>
      <td><strong>${fmtMoeda(total)}</strong></td>
      <td>${fmtMoeda(totalProd)}</td>
    </tr>`;
  }).join('');
}

function cpuEditorSelecionarLinha(idx) {
  CPU_EDITOR.selectedIndex = Number(idx) || 0;
  cpuEditorRender();
}

function cpuEditorEntrarAuxiliar() {
  const cpu = cpuEditorFindById(CPU_EDITOR.activeId);
  if (!cpu) { toast('Abra uma composição antes de entrar em auxiliar.', 'error'); return; }
  const ins = (cpu.insumos || [])[CPU_EDITOR.selectedIndex || 0];
  const aux = cpuEditorFindByCode(ins?.cod);
  if (!aux) { toast('A linha selecionada não é uma composição auxiliar salva na biblioteca.', 'warning'); return; }
  cpuEditorAbrir(aux.id);
}

function cpuEditorVoltarPrincipal() {
  const prev = (CPU_EDITOR.stack || []).shift();
  if (!prev) { toast('Você já está na composição principal aberta.', 'info'); return; }
  CPU_EDITOR.activeId = prev.id;
  CPU_EDITOR.selectedIndex = prev.selectedIndex || 0;
  cpuEditorRender();
}

function cpuEditorAtualizarProducao() {
  const cpu = cpuEditorFindById(CPU_EDITOR.activeId);
  if (!cpu) return;
  cpu.prod = Math.max(0.0001, readNumeroCampo('cpu-editor-prod') || 1);
  cpuEditorRecalcular({ silent:true });
}

function cpuEditorRecalcular(options = {}) {
  const cpu = cpuEditorFindById(CPU_EDITOR.activeId);
  if (!cpu) { toast('Abra uma composição antes de calcular.', 'error'); return; }
  const detalhes = cpuEditorCalcularDetalhes(cpu);
  cpu.precoUnitario = detalhes.custoUnitario;
  cpu.gruposCusto = detalhes.grupos;
  cpu.atualizadaEm = new Date().toISOString();
  cpuSaveLib();
  cpuRenderBiblioteca();
  if (!options.silent) toast('Composição recalculada com produção da equipe.', 'success');
}

function cpuRecalcularComposicaoSalva(cpu) {
  const usarCompor = cpuUsaModeloCompor(cpu);
  (cpu.insumos || []).forEach(ins => {
    const tipo = cpuEditorFindByCode(ins.cod) ? 'AX' : cpuInsumoTipo(ins, usarCompor);
    ins.tipo = tipo;
  });
  const detalhes = cpuEditorCalcularDetalhes(cpu);
  cpu.precoUnitario = detalhes.custoUnitario;
  cpu.gruposCusto = detalhes.grupos;
  cpu.atualizadaEm = new Date().toISOString();
  return cpu.precoUnitario;
}

function cpuOperacoesEscopo() {
  const filtro = textoChave(document.getElementById('cpu-op-escopo')?.value || '');
  if (CPU_OP_SELECTED.size) {
    return (CPU_BIBLIOTECA || []).filter(cpu => CPU_OP_SELECTED.has(codigoChave(cpu.cod)));
  }
  return (CPU_BIBLIOTECA || []).filter(cpu => {
    if (!filtro) return true;
    return textoChave(`${cpu.cod || ''} ${cpu.desc || ''} ${cpu.tipo || ''}`).includes(filtro);
  });
}

function cpuOperacoesListaCandidatos() {
  const filtro = textoChave(document.getElementById('cpu-op-escopo')?.value || '');
  return (CPU_BIBLIOTECA || []).filter(cpu => !filtro || textoChave(`${cpu.cod || ''} ${cpu.desc || ''} ${cpu.tipo || ''}`).includes(filtro));
}

function cpuOperacoesListarEscopo() {
  const el = document.getElementById('cpu-op-scope-list');
  if (!el) return;
  const lista = cpuOperacoesListaCandidatos().slice(0, 120);
  if (!lista.length) {
    el.innerHTML = '<div class="empty-state" style="padding:12px">Nenhuma composição no filtro de escopo.</div>';
    return;
  }
  el.innerHTML = `
    <div class="cpu-op-scope-actions">
      <strong>${lista.length} composição(ões) no escopo</strong>
      <button class="btn btn-outline btn-sm" onclick="cpuOperacoesSelecionarTodos()">Todos</button>
      <button class="btn btn-outline btn-sm" onclick="cpuOperacoesLimparSelecao()">Limpar</button>
    </div>
    <div class="cpu-op-scope-grid">
      ${lista.map(cpu => {
        const code = codigoChave(cpu.cod);
        return `<label class="cpu-op-scope-item">
          <input type="checkbox" ${CPU_OP_SELECTED.has(code) ? 'checked' : ''} onchange="cpuOperacoesToggleSelecao(${inlineJsArg(code)}, this.checked)"/>
          <span><strong>${escapeHtml(cpu.cod)}</strong><small>${escapeHtml(cpu.desc || '')}</small></span>
        </label>`;
      }).join('')}
    </div>`;
}

function cpuOperacoesToggleSelecao(cod, checked) {
  const code = codigoChave(cod);
  if (!code) return;
  if (checked) CPU_OP_SELECTED.add(code);
  else CPU_OP_SELECTED.delete(code);
  cpuOperacoesResumoSelecao();
}

function cpuOperacoesSelecionarTodos() {
  cpuOperacoesListaCandidatos().forEach(cpu => CPU_OP_SELECTED.add(codigoChave(cpu.cod)));
  cpuOperacoesListarEscopo();
  cpuOperacoesResumoSelecao();
}

function cpuOperacoesSelecionarAlternadas() {
  CPU_OP_SELECTED.clear();
  cpuOperacoesListaCandidatos().forEach((cpu, idx) => {
    if (idx % 2 === 0) CPU_OP_SELECTED.add(codigoChave(cpu.cod));
  });
  cpuOperacoesListarEscopo();
  cpuOperacoesResumoSelecao();
}

function cpuOperacoesLimparSelecao() {
  CPU_OP_SELECTED.clear();
  cpuOperacoesListarEscopo();
  cpuOperacoesResumoSelecao();
}

function cpuOperacoesResumoSelecao() {
  const el = document.getElementById('cpu-op-result');
  if (el && CPU_OP_SELECTED.size) {
    el.innerHTML = `${CPU_OP_SELECTED.size} composição(ões) selecionada(s) para as próximas operações.`;
  }
}

function cpuOperacoesRenderResultado(rows, resumo = '') {
  const el = document.getElementById('cpu-op-result');
  if (!el) return;
  if (!rows?.length) {
    el.innerHTML = resumo || 'Nenhuma ocorrência encontrada no escopo informado.';
    return;
  }
  el.innerHTML = `
    ${resumo ? `<div class="cpu-op-summary">${escapeHtml(resumo)}</div>` : ''}
    <div class="cpu-op-table">
      <div class="cpu-op-head"><span>CPU</span><span>Descrição</span><span>Insumo</span><span>Coef.</span><span>Total</span></div>
      ${rows.slice(0, 80).map(r => `
        <div class="cpu-op-row">
          <span class="td-mono">${escapeHtml(r.cpuCod)}</span>
          <span>${escapeHtml(r.cpuDesc)}</span>
          <span>${escapeHtml(r.insumoCod)} · ${escapeHtml(r.insumoDesc)}</span>
          <span>${fmtNum(r.coef)}</span>
          <span>${fmtMoeda(r.total)}</span>
        </div>`).join('')}
    </div>
    ${rows.length > 80 ? `<div class="form-help">Mostrando 80 de ${rows.length} ocorrência(s).</div>` : ''}
  `;
}

function cpuOperacaoPesquisar() {
  const alvo = codigoChave(document.getElementById('cpu-op-insumo')?.value);
  if (!alvo) { toast('Informe o código do insumo ou composição para pesquisar.', 'error'); return; }
  const rows = [];
  cpuOperacoesEscopo().forEach(cpu => {
    if (codigoChave(cpu.cod) === alvo || textoChave(cpu.desc).includes(textoChave(alvo))) {
      rows.push({
        cpuCod: cpu.cod,
        cpuDesc: cpu.desc,
        insumoCod: 'CPU',
        insumoDesc: 'Composição localizada',
        coef: 1,
        total: Number(cpu.precoUnitario) || 0
      });
    }
    (cpu.insumos || []).forEach(ins => {
      if (codigoChave(ins.cod) !== alvo && !textoChave(ins.desc).includes(textoChave(alvo))) return;
      rows.push({
        cpuCod: cpu.cod,
        cpuDesc: cpu.desc,
        insumoCod: ins.cod,
        insumoDesc: ins.desc,
        coef: Number(ins.coef) || 0,
        total: (Number(ins.coef) || 0) * (Number(ins.preco) || 0)
      });
    });
  });
  const totalQtd = rows.reduce((s, r) => s + (Number(r.coef) || 0), 0);
  const totalValor = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  cpuOperacoesRenderResultado(rows, `${rows.length} ocorrência(s) · coeficiente total ${fmtNum(totalQtd)} · valor direto ${fmtMoeda(totalValor)}`);
}

function cpuOperacaoTrocar() {
  const alvo = codigoChave(document.getElementById('cpu-op-insumo')?.value);
  const novo = codigoChave(document.getElementById('cpu-op-novo')?.value);
  if (!alvo || !novo) { toast('Informe o insumo atual e o novo insumo.', 'error'); return; }
  const ref = buscarReferenciaPorCodigo(novo);
  if (!ref) { toast('Novo insumo não encontrado. Cadastre-o em Insumos antes de trocar.', 'error'); return; }
  const escopo = cpuOperacoesEscopo();
  const ocorrencias = [];
  escopo.forEach(cpu => (cpu.insumos || []).forEach(ins => {
    if (codigoChave(ins.cod) === alvo) ocorrencias.push({ cpu, ins });
  }));
  if (!ocorrencias.length) { toast('Nenhuma ocorrência encontrada para troca.', 'info'); return; }
  if (!confirm(`Trocar ${alvo} por ${novo} em ${ocorrencias.length} ocorrência(s) de ${new Set(ocorrencias.map(o => o.cpu.cod)).size} composição(ões)?`)) return;
  ocorrencias.forEach(({ cpu, ins }) => {
    ins.cod = ref.codigo;
    ins.desc = ref.descricao;
    ins.unid = ref.unidade;
    ins.tipo = cpuTipoManual(ref.codigo || ref.tipo, ref.descricao);
    ins.preco = ref.precoUnitario;
    ins.fonte = ref.fonte;
    cpuRecalcularComposicaoSalva(cpu);
  });
  cpuSaveLib();
  cpuRenderBiblioteca();
  cpuOperacaoPesquisar();
  toast('Insumo trocado e CPUs recalculadas.', 'success');
}

function cpuOperacaoExcluir() {
  const alvo = codigoChave(document.getElementById('cpu-op-insumo')?.value);
  if (!alvo) { toast('Informe o insumo que será excluído das composições.', 'error'); return; }
  const escopo = cpuOperacoesEscopo();
  let ocorrencias = 0;
  escopo.forEach(cpu => {
    ocorrencias += (cpu.insumos || []).filter(ins => codigoChave(ins.cod) === alvo).length;
  });
  if (!ocorrencias) { toast('Nenhuma ocorrência encontrada para exclusão.', 'info'); return; }
  if (!confirm(`Excluir ${alvo} de ${ocorrencias} ocorrência(s) no escopo selecionado? As CPUs serão recalculadas.`)) return;
  escopo.forEach(cpu => {
    const antes = (cpu.insumos || []).length;
    cpu.insumos = (cpu.insumos || []).filter(ins => codigoChave(ins.cod) !== alvo);
    if (cpu.insumos.length !== antes) cpuRecalcularComposicaoSalva(cpu);
  });
  cpuSaveLib();
  cpuRenderBiblioteca();
  cpuOperacaoPesquisar();
  toast('Insumo excluído das composições selecionadas.', 'success');
}

function cpuOperacaoCopiar() {
  const origemCod = codigoChave(document.getElementById('cpu-op-insumo')?.value);
  const destinoCod = String(document.getElementById('cpu-op-copia-cod')?.value || '').trim().toUpperCase();
  const destinoDesc = String(document.getElementById('cpu-op-copia-desc')?.value || '').trim();
  if (!origemCod || !destinoCod) { toast('Informe a composição de origem e o novo código.', 'error'); return; }
  const origem = CPU_BIBLIOTECA.find(cpu => codigoChave(cpu.cod) === origemCod);
  if (!origem) { toast('Composição de origem não encontrada na biblioteca.', 'error'); return; }
  const existente = CPU_BIBLIOTECA.find(cpu => codigoChave(cpu.cod) === codigoChave(destinoCod));
  if (existente && !confirm(`A composição ${destinoCod} já existe. Substituir pela cópia?`)) return;
  const copia = {
    ...JSON.parse(JSON.stringify(origem)),
    id: makeId('cpu'),
    cod: destinoCod,
    desc: destinoDesc || origem.desc,
    criadaEm: new Date().toLocaleDateString('pt-BR'),
    origemCopia: origem.cod
  };
  cpuRecalcularComposicaoSalva(copia);
  const idx = CPU_BIBLIOTECA.findIndex(cpu => codigoChave(cpu.cod) === codigoChave(destinoCod));
  if (idx >= 0) CPU_BIBLIOTECA[idx] = copia;
  else CPU_BIBLIOTECA.push(copia);
  cpuSaveLib();
  cpuRenderBiblioteca();
  cpuVerFicha(copia.id);
  cpuOperacoesRenderResultado([], `Composição ${destinoCod} copiada de ${origem.cod}.`);
  toast('Composição copiada para novo código.', 'success');
}

function cpuNormalizarComposicaoExterna(raw, bancoNome = 'Banco externo') {
  const cod = String(raw.cod || raw.codigo || raw.codigoComposicao || raw.cpu || '').trim().toUpperCase();
  const desc = String(raw.desc || raw.descricao || raw.nome || '').trim();
  if (!cod || !desc) return null;
  const cpu = {
    id: raw.id || makeId('cpu-ext'),
    cod,
    desc,
    unid: String(raw.unid || raw.unidade || raw.un || 'UN').trim() || 'UN',
    tipo: String(raw.tipo || raw.categoria || 'Serviços Gerais').trim() || 'Serviços Gerais',
    encargos: raw.encargos || 'nd',
    encPct: Number(raw.encPct ?? raw.encargosPct ?? 127.5) || 127.5,
    prod: Math.max(0.0001, Number(raw.prod ?? raw.producao ?? raw.producaoEquipe ?? 1) || 1),
    insumos: Array.isArray(raw.insumos) ? raw.insumos.map(ins => ({
      cod: String(ins.cod || ins.codigo || ins.codigoInsumo || '').trim().toUpperCase(),
      desc: String(ins.desc || ins.descricao || '').trim(),
      unid: String(ins.unid || ins.unidade || ins.un || 'UN').trim() || 'UN',
      tipo: cpuTipoManual(ins.cod || ins.codigo || ins.codigoInsumo || ins.tipo || ins.grupo || ins.categoria, ins.desc || ins.descricao),
      coef: Number(ins.coef ?? ins.indice ?? ins.consumo ?? ins.qtd ?? 1) || 1,
      preco: Number(ins.preco ?? ins.precoUnitario ?? ins.valor ?? 0) || 0,
      fonte: ins.fonte || bancoNome
    })).filter(ins => ins.cod || ins.desc) : [],
    origemBanco: bancoNome,
    criadaEm: new Date().toLocaleDateString('pt-BR')
  };
  cpuRecalcularComposicaoSalva(cpu);
  return cpu;
}

function cpuHeaderIndex(headers, aliases) {
  const keys = headers.map(cpuHeaderKey);
  return keys.findIndex(key => aliases.some(alias => key.includes(alias)));
}

function cpuRowsToObjects(raw) {
  const headerRow = cpuFindHeaderRow(raw);
  if (headerRow < 0) return [];
  const headers = (raw[headerRow] || []).map(v => String(v || '').trim());
  return raw.slice(headerRow + 1).map(row => ({ headers, row })).filter(({ row }) => row.some(v => String(v || '').trim()));
}

function cpuParseBancoExternoSheets(wb, fileName) {
  const composicoes = new Map();
  const ensureCpu = (cod, data = {}) => {
    const code = String(cod || '').trim().toUpperCase();
    if (!code) return null;
    if (!composicoes.has(code)) {
      composicoes.set(code, cpuNormalizarComposicaoExterna({
        cod: code,
        descricao: data.descricao || data.desc || code,
        unidade: data.unidade || data.unid || 'UN',
        tipo: data.tipo || 'Serviços Gerais',
        encPct: data.encPct,
        prod: data.prod,
        insumos: []
      }, fileName));
    } else {
      const cpu = composicoes.get(code);
      Object.assign(cpu, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== '')));
    }
    return composicoes.get(code);
  };

  wb.SheetNames.forEach(sheetName => {
    const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header:1, defval:'' });
    cpuRowsToObjects(raw).forEach(({ headers, row }) => {
      const get = aliases => {
        const idx = cpuHeaderIndex(headers, aliases);
        return idx >= 0 ? row[idx] : '';
      };
      const codCpu = String(get(['CPU','COMPOSICAO','COMPOSIÇÃO','CODIGO_COMPOSICAO','COD_DA_COMPOSICAO']) || '').trim().toUpperCase();
      const codGenerico = String(get(['CODIGO','COD','ITEM']) || '').trim().toUpperCase();
      const desc = String(get(['DESCRICAO','DESCRIÇÃO','DESC','NOME']) || '').trim();
      const codInsumo = String(get(['CODIGO_INSUMO','COD_INSUMO','INSUMO']) || '').trim().toUpperCase();
      const coef = parseNumeroBR(get(['COEF','INDICE','ÍNDICE','CONSUMO','QTD','QUANT']));
      const preco = parseNumeroBR(get(['PRECO','PREÇO','VALOR','CUSTO','UNIT']));
      const unid = String(get(['UNIDADE','UNID','UN']) || '').trim();
      const tipo = String(get(['TIPO','GRUPO','CATEGORIA']) || '').trim();
      const prod = parseNumeroBR(get(['PRODUCAO','PRODUÇÃO','PROD_EQUIPE','PRODUTIVIDADE']));
      const encPct = parseNumeroBR(get(['ENCARGOS','ENC_PCT']));

      if (codCpu && (codInsumo || (codGenerico && desc && (coef || preco)))) {
        const cpu = ensureCpu(codCpu, {});
        const insCod = codInsumo || codGenerico;
        if (cpu && (insCod || desc)) {
          cpu.insumos.push({
            cod: insCod,
            desc,
            unid: unid || 'UN',
            tipo: cpuTipoManual(insCod || tipo, desc),
            coef: coef || 1,
            preco: preco || 0,
            fonte: `${fileName}/${sheetName}`
          });
        }
      } else if (codGenerico && desc) {
        const cpu = ensureCpu(codGenerico, {
          desc,
          descricao: desc,
          unid: unid || 'UN',
          unidade: unid || 'UN',
          tipo: tipo || 'Serviços Gerais',
          prod: prod || 1,
          encPct: encPct || undefined
        });
        if (cpu) {
          cpu.desc = desc || cpu.desc;
          cpu.unid = unid || cpu.unid;
          cpu.tipo = tipo || cpu.tipo;
          cpu.prod = prod || cpu.prod || 1;
          if (encPct) cpu.encPct = encPct;
        }
      }
    });
  });
  return [...composicoes.values()].filter(Boolean).map(cpu => {
    cpuRecalcularComposicaoSalva(cpu);
    return cpu;
  });
}

async function cpuImportarBancoExterno(event) {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;
  let importados = 0;
  try {
    for (const file of files) {
      let composicoes = [];
      if (/\.json$/i.test(file.name)) {
        const data = JSON.parse(await file.text());
        const list = Array.isArray(data) ? data : (Array.isArray(data.composicoes) ? data.composicoes : []);
        composicoes = list.map(item => cpuNormalizarComposicaoExterna(item, file.name)).filter(Boolean);
      } else {
        if (!window.XLSX) throw new Error('Biblioteca XLSX não carregada.');
        const wb = XLSX.read(await file.arrayBuffer(), { type:'array' });
        composicoes = cpuParseBancoExternoSheets(wb, file.name);
      }
      const banco = {
        id: makeId('banco'),
        nome: file.name,
        origem: file.name,
        importadoEm: new Date().toISOString(),
        composicoes
      };
      STATE.cpuBancosExternos = [...(STATE.cpuBancosExternos || []).filter(b => b.nome !== file.name), banco];
      importados += composicoes.length;
    }
    saveState();
    cpuBancoExternoRender();
    toast(`${importados} composição(ões) importada(s) para bancos externos.`, importados ? 'success' : 'warning');
  } catch (err) {
    toast(err.message || 'Erro ao importar banco externo.', 'error');
  } finally {
    if (event?.target) event.target.value = '';
  }
}

function cpuBancoExternoAtual() {
  normalizeState();
  const select = document.getElementById('cpu-banco-select');
  const id = select?.value || STATE.cpuBancosExternos?.[0]?.id || '';
  return (STATE.cpuBancosExternos || []).find(b => b.id === id) || null;
}

function cpuBancoExternoRender() {
  const select = document.getElementById('cpu-banco-select');
  const list = document.getElementById('cpu-banco-lista');
  if (!select || !list) return;
  normalizeState();
  const bancos = STATE.cpuBancosExternos || [];
  const currentValue = select.value;
  select.innerHTML = bancos.length
    ? bancos.map(b => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.nome)} · ${(b.composicoes || []).length} CPU(s)</option>`).join('')
    : '<option value="">Nenhum banco importado</option>';
  if (currentValue && bancos.some(b => b.id === currentValue)) select.value = currentValue;
  const banco = cpuBancoExternoAtual();
  if (!banco) {
    list.innerHTML = 'Nenhum banco externo importado.';
    return;
  }
  const q = textoChave(document.getElementById('cpu-banco-busca')?.value || '');
  const comps = (banco.composicoes || []).filter(cpu => !q || textoChave(`${cpu.cod} ${cpu.desc} ${cpu.tipo}`).includes(q)).slice(0, 80);
  if (!comps.length) {
    list.innerHTML = '<div class="empty-state" style="padding:12px">Nenhuma composição encontrada neste banco.</div>';
    return;
  }
  list.innerHTML = comps.map(cpu => `<div class="cpu-banco-row">
    <div><strong>${escapeHtml(cpu.cod)}</strong><span>${escapeHtml(cpu.desc)} · ${escapeHtml(cpu.unid)} · ${fmtMoeda(cpu.precoUnitario)}</span></div>
    <button class="btn btn-outline btn-sm" onclick="cpuCopiarBancoExterno(${inlineJsArg(banco.id)}, ${inlineJsArg(cpu.id)})">Copiar</button>
  </div>`).join('');
}

function cpuCopiarBancoExterno(bancoId, cpuId) {
  const banco = (STATE.cpuBancosExternos || []).find(b => String(b.id) === String(bancoId));
  const origem = banco?.composicoes?.find(cpu => String(cpu.id) === String(cpuId));
  if (!banco || !origem) { toast('Composição externa não encontrada.', 'error'); return; }
  const prefixo = String(document.getElementById('cpu-banco-prefixo')?.value || '').trim().toUpperCase();
  const destinoCampo = String(document.getElementById('cpu-banco-destino')?.value || '').trim().toUpperCase();
  const destinoCod = destinoCampo || `${prefixo}${origem.cod}`.toUpperCase();
  if (!destinoCod) { toast('Informe um código de destino ou prefixo.', 'error'); return; }
  const existente = CPU_BIBLIOTECA.find(cpu => codigoChave(cpu.cod) === codigoChave(destinoCod));
  if (existente && !confirm(`A composição ${destinoCod} já existe. Substituir?`)) return;
  const copia = cpuNormalizarComposicaoExterna({
    ...clonePlain(origem, {}),
    id: makeId('cpu'),
    cod: destinoCod,
    origemCopia: `${banco.nome}/${origem.cod}`,
    insumos: clonePlain(origem.insumos, [])
  }, banco.nome);
  const idx = CPU_BIBLIOTECA.findIndex(cpu => codigoChave(cpu.cod) === codigoChave(destinoCod));
  if (idx >= 0) CPU_BIBLIOTECA[idx] = copia;
  else CPU_BIBLIOTECA.push(copia);
  cpuSaveLib();
  cpuRenderBiblioteca();
  cpuEditorAbrir(copia.id, { fromStack:true });
  toast('Composição copiada do banco externo com recodificação.', 'success');
}

function cpuRecalcularBiblioteca() {
  (CPU_BIBLIOTECA || []).forEach(cpu => cpuRecalcularComposicaoSalva(cpu));
  cpuSaveLib();
  cpuRenderBiblioteca();
  toast('Biblioteca de CPUs recalculada.', 'success');
}

let _cpuFichaSelecionada = null;
function cpuVerFicha(id) {
  const c = CPU_BIBLIOTECA.find(x => String(x.id) === String(id));
  if (!c) return;
  _cpuFichaSelecionada = c;
  document.getElementById('cpu-ficha-card').style.display = 'block';
  const usarCompor = cpuUsaModeloCompor(c);
  const grupos = { M:0, E:0, S:0, SV:0, T:0, AX:0 };
  c.insumos.forEach(i => {
    const tipo = cpuEditorFindByCode(i.cod) ? 'AX' : cpuInsumoTipo(i, usarCompor);
    grupos[tipo] += i.coef * i.preco;
  });
  const moEnc = grupos.S * c.encPct / 100;
  const rows = c.insumos.map(ins => {
    const tagLabels = { M:'Mat', E:'Eq', S:'MO', SV:'Serv', T:'Tr', AX:'Aux' };
    const tagColors = { M:'cpu-tag-M', E:'cpu-tag-E', S:'cpu-tag-S', SV:'cpu-tag-M', T:'cpu-tag-T', AX:'cpu-tag-M' };
    const tipo = cpuEditorFindByCode(ins.cod) ? 'AX' : cpuInsumoTipo(ins, usarCompor);
    return `<div class="cpu-insumo-row" style="padding:5px 0;font-size:11px">
      <span style="color:var(--gold);font-family:monospace">${ins.cod}</span>
      <span style="overflow:hidden;text-overflow:ellipsis" title="${ins.desc}">
        <span class="cpu-tag ${tagColors[tipo]}" style="margin-right:4px;font-size:9px">${tagLabels[tipo]}</span>${ins.desc}
      </span>
      <span>${ins.unid}</span><span>${ins.coef}</span>
      <span>${fmtMoeda(ins.preco)}</span>
      <span style="font-weight:700">${fmtMoeda(ins.coef*ins.preco)}</span>
      <span></span>
    </div>`;
  }).join('');
  document.getElementById('cpu-ficha-content').innerHTML = `
    <div style="font-size:12px;margin-bottom:10px">
      <strong>${c.cod}</strong> — ${c.desc}<br>
      <span style="color:var(--text3)">${c.tipo} · ${c.unid} · Encargos: ${c.encPct}%</span>
    </div>
    <div class="cpu-insumo-row cpu-insumo-header" style="margin-bottom:4px">
      <span>Cód</span><span>Descrição</span><span>Un</span><span>Coef.</span><span>P.Unit</span><span>Subtotal</span><span></span>
    </div>
    ${rows}
    <div class="cpu-total-bar" style="margin-top:8px">
      <span class="cpu-total-label">Custo Unit. c/ Encargos:</span>
      <span class="cpu-total-value" style="font-size:15px">${fmtMoeda(c.precoUnitario)}</span>
    </div>`;
}

function cpuUsarDaBiblioteca() {
  if (!_cpuFichaSelecionada) return;
  const c = _cpuFichaSelecionada;
  STATE.orcamento.push({ id: makeId('orc'), cod: c.cod, desc: c.desc, unid: c.unid, qtd: 1, preco: c.precoUnitario, ref: 0, cat: c.tipo, capitulo: c.tipo, ordem: STATE.orcamento.length + 1 });
  invalidarDescontoPregao('CPU da biblioteca adicionada ao orçamento');
  saveState(); renderElaborar(); renderDashboard(); preencherSelectsOperacionais();
  toast('CPU "' + c.cod + '" enviada ao orçamento', 'success');
  showView('elaborar');
}

// ─── EXPORTAR / IMPORTAR BIBLIOTECA ───────────────────────
function cpuExportarBiblioteca() {
  cpuExportarBibliotecaExcel();
}

function cpuExportarBibliotecaExcel() {
  if (!CPU_BIBLIOTECA.length) { toast('Biblioteca vazia', 'error'); return; }
  const cpuRows = [['Código','Descrição','Unidade','Tipo','Encargos','Encargos %','Custo unitário','Criada em','Qtd insumos']];
  const insRows = [['CPU','Código insumo','Descrição','Unidade','Tipo','Coeficiente','Preço unitário','Subtotal']];
  CPU_BIBLIOTECA.forEach(cpu => {
    cpuRows.push([cpu.cod, cpu.desc, cpu.unid, cpu.tipo, cpu.encargos, cpu.encPct, cpu.precoUnitario, cpu.criadaEm, (cpu.insumos || []).length]);
    (cpu.insumos || []).forEach(ins => insRows.push([
      cpu.cod, ins.cod, ins.desc, ins.unid, ins.tipo, Number(ins.coef) || 0, Number(ins.preco) || 0, (Number(ins.coef) || 0) * (Number(ins.preco) || 0)
    ]));
  });
  exportRowsToExcel(`TLPlanly_CPU_Biblioteca_${new Date().toISOString().slice(0,10)}`, [
    { name:'Composições', rows: cpuRows },
    { name:'Insumos', rows: insRows }
  ]);
}

function cpuExportarBibliotecaPDF() {
  if (!CPU_BIBLIOTECA.length) { toast('Biblioteca vazia', 'error'); return; }
  const rows = [['Código','Descrição','Un','Tipo','Custo Unitário','Insumos']];
  CPU_BIBLIOTECA.forEach(cpu => rows.push([cpu.cod, cpu.desc, cpu.unid, cpu.tipo, fmtMoeda(cpu.precoUnitario), (cpu.insumos || []).length]));
  const detalhes = CPU_BIBLIOTECA.map(cpu => `
    <h2>${escapeHtml(cpu.cod)} — ${escapeHtml(cpu.desc)}</h2>
    <p><strong>Unidade:</strong> ${escapeHtml(cpu.unid)} · <strong>Tipo:</strong> ${escapeHtml(cpu.tipo)} · <strong>Custo unitário:</strong> ${fmtMoeda(cpu.precoUnitario)}</p>
    ${rowsToHtmlTable([['Código','Descrição','Un','Tipo','Coef.','Preço','Subtotal'], ...(cpu.insumos || []).map(ins => [
      ins.cod, ins.desc, ins.unid, ins.tipo, ins.coef, fmtMoeda(ins.preco), fmtMoeda((Number(ins.coef) || 0) * (Number(ins.preco) || 0))
    ])])}
  `).join('');
  exportHtmlToPDF('Biblioteca de Composições CPU - TLPlanly', rowsToHtmlTable(rows) + detalhes, `TLPlanly_CPU_Biblioteca_${new Date().toISOString().slice(0,10)}`);
}

function cpuImportarBiblioteca() {
  const input = document.getElementById('cpu-lib-import-input');
  if (input) input.click();
}

async function cpuImportarBibliotecaArquivo(event) {
  const file = event?.target?.files?.[0];
  if (!file) return;
  try {
    if (/\.json$/i.test(file.name)) {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : (Array.isArray(data.composicoes) ? data.composicoes : []);
      if (!list.length) throw new Error('JSON sem composições válidas.');
      const composicoes = list.map(item => cpuNormalizarComposicaoExterna(item, file.name)).filter(Boolean);
      const res = cpuImportarBibliotecaAdicionar(composicoes, { overwrite:false });
      cpuImportarBibliotecaCancelar({ keepInput:true });
      toast(`${res.adicionadas} adicionada(s), ${res.ignoradas} já existente(s).`, res.adicionadas ? 'success' : 'warning');
      return;
    }
    if (!window.XLSX) throw new Error('Leitor de Excel não carregado.');
    const sheets = await lerPlanilhasArquivo(file);
    if (!sheets.length) throw new Error('Nenhuma aba com dados encontrada no arquivo.');
    CPU_IMPORT_BIBLIOTECA = { file, fileName:file.name, sheets, currentIndex:0 };
    cpuImportarBibliotecaRenderSheets();
    document.getElementById('cpu-import-map-card')?.style.setProperty('display', 'block');
    const label = document.getElementById('cpu-import-file-label');
    if (label) label.textContent = `${file.name} · ${sheets.length} aba(s) detectada(s)`;
    cpuImportarBibliotecaSugerirColunas();
  } catch (err) {
    toast(`Erro na importação: ${err.message || err}`, 'error');
  } finally {
    if (event?.target) event.target.value = '';
  }
}

function cpuImportarBibliotecaRenderSheets() {
  const select = document.getElementById('cpu-import-sheet');
  if (!select) return;
  const sheets = CPU_IMPORT_BIBLIOTECA.sheets || [];
  select.innerHTML = sheets.map((entry, index) => `<option value="${index}">${escapeHtml(entry.sheetName)} · ${entry.raw.length} linha(s)</option>`).join('');
  select.value = String(CPU_IMPORT_BIBLIOTECA.currentIndex || 0);
}

function cpuImportarBibliotecaSheetAtual() {
  return (CPU_IMPORT_BIBLIOTECA.sheets || [])[Number(CPU_IMPORT_BIBLIOTECA.currentIndex) || 0] || null;
}

function cpuImportarBibliotecaCancelar(options = {}) {
  CPU_IMPORT_BIBLIOTECA = { file: null, sheets: [], currentIndex: 0 };
  const card = document.getElementById('cpu-import-map-card');
  if (card) card.style.display = 'none';
  const preview = document.getElementById('cpu-import-preview');
  if (preview) preview.innerHTML = '';
  const status = document.getElementById('cpu-import-status');
  if (status) { status.textContent = ''; status.className = 'form-help'; }
  if (!options.keepInput) {
    const input = document.getElementById('cpu-lib-import-input');
    if (input) input.value = '';
  }
}

function cpuImportarBibliotecaSelecionarAba(value) {
  CPU_IMPORT_BIBLIOTECA.currentIndex = Number(value) || 0;
  cpuImportarBibliotecaSugerirColunas();
}

function cpuColumnIndexFromLetter(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw || raw === '0' || raw === '-' || raw === 'IGNORAR') return -1;
  if (/^\d+$/.test(raw)) return Math.max(-1, Number(raw) - 1);
  if (!/^[A-Z]+$/.test(raw)) return -1;
  let n = 0;
  for (const ch of raw) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function cpuColumnLetterFromIndex(index) {
  return index >= 0 ? sheetColumnLetter(index) : '';
}

function cpuImportarBibliotecaSetCol(id, index) {
  const el = document.getElementById(id);
  if (el) el.value = cpuColumnLetterFromIndex(index);
}

function cpuImportarBibliotecaGetCol(id) {
  return cpuColumnIndexFromLetter(document.getElementById(id)?.value || '');
}

function cpuImportarBibliotecaHeaderIndex(rawRows, aliases) {
  const rows = sheetNormalizeRows(rawRows);
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] || [];
    let best = { index:-1, score:0 };
    row.forEach((cell, index) => {
      const score = sheetScoreHeader(cell, aliases);
      if (score > best.score) best = { index, score };
    });
    if (best.score >= 4) return best.index;
  }
  return -1;
}

function cpuImportarBibliotecaSugerirColunas() {
  const entry = cpuImportarBibliotecaSheetAtual();
  if (!entry) return;
  const sugestao = sheetSuggestMapping(entry.raw, 'composicoes');
  const maxCols = Math.max(0, ...sheetNormalizeRows(entry.raw).slice(0, 50).map(row => row.length));
  const fallback = maxCols >= 13
    ? { cpuCod:0, cpuDesc:1, cpuDescFull:2, cpuUnid:3, cpuProd:4, insumoCod:5, insumoDesc:6, insumoUnid:7, preco:8, precoImprod:9, coef:10, coefImprod:11, qtdEquip:12 }
    : sheetDefaultMapping('composicoes', Math.max(maxCols, 8));
  const map = sugestao.headerRow >= 0 ? sugestao.mapping : {};
  const descFullCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['descricao completa','descrição completa','desc completa','memorial']);
  const cpuTipoCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['tipo da composicao','tipo da composição','tipo composicao','tipo composição','categoria servico','categoria serviço']);
  const cpuProdCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['producao por hora','produção por hora','prod equipe','produtividade','producao','produção']);
  const insPrecoImprodCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['preco improd','preço improd','preco improdutivo','preço improdutivo','custo improd','custo improdutivo']);
  const insCoefImprodCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['indice improd','índice improd','indice improdutivo','índice improdutivo','coef improd','coeficiente improd']);
  const insQtdEquipCol = cpuImportarBibliotecaHeaderIndex(entry.raw, ['qtde equip','qtd equip','quantidade equip','quantidade equipamento','qtde equipamento']);

  const set = (id, index) => cpuImportarBibliotecaSetCol(id, index >= 0 ? index : -1);
  set('cpu-map-cpu-cod', map.cpuCod ?? fallback.cpuCod ?? 0);
  set('cpu-map-cpu-desc', map.cpuDesc ?? fallback.cpuDesc ?? 1);
  set('cpu-map-cpu-unid', map.cpuUnid ?? fallback.cpuUnid ?? 3);
  set('cpu-map-ins-cod', map.insumoCod ?? fallback.insumoCod ?? 5);
  set('cpu-map-ins-desc', map.insumoDesc ?? fallback.insumoDesc ?? 6);
  set('cpu-map-ins-unid', map.insumoUnid ?? fallback.insumoUnid ?? 7);
  set('cpu-map-ins-tipo', map.tipo ?? fallback.tipo ?? -1);
  set('cpu-map-ins-preco', map.preco ?? fallback.preco ?? 8);
  set('cpu-map-ins-coef', map.coef ?? fallback.coef ?? 10);

  set('cpu-map-cpu-desc-full', descFullCol >= 0 ? descFullCol : (map.cpuDescCompleta ?? fallback.cpuDescFull ?? fallback.cpuDescCompleta ?? 2));
  set('cpu-map-cpu-tipo', cpuTipoCol >= 0 ? cpuTipoCol : (fallback.cpuTipo ?? -1));
  set('cpu-map-cpu-prod', cpuProdCol >= 0 ? cpuProdCol : (fallback.cpuProd ?? -1));
  set('cpu-map-ins-preco-improd', insPrecoImprodCol >= 0 ? insPrecoImprodCol : (map.precoImprod ?? fallback.precoImprod ?? 9));
  set('cpu-map-ins-coef-improd', insCoefImprodCol >= 0 ? insCoefImprodCol : (map.coefImprod ?? fallback.coefImprod ?? 11));
  set('cpu-map-ins-qtd', insQtdEquipCol >= 0 ? insQtdEquipCol : (map.qtdEquip ?? fallback.qtdEquip ?? 12));

  const start = document.getElementById('cpu-import-start-row');
  if (start) start.value = String(Math.max(1, sugestao.headerRow >= 0 ? sugestao.headerRow + 2 : 2));
  cpuImportarBibliotecaPreview();
}

function cpuImportarBibliotecaMapeamento() {
  return {
    cpuCod: cpuImportarBibliotecaGetCol('cpu-map-cpu-cod'),
    cpuDesc: cpuImportarBibliotecaGetCol('cpu-map-cpu-desc'),
    cpuDescFull: cpuImportarBibliotecaGetCol('cpu-map-cpu-desc-full'),
    cpuUnid: cpuImportarBibliotecaGetCol('cpu-map-cpu-unid'),
    cpuTipo: cpuImportarBibliotecaGetCol('cpu-map-cpu-tipo'),
    cpuProd: cpuImportarBibliotecaGetCol('cpu-map-cpu-prod'),
    insCod: cpuImportarBibliotecaGetCol('cpu-map-ins-cod'),
    insQtdEquip: cpuImportarBibliotecaGetCol('cpu-map-ins-qtd'),
    insCoef: cpuImportarBibliotecaGetCol('cpu-map-ins-coef'),
    insCoefImprod: cpuImportarBibliotecaGetCol('cpu-map-ins-coef-improd'),
    insDesc: cpuImportarBibliotecaGetCol('cpu-map-ins-desc'),
    insUnid: cpuImportarBibliotecaGetCol('cpu-map-ins-unid'),
    insTipo: cpuImportarBibliotecaGetCol('cpu-map-ins-tipo'),
    insPreco: cpuImportarBibliotecaGetCol('cpu-map-ins-preco'),
    insPrecoImprod: cpuImportarBibliotecaGetCol('cpu-map-ins-preco-improd')
  };
}

function cpuImportarBibliotecaCell(row, index) {
  return index >= 0 ? String(row[index] ?? '').trim() : '';
}

function cpuImportarBibliotecaParseAtual() {
  const entry = cpuImportarBibliotecaSheetAtual();
  const result = { composicoes: [], issues: [] };
  if (!entry) {
    result.issues.push('Nenhuma planilha selecionada.');
    return result;
  }
  const cols = cpuImportarBibliotecaMapeamento();
  const rows = sheetNormalizeRows(entry.raw);
  const startRowInput = Number(document.getElementById('cpu-import-start-row')?.value || 1);
  const start = Math.max(0, startRowInput - 1);
  const composicoes = new Map();
  let currentCode = '';

  const ensureCpu = (code, row) => {
    const cod = limparCodigo(code).toUpperCase();
    if (!cod) return null;
    const descFull = cpuImportarBibliotecaCell(row, cols.cpuDescFull);
    const desc = cpuImportarBibliotecaCell(row, cols.cpuDesc) || descFull;
    const unid = normalizarUnidadeImportacao(cpuImportarBibliotecaCell(row, cols.cpuUnid) || 'UN');
    const tipo = cpuImportarBibliotecaCell(row, cols.cpuTipo);
    const prod = parseNumeroBR(cpuImportarBibliotecaCell(row, cols.cpuProd));
    if (!composicoes.has(cod)) {
      composicoes.set(cod, {
        id: makeId('cpu'),
        cod,
        desc: desc || cod,
        descCompleta: descFull || '',
        descricaoCompleta: descFull || '',
        unid,
        tipo: tipo || 'Serviços Gerais',
        encargos: 'importado',
        encPct: 0,
        prod: Math.max(0.0001, prod || 1),
        producaoEquipe: Math.max(0.0001, prod || 1),
        modeloCalculo: 'compor',
        importadoCompor: true,
        insumos: [],
        precoUnitario: 0,
        origemBanco: entry.fileName,
        origemAba: entry.sheetName,
        criadaEm: new Date().toLocaleDateString('pt-BR')
      });
    } else {
      const cpu = composicoes.get(cod);
      if (desc && (!cpu.desc || cpu.desc === cod)) cpu.desc = desc;
      if (descFull) cpu.descCompleta = descFull;
      if (descFull) cpu.descricaoCompleta = descFull;
      if (unid && unid !== 'UN') cpu.unid = unid;
      if (tipo) cpu.tipo = tipo;
      if (prod > 0) cpu.prod = Math.max(0.0001, prod);
      if (prod > 0) cpu.producaoEquipe = Math.max(0.0001, prod);
    }
    return composicoes.get(cod);
  };

  rows.slice(start).forEach((row, offset) => {
    const rowNumber = start + offset + 1;
    if (!row || row.every(cell => !String(cell || '').trim())) return;
    const joined = row.map(cell => String(cell || '')).join(' ').trim();
    if (!joined || linhaImportacaoIgnorada(joined)) return;

    const cpuCodeCell = limparCodigo(cpuImportarBibliotecaCell(row, cols.cpuCod)).toUpperCase();
    if (cpuCodeCell) currentCode = cpuCodeCell;
    const cpu = ensureCpu(currentCode, row);
    if (!cpu) {
      result.issues.push(`Linha ${rowNumber}: sem código de composição.`);
      return;
    }

    const insCodeRaw = cpuImportarBibliotecaCell(row, cols.insCod);
    const insDescCell = cpuImportarBibliotecaCell(row, cols.insDesc);
    const qtdEquipCell = cpuImportarBibliotecaCell(row, cols.insQtdEquip);
    const coefCell = cpuImportarBibliotecaCell(row, cols.insCoef);
    const coefImprodCell = cpuImportarBibliotecaCell(row, cols.insCoefImprod);
    const precoCell = cpuImportarBibliotecaCell(row, cols.insPreco);
    const precoImprodCell = cpuImportarBibliotecaCell(row, cols.insPrecoImprod);
    const hasResource = insCodeRaw || insDescCell || qtdEquipCell || coefCell || coefImprodCell || precoCell || precoImprodCell;
    if (!hasResource) return;

    const insCod = limparCodigo(insCodeRaw).toUpperCase() || `IMP-${String(rowNumber).padStart(4, '0')}`;
    const lookup = insCod ? lookupPreco(insCod) : null;
    const desc = insDescCell || lookup?.item?.descricao || insCod;
    const coef = parseNumeroBR(coefCell) || 0;
    const coefImprod = parseNumeroBR(coefImprodCell) || 0;
    const qtdEquip = parseNumeroBR(qtdEquipCell) || 0;
    const precoMapeado = precoCell ? parseNumeroBR(precoCell) : 0;
    const preco = precoCell ? precoMapeado : (Number(lookup?.preco) || 0);
    const precoImprodMapeado = precoImprodCell ? parseNumeroBR(precoImprodCell) : 0;
    const precoImprodLookup = Number(lookup?.item?.custoImprodutivo ?? lookup?.item?.precoImprodutivo ?? lookup?.item?.improdutivo ?? 0) || 0;
    const precoImprod = precoImprodCell ? precoImprodMapeado : precoImprodLookup;
    const tipoBase = cpuImportarBibliotecaCell(row, cols.insTipo) || lookup?.item?.tipo || lookup?.item?.categoria || lookup?.item?.natureza || '';
    cpu.insumos.push({
      cod: insCod,
      desc,
      unid: normalizarUnidadeImportacao(cpuImportarBibliotecaCell(row, cols.insUnid) || lookup?.item?.unidade || 'UN'),
      tipo: cpuTipoManual(insCod || tipoBase, desc),
      coef,
      indice: coef,
      coefImprod,
      indiceImprodutivo: coefImprod,
      qtd: qtdEquip || 0,
      qtdEquip: qtdEquip || 0,
      quantidadeEquipamento: qtdEquip || 0,
      preco,
      precoImprod,
      precoImprodutivo: precoImprod,
      fonte: precoCell ? `${entry.fileName}/${entry.sheetName}` : (lookup?.fonte || `${entry.fileName}/${entry.sheetName}`)
    });
    if (!preco && !lookup) result.issues.push(`Linha ${rowNumber}: recurso ${insCod} sem preço mapeado e não encontrado na base.`);
  });

  result.composicoes = [...composicoes.values()].filter(cpu => {
    if (!cpu.insumos.length) result.issues.push(`Composição ${cpu.cod}: sem recursos vinculados.`);
    return cpu.cod && cpu.desc && cpu.insumos.length;
  }).map(cpu => {
    cpuRecalcularComposicaoSalva(cpu);
    return cpu;
  });
  return result;
}

function cpuImportarBibliotecaPreview() {
  const entry = cpuImportarBibliotecaSheetAtual();
  const preview = document.getElementById('cpu-import-preview');
  const status = document.getElementById('cpu-import-status');
  if (!entry || !preview) return;
  const cols = cpuImportarBibliotecaMapeamento();
  const rows = sheetNormalizeRows(entry.raw);
  const startRowInput = Number(document.getElementById('cpu-import-start-row')?.value || 1);
  const start = Math.max(0, startRowInput - 1);
  const previewRows = rows.slice(Math.max(0, start - 1), start + 8);
  const columns = [
    ['CPU', cols.cpuCod],
    ['Descrição CPU', cols.cpuDesc],
    ['Un', cols.cpuUnid],
    ['Prod.', cols.cpuProd],
    ['Recurso', cols.insCod],
    ['Descrição recurso', cols.insDesc],
    ['Preço', cols.insPreco],
    ['Preço improd.', cols.insPrecoImprod],
    ['Índice', cols.insCoef],
    ['Índice improd.', cols.insCoefImprod],
    ['Qtde equip.', cols.insQtdEquip]
  ];
  preview.innerHTML = `<table><thead><tr><th>Linha</th>${columns.map(([label, idx]) => `<th>${escapeHtml(label)}${idx >= 0 ? ` (${sheetColumnLetter(idx)})` : ''}</th>`).join('')}</tr></thead><tbody>
    ${previewRows.map((row, i) => {
      const line = Math.max(0, start - 1) + i + 1;
      const klass = line < startRowInput ? 'skip-row' : (line === startRowInput ? 'header-row' : '');
      return `<tr class="${klass}"><td>${line}</td>${columns.map(([, idx]) => `<td>${escapeHtml(cpuImportarBibliotecaCell(row, idx))}</td>`).join('')}</tr>`;
    }).join('')}
  </tbody></table>`;
  const parsed = cpuImportarBibliotecaParseAtual();
  if (status) {
    status.className = `form-help ${parsed.composicoes.length ? 'ok' : 'error'}`;
    const avisos = parsed.issues.length ? ` · ${Math.min(parsed.issues.length, 5)} aviso(s)` : '';
    status.textContent = `${parsed.composicoes.length} composição(ões) pronta(s) para importar${avisos}.`;
  }
}

function cpuImportarBibliotecaAdicionar(composicoes, options = {}) {
  let adicionadas = 0, atualizadas = 0, ignoradas = 0;
  (composicoes || []).forEach(cpu => {
    if (!cpu?.cod || !cpu?.desc) { ignoradas++; return; }
    const normalizada = {
      ...cpu,
      cod: String(cpu.cod).trim().toUpperCase(),
      id: cpu.id || makeId('cpu')
    };
    const idx = CPU_BIBLIOTECA.findIndex(item => codigoChave(item.cod) === codigoChave(normalizada.cod));
    if (idx >= 0) {
      if (!options.overwrite) { ignoradas++; return; }
      normalizada.id = CPU_BIBLIOTECA[idx].id;
      CPU_BIBLIOTECA[idx] = normalizada;
      atualizadas++;
    } else {
      CPU_BIBLIOTECA.push(normalizada);
      adicionadas++;
    }
  });
  CPU_BIBLIOTECA.forEach(cpu => cpuRecalcularComposicaoSalva(cpu));
  cpuSaveLib();
  cpuRenderBiblioteca();
  return { adicionadas, atualizadas, ignoradas };
}

function cpuImportarBibliotecaExecutar() {
  const parsed = cpuImportarBibliotecaParseAtual();
  if (!parsed.composicoes.length) {
    toast(parsed.issues[0] || 'Nenhuma composição válida encontrada.', 'error');
    return;
  }
  const overwrite = !!document.getElementById('cpu-import-overwrite')?.checked;
  const res = cpuImportarBibliotecaAdicionar(parsed.composicoes, { overwrite });
  const status = document.getElementById('cpu-import-status');
  if (status) {
    status.className = 'form-help ok';
    status.textContent = `${res.adicionadas} adicionada(s), ${res.atualizadas} atualizada(s), ${res.ignoradas} ignorada(s).`;
  }
  toast(`${res.adicionadas + res.atualizadas} composição(ões) importada(s) para a biblioteca.`, (res.adicionadas + res.atualizadas) ? 'success' : 'warning');
}

// ─── INIT FASE 3 ───────────────────────────────────────────
cpuLoadLib();
document.addEventListener('click', e => {
  if (!e.target.closest('#cpu-search') && !e.target.closest('#cpu-search-results')) {
    document.getElementById('cpu-search-results')?.classList.remove('open');
  }
});


// ═══════════════════════════════════════════════════════════
// COPILOT AGENT — TUTOR INTELIGENTE TLPlanly
// ═══════════════════════════════════════════════════════════

const COPILOT_KB = {
  // ── SAUDAÇÃO ────────────────────────────────────────────
  oi: {
    q: ['oi','olá','ola','boa tarde','bom dia','boa noite','hello','hi'],
    r: `Olá! Sou o **Copilot do TLPlanly** — seu tutor integrado. 🤖\n\nPosso te ajudar com:\n• Como usar qualquer função do sistema\n• Dúvidas sobre BDI, SINAPI, Curva ABC\n• Legislação (Decreto 7983, TCU 2622/2013)\n• Passo a passo de qualquer módulo\n\nO que você precisa?`,
    chips: ['Sim me guie','O que é BDI?','Como importar edital?','O que é Curva ABC?']
  },

  // ── ONBOARDING ──────────────────────────────────────────
  onboarding: {
    q: ['começar','iniciar','primeiro','como usar','tutorial','ajuda','novato','não sei','por onde','como operar','operar sistema'],
    r: `**Bem-vindo ao TLPlanly!** Vou te guiar pelos primeiros passos. 🚀\n\n**Fluxo recomendado:**\n1️⃣ Configure a **UF e o tipo de obra** em Configurações\n2️⃣ Carregue ou confirme a **base SINAPI** em Bases de Referência\n3️⃣ Configure o **BDI** na aba BDI/Encargos\n4️⃣ **Elabore o orçamento** do zero ou importe Excel/PDF\n5️⃣ Ajuste os itens direto na planilha editável\n6️⃣ Gere a **Curva ABC** e exporte o relatório\n\nQuer que eu te guie em algum passo específico?`,
    chips: ['Abrir Manual','Sim me guie','Como calcular BDI?','Como exportar?']
  },

  manual: {
    q: ['manual','manual de instruções','manual de instrucoes','guia do usuário','guia do usuario','treinamento','apresentação do sistema','apresentacao do sistema','como operar o tlplanly'],
    r: `**Manual de Operação do TLPlanly**\n\nCriei um manual prático para usuários leigos, com fluxo recomendado, explicação de todos os módulos e roteiros para construtora, órgão público e auditor.\n\nVocê pode abrir a versão visual em: [Manual TLPlanly](/docs/manual_usuario_tlplanly.html)\n\nTambém posso te orientar por aqui. Pergunte, por exemplo:\n• Como importar uma planilha?\n• Como usar a Central de Documentos?\n• Como configurar BDI?\n• Como auditar preços?`,
    chips: ['Abrir Manual','Como importar edital?','Central de Documentos','Como auditar?']
  },

  desconto_pregao: {
    q: ['desconto pregão','desconto pregao','planilha ajustada','readequar proposta','valor vencedor','proposta vencedora','aplicar desconto','pregoeiro'],
    r: `**Como gerar a planilha ajustada após o desconto do pregão**\n\nUse este fluxo quando o edital trouxe uma planilha estimativa e, após o lance, o pregoeiro pediu a planilha readequada.\n\n1. Vá em **Elaborar Orçamento**\n2. Importe ou confira a planilha estimativa do edital\n3. No bloco **Readequar Proposta do Pregão**, clique em **Usar total atual** ou informe o valor estimado do edital\n4. Preencha o **Valor vencedor** ou o **Desconto (%)**\n5. Clique em **Calcular prévia** para conferir o fator\n6. Clique em **Aplicar na planilha**\n7. Exporte em **Excel** e **PDF**\n\nO TLPlanly recalcula os preços unitários proporcionalmente, preserva quantidades e estrutura, faz ajuste fino de centavos e registra a memória da readequação na exportação.`,
    chips: ['Ir para Elaborar','Meu orçamento atual','Como exportar?','Ir para Relatório']
  },

  desconto_avancado: {
    q: ['desconto avançado','desconto avancado','desconto por grupo','desconto por categoria','desconto classe a','desconto por capitulo'],
    r: `**Desconto avançado por seleção**\n\nUse quando a proposta vencedora não puder receber o mesmo desconto em todos os itens.\n\n1. Abra **Elaborar Orçamento**\n2. No bloco **Readequar Proposta do Pregão**, use a área **Desconto avançado por seleção**\n3. Escolha o alvo: Categoria, Capítulo, Itens Classe A ou Todos\n4. Informe o filtro, quando aplicável\n5. Informe o percentual\n6. Clique em **Aplicar seleção**\n\nO TLPlanly altera apenas os itens selecionados, mantém histórico para desfazer e registra a memória do ajuste na exportação.`,
    chips: ['Ir para Elaborar','O que é Curva ABC?','Como exportar?']
  },

  custos_horarios: {
    q: ['custo horário','custo horario','equipamento por hora','mão de obra por hora','mao de obra por hora','convenção coletiva','convencao coletiva','salário mensal','salario mensal'],
    r: `**Custos Horários**\n\nUse este módulo para calcular custos próprios antes de montar uma CPU.\n\n**Equipamento:** informe aquisição, vida útil, fator de depreciação, operador, combustível/energia e manutenção. O sistema calcula o custo por hora e guarda a memória.\n\n**Mão de obra:** informe salário mensal, benefícios, encargos e horas produtivas. O sistema calcula o custo horário conforme a base usada pela empresa ou convenção coletiva.\n\nDepois clique em **Enviar CPU** para transformar esse custo em composição reutilizável.`,
    chips: ['Ir para Custos Horários','Ir para Composições','Como criar CPU?']
  },

  cotacoes: {
    q: ['banco de cotações','banco de cotacoes','cotação','cotacao','preços de mercado','precos de mercado','atualizar insumo por cotação','atualizar cpu por cotação'],
    r: `**Banco de Cotações**\n\nUse quando quiser atualizar insumos e CPUs com preços de fornecedores.\n\n1. Abra **Cotações**\n2. Cadastre manualmente ou importe Excel/CSV\n3. O sistema usa código e descrição para encontrar o insumo correspondente\n4. Escolha critério: menor preço, média, mediana ou menor preço com margem\n5. Clique em **Aplicar aos custos**\n\nA aplicação pode atualizar só a biblioteca de CPUs, só o orçamento ativo ou ambos.`,
    chips: ['Ir para Cotações','Ir para Composições','Ir para Elaborar']
  },

  frentes_servico: {
    q: ['frente de serviço','frentes de serviço','frente de servico','frentes de servico','controle por frente','obra por frente','local de execução','local de execucao'],
    r: `**Frentes de Serviço**\n\nUse para separar o orçamento por local, etapa, equipe ou frente física da obra.\n\n1. Abra **Frentes de Serviço**\n2. Cadastre as frentes ou clique em **Criar por capítulo**\n3. Vincule cada item do orçamento à frente correta\n4. Acompanhe valor planejado, realizado e pendências\n5. Exporte em Excel ou PDF\n\nEsse módulo ajuda no acompanhamento de obra, medição e controle por setor.`,
    chips: ['Ir para Frentes de Serviço','Ir para Planejamento','Ir para Medições']
  },

  // ── BDI ────────────────────────────────────────────────
  bdi_oque: {
    q: ['o que é bdi','bdi significa','definição bdi','conceito bdi','bdi é'],
    r: `**BDI — Benefícios e Despesas Indiretas** 📐\n\nÉ o percentual aplicado sobre o custo direto de uma obra para cobrir:\n\n• **AC** — Administração Central\n• **S** — Seguros e Garantias\n• **R** — Risco\n• **DF** — Despesas Financeiras\n• **L** — Lucro\n• **I** — Tributos (ISS + PIS + COFINS)\n\n**Fórmula (Decreto 7983/2013):**\nBDI = [(1+AC+S+R)(1+DF)(1+L) / (1-I) - 1] × 100\n\n**Preço de Venda = Custo Direto × (1 + BDI/100)**`,
    chips: ['Limite BDI TCU?','Como calcular BDI?','Ir para BDI']
  },

  bdi_limites: {
    q: ['limite bdi','tcu bdi','acórdão 2622','limite obras','bdi máximo','bdi obras civis'],
    r: `**Limites TCU — Acórdão 2622/2013** ⚖️\n\n| Tipo de Obra | Limite BDI |\n|---|---|\n| Obras Civis | **25%** |\n| Instalações Elétricas | **24%** |\n| Fornecimento de Materiais | **15%** |\n\n⚠️ Ultrapassar esses limites **não invalida** automaticamente a proposta, mas exige **justificativa técnica fundamentada** ao órgão fiscalizador (TCU, CGU, TCE).\n\nO TLPlanly calcula e sinaliza automaticamente se o BDI ultrapassa o limite do tipo de obra selecionado.`,
    chips: ['Como calcular BDI?','O que é BDI?','Ir para BDI']
  },

  bdi_como: {
    q: ['como calcular bdi','calcular bdi','configurar bdi','preencher bdi'],
    r: `**Como configurar o BDI no TLPlanly:** 🛠️\n\n1. Clique em **BDI / Encargos** no menu lateral\n2. Preencha os 6 componentes (AC, S, R, DF, L, I)\n3. Selecione o **Tipo de Obra** (civil, elétrica, material)\n4. O BDI é calculado automaticamente\n5. O sistema mostra se está **dentro ou acima** do limite TCU\n6. Clique em **"Aplicar ao Orçamento"** para usar\n\n💡 **Dica:** Use os presets por tipo de obra para valores médios de mercado conforme Acórdão TCU 2622/2013.`,
    chips: ['Ir para BDI','Limite BDI TCU?','O que é BDI?']
  },

  // ── SINAPI ─────────────────────────────────────────────
  sinapi_oque: {
    q: ['o que é sinapi','sinapi significa','o que é a tabela sinapi','para que serve sinapi'],
    r: `**SINAPI — Sistema Nacional de Pesquisa de Custos e Índices da Construção Civil** 📊\n\nPublicado mensalmente pela **Caixa Econômica Federal + IBGE**.\n\nContém preços de referência para:\n• **Insumos** (materiais, equipamentos, mão de obra)\n• **Composições** (serviços completos)\n\nOrganizado por **UF** (27 estados) e disponibilizado em formato desonerado e não desonerado.\n\n**Obrigatório** em obras financiadas com recursos federais (Lei 14.133/2021, Art. 23).\n\nO TLPlanly já carrega a base SINAPI automaticamente. Você pode atualizar em **Bases de Referência**.`,
    chips: ['Atualizar SINAPI?','Diferença SINAPI SICRO?','O que é SINAPI?']
  },

  sinapi_atualizar: {
    q: ['atualizar sinapi','nova tabela sinapi','baixar sinapi','sinapi 2026','sinapi atualizado'],
    r: `**Como atualizar a base SINAPI:** 🔄\n\n**Download:**\n1. Acesse [caixa.gov.br → SINAPI](https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi)\n2. Baixe o arquivo ZIP do mês desejado\n3. Extraia o XLSX da aba "ISD" (não desonerado) ou "ICD" (desonerado)\n\n**No TLPlanly:**\n1. Acesse **Bases de Referência** no menu\n2. Clique em **"Carregar XLSX/ZIP SINAPI"**\n3. Selecione o arquivo baixado\n4. O sistema detecta automaticamente a UF configurada\n\n💡 A base atual já tem **4.304 insumos de MG** (Abril/2026).`,
    chips: ['Ir para Bases','O que é SICRO?','O que é SINAPI?']
  },

  sinapi_sicro: {
    q: ['diferença sinapi sicro','sinapi vs sicro','quando usar sicro','o que é sicro'],
    r: `**SINAPI vs SICRO — Qual usar?** 🔀\n\n| | SINAPI | SICRO 3 |\n|---|---|---|\n| Órgão | Caixa/IBGE | DNIT |\n| Foco | Construção civil geral | Infraestrutura/Rodovias |\n| Obras | Edificações, saneamento | Rodovias, pontes, ferrovias |\n| Obrigatório | Obras federais civis | Obras DNIT/infraestrutura |\n\n**Regra prática:**\n• Escola, hospital, habitação → **SINAPI**\n• Estrada, ponte, ferrovia, porto → **SICRO 3**\n• Redes de água/esgoto → SINAPI (pode usar ORSE/SEINFRA no estado)\n\nO TLPlanly suporta ambos simultaneamente com fallback automático.`,
    chips: ['Como carregar SICRO 3?','O que é SINAPI?','Ir para Bases']
  },

  // ── CURVA ABC ──────────────────────────────────────────
  abc_oque: {
    q: ['o que é curva abc','curva abc significa','para que serve curva abc','abc obras','pareto'],
    r: `**Curva ABC — Análise de Pareto** 📈\n\nClassifica os itens do orçamento por **representatividade financeira**:\n\n🔴 **Classe A** — Até 80% do custo total\n→ Poucos itens, alto impacto. Exigem atenção máxima na negociação.\n\n🟡 **Classe B** — De 80% a 95%\n→ Itens intermediários. Monitorar.\n\n🟢 **Classe C** — De 95% a 100%\n→ Muitos itens, baixo impacto individual.\n\n**Por que usar?**\nFocar os esforços de negociação, auditoria e controle nos itens que realmente movem o custo da obra. TCU e CGU usam Curva ABC para priorizar fiscalização.`,
    chips: ['Ir para ABC','Ir para ABC','Como usar no orçamento?']
  },

  abc_como: {
    q: ['como gerar curva abc','gerar abc','fazer curva abc','criar abc'],
    r: `**Como gerar a Curva ABC no TLPlanly:** 📊\n\n1. Primeiro, **adicione itens** ao orçamento (aba Elaborar)\n2. Clique em **Curva ABC** no menu\n3. Ajuste as faixas se necessário (padrão: A=80%, B=95%)\n4. Clique em **"Gerar Curva ABC"**\n5. O sistema ordena por valor decrescente e classifica automaticamente\n\n**Resultados:**\n• Tabela ordenada com % item e % acumulado\n• Gráfico de pizza por classe\n• Gráfico de linha acumulada\n• Exportável via aba Exportar`,
    chips: ['O que é Curva ABC?','Ir para ABC','Como exportar?']
  },

  // ── ENCARGOS ──────────────────────────────────────────
  encargos: {
    q: ['encargos sociais','desonerado','não desonerado','cprb','inss obra','regime encargos'],
    r: `**Encargos Sociais em Obras** 👷\n\n**Não Desonerado (~127,5%)** — Padrão\nEmpresa recolhe INSS patronal (20%) sobre folha + demais encargos.\nUso: a maioria das obras.\n\n**Desonerado (~96,8%)** — Lei 12.546/2011\nSubstitui INSS patronal pela CPRB (2% sobre receita bruta).\nUso: construtoras optantes pelo regime desonerado.\n\n⚠️ **Atenção:** Não misture regimes no mesmo orçamento. Se a empresa é desonerada, use a tabela desonerada do SINAPI (aba ICD) e o percentual correspondente.\n\nNo TLPlanly, selecione o regime na aba **BDI/Encargos → Encargos Sociais**.`,
    chips: ['Ir para BDI/Encargos','O que é BDI?','Como calcular CPU?']
  },

  // ── COMPOSIÇÕES CPU ────────────────────────────────────
  cpu_oque: {
    q: ['o que é cpu','composição unitária','composição analítica','cpu obras','o que é composição'],
    r: `**CPU — Composição de Preço Unitário** 🔧\n\nÉ a "receita" de como executar 1 unidade de um serviço, detalhando:\n\n• **Materiais (M)** — o que é consumido (cimento, areia, tijolos...)\n• **Mão de Obra (S)** — quem executa (pedreiro, servente...)\n• **Equipamentos (E)** — ferramentas e máquinas\n\nCada insumo tem um **coeficiente** (quanto é usado por unidade do serviço).\n\n**Exemplo:**\nAlvenaria 1m² = 0,012 m³ cimento + 0,018 m³ areia + 13 tijolos + 0,5h pedreiro + 0,25h servente\n\nO preço unitário final = Σ(coeficiente × preço do insumo) + encargos sociais sobre MO.`,
    chips: ['Como criar uma CPU?','Ir para Composições','O que é SINAPI?']
  },

  cpu_como: {
    q: ['como criar composição','criar cpu','nova composição','montar composição','como usar cpu'],
    r: `**Como criar uma CPU no TLPlanly:** ⚙️\n\n1. Clique em **Composições (CPU)** no menu\n2. Defina código, descrição, unidade e tipo\n3. No passo **Insumos**, use busca na base, cadastre insumo manual ou importe Excel\n4. Informe coeficientes, preço unitário, tipo e fonte/fornecedor\n5. Escolha o regime de encargos e veja o resultado detalhado\n6. Salve na biblioteca ou envie direto ao orçamento\n\n💡 Você pode montar a composição do zero, com base própria, cotações, histórico interno ou SINAPI/TCPO.`,
    chips: ['O que é CPU?','Ir para Composições','O que são coeficientes?']
  },

  coeficientes: {
    q: ['coeficiente','coeficiente insumo','índice produtividade','onde encontro coeficientes'],
    r: `**Coeficientes de Consumo** 📋\n\nIndicam a quantidade de cada insumo necessária para produzir **1 unidade** do serviço.\n\n**Fontes confiáveis:**\n• **SINAPI Analítico** (Caixa) — composições com coeficientes oficiais\n• **TCPO** (PINI) — banco de composições mais completo do Brasil\n• **Manuais técnicos** (NBR, ABNT)\n• **Produtividade real da empresa** (baseada em histórico)\n\n**Exemplos práticos:**\n• Concreto usinado: coef. 1,05 m³ por m³ estrutural (quebra 5%)\n• Pedreiro: 0,55 Hh/m² de revestimento cerâmico\n• Armação: 50 kg de aço por m³ de laje\n\nNo TLPlanly, você edita os coeficientes diretamente na tabela de insumos da CPU.`,
    chips: ['Como criar CPU?','Ir para Composições','O que é SINAPI analítico?']
  },

  // ── IMPORTAÇÃO ────────────────────────────────────────
  importar: {
    q: ['importar edital','importar planilha','importar pdf','abrir edital','ler pdf','importar excel'],
    r: `**Como importar uma planilha ou PDF para o orçamento:** 📄\n\n1. Acesse **Elaborar Orçamento**\n2. Clique em **Importar planilha**\n3. Envie Excel, CSV, PDF digital, PDF escaneado ou imagem\n4. O TLPlanly extrai os itens, aplica OCR quando necessário e abre a revisão\n5. Confirme para **Elaboração**\n6. Ajuste descrição, unidade, quantidade, preço, capítulo e categoria direto na planilha editável\n\nTambém é possível usar o módulo **Importar Planilha/PDF** para processar lotes maiores.`,
    chips: ['Ir para Elaborar','Ir para Importar','OCR PDF escaneado?']
  },

  analisador_docs: {
    q: ['analisar documentos','projeto básico','projeto basico','termo de referência','termo de referencia','etp','memorial descritivo','gerar orçamento pelo projeto','gerar orcamento pelo projeto','estimativa por documentos'],
    r: `**Analisador de Documentos da Obra**\n\nUse este módulo quando você ainda não tem uma planilha pronta. Anexe edital, TR, ETP, projeto básico, memorial e projetos da obra. O TLPlanly vai:\n\n• Classificar cada documento\n• Extrair escopo e especificações\n• Identificar serviços prováveis\n• Sugerir composição preliminar\n• Mapear referências SINAPI quando possível\n• Mostrar confiança e pendências por item\n• Enviar a pré-planilha para **Elaborar Orçamento**\n\nA saída é uma estimativa revisável, com memória técnica. O responsável técnico ainda valida quantidades e composições.`,
    chips: ['Ir para Analisar Documentos','Ir para Elaborar','Ir para Importar']
  },

  central_documentos: {
    q: ['central de documentos','como usar central de documentos','documentos da obra','anexar documentos','revisões de extração','revisoes de extracao','dossiê técnico','dossie tecnico'],
    r: `**Central de Documentos da Obra**\n\nUse esta tela para guardar edital, TR, ETP, projeto básico, memorial, planilhas, pranchas, fotos e ART/RRT.\n\n**Passo a passo:**\n1. Abra **Central de Documentos**\n2. Clique em **Selecionar lote**\n3. Anexe todos os arquivos relacionados à obra\n4. Clique em **Analisar agora**\n5. Revise os documentos classificados e as extrações pendentes\n6. Só depois envie itens aprovados para **Elaborar Orçamento**\n\nRegra: documento anexado não altera o orçamento automaticamente.`,
    chips: ['Ir para Central de Documentos','Ir para Analisar Documentos','Como importar edital?','Abrir Manual']
  },

  ocr: {
    q: ['ocr','pdf escaneado','imagem pdf','digitalizado','reconhecimento texto'],
    r: `**OCR — Reconhecimento de Texto em PDFs Escaneados** 🔍\n\nO TLPlanly usa **Tesseract.js** no navegador. Ao importar pelo **Elaborar Orçamento** ou pelo módulo **Importar Planilha/PDF**, o OCR entra automaticamente quando o PDF não tem texto aproveitável ou quando você envia imagem digitalizada.\n\n✅ **Vantagens:**\n• Aceita lote com PDF + anexos + imagens\n• Mantém a origem de cada item extraído\n• Gera **Memória em Excel e PDF** para conferência\n• Envia os itens para ajuste direto na planilha editável\n\n⚠️ PDFs de baixa qualidade reduzem a precisão. Resolução mínima recomendada: 200 DPI.`,
    chips: ['Ir para Elaborar','Ir para Importar','Como importar planilha?']
  },

  // ── EXPORTAÇÃO ────────────────────────────────────────
  exportar: {
    q: ['exportar','gerar planilha','relatório','gerar excel','planilha excel','pdf edital','imprimir'],
    r: `**Como exportar a planilha orçamentária:** 📤\n\n1. Acesse **Exportar / Relatório** no menu\n2. Preencha os dados da obra (nome, órgão, RT, CREA, ART/RRT)\n3. Escolha a aba desejada para pré-visualizar\n4. Clique em **Excel (.xlsx) Profissional** ou **PDF Profissional**\n\nO Excel leva: Planilha Orçamentária, BDI, Curva ABC, Encargos, Planejamento, Medições, Quantitativos, Anexos, Custos Horários, Cotações e Frentes de Serviço. O PDF gera uma versão pronta para salvar, imprimir ou anexar ao processo.\n\n✅ O formato segue padrão exigido pelo **TCU/CGU/editais públicos** e também serve para acompanhamento de obra.`,
    chips: ['Ir para Relatório','Modelo de relatório','Como configurar moeda']
  },

  relatorio_moeda: {
    q: ['moeda','cotação','cotacao','dólar','dolar','euro','modelo relatório','modelo relatorio','duplicar item','mover item','zerar quantidade'],
    r: `**Ajustes avançados do orçamento**\n\nNo TLPlanly você pode:\n\n• Alterar a **moeda de exibição** em Configurações, mantendo os custos internos em reais\n• Informar a **cotação** usada na conversão\n• Escolher o **modelo de relatório**: órgão público, construtora, medição ou auditoria\n• No orçamento, **duplicar itens**, mover a ordem e zerar quantidades sem apagar a estrutura\n\nFluxo recomendado: configure moeda/modelo → elabore ou importe itens → ajuste ordem/quantidades → exporte o Excel profissional.`,
    chips: ['Ir para Configurações','Ir para Relatório','Ir para Elaborar']
  },

  gestao_obra: {
    q: ['planejamento','medição','medicao','gantt','curva s','quantitativos','anexos','backup','acompanhamento'],
    r: `**Gestão da Obra no TLPlanly**\n\nAgora o orçamento não fica isolado. Você pode:\n\n• Gerar **Planejamento** a partir dos itens do orçamento\n• Registrar **Medições** por período\n• Criar **Quantitativos vinculados** com fórmulas\n• Usar a **Central de Documentos** com lote, OCR, classificação e revisão\n• Criar **backups/pontos de restauração**\n\nFluxo recomendado: documentos → orçamento → quantitativos → planejamento → medições → relatório completo.`,
    chips: ['Ir para Planejamento','Ir para Medições','Ir para Quantitativos','Ir para Anexos','Ir para Backups']
  },

  art: {
    q: ['art','rrt','o que é art','anotação responsabilidade técnica','registro crea','cau'],
    r: `**ART / RRT — Anotação de Responsabilidade Técnica** 📜\n\n**ART** (Anotação de Responsabilidade Técnica)\n→ Emitida por **Engenheiros** no CREA (Conselho Regional de Engenharia)\n→ Obrigatória em obras e serviços de engenharia\n\n**RRT** (Registro de Responsabilidade Técnica)\n→ Emitida por **Arquitetos** no CAU (Conselho de Arquitetura e Urbanismo)\n\n**Por que é obrigatória em orçamentos:**\nA Lei 14.133/2021 (Nova Lei de Licitações) exige que projetos e orçamentos apresentados em licitações públicas tenham ART/RRT do responsável técnico.\n\nNo TLPlanly, o campo ART aparece no cabeçalho da planilha exportada.`,
    chips: ['Ir para Relatório','O que é BDI?','Legislação de obras públicas']
  },

  legislacao: {
    q: ['legislação','lei licitações','lei 14133','lei 8666','decreto 7983','norma obras','regulamentação'],
    r: `**Legislação Principal para Orçamentos de Obras Públicas** ⚖️\n\n📌 **Lei 14.133/2021** (Nova Lei de Licitações)\n→ Substitui a Lei 8.666/93. Regula contratações públicas federais.\n→ Art. 23: obriga uso de SINAPI/SICRO como referência de preços.\n\n📌 **Decreto nº 7.983/2013**\n→ Define BDI e encargos sociais para obras públicas federais.\n→ Estabelece a fórmula oficial do BDI.\n\n📌 **TCU Acórdão 2622/2013**\n→ Define limites percentuais de BDI por tipo de obra.\n→ Referência obrigatória em auditorias do TCU/CGU.\n\n📌 **Lei 12.546/2011**\n→ Institui o regime desonerado (CPRB) para construtoras.\n\nO TLPlanly aplica automaticamente todas essas normas nos cálculos.`,
    chips: ['O que é BDI?','Limite BDI TCU?','O que é SINAPI?']
  },

  // ── AUDITORIA ─────────────────────────────────────────
  auditoria: {
    q: ['auditoria','analisar preços','conferir preços','verificar conformidade','tcu gcu fiscalização','análise sinapi'],
    r: `**Módulo de Auditoria SINAPI** 🔎\n\nPara gestores públicos, fiscais e auditores verificarem se os preços praticados estão dentro dos parâmetros SINAPI.\n\n**Como usar:**\n1. Ative o **Modo Auditor** (toggle no topo)\n2. Importe ou monte a planilha do fornecedor\n3. Vá em **Análise SINAPI** no menu\n4. Clique **"Auditar"**\n5. O sistema compara item a item:\n   ✓ Conforme (dentro da tolerância)\n   ✗ Acima do limite\n   — Não encontrado na base\n\n**Tolerância padrão:** 5% acima da referência SINAPI (ajustável em Configurações).\n\nItens acima do limite exigem justificativa técnica ou reajuste de proposta.`,
    chips: ['Ir para Auditoria','Modo Auditor?','Tolerância de desvio']
  },

  // ── CONTEXTUAIS ───────────────────────────────────────
  duvida_geral: {
    q: ['não entendi','como funciona','me explica','o que fazer','próximo passo','o que é isso'],
    r: null, // handled dynamically
  },

  navegar: {
    q: ['ir para','abrir','navegar','acessar','onde fica','onde está','encontrar','menu'],
    r: null, // handled dynamically
  },
};

// ── CONTEXTO DA VIEW ─────────────────────────────────────
const VIEW_CONTEXT = {
  dashboard:    { nome: 'Dashboard', dica: 'Aqui você vê o resumo do orçamento ativo — totais, Curva ABC e itens críticos.' },
  elaborar:     { nome: 'Elaborar Orçamento', dica: 'Crie itens próprios, pesquise SINAPI ou importe Excel/PDF. Depois ajuste descrição, unidade, quantidade, preço, capítulo e categoria direto na planilha.' },
  custos:       { nome: 'Custos Horários', dica: 'Calcule custos horários de equipamentos e mão de obra, salve a memória e envie como CPU reutilizável.' },
  cotacoes:     { nome: 'Cotações', dica: 'Cadastre ou importe preços de fornecedores e aplique aos insumos da biblioteca de CPUs e do orçamento ativo.' },
  bdi:          { nome: 'BDI & Encargos', dica: 'Configure os componentes do BDI conforme o Decreto 7983/2013 e escolha o regime de encargos.' },
  curvaABC:     { nome: 'Curva ABC', dica: 'Gere a análise de Pareto do orçamento para identificar os itens de maior impacto financeiro.' },
  memoria:      { nome: 'Memória de Cálculo', dica: 'Veja o detalhamento de cada item com encargos sociais, BDI e referência SINAPI.' },
  planejamento: { nome: 'Planejamento', dica: 'Gere tarefas do orçamento, ajuste datas, dependências, Gantt e Curva S.' },
  frentes:      { nome: 'Frentes de Serviço', dica: 'Organize os itens do orçamento por local de execução, etapa ou equipe e acompanhe planejado x realizado.' },
  medicoes:     { nome: 'Medições', dica: 'Registre quantidades executadas por período e acompanhe saldo, avanço e excedentes.' },
  quantitativos:{ nome: 'Quantitativos', dica: 'Crie fórmulas auxiliares vinculadas aos serviços e aplique o resultado à quantidade contratada.' },
  analisador:   { nome: 'Analisador de Documentos', dica: 'Anexe edital, TR, ETP, projeto básico, memorial e projetos para gerar uma pré-planilha revisável com serviços, confiança e pendências.' },
  documentos:   { nome: 'Central de Documentos', dica: 'Anexe lotes de documentos da obra, rode OCR/classificação, reabra revisões e mantenha rastreabilidade até o orçamento.' },
  backups:      { nome: 'Backups', dica: 'Crie pontos de restauração locais para orçamento, planejamento, medições e anexos.' },
  auditoria:    { nome: 'Análise SINAPI', dica: 'Compare os preços do orçamento com a tabela SINAPI e identifique desvios acima da tolerância.' },
  conformidade: { nome: 'Conformidade BDI', dica: 'Verifique se o BDI calculado está dentro dos limites do TCU Acórdão 2622/2013.' },
  relatorio:    { nome: 'Exportar / Relatório', dica: 'Preencha os dados da obra, escolha o modelo de relatório e exporte Excel/PDF com orçamento, BDI, ABC, planejamento, medições e anexos.' },
  bases:        { nome: 'Bases de Referência', dica: 'Carregue e gerencie SINAPI, SICRO 3 e bases estaduais. Use o OCR para PDFs escaneados.' },
  importar:     { nome: 'Importar Planilha/PDF', dica: 'Importe Excel, CSV, PDF digital, PDF escaneado ou imagens e faça o match automático com a base SINAPI.' },
  cpu:          { nome: 'Composições (CPU)', dica: 'Crie composições analíticas próprias com insumos de bases oficiais, cadastro manual ou Excel.' },
  config:       { nome: 'Configurações', dica: 'Configure UF, tolerância, encargos, tipo de obra, moeda de exibição, cotação e modelo padrão de relatório.' },
};

// ── ENGINE DO COPILOT ─────────────────────────────────────
let COP = {
  open: false,
  messages: [],
  firstOpen: true,
  currentView: 'dashboard',
  pendingAction: null,
};

function copilotNormText(txt) {
  return (txt || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function copilotActionForView(view) {
  const ctx = VIEW_CONTEXT[view] || { nome: view };
  return { type: 'navigate', view, label: ctx.nome };
}

function copilotDetectPendingAction(txt) {
  const norm = copilotNormText(txt);
  const asksToContinue = /\b(quer|pronto|posso|devo|deseja|avise|confirma|confirmar|agora|seguir|continuar|vamos)\b/.test(norm);
  if (/(abrir manual|manual|guia do usuario|guia do sistema)/.test(norm)) return { type: 'manual' };
  if (!asksToContinue) return null;

  if (/(desconto pregao|desconto do pregao|planilha ajustada|readequar proposta|valor vencedor|proposta vencedora)/.test(norm)) return copilotActionForView('elaborar');
  if (/(custo horario|custos horarios|equipamento por hora|mao de obra por hora|convencao coletiva)/.test(norm)) return copilotActionForView('custos');
  if (/(banco de cotacoes|cotacoes|precos de mercado|preco de fornecedor|fornecedor)/.test(norm)) return copilotActionForView('cotacoes');
  if (/(frente de servico|frentes de servico|controle por frente|local de execucao)/.test(norm)) return copilotActionForView('frentes');
  if (/(moeda|cotacao|dolar|euro|modelo padrao)/.test(norm)) return copilotActionForView('config');
  if (/(analisar documentos|projeto basico|termo de referencia|etp|memorial|estimativa por documento|gerar orcamento pelo projeto|documentos da obra)/.test(norm)) return copilotActionForView('analisador');
  if (/(relatorio|exportar|pdf final|gerar pdf|baixar)/.test(norm)) return copilotActionForView('relatorio');
  if (/(upload|arquivo|pdf|excel|planilha|edital|import)/.test(norm)) return copilotActionForView('importar');
  if (/(bdi|encargo)/.test(norm)) return copilotActionForView('bdi');
  if (/(curva abc|abc|pareto)/.test(norm)) return copilotActionForView('curvaABC');
  if (/(planejamento|gantt|curva s|cronograma)/.test(norm)) return copilotActionForView('planejamento');
  if (/(medicao|medicoes|medir|executado|acompanhamento)/.test(norm)) return copilotActionForView('medicoes');
  if (/(quantitativo|quantitativos|formula|memoria quantitativa)/.test(norm)) return copilotActionForView('quantitativos');
  if (/(central de documentos|anexo|anexos|documento|documentos|especificacao|foto|dossie|dossiê)/.test(norm)) return copilotActionForView('documentos');
  if (/(backup|restaurar|restauracao|versao)/.test(norm)) return copilotActionForView('backups');
  if (/(orcamento|elaborar|insumo)/.test(norm)) return copilotActionForView('elaborar');
  if (/(auditoria|auditar|conformidade|sinapi)/.test(norm)) return copilotActionForView('auditoria');
  if (/(cpu|composicao)/.test(norm)) return copilotActionForView('cpu');
  if (/(modulo|passo|comecar|iniciar|guie|guiar)/.test(norm)) return { type: 'module-menu' };
  return null;
}

function copilotSetPendingFromBot(txt) {
  const action = copilotDetectPendingAction(txt);
  if (action) COP.pendingAction = action;
}

function copilotExecuteAction(action) {
  if (!action) return false;
  COP.pendingAction = null;

  if (action.type === 'module-menu') {
    copilotBotMsg('Perfeito. Escolha por onde vamos começar:');
    copilotSetChips(['Ir para Analisar Documentos','Ir para Elaborar','Ir para Importar','Ir para BDI','Ir para Relatório']);
    return true;
  }

  if (action.type === 'manual') {
    copilotBotMsg('Abrindo o **Manual de Operação do TLPlanly** em uma nova aba. No servidor/Render, ele também fica disponível em **/manual**.');
    setTimeout(() => window.open('/docs/manual_usuario_tlplanly.html', '_blank'), 300);
    copilotSetChips(['Como importar edital?','Central de Documentos','Como configurar BDI?','Como auditar?']);
    return true;
  }

  if (action.type === 'navigate') {
    const ctx = VIEW_CONTEXT[action.view] || { nome: action.label || action.view };
    copilotBotMsg(`Perfeito. Abrindo **${ctx.nome}** agora...`);
    setTimeout(() => showView(action.view), 500);
    copilotSetChips(['O que posso fazer aqui?','Meu orçamento atual','Ir para Dashboard']);
    return true;
  }

  return false;
}

function copilotHandleShortReply(norm) {
  const yes = /^(sim|s|ok|okay|pode|pode sim|vamos|bora|claro|confirmo|isso|quero|quero sim|continuar|prosseguir|seguir|manda|vai)$/.test(norm);
  const no = /^(nao|n|não|cancelar|cancela|depois|agora nao|agora não|voltar|deixa)$/.test(norm);

  if (yes) {
    if (COP.pendingAction && copilotExecuteAction(COP.pendingAction)) return true;
    copilotBotMsg('Claro. O que você quer fazer agora?');
    copilotSetChips(['Ir para Elaborar','Ir para Importar','Ir para BDI','Ir para ABC','Meu orçamento atual']);
    return true;
  }

  if (no) {
    COP.pendingAction = null;
    copilotBotMsg('Sem problema. O que você prefere fazer agora?');
    copilotSetChips(['O que é BDI?','Como importar edital?','Ir para Dashboard','Meu orçamento atual']);
    return true;
  }

  return false;
}

function copilotToggle() {
  COP.open = !COP.open;
  const panel = document.getElementById('copilot-panel');
  panel.classList.toggle('open', COP.open);
  if (COP.open && COP.firstOpen) {
    COP.firstOpen = false;
    document.getElementById('cop-badge').style.display = 'none';
    setTimeout(() => {
      copilotBotMsg('Olá! 👋 Sou o **Copilot do TLPlanly**.\n\nEstou aqui para te ajudar com qualquer dúvida sobre o sistema, cálculos de BDI, SINAPI, legislação de obras públicas e muito mais.\n\n**O que você quer saber?**');
      copilotSetChips(['Sim me guie','O que é BDI?','Como importar edital?','O que é SINAPI?','O que é Curva ABC?','Legislação obras']);
    }, 200);
  }
}

function copilotBotMsg(txt) {
  const msgs = document.getElementById('cop-messages');
  const typing = document.createElement('div');
  typing.className = 'cop-msg bot';
  typing.innerHTML = `<div class="cop-msg-avatar">🤖</div>
    <div class="cop-msg-bubble"><div class="cop-typing"><div class="cop-dot"></div><div class="cop-dot"></div><div class="cop-dot"></div></div></div>`;
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const el = document.createElement('div');
    el.className = 'cop-msg bot';
    el.innerHTML = `<div class="cop-msg-avatar">🤖</div>
      <div class="cop-msg-bubble">${copilotMarkdown(txt)}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    COP.messages.push({ role: 'bot', text: txt });
    copilotSetPendingFromBot(txt);
  }, 600 + Math.min(txt.length * 4, 800));
}

function copilotMarkdown(txt) {
  return txt
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/• /g, '&bull; ')
    .replace(/→ /g, '&rarr; ')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--gold)">$1</a>');
}

function copilotUserMsg(txt) {
  const msgs = document.getElementById('cop-messages');
  const el = document.createElement('div');
  el.className = 'cop-msg user';
  el.innerHTML = `<div class="cop-msg-avatar">👤</div>
    <div class="cop-msg-bubble">${txt}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  COP.messages.push({ role: 'user', text: txt });
}

function copilotSetChips(chips) {
  const el = document.getElementById('cop-chips');
  el.innerHTML = chips.map(c =>
    `<div class="cop-chip" onclick="copilotChip(this.textContent)">${c}</div>`
  ).join('');
}

function copilotChip(txt) {
  document.getElementById('cop-input').value = txt;
  copilotEnviar();
}

function copilotEnviar() {
  const inp = document.getElementById('cop-input');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  copilotUserMsg(txt);
  document.getElementById('cop-chips').innerHTML = '';
  setTimeout(() => copilotResponder(txt), 100);
}


// ─── INTEGRAÇÃO ANTHROPIC API (streaming SSE) ──────────────
let COP_API_URL = '/api/copilot';
let COP_API_DISPONIVEL = null; // null=não testado, true/false

function copilotSetModoLocal() {
  COP_API_DISPONIVEL = false;
  const lbl = document.getElementById('cop-mode-label');
  if (lbl) lbl.innerHTML = '🟡 Modo local — base de conhecimento';
}

function copilotSetModoOnline(data = {}) {
  const lbl = document.getElementById('cop-mode-label');
  const primary = data.providers?.primary === 'deepseek' ? 'DeepSeek' : 'Claude';
  const fallback = data.providers?.fallback === 'deepseek' ? ' + DeepSeek backup' : '';
  if (lbl) lbl.innerHTML = `🟢 ${primary}${fallback} — IA online`;
}

async function copilotTestarServidor() {
  if (COP_API_DISPONIVEL !== null) return COP_API_DISPONIVEL;
  try {
    const r = await fetch('/health', { signal: AbortSignal.timeout(2000) });
    const data = await r.json();
    COP_API_DISPONIVEL = r.ok && (data.anthropic === true || data.deepseek === true);
    if (COP_API_DISPONIVEL) {
      console.log('[Copilot] IA online disponível ✅');
      copilotSetModoOnline(data);
    } else {
      console.log('[Copilot] Servidor sem API key — usando base local');
      copilotSetModoLocal();
    }
  } catch {
    copilotSetModoLocal();
    console.log('[Copilot] Servidor offline — usando base local');
  }
  return COP_API_DISPONIVEL;
}

async function copilotTentarAPI(userMsg) {
  const disponivel = await copilotTestarServidor();
  if (!disponivel) return false;

  // Monta histórico de mensagens (últimas 8 trocas)
  const history = COP.messages.slice(-16).map(m => ({
    role: m.role === 'bot' ? 'assistant' : 'user',
    content: m.text
  }));
  history.push({ role: 'user', content: userMsg });

  // Contexto dinâmico do sistema
  const context = {
    view: COP.currentView || 'dashboard',
    totalItens: STATE.orcamento?.length ?? 0,
    totalOrcamento: STATE.orcamento?.reduce((s,i) => s + itemValor(i), 0) ?? 0,
    bdi: hasBDI() ? STATE.bdi : null,
    sinapiCount: STATE.sinapiBase?.length ?? 0,
  };

  // Cria bolha de resposta com streaming
  const msgs = document.getElementById('cop-messages');
  const el = document.createElement('div');
  el.className = 'cop-msg bot';
  el.innerHTML = `<div class="cop-msg-avatar">🤖</div>
    <div class="cop-msg-bubble" id="cop-stream-bubble">
      <div class="cop-typing"><div class="cop-dot"></div><div class="cop-dot"></div><div class="cop-dot"></div></div>
    </div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;

  let fullText = '';
  const bubble = document.getElementById('cop-stream-bubble');

  try {
    const resp = await fetch(COP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, context }),
    });

    if (!resp.ok) {
      copilotSetModoLocal();
      el.remove();
      return false;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try {
          const chunk = JSON.parse(raw);
          if (chunk.meta) {
            if (chunk.meta.provider === 'deepseek') {
              const lbl = document.getElementById('cop-mode-label');
              if (lbl) lbl.innerHTML = chunk.meta.fallbackFrom
                ? '🟢 DeepSeek backup — IA online'
                : '🟢 DeepSeek — IA online';
            }
            continue;
          }
          if (chunk.error) {
            copilotSetModoLocal();
            el.remove();
            return false;
          }
          if (chunk.text) {
            fullText += chunk.text;
            bubble.innerHTML = copilotMarkdown(fullText) + '<span style="opacity:.4;animation:cop-bounce .8s infinite">▌</span>';
            msgs.scrollTop = msgs.scrollHeight;
          }
        } catch {}
      }
    }

    // Finaliza — remove cursor
    if (!fullText.trim()) {
      copilotSetModoLocal();
      el.remove();
      return false;
    }
    bubble.innerHTML = copilotMarkdown(fullText);
    COP.messages.push({ role: 'bot', text: fullText });
    copilotSetPendingFromBot(fullText);

    // Chips contextuais pós-resposta
    copilotSetChips(['Ir para Elaborar','Ir para BDI','Ir para ABC','Meu orçamento atual']);
    return true;

  } catch(err) {
    el.remove();
    copilotSetModoLocal(); // falhou, próxima tentativa usa KB local
    return false;
  }
}

// Testa servidor ao carregar a página
window.addEventListener('load', () => setTimeout(copilotTestarServidor, 3000));

async function copilotResponder(txt) {
  // Normaliza o texto: remove acentos, pontuação, minúsculas
  const norm = copilotNormText(txt);

  if (copilotHandleShortReply(norm)) return;

  const localFirst = /^(ir|abrir|acessar)\b/.test(norm)
    || /^(meu orcamento atual|o que posso fazer aqui|sim me guie)$/.test(norm)
    || /^(manual|abrir manual|guia|como operar|o que e bdi|como importar|como exportar|como calcular bdi|o que e sinapi|o que e curva abc|limite bdi|desconto pregao|desconto avancado|planilha ajustada|readequar proposta|custo horario|custos horarios|banco de cotacoes|frente de servico)/.test(norm);

  // Comandos de navegação e chips previsíveis são locais para não prender o usuário em chamadas externas.
  if (!localFirst) {
    const usouAPI = await copilotTentarAPI(txt);
    if (usouAPI) return;
  }

  // ══ MAPA DE TÓPICOS ═══════════════════════════════════════
  // Cada entrada: array de palavras/frases que disparam a resposta
  // Cobre chips gerados pelo próprio sistema + variações naturais
  const TOPICS = [
    { keys:['manual','manual de instrucoes','manual de operacao','guia do usuario','guia do sistema',
            'treinamento','apresentacao do sistema','como operar o tlplanly','como operar o sistema'],
      entry:'manual' },
    { keys:['desconto pregao','desconto do pregao','planilha ajustada','readequar proposta',
            'valor vencedor','proposta vencedora','aplicar desconto','lance vencedor',
            'pregoeiro pediu planilha','duas horas planilha','ajustar planilha pregão',
            'ajustar planilha pregao','reduzir proposta','desconto linear'],
      entry:'desconto_pregao' },
    { keys:['desconto avancado','desconto avançado','desconto por grupo','desconto por categoria',
            'desconto por capitulo','desconto por capítulo','desconto classe a','desconto seletivo'],
      entry:'desconto_avancado' },
    { keys:['custo horario','custos horarios','custo horário','custos horários','equipamento por hora',
            'mao de obra por hora','mão de obra por hora','convencao coletiva','convenção coletiva',
            'salario mensal','salário mensal','calcular hora equipamento'],
      entry:'custos_horarios' },
    { keys:['banco de cotacoes','banco de cotações','cotacoes de fornecedor','cotações de fornecedor',
            'precos de mercado','preços de mercado','atualizar cpu por cotacao','atualizar cpu por cotação',
            'atualizar insumo por cotacao','atualizar insumo por cotação'],
      entry:'cotacoes' },
    { keys:['frente de servico','frente de serviço','frentes de servico','frentes de serviço',
            'controle por frente','local de execucao','local de execução','obra por frente'],
      entry:'frentes_servico' },
    // Onboarding / tutorial
    { keys:['sim me guie','como comecar','comecar','iniciar','tutorial','por onde comecar','primeiro passo',
            'como usar o sistema','me guie','ajuda','help','nao sei','nao entendo','como funciona',
            'guia','primeiros passos','introducao','inicio','bem vindo'], entry:'onboarding' },
    // BDI — o que é
    { keys:['o que e bdi','bdi e','explicar bdi','explica bdi','bdi significa','conceito bdi','definicao bdi',
            'beneficios despesas','o que significa bdi','me explica bdi','entender bdi'], entry:'bdi_oque' },
    // BDI — limites TCU
    { keys:['limite bdi','tcu bdi','acordao 2622','maximo bdi','bdi maximo','limite tcu','bdi obras civis',
            'bdi acima','bdi excede','ultrapassar limite','bdi percentual maximo','limite percentual'],
      entry:'bdi_limites' },
    // BDI — como calcular/configurar
    { keys:['como calcular bdi','calcular bdi','configurar bdi','preencher bdi','aplicar bdi',
            'formula bdi','componentes bdi','ac s r df','administracao central','seguros garantias',
            'despesas financeiras','lucro bdi','tributos bdi','como preencher','bdi correto'],
      entry:'bdi_como' },
    // SINAPI — o que é / explicar
    { keys:['explicar sinapi','explica sinapi','o que e sinapi','sinapi e','o que sinapi','usar sinapi',
            'como usar sinapi','entender sinapi','sinapi significa','tabela sinapi','base sinapi',
            'sistema nacional pesquisa','caixa ibge','insumos sinapi','preco referencia','preco sinapi',
            'referencia sinapi','sinapi caixa','pesquisa custos'],
      entry:'sinapi_oque' },
    // SINAPI — atualizar/baixar
    { keys:['atualizar sinapi','baixar sinapi','nova tabela sinapi','sinapi 2026','download sinapi',
            'atualizar base','nova versao sinapi','sinapi novo','carregar sinapi','sinapi mensal',
            'sinapi abril','sinapi mes','importar sinapi','arquivo sinapi xlsx'],
      entry:'sinapi_atualizar' },
    // SICRO
    { keys:['sicro','dnit','diferenca sinapi sicro','quando usar sicro','obras rodoviarias',
            'infraestrutura transporte','rodovia','ponte','ferrovia','hidrovia','dnit obras'],
      entry:'sinapi_sicro' },
    // Curva ABC — o que é
    { keys:['o que e curva abc','curva abc e','explicar abc','explica abc','pareto','classe a b c',
            'representatividade','80 95 100','analise abc','classificacao abc','itens criticos',
            'o que e abc','curva abc significa'],
      entry:'abc_oque' },
    // Curva ABC — como gerar
    { keys:['como gerar abc','gerar curva abc','fazer abc','criar abc','gerar abc',
            'montar curva abc','calcular abc','quero abc','ver abc','abrir abc'],
      entry:'abc_como' },
    // Encargos sociais
    { keys:['encargo','desonerado','nao desonerado','cprb','inss obra','regime encargo',
            'encargo social','encargos trabalhistas','fgts','sat rat','lei 12546',
            'regime tributario obra','previdencia obra','contribuicao patronal'],
      entry:'encargos' },
    // CPU — o que é
    { keys:['o que e cpu','cpu e','composicao e','o que e composicao','composicao unitaria',
            'composicao analitica','preco unitario','composicao de preco','o que e composicao',
            'o que significa cpu','composicao servico'],
      entry:'cpu_oque' },
    // CPU — como criar
    { keys:['como criar composicao','criar cpu','nova composicao','montar composicao',
            'criar composicao','adicionar composicao','composicao propria','minha composicao',
            'fazer composicao','elaborar composicao'],
      entry:'cpu_como' },
    // Coeficientes
    { keys:['coeficiente','produtividade','indices tcpo','onde encontro coeficientes',
            'coeficiente consumo','indice producao','quanto de material','consumo por unidade'],
      entry:'coeficientes' },
    // Analisador de documentos
    { keys:['central de documentos','como usar central de documentos','anexar documentos','revisoes de extracao',
            'revisao de extracao','dossie tecnico','documentos classificados','lote de documentos'],
      entry:'central_documentos' },
    // Analisador de documentos
    { keys:['analisar documentos','documentos da obra','projeto basico','termo de referencia',
            'estudo tecnico preliminar','etp','memorial descritivo','projetos da obra',
            'gerar orcamento pelo projeto','estimativa por documentos','analisar edital',
            'analisar tr','analisar memorial','analisar projeto'],
      entry:'analisador_docs' },
    // Importar edital — AMPLIADO com linguagem natural
    { keys:['importar','importacao edital','ler pdf','abrir edital','importar planilha','importar excel',
            'como importar','carregar pdf','carregar planilha','carregar arquivo','abrir pdf',
            'carregar edital','extrair pdf','extrair planilha','pdf planilha','planilha pdf',
            'como carregar','subir arquivo','fazer upload','upload pdf','upload excel',
            'planilha edital','abrir arquivo','ler planilha','abrir planilha','edital pdf',
            'planilha licitacao','planilha xlsx','extrair dados','extrair itens','importar dados',
            'como abrir','arquivo pdf','pdf edital extrair','como faço para carregar'],
      entry:'importar' },
    // OCR — PDFs escaneados
    { keys:['ocr','pdf escaneado','digitalizado','imagem pdf','reconhecimento texto',
            'pdf imagem','foto planilha','planilha escaneada','pdf nao seleciona',
            'nao consigo selecionar texto','pdf de imagem','scanner','digitalizar',
            'nao reconhece texto','pdf bloqueado','pdf sem texto'],
      entry:'ocr' },
    // Exportar / relatório
    { keys:['exportar','relatorio','gerar excel','planilha excel','pdf edital','imprimir',
            'como exportar','gerar relatorio','baixar planilha','salvar planilha','gerar pdf',
            'planilha orcamentaria','exportar orcamento','salvar orcamento','baixar orcamento',
            'gerar documento','documento word','arquivo exportar','exportar dados'],
      entry:'exportar' },
    // ART/RRT
    { keys:['art','rrt','anotacao responsabilidade','crea','cau','registro tecnico',
            'responsabilidade tecnica','engenheiro responsavel','arquiteto responsavel'],
      entry:'art' },
    // Legislação
    { keys:['legislacao','lei obras','decreto','norma obra','regulamentacao','14133','8666','7983',
            'legislacao obras','nova lei licitacoes','lei licitacao','norma tecnica',
            'decreto 7983','lei 14133','obrigatoriedade sinapi','lei federal obras'],
      entry:'legislacao' },
    // Auditoria
    { keys:['auditoria','auditar','conferir preco','verificar conformidade','analise sinapi',
            'fiscalizacao','analisar preco','verificar preco','conferir orcamento',
            'preco acima','preco abaixo','desvio preco','conformidade preco',
            'tcu auditoria','cgu auditoria','fiscal obra','checar preco'],
      entry:'auditoria' },
    { keys:['planejamento','cronograma','gantt','curva s','medicao','medicoes','acompanhamento',
            'quantitativo','quantitativos','anexo','anexos','especificacao','backup','restauracao',
            'gestao da obra','executado','previsto realizado'],
      entry:'gestao_obra' },
  ];

  // ══ NAVEGAÇÃO DIRETA ══════════════════════════════════════
  if (/^ir para( o)? modulo$|^abrir( o)? modulo$|^acessar( o)? modulo$/.test(norm)) {
    copilotBotMsg('Claro. Qual módulo você quer abrir?');
    copilotSetChips(['Ir para Elaborar','Ir para Custos Horários','Ir para Cotações','Ir para Frentes de Serviço','Ir para Importar','Ir para Relatório']);
    return;
  }

  const navMap = [
    { keys:['ir para bdi','abrir bdi','acessar bdi','modulo bdi','ir para encargos'], view:'bdi' },
    { keys:['ir para custos horarios','ir para custos horários','abrir custos horarios','abrir custos horários','ir para custo horario','ir para custo horário'], view:'custos' },
    { keys:['ir para cotacoes','ir para cotações','abrir cotacoes','abrir cotações','ir para banco de cotacoes','ir para banco de cotações'], view:'cotacoes' },
    { keys:['ir para frentes','ir para frente de servico','ir para frente de serviço','ir para frentes de servico','ir para frentes de serviço','abrir frentes'], view:'frentes' },
    { keys:['ir para curva','ir para abc','abrir abc','curva abc'], view:'curvaABC' },
    { keys:['ir para elaborar','ir para orcamento','abrir orcamento'], view:'elaborar' },
    { keys:['ir para memoria','ir para memoria calculo'], view:'memoria' },
    { keys:['ir para planejamento','abrir planejamento','ir para cronograma','abrir gantt','ir para gantt'], view:'planejamento' },
    { keys:['ir para medicoes','ir para medicao','abrir medicoes','abrir medicao','ir para acompanhamento'], view:'medicoes' },
    { keys:['ir para quantitativos','ir para quantitativo','abrir quantitativos','abrir quantitativo'], view:'quantitativos' },
    { keys:['ir para anexos','ir para documentos','ir para central de documentos','ir para especificacoes','abrir anexos','abrir central de documentos'], view:'documentos' },
    { keys:['ir para backups','ir para backup','abrir backups','restaurar backup'], view:'backups' },
    { keys:['ir para analisar documentos','ir para analisador','abrir analisador','analisar documentos','abrir documentos da obra'], view:'analisador' },
    { keys:['ir para auditoria','ir para analise sinapi'], view:'auditoria' },
    { keys:['ir para relatorio','ir para exportar'], view:'relatorio' },
    { keys:['ir para bases','ir para base','abrir bases'], view:'bases' },
    { keys:['ir para importar','abrir importar','fazer upload','upload agora','enviar arquivo','subir arquivo','selecionar arquivo','importar agora'], view:'importar' },
    { keys:['ir para composicoes','ir para cpu','abrir cpu'], view:'cpu' },
    { keys:['ir para configuracoes','ir para config'], view:'config' },
    { keys:['ir para dashboard'], view:'dashboard' },
    { keys:['ir para conformidade'], view:'conformidade' },
  ];

  for (const nav of navMap) {
    if (nav.keys.some(k => norm.includes(k))) {
      const ctx = VIEW_CONTEXT[nav.view];
      copilotBotMsg(`Ok! Abrindo **${ctx?.nome || nav.view}** agora... 🚀`);
      setTimeout(() => showView(nav.view), 700);
      copilotSetChips(['O que posso fazer aqui?','Preciso de ajuda','O que é BDI?']);
      return;
    }
  }

  // ══ CONTEXTO ATUAL ════════════════════════════════════════
  if (/o que (posso fazer|tem aqui|e esta tela)|ajuda aqui|nesta tela|modulo atual|posso fazer aqui/.test(norm)) {
    const ctx = VIEW_CONTEXT[COP.currentView];
    if (ctx) {
      copilotBotMsg(`**Você está em: ${ctx.nome}**\n\n${ctx.dica}\n\nO que quer saber?`);
      copilotSetChips(['Sim me guie','O que é BDI?','Sim me guie']);
    }
    return;
  }

  // ══ ESTADO DO ORÇAMENTO ═══════════════════════════════════
  if (/meu orcamento|quantos itens|total orcamento|resumo|ver orcamento/.test(norm)) {
    const sub = STATE.orcamento.reduce((s,i)=>s+itemValor(i),0);
    copilotBotMsg(`**Seu orçamento atual:**\n\n• **${STATE.orcamento.length} itens** lançados\n• Subtotal (sem BDI): **${fmtMoeda(sub)}**\n• BDI configurado: **${bdiText('não configurado')}**\n• Total c/ BDI: **${fmtMoeda(totalComBDI(sub))}**\n• Base SINAPI: **${STATE.sinapiBase.length.toLocaleString('pt-BR')} insumos** carregados`);
    copilotSetChips(['Ir para Elaborar','Ir para ABC','Como exportar?','Ir para Auditoria']);
    return;
  }

  // ══ BUSCA POR TÓPICO (principal) ══════════════════════════
  for (const { keys, entry } of TOPICS) {
    if (keys.some(k => norm.includes(k))) {
      const kb = COPILOT_KB[entry];
      if (kb && kb.r) {
        copilotBotMsg(kb.r);
        copilotSetChips(kb.chips || ['Ir para Elaborar','Ir para BDI','Ir para ABC','Meu orçamento atual']);
        return;
      }
    }
  }

  // ══ FALLBACK CONTEXTUAL ═══════════════════════════════════
  const ctx = VIEW_CONTEXT[COP.currentView];
  copilotBotMsg(`Não reconheci "*${txt}*" como um tópico específico.\n\n${ctx ? `Você está em **${ctx.nome}** — ${ctx.dica}\n\n` : ''}Escolha um tópico:`);
  copilotSetChips(['O que é BDI?','Como importar edital?','Ir para Planejamento','Ir para Medições','Meu orçamento atual']);
}

// ── Detecta view atual para contexto ──────────────────
const _cop_origShowView = typeof showView === 'function' ? showView : null;
if (_cop_origShowView) {
  const __prevShowView = showView;
  showView = function(id) {
    __prevShowView(id);
    COP.currentView = id;
    // Proactive hint se copilot aberto
    if (COP.open && VIEW_CONTEXT[id]) {
      setTimeout(() => {
        copilotBotMsg(`📍 **${VIEW_CONTEXT[id].nome}**\n\n${VIEW_CONTEXT[id].dica}\n\nPosso te ajudar aqui?`);
        copilotSetChips(['Sim me guie','O que posso fazer aqui?','Meu orçamento atual']);
      }, 400);
    }
  };
}

// ── Proactive alert: BDI acima do limite ──────────────
(function() {
  const origCalcBDI = typeof calcBDI === 'function' ? calcBDI : null;
  if (origCalcBDI) {
    const __prev = calcBDI;
    calcBDI = function() {
      __prev();
      const bdi = STATE.bdi;
      const tipo = document.getElementById('bdi-tipo')?.value || 'civil';
      const lim = BDI_LIMITES[tipo] || 25;
      if (bdi > lim && !COP.firstOpen) {
        const badge = document.getElementById('cop-badge');
        badge.style.display = 'flex';
        badge.textContent = '!';
        if (COP.open) {
          setTimeout(() => {
            copilotBotMsg(`⚠️ **Alerta:** Seu BDI de **${bdi.toFixed(2)}%** ultrapassa o limite do TCU para "${tipo === 'civil' ? 'Obras Civis' : tipo === 'eletrica' ? 'Instalações Elétricas' : 'Fornecimento de Materiais'}" (**${lim}%**).\n\nVocê precisará **justificar tecnicamente** esse percentual no processo licitatório. Reduza o BDI ou prepare a memória de justificativa.`);
            copilotSetChips(['Limite BDI TCU?','Limites TCU','Como calcular BDI?']);
          }, 800);
        }
      }
    };
  }
})();

// ── Onboarding automático no primeiro acesso ──────────
(function() {
  const visto = localStorage.getItem('tlplanly_copilot_visto');
  if (!visto) {
    localStorage.setItem('tlplanly_copilot_visto', '1');
    setTimeout(() => {
      const badge = document.getElementById('cop-badge');
      badge.style.display = 'flex';
      badge.textContent = '1';
    }, 2000);
  }
})();


