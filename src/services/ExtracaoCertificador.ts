export type CertStatus = 'aprovado' | 'corrigido' | 'pendente' | 'bloqueado';

export interface ItemExtraidoCertificavel {
    cod?: string;
    desc?: string;
    unid?: string;
    qtd?: number;
    preco?: number;
    refSinapi?: number;
    matchTipo?: string;
    totalLinha?: number;
    origemArquivo?: string;
    origemMetodo?: string;
    linhaOrigem?: string;
    numerosOrigem?: number[];
    selecionado?: boolean;
    [key: string]: any;
}

export interface ItemCertificado extends ItemExtraidoCertificavel {
    certStatus: CertStatus;
    certScore: number;
    certMotivos: string[];
    certCorrecoes: string[];
    selecionado: boolean;
}

export interface RelatorioCertificacao {
    status: CertStatus;
    score: number;
    rodadas: number;
    total: number;
    aprovado: number;
    corrigido: number;
    pendente: number;
    bloqueado: number;
    motivos: string[];
}

type CamposCertificacao = Pick<ItemCertificado, 'certStatus' | 'certScore' | 'certMotivos' | 'certCorrecoes' | 'selecionado'>;

const UNIDADES_VALIDAS = new Set([
    'UN', 'UNID', 'UND', 'M', 'M2', 'M3', 'M2KM', 'M3KM', 'TKM', 'KG', 'T', 'L', 'H', 'HR', 'VG', 'VB', 'CJ', 'GL',
    'MES', 'PONTO', 'KM', 'MÃŠS', 'MÂ²', 'MÂ³', 'M2XMES',
]);
const CODIGO_ITEM_RE = /(?:\b(ED-\d{3,6})\b|\b(CPU-\d+)\b|\b([A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2})\b|(?<![,.])\b(\d{3,7})(?=\s+(?:SINAPI|SICRO|SICOR|ORSE|DNIT|SUDECAP)\b)(?![,.])|(?<![,.])\b(\d{5,7})\b(?![,.]))/i;
const NUM_BR_RE_SRC = String.raw`-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?`;
const UNIDADE_TAIL_RE_SRC = String.raw`M2XMES|M2KM|M3KM|TKM|MÂ²|M2|MÂ³|M3|MÃŠS|MES|UNID|UND|UN|KG|T|VG|VB|CJ|GL|HR|H|L|PONTO|KM|M`;
const ITEM_TAIL_RE = new RegExp(String.raw`\b(${UNIDADE_TAIL_RE_SRC})\b\s+(${NUM_BR_RE_SRC})\s+(?:R\$\s*)?(${NUM_BR_RE_SRC})\s*(?:R\$)?\s+(?:R\$\s*)?(${NUM_BR_RE_SRC})\s*(?:R\$)?`, 'gi');

function normalizarTextoSimples(text: string): string {
    return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function parseNumeroBR(valor: any): number {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    const raw = String(valor ?? '').trim();
    if (!raw) return 0;
    const clean = raw
        .replace(/R\$/gi, '')
        .replace(/\s+/g, '')
        .replace(/[^\d,.\-]/g, '');
    if (!clean || clean === '-' || clean === ',' || clean === '.') return 0;

    if (clean.includes(',') && clean.includes('.')) {
        return Number(clean.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (clean.includes(',')) {
        return Number(clean.replace(',', '.')) || 0;
    }
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount > 1) return Number(clean.replace(/\./g, '')) || 0;
    return Number(clean) || 0;
}

export function normalizarUnidade(unid: string | undefined): string {
    const u = String(unid || 'UN').trim().toUpperCase()
        .replace('MÂ²', 'M2')
        .replace('MÂ³', 'M3')
        .replace(/^UND$/, 'UN')
        .replace(/^UNID$/, 'UN')
        .replace(/^MÃŠS$/, 'MES');
    return u || 'UN';
}

export function linhaDeImportacaoIgnorada(line: string): boolean {
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

export function extrairNumerosOperacionais(text: string): number[] {
    const matches = String(text || '').matchAll(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?/g);
    const values: number[] = [];
    for (const match of matches) {
        const token = match[0];
        const index = match.index || 0;
        const before = String(text).slice(Math.max(0, index - 8), index).toUpperCase();
        const after = String(text).slice(index + token.length, index + token.length + 8).toUpperCase();
        if (/AF_$/.test(before) || /^[/-]\d{2,4}/.test(after)) continue;
        const n = parseNumeroBR(token);
        if (Number.isFinite(n)) values.push(n);
    }
    return values;
}

export function parsearLinhaOrcamentaria(line: string): ItemExtraidoCertificavel | null {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    if (linhaDeImportacaoIgnorada(cleaned)) return null;

    const codMatch = cleaned.match(CODIGO_ITEM_RE);
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
    let numeros: number[] = [];

    const tails = [...afterCode.matchAll(ITEM_TAIL_RE)];
    const tail = tails.length ? tails[tails.length - 1] : null;
    if (tail && tail.index !== undefined) {
        unid = normalizarUnidade(tail[1]);
        qtd = parseNumeroBR(tail[2]);
        preco = parseNumeroBR(tail[3]);
        totalLinha = parseNumeroBR(tail[4]);
        numeros = [qtd, preco, totalLinha];
        desc = afterCode.slice(0, tail.index)
            .replace(/^(SINAPI|SICOR|SICRO|SUDECAP|ORSE|DNIT)\b/i, '')
            .replace(/\b(AF_\d{2}\/\d{4}|SEDI|CANT|COMPOSICAO|COMPOSIÃ‡ÃƒO)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    } else {
        numeros = extrairNumerosOperacionais(afterCode).filter(n => n > 0);
        if (numeros.length >= 3) {
            qtd = numeros[numeros.length - 3];
            preco = numeros[numeros.length - 2];
            totalLinha = numeros[numeros.length - 1];
        } else if (numeros.length >= 2) {
            qtd = numeros[numeros.length - 2];
            preco = numeros[numeros.length - 1];
        }
        desc = afterCode
            .replace(/\b(SINAPI|SICRO|ORSE|DNIT)\b/gi, ' ')
            .replace(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,8})|-?\d+(?:[.,]\d{1,8})?/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    desc = desc.replace(/\bTOTAL\b.*$/i, '').replace(/\s+/g, ' ').trim();
    if (desc.length < 3) return null;

    return {
        cod,
        desc: desc.substring(0, 240),
        unid,
        qtd: qtd > 0 ? qtd : 1,
        preco: preco > 0 ? preco : 0,
        totalLinha,
        linhaOrigem: cleaned,
        numerosOrigem: numeros,
        origem: 'pdf',
    };
}

export function segmentarLinhaOrcamentaria(line: string): string[] {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    const re = new RegExp(CODIGO_ITEM_RE.source, 'gi');
    const matches = [...cleaned.matchAll(re)].filter(m => m.index !== undefined && codigoSegmentavel(cleaned, m));
    if (matches.length <= 1) return [cleaned];
    return matches
        .map((match, index) => {
            const start = match.index || 0;
            const end = index + 1 < matches.length ? (matches[index + 1].index || cleaned.length) : cleaned.length;
            return cleaned.slice(start, end).trim();
        })
        .filter(Boolean);
}

function codigoSegmentavel(line: string, match: RegExpMatchArray): boolean {
    const token = match[0] || '';
    const index = match.index || 0;
    if (index === 0) return true;
    const prefix = line.slice(0, index);
    if (/^\d{1,3}\s+$/.test(prefix) && /^[A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2}$/i.test(token)) return true;
    const before = line.slice(Math.max(0, index - 40), index);
    return /(?:R\$\s*|\d{1,3}(?:\.\d{3})*,\d{2}\s*)$/.test(before);
}

function linhaIniciaComCodigoItem(line: string): boolean {
    const match = line.match(CODIGO_ITEM_RE);
    if (!match || match.index === undefined) return false;
    if (match.index === 0) return true;
    const prefix = line.slice(0, match.index);
    return /^\d{1,3}\s+$/.test(prefix) && /^[A-Z0-9]{2}\.[A-Z0-9]{2}\.[A-Z0-9]{2}$/i.test(match[0] || '');
}

export function parsearLinhasOrcamentarias(lines: string[]): ItemExtraidoCertificavel[] {
    const items: ItemExtraidoCertificavel[] = [];
    let buffer: { linhas: string[]; prefixo: string[] } | null = null;
    let prefixoPendente: string[] = [];

    const finalizar = () => {
        if (!buffer?.linhas.length) return;
        const item = parsearLinhaOrcamentaria(montarTextoBuffer(buffer.linhas, buffer.prefixo));
        if (item) items.push(item);
        buffer = null;
    };

    const segmentos = lines.flatMap(rawLine => {
        const cleaned = String(rawLine || '').replace(/\s+/g, ' ').trim();
        return cleaned ? segmentarLinhaOrcamentaria(cleaned) : [];
    });

    for (let idx = 0; idx < segmentos.length; idx++) {
        const segment = segmentos[idx];
        const nextSegment = segmentos[idx + 1] || '';
        if (linhaDeImportacaoIgnorada(segment)) {
            finalizar();
            prefixoPendente = [];
            continue;
        }
        if (linhaIniciaComCodigoItem(segment)) {
            finalizar();
            buffer = { linhas: [segment], prefixo: prefixoPendente };
            prefixoPendente = [];
        } else if (buffer && linhaProvavelPrefixoProximoItem(segment, nextSegment)) {
            finalizar();
            prefixoPendente.push(segment);
            if (prefixoPendente.length > 4) prefixoPendente = prefixoPendente.slice(-4);
        } else if (buffer) {
            buffer.linhas.push(segment);
        } else if (linhaComplementarDescricao(segment)) {
            prefixoPendente.push(segment);
            if (prefixoPendente.length > 4) prefixoPendente = prefixoPendente.slice(-4);
        }
    }
    finalizar();
    return items;
}

function linhaComplementarDescricao(line: string): boolean {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    if (!cleaned || cleaned.length < 3) return false;
    if (linhaDeImportacaoIgnorada(cleaned)) return false;
    if (linhaIniciaComCodigoItem(cleaned)) return false;
    if (/^\d{1,2}\s+[A-ZÀ-Ú\s/.()-]{3,60}$/.test(cleaned)) return false;
    return true;
}

function linhaProvavelPrefixoProximoItem(line: string, nextLine: string): boolean {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    const next = String(nextLine || '').replace(/\s+/g, ' ').trim();
    if (!linhaComplementarDescricao(cleaned)) return false;
    if (!linhaIniciaComCodigoItem(next)) return false;
    if (linhaContinuidadeFinalItem(cleaned)) return false;
    return cleaned.length >= 20;
}

function linhaContinuidadeFinalItem(line: string): boolean {
    const cleaned = String(line || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return true;
    if (cleaned.length < 18) return true;
    if (new RegExp(ITEM_TAIL_RE.source, 'i').test(cleaned)) return true;
    if (/^AF_\d{2}\/\d{4}/i.test(cleaned)) return true;
    if (/AF_\d{2}\/\d{4}/i.test(cleaned) && cleaned.length <= 90) return true;
    if (/^\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?$/.test(cleaned)) return true;
    if (/^(?:M|MM|CM|KG|UN|M2|M3)\s*\.?\s*AF_/i.test(cleaned)) return true;
    return false;
}

function montarTextoBuffer(linhas: string[], prefixo: string[] = []): string {
    const [primeira, ...resto] = linhas.map(l => String(l || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!primeira) return '';
    const complementos = [...prefixo, ...resto].filter(linhaComplementarDescricao);
    const extras = complementos.join(' ').trim();
    if (!extras) return primeira;

    const tails = [...primeira.matchAll(ITEM_TAIL_RE)];
    const tail = tails.length ? tails[tails.length - 1] : null;
    if (tail && tail.index !== undefined) {
        const antes = primeira.slice(0, tail.index).trim();
        const depois = primeira.slice(tail.index).trim();
        return `${antes} ${extras} ${depois}`.replace(/\s+/g, ' ').trim();
    }
    return `${primeira} ${extras}`.replace(/\s+/g, ' ').trim();
}

function avaliarItem(item: ItemExtraidoCertificavel, modo: 'planilha' | 'estimativa'): CamposCertificacao {
    const motivos: string[] = [];
    const correcoes = Array.isArray(item.certCorrecoes) ? [...item.certCorrecoes] : [];
    const desc = String(item.desc || '').trim();
    const origem = `${item.linhaOrigem || ''} ${item.origem || ''} ${item.origemMetodo || ''} ${item.metodo || ''} ${item.capitulo || ''} ${desc}`;
    const qtd = Number(item.qtd) || 0;
    const preco = Number(item.preco) || 0;
    const totalLinha = Number(item.totalLinha) || 0;
    const totalCalculado = qtd * preco;
    const unid = normalizarUnidade(item.unid);
    const origemNorm = normalizarTextoSimples(origem);
    const quantidadePareceAno = Number.isInteger(qtd) && qtd >= 1900 && qtd <= 2100;
    const estimativaInferida = modo === 'estimativa' && /inferido|analisador|estimativa por documentos/.test(origemNorm);
    let bloqueios = 0;
    let alertas = 0;

    if (linhaDeImportacaoIgnorada(origem)) {
        motivos.push('Linha parece ser cabecalho, rodape ou total da planilha.');
        bloqueios++;
    }
    if (/[=]\s*procv|procv\s*\(|vlookup\s*\(|\bR\$\s*R\$/i.test(origem)) {
        motivos.push('Descricao contem formula, marcador monetario quebrado ou resto de extracao.');
        bloqueios++;
    }
    if (desc.length < 5) {
        motivos.push('Descricao insuficiente para validar o item.');
        bloqueios++;
    }
    if (!qtd || qtd <= 0) {
        motivos.push('Quantidade ausente ou zerada.');
        bloqueios++;
    }
    if (preco < 0 || (!preco && modo === 'planilha')) {
        motivos.push('Preco unitario ausente ou invalido.');
        modo === 'planilha' ? bloqueios++ : alertas++;
    }
    if (qtd > 1_000_000) {
        motivos.push('Quantidade muito alta para importacao automatica.');
        bloqueios++;
    }
    if (preco > 10_000_000) {
        motivos.push('Preco unitario muito alto para importacao automatica.');
        bloqueios++;
    }
    if (totalCalculado > 100_000_000 && modo === 'planilha') {
        motivos.push('Total calculado fora da escala esperada; exige correcao antes do orcamento.');
        bloqueios++;
    }
    if (modo === 'estimativa' && quantidadePareceAno) {
        motivos.push('Quantidade parece ser ano/data extraida do documento; validar manualmente.');
        bloqueios++;
    }
    if (estimativaInferida && !totalLinha && totalCalculado > 500_000) {
        motivos.push('Estimativa inferida com total muito alto; exige memoria de calculo antes de entrar no orcamento.');
        bloqueios++;
    }
    if (totalLinha > 0 && totalCalculado > 0) {
        const divergencia = Math.abs(totalCalculado - totalLinha) / Math.max(totalLinha, 1);
        if (divergencia > 0.05) {
            motivos.push(`Quantidade x preco nao fecha com o total da linha (${Math.round(divergencia * 100)}% de divergencia).`);
            bloqueios++;
        }
    }
    if (!UNIDADES_VALIDAS.has(unid)) {
        motivos.push('Unidade nao reconhecida automaticamente; validar manualmente.');
        alertas++;
    }
    if (item.matchTipo === 'parcial') {
        motivos.push('Referencia encontrada por descricao; validar codigo sugerido.');
        alertas++;
    }
    if (item.matchTipo === 'nenhum') {
        motivos.push('Sem correspondencia automatica na base SINAPI carregada.');
        alertas++;
    }

    let status: CertStatus = 'aprovado';
    if (bloqueios > 0) status = 'bloqueado';
    else if (alertas > 0) status = 'pendente';
    else if (correcoes.length > 0) status = 'corrigido';

    const score = Math.max(0, Math.min(100, 100 - bloqueios * 35 - alertas * 10));
    return { certStatus: status, certScore: score, certMotivos: motivos, certCorrecoes: correcoes, selecionado: status !== 'bloqueado' && item.selecionado !== false };
}

function tentarCorrigir(item: ItemExtraidoCertificavel): ItemExtraidoCertificavel {
    const next: ItemExtraidoCertificavel = { ...item, certCorrecoes: Array.isArray(item.certCorrecoes) ? [...item.certCorrecoes] : [] };
    const nums = Array.isArray(next.numerosOrigem) ? next.numerosOrigem.filter(n => n > 0) : [];
    if (nums.length >= 3) {
        const [qtd, preco, total] = nums.slice(-3);
        const atualFecha = Math.abs((Number(next.qtd) || 0) * (Number(next.preco) || 0) - (Number(next.totalLinha) || 0));
        const novoFecha = Math.abs(qtd * preco - total);
        if (!next.totalLinha || novoFecha < atualFecha) {
            next.qtd = qtd;
            next.preco = preco;
            next.totalLinha = total;
            next.certCorrecoes.push('Recalculado pela sequencia quantidade, preco unitario e total da linha.');
        }
    }
    const totalLinha = Number(next.totalLinha) || 0;
    const preco = Number(next.preco) || 0;
    if (totalLinha > 0 && preco > 0) {
        const qtdCalculada = totalLinha / preco;
        const divergencia = Math.abs((Number(next.qtd) || 0) * preco - totalLinha) / Math.max(totalLinha, 1);
        if (divergencia > 0.05 && qtdCalculada > 0 && qtdCalculada < 1_000_000) {
            next.qtd = Math.round(qtdCalculada * 10000) / 10000;
            next.certCorrecoes.push('Quantidade recalculada a partir do total da linha.');
        }
    }
    next.unid = normalizarUnidade(next.unid);
    return next;
}

export function certificarItensExtraidos(
    itens: ItemExtraidoCertificavel[],
    options: { modo?: 'planilha' | 'estimativa'; maxRodadas?: number } = {}
): { itens: ItemCertificado[]; relatorio: RelatorioCertificacao } {
    const modo = options.modo || 'planilha';
    const maxRodadas = options.maxRodadas || 3;
    let rodadas = 0;
    let atuais: Array<ItemExtraidoCertificavel & Partial<CamposCertificacao>> = itens.map(i => ({ ...i, unid: normalizarUnidade(i.unid) }));

    for (let round = 1; round <= maxRodadas; round++) {
        rodadas = round;
        let mudou = false;
        atuais = atuais.map(item => {
            const aval = avaliarItem(item, modo);
            if (aval.certStatus !== 'bloqueado') return { ...item, ...aval };
            const corrigido = tentarCorrigir(item);
            const mudouItem = JSON.stringify(corrigido) !== JSON.stringify(item);
            mudou = mudou || mudouItem;
            return { ...corrigido, ...avaliarItem(corrigido, modo) };
        });
        if (!mudou || atuais.every(i => i.certStatus !== 'bloqueado')) break;
    }

    const certificados = atuais.map(item => ({ ...item, ...avaliarItem(item, modo) })) as ItemCertificado[];
    const count = (status: CertStatus) => certificados.filter(i => i.certStatus === status).length;
    const bloqueado = count('bloqueado');
    const pendente = count('pendente');
    const corrigido = count('corrigido');
    const aprovado = count('aprovado');
    const score = certificados.length
        ? Math.round(certificados.reduce((s, i) => s + i.certScore, 0) / certificados.length)
        : 0;
    const status: CertStatus = bloqueado ? 'bloqueado' : pendente ? 'pendente' : corrigido ? 'corrigido' : 'aprovado';
    const motivos = [...new Set(certificados.flatMap(i => i.certMotivos || []))].slice(0, 8);

    return {
        itens: certificados,
        relatorio: { status, score, rodadas, total: certificados.length, aprovado, corrigido, pendente, bloqueado, motivos },
    };
}
