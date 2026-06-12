import { parseNumeroBR, normalizarUnidade } from './ExtracaoCertificador';

export type FinalidadePlanilha = 'grupos' | 'orcamento' | 'insumos' | 'composicoes';

export type MapeamentoColunas = Record<string, number>;

export interface SugestaoMapeamento {
    finalidade: FinalidadePlanilha;
    headerRow: number;
    startRow: number;
    confidence: number;
    colunas: Array<{ index: number; letra: string; header: string; amostras: string[] }>;
    mapping: MapeamentoColunas;
    requiredMissing: string[];
}

export interface ResultadoPlanilhaMapeada {
    grupos: any[];
    items: any[];
    insumos: any[];
    composicoes: any[];
    issues: string[];
}

const FIELDS: Record<FinalidadePlanilha, Array<{ key: string; label: string; required?: boolean; numeric?: boolean; aliases: string[] }>> = {
    grupos: [
        { key: 'cod', label: 'Codigo do grupo', required: true, aliases: ['codigo', 'cod', 'codigo grupo', 'grupo', 'grupo custo', 'grupo de custo'] },
        { key: 'nome', label: 'Nome do grupo', required: true, aliases: ['nome', 'descricao', 'grupo', 'grupo custo', 'grupo de custo', 'classe'] },
        { key: 'tipo', label: 'Tipo normalizado', aliases: ['tipo', 'natureza', 'classificacao', 'categoria'] },
        { key: 'descricao', label: 'Descricao complementar', aliases: ['observacao', 'descricao complementar', 'detalhe'] },
    ],
    orcamento: [
        { key: 'cod', label: 'Codigo', aliases: ['codigo', 'cod', 'item', 'codigo item', 'codigo servico', 'codigo composicao'] },
        { key: 'desc', label: 'Descricao', required: true, aliases: ['descricao', 'servico', 'especificacao', 'insumo'] },
        { key: 'unid', label: 'Unidade', aliases: ['unidade', 'unid', 'und', 'un'] },
        { key: 'qtd', label: 'Quantidade', numeric: true, aliases: ['quantidade', 'quant', 'qtd', 'qtde'] },
        { key: 'preco', label: 'Custo unitario', numeric: true, aliases: ['preco unitario', 'valor unitario', 'custo unitario', 'p unit'] },
        { key: 'total', label: 'Total', numeric: true, aliases: ['total', 'preco total', 'valor total', 'custo total'] },
        { key: 'categoria', label: 'Categoria', aliases: ['categoria', 'grupo', 'classe', 'capitulo'] },
    ],
    insumos: [
        { key: 'cod', label: 'Codigo do insumo', required: true, aliases: ['codigo', 'cod', 'codigo insumo', 'insumo', 'item'] },
        { key: 'desc', label: 'Descricao do insumo', required: true, aliases: ['descricao', 'insumo', 'especificacao'] },
        { key: 'preco', label: 'Custo unitario', required: true, numeric: true, aliases: ['preco', 'custo', 'valor', 'preco unitario', 'custo unitario', 'valor unitario'] },
        { key: 'unid', label: 'Unidade', aliases: ['unidade', 'unid', 'und', 'un'] },
        { key: 'tipo', label: 'Tipo do insumo', aliases: ['tipo', 'classe', 'categoria', 'natureza', 'classificacao'] },
        { key: 'grupo', label: 'Grupo de custo', aliases: ['grupo', 'grupo custo', 'grupo de custo', 'codigo grupo', 'cod grupo'] },
    ],
    composicoes: [
        { key: 'cpuCod', label: 'Codigo da CPU', required: true, aliases: ['codigo cpu', 'cod cpu', 'composicao', 'codigo composicao', 'codigo servico'] },
        { key: 'cpuDesc', label: 'Descricao da CPU', aliases: ['descricao cpu', 'descricao composicao', 'servico'] },
        { key: 'cpuUnid', label: 'Unidade da CPU', aliases: ['unidade cpu', 'unid cpu', 'unidade servico'] },
        { key: 'insumoCod', label: 'Codigo do insumo vinculado', required: true, aliases: ['codigo insumo', 'cod insumo', 'insumo', 'codigo recurso', 'recurso'] },
        { key: 'insumoDesc', label: 'Descricao do insumo', aliases: ['descricao insumo', 'descricao recurso', 'recurso descricao'] },
        { key: 'insumoUnid', label: 'Unidade do insumo', aliases: ['unidade insumo', 'unid insumo', 'unidade recurso'] },
        { key: 'tipo', label: 'Tipo do insumo', aliases: ['tipo', 'classe', 'categoria', 'grupo', 'natureza'] },
        { key: 'coef', label: 'Coeficiente', required: true, numeric: true, aliases: ['coeficiente', 'coef', 'consumo', 'indice', 'quantidade insumo'] },
        { key: 'preco', label: 'Custo unitario do insumo', numeric: true, aliases: ['preco', 'custo', 'valor', 'preco unitario', 'custo unitario'] },
    ],
};

export function camposMapeamento(finalidade: FinalidadePlanilha) {
    return FIELDS[finalidade];
}

export function sugerirMapeamentoPlanilha(rawRows: any[][], finalidade: FinalidadePlanilha = 'orcamento'): SugestaoMapeamento {
    const rows = normalizarLinhas(rawRows);
    const maxCols = Math.max(0, ...rows.slice(0, 50).map(row => row.length));
    let best = { row: -1, score: -1, mapping: {} as MapeamentoColunas };

    for (let r = 0; r < Math.min(25, rows.length); r++) {
        const row = rows[r] || [];
        const used = new Set<number>();
        const mapping: MapeamentoColunas = {};
        let score = 0;
        for (const field of FIELDS[finalidade]) {
            let bestCol = -1;
            let bestScore = 0;
            row.forEach((cell, ci) => {
                if (used.has(ci)) return;
                const s = scoreCabecalho(cell, field.aliases);
                if (s > bestScore) {
                    bestScore = s;
                    bestCol = ci;
                }
            });
            if (bestCol >= 0 && bestScore > 0) {
                mapping[field.key] = bestCol;
                used.add(bestCol);
                score += bestScore + (field.required ? 2 : 0);
            }
        }
        const requiredFound = FIELDS[finalidade].filter(f => f.required && mapping[f.key] >= 0).length;
        score += requiredFound * 4;
        if (score > best.score) best = { row: r, score, mapping };
    }

    const minScore = finalidade === 'composicoes' ? 10 : 7;
    const headerRow = best.score >= minScore ? best.row : -1;
    const mapping = headerRow >= 0 ? best.mapping : defaultMapping(finalidade, maxCols);
    const requiredMissing = FIELDS[finalidade]
        .filter(f => f.required && !(mapping[f.key] >= 0))
        .map(f => f.key);
    const confidence = Math.max(15, Math.min(98, Math.round(best.score * 7 + (requiredMissing.length ? -20 : 10))));

    return {
        finalidade,
        headerRow,
        startRow: headerRow >= 0 ? headerRow + 1 : 0,
        confidence,
        colunas: montarColunas(rows, maxCols, headerRow),
        mapping,
        requiredMissing,
    };
}

export function mapearPlanilha(rawRows: any[][], mapping: MapeamentoColunas, finalidade: FinalidadePlanilha, headerRow = -1): ResultadoPlanilhaMapeada {
    const rows = normalizarLinhas(rawRows);
    const start = headerRow >= 0 ? headerRow + 1 : 0;
    const issues: string[] = [];
    const grupos: any[] = [];
    const items: any[] = [];
    const insumos: any[] = [];
    const cpuMap = new Map<string, any>();

    rows.slice(start).forEach((row, offset) => {
        const rowNumber = start + offset + 1;
        if (!row || row.every(cell => !String(cell ?? '').trim())) return;
        const joined = row.map(cell => String(cell ?? '')).join(' ').trim();
        if (!joined || /^(total|subtotal)\b/i.test(joined)) return;

        if (finalidade === 'grupos') {
            const grupo = itemGrupoCusto(row, mapping);
            if (!grupo.codigo || !grupo.nome) {
                issues.push(`Linha ${rowNumber}: grupo de custo sem codigo ou nome.`);
                return;
            }
            grupos.push(grupo);
            return;
        }

        if (finalidade === 'orcamento') {
            const item = itemOrcamento(row, mapping);
            if (!item.desc) return;
            validarNumerico(item.qtd, 'quantidade', rowNumber, issues);
            validarNumerico(item.preco, 'custo unitario', rowNumber, issues);
            items.push({ ...item, origem: 'excel', linhaOrigem: joined });
            return;
        }

        if (finalidade === 'insumos') {
            const ins = itemInsumo(row, mapping);
            if (!ins.codigoSinapi || !ins.descricao) {
                issues.push(`Linha ${rowNumber}: insumo sem codigo ou descricao.`);
                return;
            }
            if (!ins.precoMedio) issues.push(`Linha ${rowNumber}: custo unitario ausente ou zerado.`);
            insumos.push(ins);
            return;
        }

        const vinculo = itemComposicao(row, mapping);
        if (!vinculo.cpuCod || !vinculo.insumo.cod) {
            issues.push(`Linha ${rowNumber}: composicao sem codigo de CPU ou codigo de insumo.`);
            return;
        }
        if (!vinculo.insumo.coef) issues.push(`Linha ${rowNumber}: coeficiente ausente ou zerado.`);
        const cpu = cpuMap.get(vinculo.cpuCod) || {
            id: '',
            cod: vinculo.cpuCod,
            desc: vinculo.cpuDesc || vinculo.cpuCod,
            unid: vinculo.cpuUnid || 'UN',
            tipo: 'Servicos',
            encargos: 'nd',
            encPct: 127.5,
            insumos: [],
            precoUnitario: 0,
            criadaEm: new Date().toLocaleDateString('pt-BR'),
        };
        cpu.insumos.push(vinculo.insumo);
        cpu.precoUnitario = cpu.insumos.reduce((s: number, i: any) => s + (Number(i.coef) || 0) * (Number(i.preco) || 0), 0);
        cpuMap.set(vinculo.cpuCod, cpu);
    });

    return { grupos, items, insumos, composicoes: [...cpuMap.values()], issues };
}

function itemGrupoCusto(row: string[], mapping: MapeamentoColunas) {
    const codigo = limparCodigoPlanilha(valor(row, mapping.cod));
    const nome = valor(row, mapping.nome);
    return {
        codigo,
        nome,
        tipo: normalizarGrupoCusto(valor(row, mapping.tipo) || nome || codigo),
        descricao: valor(row, mapping.descricao),
        importado: true,
    };
}

function itemOrcamento(row: string[], mapping: MapeamentoColunas) {
    const qtd = parseNumeroBR(valor(row, mapping.qtd)) || 1;
    const preco = parseNumeroBR(valor(row, mapping.preco));
    const totalLinha = parseNumeroBR(valor(row, mapping.total));
    return {
        cod: limparCodigoPlanilha(valor(row, mapping.cod)),
        desc: valor(row, mapping.desc),
        unid: normalizarUnidade(valor(row, mapping.unid) || 'UN'),
        qtd,
        preco,
        totalLinha,
        cat: valor(row, mapping.categoria) || 'Servicos',
        capitulo: valor(row, mapping.categoria) || 'Servicos',
    };
}

function itemInsumo(row: string[], mapping: MapeamentoColunas) {
    const cod = limparCodigoPlanilha(valor(row, mapping.cod));
    const grupoCusto = valor(row, mapping.grupo) || valor(row, mapping.tipo);
    const tipo = normalizarTipoInsumo(valor(row, mapping.tipo) || grupoCusto);
    return {
        codigoSinapi: cod,
        codigo: cod,
        descricao: valor(row, mapping.desc),
        unidade: normalizarUnidade(valor(row, mapping.unid) || 'UN'),
        precoMedio: parseNumeroBR(valor(row, mapping.preco)),
        tipo,
        grupoCusto: String(grupoCusto || tipo).trim().toUpperCase(),
        fonte: 'IMPORTADO/TLPLANLY',
        dataReferencia: new Date().toLocaleDateString('pt-BR'),
        importado: true,
    };
}

function itemComposicao(row: string[], mapping: MapeamentoColunas) {
    const insumoCod = limparCodigoPlanilha(valor(row, mapping.insumoCod));
    return {
        cpuCod: limparCodigoPlanilha(valor(row, mapping.cpuCod)),
        cpuDesc: valor(row, mapping.cpuDesc),
        cpuUnid: normalizarUnidade(valor(row, mapping.cpuUnid) || 'UN'),
        insumo: {
            cod: insumoCod,
            desc: valor(row, mapping.insumoDesc) || insumoCod,
            unid: normalizarUnidade(valor(row, mapping.insumoUnid) || 'UN'),
            tipo: normalizarTipoInsumo(valor(row, mapping.tipo)),
            coef: parseNumeroBR(valor(row, mapping.coef)),
            preco: parseNumeroBR(valor(row, mapping.preco)),
        },
    };
}

function normalizarLinhas(rawRows: any[][]): string[][] {
    return (rawRows || []).map(row => Array.isArray(row) ? row.map(cell => String(cell ?? '').replace(/\s+/g, ' ').trim()) : []);
}

function scoreCabecalho(cell: string, aliases: string[]): number {
    const norm = normalizarTexto(cell);
    if (!norm) return 0;
    let best = 0;
    for (const alias of aliases) {
        const a = normalizarTexto(alias);
        if (norm === a) best = Math.max(best, 6);
        else if (norm.includes(a)) best = Math.max(best, 4);
        else if (a.includes(norm) && norm.length >= 3) best = Math.max(best, 2);
    }
    return best;
}

function defaultMapping(finalidade: FinalidadePlanilha, maxCols: number): MapeamentoColunas {
    const map: MapeamentoColunas = {};
    const set = (key: string, idx: number) => { if (idx < maxCols) map[key] = idx; };
    if (finalidade === 'grupos') {
        set('cod', 0); set('nome', 1); set('tipo', 2); set('descricao', 3);
    } else if (finalidade === 'insumos') {
        set('cod', 0); set('desc', 1); set('preco', 2); set('unid', 3); set('tipo', 4); set('grupo', 5);
    } else if (finalidade === 'composicoes') {
        set('cpuCod', 0); set('cpuDesc', 1); set('cpuUnid', 2); set('insumoCod', 3); set('insumoDesc', 4); set('tipo', 5); set('coef', 6); set('preco', 7);
    } else {
        set('cod', 0); set('desc', 1); set('unid', 2); set('qtd', 3); set('preco', 4); set('total', 5); set('categoria', 6);
    }
    return map;
}

function montarColunas(rows: string[][], maxCols: number, headerRow: number) {
    return Array.from({ length: maxCols }, (_, index) => ({
        index,
        letra: colunaLetra(index),
        header: headerRow >= 0 ? rows[headerRow]?.[index] || `Coluna ${colunaLetra(index)}` : `Coluna ${colunaLetra(index)}`,
        amostras: rows.slice(headerRow >= 0 ? headerRow + 1 : 0, headerRow >= 0 ? headerRow + 5 : 4).map(row => row[index] || '').filter(Boolean).slice(0, 3),
    }));
}

function valor(row: string[], idx: number | undefined): string {
    return idx !== undefined && idx >= 0 ? String(row[idx] ?? '').trim() : '';
}

function validarNumerico(value: number, field: string, rowNumber: number, issues: string[]) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) issues.push(`Linha ${rowNumber}: ${field} invalido.`);
}

export function normalizarTipoInsumo(value: string): 'M' | 'S' | 'E' | 'T' {
    const n = normalizarTexto(value);
    if (/mao|mdo|obra|pedreiro|servente|oficial|horista/.test(n)) return 'S';
    if (/equip|maquina|caminhao|trator|escavadeira|betoneira|andaime/.test(n)) return 'E';
    if (/transp|frete|dmt/.test(n)) return 'T';
    return 'M';
}

export function normalizarGrupoCusto(value: string): 'M' | 'S' | 'E' | 'T' | 'SV' {
    const raw = String(value || '').trim().toUpperCase();
    const n = normalizarTexto(value);
    if (raw === 'E' || /equip|maquina|ferramenta/.test(n)) return 'E';
    if (raw === 'S' || /mao|mdo|obra|pessoal|horista|mensalista/.test(n)) return 'S';
    if (raw === 'T' || /transp|frete|dmt/.test(n)) return 'T';
    if (raw === 'SV' || raw === 'SERV' || /servic|composicao|cpu/.test(n)) return 'SV';
    return 'M';
}

function normalizarTexto(value: string): string {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function limparCodigoPlanilha(value: string): string {
    return String(value || '').replace(/[^0-9A-Za-z.\-]/g, '').trim().toUpperCase();
}

function colunaLetra(index: number): string {
    let n = index + 1;
    let s = '';
    while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - m) / 26);
    }
    return s;
}
