
// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let STATE = {
  mode: 'construtor',
  theme: 'dark',
  bdi: 24.46,
  bdiComponents: { ac:4, s:0.5, r:1.27, df:1.23, l:7.4, i:8.65 },
  orcamento: [],      // { cod, desc, unid, qtd, preco, ref, cat }
  planejamento: [],
  medicoes: [],
  quantitativos: {},
  documentos: [],
  backups: [],
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
    STATE.backups = p.backups || [];
    STATE.bdi = p.bdi || 24.46;
    STATE.bdiComponents = p.bdiComponents || STATE.bdiComponents;
    STATE.config = { ...STATE.config, ...(p.config || {}) };
  }
} catch(e) {}

function makeId(prefix='id') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function normalizeState() {
  STATE.orcamento = Array.isArray(STATE.orcamento) ? STATE.orcamento : [];
  STATE.planejamento = Array.isArray(STATE.planejamento) ? STATE.planejamento : [];
  STATE.medicoes = Array.isArray(STATE.medicoes) ? STATE.medicoes : [];
  STATE.quantitativos = STATE.quantitativos && typeof STATE.quantitativos === 'object' ? STATE.quantitativos : {};
  STATE.documentos = Array.isArray(STATE.documentos) ? STATE.documentos : [];
  STATE.backups = Array.isArray(STATE.backups) ? STATE.backups : [];
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
    normalizeState();
    localStorage.setItem('tlplanly_state', JSON.stringify({
      orcamento: STATE.orcamento,
      planejamento: STATE.planejamento,
      medicoes: STATE.medicoes,
      quantitativos: STATE.quantitativos,
      documentos: STATE.documentos,
      backups: STATE.backups,
      bdi: STATE.bdi,
      bdiComponents: STATE.bdiComponents,
      config: STATE.config
    }));
  } catch(e) {}
}

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
  const t = localStorage.getItem('tlplanly_theme') || 'dark';
  STATE.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('themeBtn').textContent = t === 'dark' ? '☀' : '🌙';
})();

// ═══════════════════════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════════════════════
function setMode(m) {
  STATE.mode = m;
  document.getElementById('btnConstrutor').classList.toggle('active', m==='construtor');
  document.getElementById('btnAuditor').classList.toggle('active', m==='auditor');
  toast(m==='construtor' ? 'Modo Construtor ativo' : 'Modo Auditor ativo', 'info');
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function showView(id) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('view-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>{
    if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+id+"'")) n.classList.add('active');
  });
  if (id==='dashboard') renderDashboard();
  if (id==='curvaABC') gerarCurvaABC();
  if (id==='memoria') renderMemoria();
  if (id==='planejamento') planejamentoRender();
  if (id==='medicoes') medicoesRender();
  if (id==='quantitativos') quantRender();
  if (id==='documentos') docsRender();
  if (id==='backups') backupRender();
  if (id==='relatorio') renderRelatorioPreview();
  if (id==='config') syncConfigForm();
  if (id==='sinapi') renderSinapiBase();
  if (id==='bdi') { calcBDI(); showEncargos('nd'); renderBDIComp(); }
  if (id==='auditoria') executarAuditoria();
  if (id==='conformidade') verificarConformidade();
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
  STATE.orcamento.push({ id: makeId('orc'), cod, desc, unid, qtd, preco, ref, cat, capitulo, ordem: STATE.orcamento.length + 1 });
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
  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  toast('Quantidades zeradas. A estrutura foi preservada.', 'success');
}

function limparOrcamento() {
  if (!confirm('Deseja limpar todo o orçamento?')) return;
  STATE.orcamento = [];
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
    document.getElementById('elab-bdi-pct').textContent = STATE.bdi.toFixed(2) + '%';
    return;
  }
  const rows = STATE.orcamento.map((it, i) => {
    const total = it.qtd * it.preco;
    const desv = it.ref > 0 ? ((it.preco - it.ref) / it.ref * 100) : null;
    const desvHtml = desv !== null
      ? `<span style="color:${desv > 5 ? 'var(--red)' : desv < -5 ? 'var(--green)' : 'var(--text2)'}">${desv > 0 ? '+' : ''}${desv.toFixed(1)}%</span>`
      : '<span style="color:var(--text3)">N/D</span>';
    return `<tr>
      <td class="td-mono">${i+1}</td>
      <td class="td-mono">${it.cod}</td>
      <td><div>${it.desc}</div><div style="font-size:10px;color:var(--text3);margin-top:2px">${it.capitulo || it.cat || 'Serviços'}</div></td>
      <td>${it.unid}</td>
      <td>${fmtNum(it.qtd)}</td>
      <td>${fmtMoeda(it.preco)}</td>
      <td style="color:var(--gold)">${it.ref > 0 ? fmtMoeda(it.ref) : '—'}</td>
      <td>${desvHtml}</td>
      <td><strong>${fmtMoeda(total)}</strong></td>
      <td><span class="badge badge-ok" style="font-size:10px">${it.cat}</span></td>
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
  const sub = STATE.orcamento.reduce((s, it) => s + it.qtd * it.preco, 0);
  const total = sub * (1 + STATE.bdi/100);
  document.getElementById('elab-sub').textContent = fmtMoeda(sub);
  document.getElementById('elab-total').textContent = fmtMoeda(total);
  document.getElementById('elab-bdi-pct').textContent = STATE.bdi.toFixed(2) + '%';
}

function exportarOrcamento() {
  const nome = document.getElementById('orcNome').value || 'orcamento';
  const data = {
    nome, data: new Date().toLocaleDateString('pt-BR'),
    bdi: STATE.bdi,
    moeda: { codigo: moedaCodigo(), cotacao: moedaCotacao() },
    itens: STATE.orcamento,
    subtotal: STATE.orcamento.reduce((s, it)=>s+it.qtd*it.preco, 0)
  };
  downloadJSON(data, nome.replace(/\s+/g,'_') + '_TLPlanly.json');
  toast('Orçamento exportado', 'success');
}

// ═══════════════════════════════════════════════════════════
// BDI
// ═══════════════════════════════════════════════════════════
const BDI_LIMITES = { civil: 25, eletrica: 24, material: 15 };

function calcBDI() {
  const ac = parseFloat(document.getElementById('bdi-ac').value)||0;
  const s  = parseFloat(document.getElementById('bdi-s').value)||0;
  const r  = parseFloat(document.getElementById('bdi-r').value)||0;
  const df = parseFloat(document.getElementById('bdi-df').value)||0;
  const l  = parseFloat(document.getElementById('bdi-l').value)||0;
  const i  = parseFloat(document.getElementById('bdi-i').value)||0;

  STATE.bdiComponents = {ac,s,r,df,l,i};

  const bdi = ((1+ac/100+s/100+r/100)*(1+df/100)*(1+l/100) / (1-i/100) - 1) * 100;
  STATE.bdi = bdi;
  saveState();

  const tipo = document.getElementById('bdi-tipo').value;
  const lim = BDI_LIMITES[tipo] || 25;

  document.getElementById('bdi-result-pct').textContent = bdi.toFixed(2) + '%';
  document.getElementById('bdi-limite').textContent = lim + '%';
  document.getElementById('bdi-limite-lbl').textContent = lim + '%';

  const pct = Math.min(bdi / lim * 100, 120);
  const prog = document.getElementById('bdi-progress');
  prog.style.width = Math.min(pct, 100) + '%';

  const badge = document.getElementById('bdi-status-badge');
  if (bdi <= lim) {
    prog.style.background = 'var(--green)';
    badge.textContent = '✓ Dentro do Limite TCU';
    badge.className = 'bdi-status bdi-ok';
  } else if (bdi <= lim * 1.1) {
    prog.style.background = 'var(--gold)';
    badge.textContent = '⚠ Atenção: Próximo do Limite';
    badge.className = 'bdi-status bdi-warn';
  } else {
    prog.style.background = 'var(--red)';
    badge.textContent = '✗ ACIMA do Limite TCU!';
    badge.className = 'bdi-status bdi-bad';
  }

  // Update BDI in totals
  document.getElementById('elab-bdi-pct').textContent = bdi.toFixed(2) + '%';
  document.getElementById('mem-bdi').value = bdi.toFixed(2);

  renderBDIComp();
}

function renderBDIComp() {
  const bdi = STATE.bdi;
  const tipoAtual = document.getElementById('bdi-tipo')?.value || 'civil';
  const linhas = [
    {nome:'Obras Civis',          lim:25, key:'civil'},
    {nome:'Instalações Elétricas', lim:24, key:'eletrica'},
    {nome:'Fornecimento de Materiais', lim:15, key:'material'},
  ];
  const html = linhas.map(function(l) {
    const isSel = l.key === tipoAtual;
    const ok    = bdi <= l.lim;
    let badge;
    if (isSel) {
      badge = '<span class="badge ' + (ok ? 'badge-ok' : 'badge-err') + '">' + (ok ? '✓ OK' : '✗ Excede') + '</span>';
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
  // tipo change updates comparativo immediately
  renderBDIComp();
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
  toast(`BDI de ${STATE.bdi.toFixed(2)}% aplicado ao orçamento`, 'success');
  renderElaborar();
  renderDashboard();
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
  const items = [...STATE.orcamento];

  if (!items.length) {
    document.getElementById('abc-tabela').innerHTML = '<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--text3)">Orçamento vazio. Adicione itens primeiro.</td></tr>';
    return;
  }

  items.sort((a,b) => (b.qtd*b.preco) - (a.qtd*a.preco));
  const totalGeral = items.reduce((s,i)=>s+i.qtd*i.preco,0);

  let acum = 0;
  const rows = items.map((it,idx) => {
    const total = it.qtd * it.preco;
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
  const valA = items.filter(i=>i._classe==='A').reduce((s,i)=>s+i.qtd*i.preco,0);
  const valB = items.filter(i=>i._classe==='B').reduce((s,i)=>s+i.qtd*i.preco,0);
  const valC = items.filter(i=>i._classe==='C').reduce((s,i)=>s+i.qtd*i.preco,0);

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
  const bdi = STATE.bdi;

  const blocks = STATE.orcamento.map((it, i) => {
    const total = it.qtd * it.preco;
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
          <div class="enc-row"><span class="enc-name">BDI (${bdi.toFixed(2)}%)</span><span class="enc-val">${fmtMoeda(total * bdi/100)}</span></div>
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
  const bdi = STATE.bdi;
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
  const items = STATE.orcamento;
  const sub = items.reduce((s,i)=>s+i.qtd*i.preco, 0);
  const total = sub * (1 + STATE.bdi/100);
  const acima = items.filter(i => i.ref > 0 && i.preco > i.ref * 1.05).length;

  document.getElementById('dash-total').textContent = fmtMoeda(sub);
  document.getElementById('dash-itens').textContent = items.length + ' itens';
  document.getElementById('dash-bdi').textContent = STATE.bdi.toFixed(2) + '%';
  document.getElementById('dash-bdi-status').textContent = STATE.bdi <= 25 ? 'Dentro do limite TCU' : '⚠ Acima do limite';
  document.getElementById('dash-total-bdi').textContent = fmtMoeda(total);
  document.getElementById('dash-acima').textContent = acima;

  // ABC chart
  const sorted = [...items].sort((a,b)=>(b.qtd*b.preco)-(a.qtd*a.preco));
  const tot = sub || 1;
  let acc=0; const classesCount = {A:0,B:0,C:0}; const classesVal = {A:0,B:0,C:0};
  sorted.forEach(it => {
    const v = it.qtd*it.preco;
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
  items.forEach(i => { cats[i.cat] = (cats[i.cat]||0) + i.qtd*i.preco; });
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
    const v = it.qtd*it.preco;
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
  const sub = STATE.orcamento.reduce((s,i)=>s+i.qtd*i.preco,0);
  const total = sub * (1 + STATE.bdi/100);
  document.getElementById('rel-preview').innerHTML = `
    <div style="font-size:13px;color:var(--text2);line-height:1.8">
      <div><strong>Orçamento:</strong> ${document.getElementById('orcNome')?.value || '—'}</div>
      <div><strong>Itens:</strong> ${STATE.orcamento.length}</div>
      <div><strong>BDI Aplicado:</strong> ${STATE.bdi.toFixed(2)}%</div>
      <div><strong>Subtotal (sem BDI):</strong> ${fmtMoeda(sub)}</div>
      <div><strong>Total c/ BDI:</strong> <span style="color:var(--gold);font-weight:800;font-size:18px">${fmtMoeda(total)}</span></div>
      <div><strong>Referência SINAPI:</strong> MG / ${STATE.sinapiMes || '—'}</div>
    </div>`;
}

function exportarJSON() {
  const data = {
    orcamento: STATE.orcamento,
    bdi: STATE.bdi,
    moeda: { codigo: moedaCodigo(), cotacao: moedaCotacao() },
    total: STATE.orcamento.reduce((s,i)=>s+i.qtd*i.preco,0)
  };
  downloadJSON(data, 'tlplanly_export.json');
  toast('JSON exportado', 'success');
}

function exportarCSV() {
  const lines = [`Código;Descrição;Un;Qtd;Preço Unit (${moedaCodigo()});Ref SINAPI (${moedaCodigo()});Total (${moedaCodigo()})`];
  STATE.orcamento.forEach(i => {
    lines.push([i.cod, i.desc, i.unid, i.qtd, valorMoeda(i.preco).toFixed(2), valorMoeda(i.ref).toFixed(2), valorMoeda(i.qtd*i.preco).toFixed(2)].join(';'));
  });
  downloadText(lines.join('\n'), 'tlplanly_export.csv', 'text/csv');
  toast('CSV exportado', 'success');
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

function redrawAllCharts() {
  if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
  if (document.getElementById('view-curvaABC').classList.contains('active')) gerarCurvaABC();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  syncConfigForm();
  calcBDI();
  showEncargos('nd');
  renderBDIComp();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();
  loadSinapiBase();
  // Sync BDI inputs from saved state
  const c = STATE.bdiComponents;
  if (c) {
    document.getElementById('bdi-ac').value = c.ac;
    document.getElementById('bdi-s').value = c.s;
    document.getElementById('bdi-r').value = c.r;
    document.getElementById('bdi-df').value = c.df;
    document.getElementById('bdi-l').value = c.l;
    document.getElementById('bdi-i').value = c.i;
    calcBDI();
  }
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
  return (Number(item?.qtd) || 0) * (Number(item?.preco) || 0);
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
  const lines = ['# Planejamento TLPlanly', '', '| ID | Tarefa | Início | Fim | Dependências | Progresso |', '|---|---|---:|---:|---|---:|'];
  STATE.planejamento.forEach(t => lines.push(`| ${t.code} | ${mdCell(t.desc)} | ${t.inicio} | ${t.fim} | ${(t.deps || []).join(', ') || '-'} | ${t.progresso || 0}% |`));
  downloadText(lines.join('\n'), 'planejamento_tlplanly.md', 'text/markdown');
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
  const el = document.getElementById('docs-lista');
  if (!el) return;
  el.innerHTML = STATE.documentos.length ? `<div class="op-list">${STATE.documentos.map(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    return `<div class="op-row">
      <div class="op-row-main">
        <div class="op-title">${escapeHtml(d.titulo)}</div>
        <div class="op-meta">${escapeHtml(d.tipo)} · ${d.criadoEm} · ${d.targetId === 'obra' ? 'Obra / Geral' : escapeHtml(itemLabel(item))}</div>
        ${d.texto ? `<div style="font-size:12px;color:var(--text2);margin-top:8px">${escapeHtml(d.texto)}</div>` : ''}
        ${d.files?.length ? `<div class="op-meta" style="margin-top:6px">Arquivos: ${d.files.map(f => escapeHtml(f.name)).join(', ')}</div>` : ''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="docsRemover('${d.id}')">×</button>
    </div>`;
  }).join('')}</div>` : '<div class="empty-state" style="padding:24px">Nenhum anexo ou especificação registrado.</div>';
}

function docsRemover(id) {
  STATE.documentos = STATE.documentos.filter(d => d.id !== id);
  saveState();
  docsRender();
}

function docsExportarDossie() {
  const lines = ['# Dossiê Técnico TLPlanly', '', `Gerado em: ${new Date().toLocaleString('pt-BR')}`, ''];
  STATE.documentos.forEach(d => {
    const item = d.targetId === 'obra' ? null : getItemById(d.targetId);
    lines.push(`## ${d.titulo}`, '', `- Tipo: ${d.tipo}`, `- Vínculo: ${d.targetId === 'obra' ? 'Obra / Geral' : itemLabel(item)}`, `- Criado em: ${d.criadoEm}`, '');
    if (d.texto) lines.push(d.texto, '');
    if (d.files?.length) lines.push('Arquivos: ' + d.files.map(f => f.name).join(', '), '');
  });
  downloadText(lines.join('\n'), 'dossie_tecnico_tlplanly.md', 'text/markdown');
}

function backupPayload() {
  return {
    orcamento: STATE.orcamento,
    planejamento: STATE.planejamento,
    medicoes: STATE.medicoes,
    quantitativos: STATE.quantitativos,
    documentos: STATE.documentos,
    bdi: STATE.bdi,
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
  filtro: 'todos'
};

const IMPORT_EXTS = ['pdf','xlsx','xls','ods','csv','png','jpg','jpeg','tif','tiff'];
const IMAGE_EXTS = ['png','jpg','jpeg','tif','tiff'];
const SPREADSHEET_EXTS = ['xlsx','xls','ods','csv'];

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
  document.getElementById('imp-card-upload').style.display = 'block';
  IMP.rawItems = []; IMP.reviewed = []; IMP.importResults = []; IMP.markdown = '';
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

async function iniciarExtracao() {
  const files = IMP.files.length ? IMP.files : (IMP.file ? [IMP.file] : []);
  if (!files.length) return;

  // Show progress card
  document.getElementById('imp-card-upload').style.display = 'none';
  document.getElementById('imp-card-progress').style.display = 'block';
  document.getElementById('imp-card-review').style.display = 'none';

  const stepsHtml = [
    ['Lendo lote', `${files.length} arquivo(s)`],
    ['Extraindo linhas / OCR', 'Aguardando'],
    ['Normalizando itens', 'Aguardando'],
    ['Match com SINAPI', 'Aguardando'],
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
    IMP.reviewed = items.map(it => matchSINAPI(it));
    setStep(null, 3, 'done', `${IMP.reviewed.filter(r=>r.matchTipo==='ok').length} matches`);
    setProgress(100, 'Concluído!');
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
    linhas.push(`${idx + 1}. **${r.fileName}** - ${r.metodo} - ${r.items.length} item(ns)`);
    if (r.aviso) linhas.push(`   - Aviso: ${r.aviso}`);
  });

  linhas.push('', '## Itens extraídos', '');
  linhas.push('| Arquivo | Método | Código | Descrição | Unid. | Qtd. | Preço |');
  linhas.push('|---|---|---:|---|---:|---:|---:|');

  results.forEach(r => {
    r.items.forEach(item => {
      linhas.push(`| ${mdCell(r.fileName)} | ${mdCell(r.metodo)} | ${mdCell(item.cod || '-')} | ${mdCell(item.desc || '-')} | ${mdCell(item.unid || 'UN')} | ${item.qtd || 0} | ${item.preco || 0} |`);
    });
  });

  linhas.push('', '## Observação técnica', '');
  linhas.push('O Markdown é usado como memória de conferência e rastreabilidade. A importação operacional do orçamento usa dados estruturados para preservar código, descrição, unidade, quantidade, preço e origem.');

  return linhas.join('\n');
}

function mdCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function exportarMemoriaImportacao() {
  if (!IMP.markdown && IMP.importResults.length) IMP.markdown = gerarMemoriaImportacao(IMP.importResults);
  if (!IMP.markdown) {
    toast('Extraia os arquivos antes de gerar a memória .md.', 'error');
    return;
  }
  const blob = new Blob([IMP.markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `memoria_importacao_tlplanly_${new Date().toISOString().slice(0,10)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  setStep(null, 0, 'done', `${raw.length} linhas`);
  setStep(null, 1, 'spin', 'Detectando cabeçalho...');
  setProgress(40, 'Detectando colunas...');

  // Find header row
  let headerRow = -1, colMap = { cod:-1, desc:-1, unid:-1, qtd:-1, preco:-1 };
  for (let r = 0; r < Math.min(20, raw.length); r++) {
    const row = raw[r].map(c => String(c).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''));
    let found = 0;
    row.forEach((cell, ci) => {
      if ((cell.includes('cod') || cell.includes('item')) && colMap.cod < 0) { colMap.cod = ci; found++; }
      if ((cell.includes('desc') || cell.includes('servic') || cell.includes('especif')) && colMap.desc < 0) { colMap.desc = ci; found++; }
      if ((cell.includes('unid') || cell === 'un' || cell === 'und') && colMap.unid < 0) { colMap.unid = ci; found++; }
      if ((cell.includes('qtd') || cell.includes('quant')) && colMap.qtd < 0) { colMap.qtd = ci; found++; }
      if ((cell.includes('prec') || cell.includes('unit') || cell.includes('valor') || cell.includes('custo')) && colMap.preco < 0) { colMap.preco = ci; found++; }
    });
    if (found >= 2 && (colMap.cod >= 0 || colMap.desc >= 0)) { headerRow = r; break; }
  }

  setStep(null, 1, 'done', headerRow >= 0 ? `Cabeçalho L${headerRow+1}` : 'Heurística');
  setStep(null, 2, 'spin', 'Lendo itens...');
  setProgress(60, 'Extraindo itens...');

  const items = [];
  const start = headerRow >= 0 ? headerRow + 1 : 1;

  for (let r = start; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c)) continue;

    const cod = colMap.cod >= 0 ? String(row[colMap.cod] || '').trim() : '';
    const desc = colMap.desc >= 0 ? String(row[colMap.desc] || '').trim() : row.filter(c=>c).join(' ').trim();
    const unid = colMap.unid >= 0 ? String(row[colMap.unid] || '').trim() : 'UN';
    const qtdRaw = colMap.qtd >= 0 ? row[colMap.qtd] : '';
    const precoRaw = colMap.preco >= 0 ? row[colMap.preco] : '';

    const qtd = parseFloat(String(qtdRaw).replace(/[^\d.,]/g,'').replace(',','.')) || 0;
    const preco = parseFloat(String(precoRaw).replace(/[^\d.,]/g,'').replace(',','.')) || 0;

    if (desc.length < 3) continue;

    items.push({ cod: limparCodigo(cod), desc, unid: unid || 'UN', qtd: qtd || 1, preco, origem: 'excel' });
  }

  setStep(null, 2, 'done', `${items.length} itens`);
  setProgress(70, 'Concluído');
  return items;
}

// ─── PDF LINE PARSER ───────────────────────────────────────
function parsearLinhas(lines) {
  // Detecta padrão: linha com número de serviço SINAPI (5-7 dígitos) seguido de descrição
  const SINAPI_RE = /\b(\d{5,7})\b/;
  const PRECO_RE = /[\d]{1,3}(?:[.,]\d{3})*[.,]\d{2}/g;

  const items = [];
  let buffer = null;

  lines.forEach(line => {
    const cleaned = line.replace(/\s+/g,' ').trim();
    if (!cleaned || cleaned.length < 4) return;
    // Skip headers/titles
    if (/^(item|codigo|descri|unid|quant|preco|valor|total|sub)/i.test(cleaned)) return;

    const codMatch = cleaned.match(SINAPI_RE);
    if (codMatch) {
      if (buffer) items.push(finalizarBuffer(buffer));
      buffer = { cod: codMatch[1], desc: '', unid: 'UN', qtd: 1, preco: 0, origem: 'pdf', linhas: [cleaned] };
    } else if (buffer) {
      buffer.linhas.push(cleaned);
    }
  });
  if (buffer) items.push(finalizarBuffer(buffer));

  // If no SINAPI codes found, try column-based heuristic
  if (!items.length) {
    lines.forEach(line => {
      const parts = line.split(/\s{2,}/);
      if (parts.length >= 3) {
        const cod = limparCodigo(parts[0]);
        const desc = parts[1] || '';
        if (desc.length > 3) {
          const nums = line.match(PRECO_RE) || [];
          const preco = nums.length > 0 ? parseFloat(nums[nums.length-1].replace(/\./g,'').replace(',','.')) : 0;
          const qtd = nums.length > 1 ? parseFloat(nums[0].replace(/\./g,'').replace(',','.')) : 1;
          items.push({ cod, desc: desc.trim(), unid: 'UN', qtd: qtd||1, preco, origem:'pdf' });
        }
      }
    });
  }

  return items.filter(i => i.desc.length > 3);
}

function finalizarBuffer(buf) {
  const fullText = buf.linhas.join(' ');
  const PRECO_RE = /[\d]{1,3}(?:[.,]\d{3})*[.,]\d{2}/g;
  const nums = (fullText.match(PRECO_RE) || []).map(n => parseFloat(n.replace(/\./g,'').replace(',','.')));

  // Heuristic: last number is unit price, second-last is qty (if > 0)
  const preco = nums.length > 0 ? nums[nums.length-1] : 0;
  const qtd   = nums.length > 1 ? nums[nums.length-2] : 1;

  // Extract unit (m2, m3, m, kg, un, vb, etc.)
  const unidMatch = fullText.match(/\b(m2|m²|m³|m3|m\b|kg|kgf|t\b|vb|cj|un|unid|gl|hr|h\b|l\b|litro)\b/i);
  const unid = unidMatch ? unidMatch[1].toUpperCase().replace('²','2').replace('³','3') : 'UN';

  // Description: everything between code and first number
  let desc = fullText.replace(buf.cod, '').trim();
  desc = desc.replace(PRECO_RE, '').replace(/\s+/g,' ').trim();
  desc = desc.replace(unid, '').trim().substring(0, 200);

  return { cod: buf.cod, desc, unid, qtd: qtd > 0 && qtd < 1e7 ? qtd : 1, preco, origem: 'pdf' };
}

function limparCodigo(s) {
  return String(s).replace(/[^0-9A-Za-z.\-]/g,'').trim();
}

// ─── MATCH SINAPI ──────────────────────────────────────────
function matchSINAPI(item) {
  const ref = STATE.sinapiBase.find(s => s.codigoSinapi === item.cod);

  if (ref) {
    return { ...item, refSinapi: ref.precoMedio, refDesc: ref.descricao, refUnid: ref.unidade, matchTipo: 'ok', selecionado: true };
  }

  // Partial match by description keywords
  const words = item.desc.toUpperCase().split(/\s+/).filter(w => w.length > 4);
  let bestScore = 0, bestRef = null;
  STATE.sinapiBase.forEach(s => {
    const up = s.descricao.toUpperCase();
    let score = 0;
    words.forEach(w => { if (up.includes(w)) score++; });
    if (score > bestScore && score >= 2) { bestScore = score; bestRef = s; }
  });

  if (bestRef) {
    return { ...item, refSinapi: bestRef.precoMedio, refDesc: bestRef.descricao, refUnid: bestRef.unidade,
             sugestao: bestRef.codigoSinapi, matchTipo: 'parcial', selecionado: true };
  }

  return { ...item, refSinapi: 0, matchTipo: 'nenhum', selecionado: true };
}

// ─── REVISÃO UI ────────────────────────────────────────────
function mostrarRevisao() {
  document.getElementById('imp-card-progress').style.display = 'none';
  document.getElementById('imp-card-review').style.display = 'block';
  filtrarRevisao('todos');
  atualizarStatsRevisao();
}

function filtrarRevisao(f) {
  IMP.filtro = f;
  ['todos','ok','parcial','nenhum'].forEach(id => {
    const btn = document.getElementById('rfilt-'+id);
    if (btn) btn.style.borderColor = id === f ? 'var(--gold)' : '';
    if (btn) btn.style.color = id === f ? 'var(--gold)' : '';
  });
  renderRevisao();
}

function renderRevisao() {
  const lista = IMP.filtro === 'todos' ? IMP.reviewed
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

    return `<div class="rev-row">
      <input type="checkbox" ${r.selecionado?'checked':''} onchange="IMP.reviewed[${globalIdx}].selecionado=this.checked;atualizarStatsRevisao()"/>
      <span style="width:80px;font-family:monospace;font-size:11px;color:var(--gold);flex-shrink:0">${r.cod||'—'}</span>
      <span style="flex:1;min-width:0">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${r.desc}">${r.desc}</div>
        ${sugestaoHtml}
        ${origemHtml}
      </span>
      <span style="width:45px;flex-shrink:0;color:var(--text2)">${r.unid}</span>
      <span style="width:60px;flex-shrink:0;color:var(--text2)">${fmtNum(r.qtd)}</span>
      <span style="width:80px;flex-shrink:0">${r.preco > 0 ? fmtMoeda(r.preco) : '<span style="color:var(--text3)">—</span>'}</span>
      <span style="width:80px;flex-shrink:0">${refCol}</span>
      <span style="width:75px;flex-shrink:0">${matchLabel}</span>
    </div>`;
  }).join('');
}

function selecionarTodosRev(sel) {
  IMP.reviewed.forEach(r => r.selecionado = sel);
  renderRevisao();
  atualizarStatsRevisao();
}

function atualizarStatsRevisao() {
  const sel = IMP.reviewed.filter(r=>r.selecionado).length;
  const ok = IMP.reviewed.filter(r=>r.matchTipo==='ok').length;
  const parcial = IMP.reviewed.filter(r=>r.matchTipo==='parcial').length;
  const nenhum = IMP.reviewed.filter(r=>r.matchTipo==='nenhum').length;
  document.getElementById('imp-rev-stats').textContent =
    `${sel} selecionados | ✓ ${ok} match | ~ ${parcial} parcial | ✗ ${nenhum} sem match`;
}

function confirmarImportacao(destino = STATE.mode === 'auditor' ? 'auditoria' : 'elaborar') {
  const selecionados = IMP.reviewed.filter(r => r.selecionado);
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
    return { id: makeId('orc'), cod, desc: r.desc, unid: r.unid, qtd: r.qtd, preco: preco||0, ref: r.refSinapi||0, cat, capitulo: cat, origemArquivo: r.origemArquivo || '', origemMetodo: r.origemMetodo || '' };
  });

  if (acao === 'substituir') STATE.orcamento = novos;
  else STATE.orcamento = [...STATE.orcamento, ...novos];

  saveState();
  renderElaborar();
  renderDashboard();
  preencherSelectsOperacionais();

  const alvo = destino === 'auditoria' ? 'auditoria' : 'elaborar';
  const destinoLabel = alvo === 'auditoria' ? 'Auditoria' : 'Elaboração';
  toast(`${novos.length} itens importados e enviados para ${destinoLabel}.`, 'success');
  showView(alvo);
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
  'seinfra-mg': { nome: 'SEINFRA-MG', url: 'http://www.infraestrutura.mg.gov.br/municipio/consulta-a-planilha-de-precos-seinfra', desc: 'Secretaria de Infraestrutura — Minas Gerais' },
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
  // Returns { preco, fonte, item } searching in priority order
  for (const baseKey of PRIORIDADE_BASES) {
    const base = BASES[baseKey];
    if (!base.loaded || !base.items.length) continue;
    const found = base.items.find(i => i.codigoSinapi === cod || i.codigo === cod);
    if (found) return { preco: found.precoMedio || found.preco || 0, fonte: base.nome, item: found };
  }
  // Fallback to STATE.sinapiBase (original)
  const fb = STATE.sinapiBase.find(i => i.codigoSinapi === cod);
  if (fb) return { preco: fb.precoMedio, fonte: 'SINAPI (padrão)', item: fb };
  return null;
}

function getAllItems() {
  // Merge all base items for search
  const all = [];
  // Original sinapiBase first
  STATE.sinapiBase.forEach(i => all.push({ ...i, _base: 'SINAPI', _baseTipo: 'federal' }));
  Object.entries(BASES).forEach(([key, base]) => {
    if (base.loaded) {
      base.items.forEach(i => all.push({ ...i, _base: base.nome, _baseTipo: base.tipo }));
    }
  });
  return all;
}

// ─── SICRO 3 LOADER ────────────────────────────────────────
async function carregarSICRO(event) {
  const file = event.target.files[0];
  if (!file) return;
  toast('Carregando SICRO 3...', 'info');

  try {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const items = [];

    // SICRO has multiple sheets: Insumos, Composicoes, etc.
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      // Find header
      let headerRow = -1;
      let colCod=-1, colDesc=-1, colUnid=-1, colPreco=-1, colCat=-1;
      for (let r = 0; r < Math.min(15, raw.length); r++) {
        const row = raw[r].map(c => String(c).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''));
        row.forEach((cell, ci) => {
          if (/cod|item/.test(cell) && colCod < 0) colCod = ci;
          if (/desc|especif|servic/.test(cell) && colDesc < 0) colDesc = ci;
          if (/unid|^un$|^und$/.test(cell) && colUnid < 0) colUnid = ci;
          if (/prec|custo|unit|valor/.test(cell) && colPreco < 0) colPreco = ci;
          if (/categ|tipo|classe/.test(cell) && colCat < 0) colCat = ci;
        });
        if (colCod >= 0 && colDesc >= 0) { headerRow = r; break; }
      }
      if (headerRow < 0) return;

      for (let r = headerRow + 1; r < raw.length; r++) {
        const row = raw[r];
        if (!row || row.every(c => !c)) continue;
        const cod = String(row[colCod] || '').trim();
        const desc = colDesc >= 0 ? String(row[colDesc] || '').trim() : '';
        const unid = colUnid >= 0 ? String(row[colUnid] || '').trim() : 'UN';
        const precoRaw = colPreco >= 0 ? row[colPreco] : 0;
        const preco = parseFloat(String(precoRaw).replace(/[^\d.,]/g,'').replace(',','.')) || 0;
        const cat = colCat >= 0 ? String(row[colCat] || '').trim() : sheetName;
        if (!cod || desc.length < 3) continue;
        items.push({ codigoSinapi: cod, codigo: cod, descricao: desc, unidade: unid || 'UN',
                     precoMedio: preco, dataReferencia: new Date().toLocaleDateString('pt-BR'),
                     desonerado: false, fonte: 'SICRO3/DNIT', categoria: cat });
      }
    });

    if (!items.length) { toast('Nenhum item encontrado no arquivo SICRO', 'error'); return; }

    BASES.sicro.items = items;
    BASES.sicro.loaded = true;

    document.getElementById('sicro-count').textContent = items.length.toLocaleString('pt-BR');
    document.getElementById('sicro-count').className = 'base-stat base-loaded';
    document.getElementById('sicro-info').textContent = 'insumos e composições SICRO 3';
    document.getElementById('sicro-status-dot').textContent = '● Carregado';
    document.getElementById('sicro-status-dot').style.color = 'var(--green)';
    document.getElementById('base-card-sicro').classList.add('active');

    renderPrioridade();
    atualizarTotalBases();
    toast(`SICRO 3: ${items.length.toLocaleString('pt-BR')} itens carregados`, 'success');
  } catch(err) {
    toast('Erro ao carregar SICRO: ' + err.message, 'error');
    console.error(err);
  }
}

// ─── SINAPI XLSX DIRETO ────────────────────────────────────
async function carregarSINAPI(event) {
  const file = event.target.files[0];
  if (!file) return;
  toast('Carregando SINAPI...', 'info');
  try {
    // Reuse the existing lerArquivo logic via XLSX
    const ab = await file.arrayBuffer();
    let items = [];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'zip') {
      toast('ZIP detectado — extraia o XLSX interno e carregue diretamente', 'error');
      return;
    }

    const wb = XLSX.read(ab, { type: 'array' });
    // SINAPI nacional: aba ISD/ICD/ISE
    const abaNames = ['ISD','ICD','ISE'];
    let ws = null, abaNome = '';
    for (const an of abaNames) {
      ws = wb.Sheets[an];
      if (ws) { abaNome = an; break; }
    }

    if (!ws) ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // Detect UF column from config
    const uf = (STATE.config.uf || 'MG').toUpperCase();
    let headerRow = -1, colCod=-1, colDesc=-1, colUnid=-1, colUF=-1;

    // SINAPI nacional: row 10 (idx 9) is header with UFs
    for (let r = 0; r < Math.min(15, raw.length); r++) {
      const row = raw[r];
      const rowStr = row.map(c => String(c).toUpperCase());
      const ufIdx = rowStr.findIndex(c => c.trim() === uf);
      if (ufIdx >= 0) { headerRow = r; colUF = ufIdx; colCod = 1; colDesc = 2; colUnid = 3; break; }
    }

    // Fallback: generic layout
    if (headerRow < 0) {
      for (let r = 0; r < Math.min(15, raw.length); r++) {
        const row = raw[r].map(c => String(c).toLowerCase());
        row.forEach((cell, ci) => {
          if (/cod/.test(cell) && colCod < 0) colCod = ci;
          if (/desc/.test(cell) && colDesc < 0) colDesc = ci;
          if (/unid/.test(cell) && colUnid < 0) colUnid = ci;
          if (/prec|custo/.test(cell) && colUF < 0) colUF = ci;
        });
        if (colCod >= 0 && colDesc >= 0) { headerRow = r; break; }
      }
    }

    if (headerRow < 0) { toast('Layout SINAPI não reconhecido', 'error'); return; }

    for (let r = headerRow + 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row || row.every(c => !c)) continue;
      const cod = String(row[colCod] || '').trim();
      if (!cod || isNaN(Number(cod))) continue;
      const preco = parseFloat(String(row[colUF] || '0').replace(',','.')) || 0;
      if (preco <= 0) continue;
      items.push({
        codigoSinapi: cod,
        descricao: String(row[colDesc] || '').trim(),
        unidade: colUnid >= 0 ? String(row[colUnid] || '').trim() : 'UN',
        precoMedio: preco,
        dataReferencia: new Date().toLocaleDateString('pt-BR'),
        desonerado: false,
        fonte: `SINAPI/CAIXA/${abaNome||''}/${uf}`
      });
    }

    if (!items.length) { toast('Nenhum item SINAPI encontrado', 'error'); return; }

    // Merge into STATE.sinapiBase
    STATE.sinapiBase = items;
    STATE.sinapiMes = new Date().toLocaleDateString('pt-BR', { month:'2-digit', year:'numeric' });
    BASES.sinapi.items = items;
    BASES.sinapi.loaded = true;

    document.getElementById('sinapi-count-b').textContent = items.length.toLocaleString('pt-BR');
    document.getElementById('sinapi-count-b').className = 'base-stat base-loaded';
    document.getElementById('sinapi-mes-b').textContent = `insumos — UF: ${uf}`;
    document.getElementById('sinapi-status-dot').textContent = '● Carregado';
    document.getElementById('sinapi-status-dot').style.color = 'var(--green)';

    renderPrioridade();
    atualizarTotalBases();
    toast(`SINAPI: ${items.length.toLocaleString('pt-BR')} itens (${uf})`, 'success');
  } catch(err) {
    toast('Erro ao carregar SINAPI: ' + err.message, 'error');
    console.error(err);
  }
}

// ─── ESTADUAL LOADER ───────────────────────────────────────
async function carregarEstadual(event) {
  const file = event.target.files[0];
  if (!file) return;
  const subtipo = document.getElementById('est-tipo').value;
  const info = LINKS_ESTADUAIS[subtipo] || {};
  toast(`Carregando ${info.nome || 'base estadual'}...`, 'info');

  try {
    const ab = await file.arrayBuffer();
    const wb = XLSX.read(ab, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let headerRow = -1, colCod=-1, colDesc=-1, colUnid=-1, colPreco=-1;
    for (let r = 0; r < Math.min(20, raw.length); r++) {
      const row = raw[r].map(c => String(c).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''));
      row.forEach((cell, ci) => {
        if (/cod|item/.test(cell) && colCod < 0) colCod = ci;
        if (/desc|servic|especif/.test(cell) && colDesc < 0) colDesc = ci;
        if (/unid|^un$|^und$/.test(cell) && colUnid < 0) colUnid = ci;
        if (/prec|custo|unit|valor/.test(cell) && colPreco < 0) colPreco = ci;
      });
      if (colCod >= 0 && colDesc >= 0) { headerRow = r; break; }
    }
    if (headerRow < 0) { toast('Cabeçalho não encontrado no arquivo estadual', 'error'); return; }

    const items = [];
    for (let r = headerRow + 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row || row.every(c => !c)) continue;
      const cod = String(row[colCod] || '').trim();
      const desc = colDesc >= 0 ? String(row[colDesc] || '').trim() : '';
      if (!desc || desc.length < 3) continue;
      const unid = colUnid >= 0 ? String(row[colUnid] || '').trim() : 'UN';
      const preco = colPreco >= 0 ? parseFloat(String(row[colPreco]||'0').replace(/[^\d.,]/g,'').replace(',','.')) : 0;
      items.push({ codigoSinapi: cod, codigo: cod, descricao: desc, unidade: unid || 'UN',
                   precoMedio: preco, dataReferencia: new Date().toLocaleDateString('pt-BR'),
                   desonerado: false, fonte: info.nome || subtipo });
    }

    if (!items.length) { toast('Nenhum item encontrado no arquivo estadual', 'error'); return; }

    BASES.estadual.items = items;
    BASES.estadual.loaded = true;
    BASES.estadual.subtipo = subtipo;
    BASES.estadual.nome = info.nome || subtipo;

    document.getElementById('est-count').textContent = items.length.toLocaleString('pt-BR');
    document.getElementById('est-count').className = 'base-stat base-loaded';
    document.getElementById('est-info').textContent = `itens — ${info.nome}`;
    document.getElementById('est-nome').textContent = info.nome || 'Base Estadual';
    document.getElementById('est-desc').textContent = info.desc || '';
    document.getElementById('est-status-dot').textContent = '● Carregado';
    document.getElementById('est-status-dot').style.color = 'var(--green)';
    document.getElementById('base-card-estadual').classList.add('active');

    renderPrioridade();
    atualizarTotalBases();
    toast(`${info.nome}: ${items.length.toLocaleString('pt-BR')} itens carregados`, 'success');
  } catch(err) {
    toast('Erro ao carregar base estadual: ' + err.message, 'error');
  }
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
      const el = document.getElementById('sinapi-count-b');
      const elMes = document.getElementById('sinapi-mes-b');
      if (el) { el.textContent = STATE.sinapiBase.length.toLocaleString('pt-BR'); el.className = 'base-stat base-loaded'; }
      if (elMes) elMes.textContent = `insumos — ${STATE.sinapiMes||''}`;
      document.getElementById('sinapi-status-dot').textContent = '● Carregado';
      document.getElementById('sinapi-status-dot').style.color = 'var(--green)';
      BASES.sinapi.items = STATE.sinapiBase;
      BASES.sinapi.loaded = true;
    }
    renderPrioridade();
    atualizarTotalBases();
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

// ─── PREVIEW PLANILHA ORÇAMENTÁRIA ────────────────────────
function renderPreviewPlanilha() {
  const meta = getMeta();
  const modelo = relatorioModeloAtual();
  const items = STATE.orcamento;
  const sub  = items.reduce((s,i)=>s+i.qtd*i.preco, 0);
  const bdi  = STATE.bdi;
  const total = sub * (1 + bdi/100);
  const now  = new Date().toLocaleDateString('pt-BR');

  document.getElementById('rel-info-count').textContent = `${items.length} itens · Subtotal: ${fmtMoeda(sub)} · Total c/ BDI: ${fmtMoeda(total)}`;

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
      const total_it = it.qtd * it.preco;
      const total_bdi = total_it * (1 + bdi/100);
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
        <td style="text-align:right">${bdi.toFixed(2)}%</td>
        <td style="text-align:right">${fmtMoeda(total_it * (1+bdi/100)/it.qtd)}</td>
        <td style="text-align:right;font-weight:700">${fmtMoeda(total_bdi)}</td>
      </tr>`;
    });
  }

  const html = `<table>
    <tr><td colspan="11" class="sh-header">${modelo.titulo}</td></tr>
    <tr><td colspan="11" class="sh-sub">${modelo.subtitulo} · Base de preços: ${meta.fonte} · Moeda: ${moedaCodigo()}</td></tr>
    ${metaRows}
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
      <td colspan="10" style="text-align:right">BDI (${bdi.toFixed(2)}%) — Decreto 7983/2013:</td>
      <td style="text-align:right;color:#2a6b00;font-weight:700">${fmtMoeda(sub * bdi/100)}</td>
    </tr>
    <tr class="sh-total">
      <td colspan="10" style="text-align:right;font-size:13px">TOTAL GERAL (Preço de Venda com BDI):</td>
      <td style="text-align:right;font-size:14px">${fmtMoeda(total)}</td>
    </tr>
    <tr><td colspan="11" style="padding:4px 10px;font-size:10px;color:#666;border:1px solid #ddd">
      * Preços em conformidade com a tabela ${meta.fonte} · Data base: ${meta.data} · BDI: ${bdi.toFixed(2)}% (limite TCU Acórdão 2622/2013: 25%) · Cotação: 1 ${moedaCodigo()} = R$ ${moedaCotacao().toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:4})}
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
  const c = STATE.bdiComponents;
  const bdi = STATE.bdi;
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

  const status = bdi <= lim ? 'CONFORME' : 'NÃO CONFORME';
  const statusColor = bdi <= lim ? '#2a6b00' : '#c00';

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
      <td style="text-align:right;font-size:14px">${bdi.toFixed(2)}%</td>
      <td style="text-align:right;color:${statusColor};font-weight:800">${status}</td>
    </tr>
    <tr class="sh-bdi">
      <td colspan="4" style="font-size:10px;color:#555;padding:8px 10px">
        Limite TCU Acórdão 2622/2013 para ${tipo==='civil'?'obras civis':tipo==='eletrica'?'instalações elétricas':'fornecimento de materiais'}: ${lim}%
        · BDI apurado: ${bdi.toFixed(2)}% · Status: <strong style="color:${statusColor}">${status}</strong>
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
  const items = [...STATE.orcamento].sort((a,b)=>(b.qtd*b.preco)-(a.qtd*a.preco));
  const totalG = items.reduce((s,i)=>s+i.qtd*i.preco, 0);
  let acum = 0;

  if (!items.length) {
    document.getElementById('preview-abc-rel').innerHTML = '<div style="padding:24px;text-align:center;color:#999">Nenhum item no orçamento</div>';
    return;
  }

  const rows = items.map((it, i) => {
    const v = it.qtd * it.preco;
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
  const items = STATE.orcamento;
  const sub = items.reduce((s,i)=>s+i.qtd*i.preco, 0);
  const bdi = STATE.bdi;
  const total = sub * (1 + bdi/100);

  // Totais por categoria
  const cats = {};
  items.forEach(i => {
    cats[i.cat] = (cats[i.cat]||0) + i.qtd*i.preco;
  });
  const catRows = Object.entries(cats).map(([cat, val]) =>
    `<tr class="sh-row"><td>${cat}</td><td style="text-align:right">${fmtMoeda(val)}</td>
     <td style="text-align:right">${(sub > 0 ? val/sub*100 : 0).toFixed(1)}%</td>
     <td style="text-align:right">${fmtMoeda(val*(1+bdi/100))}</td></tr>`
  ).join('');

  // Auditoria summary
  const acima = items.filter(i => i.ref > 0 && i.preco > i.ref*1.05).length;
  const conforme = items.filter(i => i.ref > 0 && i.preco <= i.ref*1.05).length;
  const nf = items.filter(i => !i.ref || i.ref === 0).length;

  document.getElementById('preview-resumo-rel').innerHTML = `<table>
    <tr><td colspan="4" class="sh-header">${modelo.resumo}</td></tr>
    <tr><td colspan="4" class="sh-sub">Obra: ${meta.obra} | ${meta.orgao} | Processo: ${meta.edital} | Moeda: ${moedaCodigo()}</td></tr>
    <tr class="sh-meta"><td class="lbl">Responsável:</td><td>${meta.rt} — ${meta.crea}</td><td class="lbl">ART/RRT:</td><td>${meta.art}</td></tr>
    <tr class="sh-meta"><td class="lbl">Local:</td><td>${meta.local}</td><td class="lbl">Data Base:</td><td>${meta.data}</td></tr>
    <tr class="sh-meta"><td class="lbl">Fonte:</td><td>${meta.fonte}</td><td class="lbl">Emissão:</td><td>${new Date().toLocaleDateString('pt-BR')}</td></tr>

    <tr><td colspan="4" style="padding:8px 10px;background:#e8f0f8;font-weight:800;font-size:12px;border:1px solid #ccc">1. RESUMO FINANCEIRO</td></tr>
    <tr class="sh-col-header"><th>Descrição</th><th colspan="3" style="text-align:right">${moedaHeader('Valor')}</th></tr>
    <tr class="sh-row"><td>Custo Direto (sem BDI)</td><td colspan="3" style="text-align:right">${fmtMoeda(sub)}</td></tr>
    <tr class="sh-row"><td>BDI — ${bdi.toFixed(2)}% (Decreto 7983/2013)</td><td colspan="3" style="text-align:right">${fmtMoeda(sub*bdi/100)}</td></tr>
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
  const items = STATE.orcamento;
  const bdi = STATE.bdi;
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
    [],
    ['Item','Capítulo','Código SINAPI','Descrição','Un','Qtd',moedaHeader('P.Unit'),moedaHeader('Ref.SINAPI'),'Desvio %','BDI %',moedaHeader('P.Unit c/BDI'),moedaHeader('Total c/BDI'),'Categoria'],
  ];
  let sub = 0;
  items.forEach((it, i) => {
    const v = it.qtd * it.preco;
    sub += v;
    const desv = it.ref > 0 ? ((it.preco - it.ref)/it.ref*100).toFixed(2) : '';
    planData.push([
      i+1, it.capitulo || it.cat || 'Serviços', it.cod, it.desc, it.unid,
      it.qtd, valorMoeda(it.preco), it.ref > 0 ? valorMoeda(it.ref) : '',
      desv !== '' ? parseFloat(desv) : '',
      parseFloat(bdi.toFixed(2)),
      parseFloat(valorMoeda(it.preco*(1+bdi/100)).toFixed(2)),
      parseFloat(valorMoeda(v*(1+bdi/100)).toFixed(2)),
      it.cat
    ]);
  });
  planData.push([]);
  planData.push(['','','','','','SUBTOTAL (sem BDI):','','','','',valorMoeda(sub)]);
  planData.push(['','','','','','BDI ('+bdi.toFixed(2)+'%):','','','','',valorMoeda(sub*bdi/100)]);
  planData.push(['','','','','','TOTAL GERAL c/ BDI:','','','','',valorMoeda(sub*(1+bdi/100))]);

  const ws1 = XLSX.utils.aoa_to_sheet(planData);
  ws1['!cols'] = [
    {wch:5},{wch:22},{wch:12},{wch:45},{wch:6},{wch:10},{wch:14},{wch:14},{wch:10},{wch:8},{wch:16},{wch:16},{wch:12}
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilha Orçamentária');

  // ── Aba 2: Composição BDI ──
  const c = STATE.bdiComponents;
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
    ['','BDI CALCULADO:', parseFloat(bdi.toFixed(2))],
    ['','Fórmula: [(1+AC+S+R)(1+DF)(1+L)/(1-I)-1]×100',''],
    ['','Limite TCU Acórdão 2622/2013:', 25],
    ['','Status:', bdi <= 25 ? 'CONFORME' : 'NÃO CONFORME'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(bdiData);
  ws2['!cols'] = [{wch:10},{wch:35},{wch:16}];
  XLSX.utils.book_append_sheet(wb, ws2, 'BDI');

  // ── Aba 3: Curva ABC ──
  const abcItems = [...items].sort((a,b)=>(b.qtd*b.preco)-(a.qtd*a.preco));
  const totalG = abcItems.reduce((s,i)=>s+i.qtd*i.preco,0);
  let acum = 0;
  const abcData = [
    ['CURVA ABC — ANÁLISE DE REPRESENTATIVIDADE'],
    ['Obra:', meta.obra],
    [],
    ['#','Código','Descrição','Un','Qtd',moedaHeader('P.Unit'),moedaHeader('Total'),'% Item','% Acumulado','Classe'],
  ];
  abcItems.forEach((it, i) => {
    const v = it.qtd * it.preco;
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
    STATE.orcamento.forEach(it => {
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

  // Save
  const fname = (meta.obra || 'orcamento').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'') + '_TLPlanly.xlsx';
  XLSX.writeFile(wb, fname);
  toast('Excel profissional gerado: ' + fname, 'success');
}

function exportarExcelBDI() {
  if (!window.XLSX) return;
  const meta = getMeta();
  const c = STATE.bdiComponents;
  const bdi = STATE.bdi;
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
    ['','BDI CALCULADO:', parseFloat(bdi.toFixed(2))],
    ['','Limite TCU:', 25],
    ['','Status:', bdi <= 25 ? 'CONFORME' : 'NÃO CONFORME'],
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
  renderPreviewPlanilha();
  window.print();
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

let CPU_BIBLIOTECA = [];   // composições salvas

// Persiste biblioteca
function cpuSaveLib() {
  try { localStorage.setItem('tlplanly_cpu_lib', JSON.stringify(CPU_BIBLIOTECA)); } catch(e){}
}
function cpuLoadLib() {
  try {
    const s = localStorage.getItem('tlplanly_cpu_lib');
    if (s) CPU_BIBLIOTECA = JSON.parse(s);
  } catch(e){}
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
    return `<div class="search-item" onclick="cpuSelecionarInsumo('${cod}')">
      <span class="search-item-code">${cod}</span>
      ${i.descricao||''}
      <span class="search-item-unit">${i.unidade||'UN'}</span>
      <span style="float:right;color:var(--gold);font-weight:700">${fmtMoeda(i.precoMedio||0)}</span>
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
  if (/SERVENTE|PEDREIRO|MESTRE|OFICIAL|CARPINTEIRO|FERREI|ENCANADOR|ELETRICISTA|PINTOR|AJUDANTE/.test(desc)) {
    tipoSel.value = 'S';
  } else if (/CAMINHÃO|BETONEIRA|COMPACTADOR|RETROESCAVADEIRA|ESCAVADEIRA|GUINDASTE|ANDAIME/.test(desc)) {
    tipoSel.value = 'E';
  } else {
    tipoSel.value = 'M';
  }
  const prev = document.getElementById('cpu-ins-preview');
  prev.style.display = 'block';
  prev.innerHTML = `<span class="enc-auto-badge">&#9432; ${item.descricao} · ${item.unidade} · ${fmtMoeda(item.precoMedio)}</span>`;
}

function cpuAdicionarInsumo() {
  if (!_cpuInsumoSelecionado) { toast('Selecione um insumo SINAPI primeiro', 'error'); return; }
  const coef = parseFloat(document.getElementById('cpu-ins-coef').value) || 1;
  const tipo = document.getElementById('cpu-ins-tipo').value;
  const item = _cpuInsumoSelecionado;
  CPU.insumos.push({
    cod: item.codigoSinapi || item.codigo || '',
    desc: item.descricao || '',
    unid: item.unidade || 'UN',
    tipo,
    coef,
    preco: item.precoMedio || 0,
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
    const sub = ins.coef * ins.preco;
    cd += sub;
    const tagColors = { M:'cpu-tag-M', E:'cpu-tag-E', S:'cpu-tag-S', T:'cpu-tag-T' };
    const tagLabels = { M:'Material', E:'Equip.', S:'MO', T:'Transp.' };
    return `<div class="cpu-insumo-row">
      <span class="td-mono" style="color:var(--gold);font-size:11px">${ins.cod}</span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${ins.desc}">
        <span class="cpu-tag ${tagColors[ins.tipo]}" style="margin-right:4px">${tagLabels[ins.tipo]}</span>${ins.desc}
      </span>
      <span style="color:var(--text2)">${ins.unid}</span>
      <input type="number" value="${ins.coef}" step="0.001" min="0.0001"
        class="form-input" style="padding:4px 6px;font-size:12px;text-align:right"
        onchange="CPU.insumos[${i}].coef=parseFloat(this.value)||0;cpuRenderInsumos()"/>
      <input type="number" value="${ins.preco.toFixed(2)}" step="0.01" min="0"
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
  const grupos = { M: 0, E: 0, S: 0, T: 0 };
  CPU.insumos.forEach(i => { grupos[i.tipo] += i.coef * i.preco; });
  const moComEnc = grupos.S * (1 + CPU.encPct / 100);
  const custoTotal = grupos.M + moComEnc + grupos.E + grupos.T;
  return { grupos, moComEnc, custoTotal };
}

function cpuRenderResultado() {
  const cod  = document.getElementById('cpu-cod').value  || 'CPU-001';
  const desc = document.getElementById('cpu-desc').value || 'Composição sem descrição';
  const unid = document.getElementById('cpu-unid').value || 'm²';
  const tipo = document.getElementById('cpu-tipo').value || 'Serviços Gerais';
  CPU.cod = cod; CPU.desc = desc; CPU.unid = unid; CPU.tipo = tipo;

  const { grupos, moComEnc, custoTotal } = cpuCalcPrecoUnitario();

  const linhas = [
    ['Materiais (M)', grupos.M],
    ['Mão de Obra s/ encargos (S)', grupos.S],
    ['Encargos Sociais (' + CPU.encPct + '%)', grupos.S * CPU.encPct / 100],
    ['Mão de Obra c/ Encargos', moComEnc],
    ['Equipamentos (E)', grupos.E],
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
    const matchSearch = !search || c.cod.toUpperCase().includes(search) || c.desc.toUpperCase().includes(search);
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
    <div class="cpu-lib-item" onclick="cpuVerFicha(${c.id})">
      <span class="cpu-lib-code">${c.cod}</span>
      <div style="flex:1;min-width:0">
        <div class="cpu-lib-desc" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.desc}</div>
        <div style="font-size:10px;color:var(--text3)">${c.tipo} · ${c.insumos.length} insumos · ${c.criadaEm}</div>
      </div>
      <span class="cpu-lib-un">${c.unid}</span>
      <span class="cpu-lib-preco">${fmtMoeda(c.precoUnitario)}</span>
    </div>`).join('');
}

let _cpuFichaSelecionada = null;
function cpuVerFicha(id) {
  const c = CPU_BIBLIOTECA.find(x => x.id === id);
  if (!c) return;
  _cpuFichaSelecionada = c;
  document.getElementById('cpu-ficha-card').style.display = 'block';
  const grupos = { M:0, E:0, S:0, T:0 };
  c.insumos.forEach(i => { grupos[i.tipo] += i.coef * i.preco; });
  const moEnc = grupos.S * c.encPct / 100;
  const rows = c.insumos.map(ins => {
    const tagLabels = { M:'Mat', E:'Eq', S:'MO', T:'Tr' };
    const tagColors = { M:'cpu-tag-M', E:'cpu-tag-E', S:'cpu-tag-S', T:'cpu-tag-T' };
    return `<div class="cpu-insumo-row" style="padding:5px 0;font-size:11px">
      <span style="color:var(--gold);font-family:monospace">${ins.cod}</span>
      <span style="overflow:hidden;text-overflow:ellipsis" title="${ins.desc}">
        <span class="cpu-tag ${tagColors[ins.tipo]}" style="margin-right:4px;font-size:9px">${tagLabels[ins.tipo]}</span>${ins.desc}
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
  saveState(); renderElaborar(); renderDashboard(); preencherSelectsOperacionais();
  toast('CPU "' + c.cod + '" enviada ao orçamento', 'success');
  showView('elaborar');
}

// ─── EXPORTAR / IMPORTAR BIBLIOTECA ───────────────────────
function cpuExportarBiblioteca() {
  if (!CPU_BIBLIOTECA.length) { toast('Biblioteca vazia', 'error'); return; }
  downloadJSON(CPU_BIBLIOTECA, 'TLPlanly_CPU_Biblioteca.json');
  toast('Biblioteca exportada', 'success');
}

function cpuImportarBiblioteca() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json';
  inp.onchange = async function(e) {
    try {
      const txt = await e.target.files[0].text();
      const data = JSON.parse(txt);
      if (!Array.isArray(data)) throw new Error('Formato inválido');
      CPU_BIBLIOTECA = [...CPU_BIBLIOTECA, ...data];
      cpuSaveLib(); cpuRenderBiblioteca();
      toast(data.length + ' composições importadas', 'success');
    } catch(err) { toast('Erro: ' + err.message, 'error'); }
  };
  inp.click();
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
    q: ['começar','iniciar','primeiro','como usar','tutorial','ajuda','novato','não sei','por onde'],
    r: `**Bem-vindo ao TLPlanly!** Vou te guiar pelos primeiros passos. 🚀\n\n**Fluxo recomendado:**\n1️⃣ Configure a **UF e o tipo de obra** em Configurações\n2️⃣ Carregue ou confirme a **base SINAPI** em Bases de Referência\n3️⃣ Configure o **BDI** na aba BDI/Encargos\n4️⃣ **Elabore o orçamento** buscando insumos SINAPI\n5️⃣ Gere a **Curva ABC** para análise\n6️⃣ **Exporte** a planilha no formato edital\n\nQuer que eu te guie em algum passo específico?`,
    chips: ['Sim me guie','Como calcular BDI?','Sim me guie','Como exportar?']
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
    r: `**Como criar uma CPU no TLPlanly:** ⚙️\n\n1. Clique em **Composições (CPU)** no menu\n2. **Passo 1:** Defina código, descrição, unidade e tipo\n3. **Passo 2:** Busque insumos SINAPI e adicione com coeficientes\n   → O sistema detecta automaticamente se é Material ou MO\n   → Edite coeficientes e preços direto na tabela\n4. **Passo 3:** Escolha o regime de encargos (ND ou Desonerado)\n5. **Passo 4:** Veja o custo unitário final detalhado por grupo\n6. **Salve na Biblioteca** ou **Envie direto ao Orçamento**\n\n💡 Coeficientes são geralmente tirados de tabelas técnicas como TCPO ou composições SINAPI.`,
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
    r: `**Como importar planilhas de editais:** 📄\n\n1. Ir em **Importar Edital** no menu\n2. Arraste **todos os arquivos do edital/planilha** de uma vez: PDF digital, PDF escaneado, imagens, Excel, ODS ou CSV\n3. Configure página inicial/final se necessário\n4. Clique **"Extrair Dados"**\n5. O sistema tenta texto digital primeiro e aciona **OCR automático** quando o arquivo for digitalizado\n6. Revise os itens, confira a origem de cada linha e baixe a **Memória .md** se quiser rastreabilidade\n7. Confirme para **Elaboração** ou **Auditoria**\n\n💡 Para orçamento, o TLPlanly usa dados estruturados. O Markdown entra como memória de conferência, não como substituto da planilha.`,
    chips: ['Ir para Importar','OCR PDF escaneado?','Memória .md']
  },

  ocr: {
    q: ['ocr','pdf escaneado','imagem pdf','digitalizado','reconhecimento texto'],
    r: `**OCR — Reconhecimento de Texto em PDFs Escaneados** 🔍\n\nO TLPlanly usa **Tesseract.js** no navegador. No módulo **Importar Edital**, o OCR agora entra automaticamente quando o PDF não tem texto aproveitável ou quando você envia imagem digitalizada.\n\n✅ **Vantagens:**\n• Aceita lote com PDF + anexos + imagens\n• Mantém a origem de cada item extraído\n• Gera **Memória .md** para conferência\n\n**Passos:**\n1. Importar Edital\n2. Arraste todos os arquivos relacionados\n3. Clique **Extrair Dados**\n4. Revise os itens e confirme para Elaboração ou Auditoria\n\n⚠️ PDFs de baixa qualidade reduzem a precisão. Resolução mínima recomendada: 200 DPI.`,
    chips: ['Ir para Importar','Como importar edital?','Dica de qualidade OCR']
  },

  // ── EXPORTAÇÃO ────────────────────────────────────────
  exportar: {
    q: ['exportar','gerar planilha','relatório','gerar excel','planilha excel','pdf edital','imprimir'],
    r: `**Como exportar a planilha orçamentária:** 📤\n\n1. Acesse **Exportar / Relatório** no menu\n2. Preencha os dados da obra (nome, órgão, RT, CREA, ART/RRT)\n3. Escolha a aba desejada para pré-visualizar\n4. Clique **"Excel (.xlsx) Profissional"**\n\nO Excel agora leva: Planilha Orçamentária, BDI, Curva ABC, Encargos, Planejamento, Medições, Quantitativos e Anexos.\n\n✅ O formato segue padrão exigido pelo **TCU/CGU/editais públicos** e também serve para acompanhamento de obra.`,
    chips: ['Ir para Relatório','Modelo de relatório','Como configurar moeda']
  },

  relatorio_moeda: {
    q: ['moeda','cotação','cotacao','dólar','dolar','euro','modelo relatório','modelo relatorio','duplicar item','mover item','zerar quantidade'],
    r: `**Ajustes avançados do orçamento**\n\nNo TLPlanly você pode:\n\n• Alterar a **moeda de exibição** em Configurações, mantendo os custos internos em reais\n• Informar a **cotação** usada na conversão\n• Escolher o **modelo de relatório**: órgão público, construtora, medição ou auditoria\n• No orçamento, **duplicar itens**, mover a ordem e zerar quantidades sem apagar a estrutura\n\nFluxo recomendado: configure moeda/modelo → elabore ou importe itens → ajuste ordem/quantidades → exporte o Excel profissional.`,
    chips: ['Ir para Configurações','Ir para Relatório','Ir para Elaborar']
  },

  gestao_obra: {
    q: ['planejamento','medição','medicao','gantt','curva s','quantitativos','anexos','backup','acompanhamento'],
    r: `**Gestão da Obra no TLPlanly**\n\nAgora o orçamento não fica isolado. Você pode:\n\n• Gerar **Planejamento** a partir dos itens do orçamento\n• Registrar **Medições** por período\n• Criar **Quantitativos vinculados** com fórmulas\n• Vincular **anexos e especificações** por item\n• Criar **backups/pontos de restauração**\n\nFluxo recomendado: orçamento → quantitativos → planejamento → medições → relatório completo.`,
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
  elaborar:     { nome: 'Elaborar Orçamento', dica: 'Pesquise insumos SINAPI pelo código ou descrição e adicione ao orçamento com quantidade e preço.' },
  bdi:          { nome: 'BDI & Encargos', dica: 'Configure os componentes do BDI conforme o Decreto 7983/2013 e escolha o regime de encargos.' },
  curvaABC:     { nome: 'Curva ABC', dica: 'Gere a análise de Pareto do orçamento para identificar os itens de maior impacto financeiro.' },
  memoria:      { nome: 'Memória de Cálculo', dica: 'Veja o detalhamento de cada item com encargos sociais, BDI e referência SINAPI.' },
  planejamento: { nome: 'Planejamento', dica: 'Gere tarefas do orçamento, ajuste datas, dependências, Gantt e Curva S.' },
  medicoes:     { nome: 'Medições', dica: 'Registre quantidades executadas por período e acompanhe saldo, avanço e excedentes.' },
  quantitativos:{ nome: 'Quantitativos', dica: 'Crie fórmulas auxiliares vinculadas aos serviços e aplique o resultado à quantidade contratada.' },
  documentos:   { nome: 'Anexos / Especificações', dica: 'Registre especificações, fotos e documentos vinculados à obra ou a itens do orçamento.' },
  backups:      { nome: 'Backups', dica: 'Crie pontos de restauração locais para orçamento, planejamento, medições e anexos.' },
  auditoria:    { nome: 'Análise SINAPI', dica: 'Compare os preços do orçamento com a tabela SINAPI e identifique desvios acima da tolerância.' },
  conformidade: { nome: 'Conformidade BDI', dica: 'Verifique se o BDI calculado está dentro dos limites do TCU Acórdão 2622/2013.' },
  relatorio:    { nome: 'Exportar / Relatório', dica: 'Preencha os dados da obra, escolha o modelo de relatório e exporte Excel/PDF com orçamento, BDI, ABC, planejamento, medições e anexos.' },
  bases:        { nome: 'Bases de Referência', dica: 'Carregue e gerencie SINAPI, SICRO 3 e bases estaduais. Use o OCR para PDFs escaneados.' },
  importar:     { nome: 'Importar Edital', dica: 'Importe planilhas de editais em PDF ou Excel e faça o match automático com a base SINAPI.' },
  cpu:          { nome: 'Composições (CPU)', dica: 'Crie composições analíticas próprias com insumos SINAPI, coeficientes e encargos sociais.' },
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
  if (!asksToContinue) return null;

  if (/(moeda|cotacao|dolar|euro|modelo padrao)/.test(norm)) return copilotActionForView('config');
  if (/(relatorio|exportar|pdf final|gerar pdf|baixar)/.test(norm)) return copilotActionForView('relatorio');
  if (/(upload|arquivo|pdf|excel|planilha|edital|import)/.test(norm)) return copilotActionForView('importar');
  if (/(bdi|encargo)/.test(norm)) return copilotActionForView('bdi');
  if (/(curva abc|abc|pareto)/.test(norm)) return copilotActionForView('curvaABC');
  if (/(planejamento|gantt|curva s|cronograma)/.test(norm)) return copilotActionForView('planejamento');
  if (/(medicao|medicoes|medir|executado|acompanhamento)/.test(norm)) return copilotActionForView('medicoes');
  if (/(quantitativo|quantitativos|formula|memoria quantitativa)/.test(norm)) return copilotActionForView('quantitativos');
  if (/(anexo|anexos|documento|especificacao|foto)/.test(norm)) return copilotActionForView('documentos');
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
    copilotSetChips(['Ir para Configurações','Ir para Bases','Ir para BDI','Ir para Elaborar','Ir para Importar']);
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
    totalOrcamento: STATE.orcamento?.reduce((s,i) => s + i.qtd * i.preco, 0) ?? 0,
    bdi: STATE.bdi ?? 0,
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
    || /^(o que e bdi|como importar|como exportar|como calcular bdi|o que e sinapi|o que e curva abc|limite bdi)/.test(norm);

  // Comandos de navegação e chips previsíveis são locais para não prender o usuário em chamadas externas.
  if (!localFirst) {
    const usouAPI = await copilotTentarAPI(txt);
    if (usouAPI) return;
  }

  // ══ MAPA DE TÓPICOS ═══════════════════════════════════════
  // Cada entrada: array de palavras/frases que disparam a resposta
  // Cobre chips gerados pelo próprio sistema + variações naturais
  const TOPICS = [
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
    copilotSetChips(['Ir para Elaborar','Ir para Planejamento','Ir para Medições','Ir para Quantitativos','Ir para Importar','Ir para Relatório']);
    return;
  }

  const navMap = [
    { keys:['ir para bdi','abrir bdi','acessar bdi','modulo bdi','ir para encargos'], view:'bdi' },
    { keys:['ir para curva','ir para abc','abrir abc','curva abc'], view:'curvaABC' },
    { keys:['ir para elaborar','ir para orcamento','abrir orcamento'], view:'elaborar' },
    { keys:['ir para memoria','ir para memoria calculo'], view:'memoria' },
    { keys:['ir para planejamento','abrir planejamento','ir para cronograma','abrir gantt','ir para gantt'], view:'planejamento' },
    { keys:['ir para medicoes','ir para medicao','abrir medicoes','abrir medicao','ir para acompanhamento'], view:'medicoes' },
    { keys:['ir para quantitativos','ir para quantitativo','abrir quantitativos','abrir quantitativo'], view:'quantitativos' },
    { keys:['ir para anexos','ir para documentos','ir para especificacoes','abrir anexos'], view:'documentos' },
    { keys:['ir para backups','ir para backup','abrir backups','restaurar backup'], view:'backups' },
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
    const sub = STATE.orcamento.reduce((s,i)=>s+i.qtd*i.preco,0);
    copilotBotMsg(`**Seu orçamento atual:**\n\n• **${STATE.orcamento.length} itens** lançados\n• Subtotal (sem BDI): **${fmtMoeda(sub)}**\n• BDI configurado: **${STATE.bdi.toFixed(2)}%**\n• Total c/ BDI: **${fmtMoeda(sub*(1+STATE.bdi/100))}**\n• Base SINAPI: **${STATE.sinapiBase.length.toLocaleString('pt-BR')} insumos** carregados`);
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


