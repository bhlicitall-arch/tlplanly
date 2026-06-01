import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Insumo, OrcamentoItem } from '../models/Insumo';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function removerAcentos(s: string): string {
    const de   = 'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÇçÑñ';
    const para = 'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn';
    return s.split('').map(c => { const i = de.indexOf(c); return i >= 0 ? para[i] : c; }).join('');
}

function normalizar(h: string): string {
    return removerAcentos(h).toLowerCase().trim().replace(/\s+/g, '_');
}

function parseNumBR(valor: any): number {
    if (typeof valor === 'number') return valor;
    if (!valor || valor === '') return 0;
    const s = String(valor).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

// ---------------------------------------------------------------------------

export class OrcamentoParser {

    /**
     * Le e interpreta uma planilha CSV de orcamento no formato SINAPI.
     * Suporta dois layouts:
     *
     *  Layout A (simples):
     *    Linha de cabecalho com CODIGO;DESCRICAO;UNIDADE;QUANTIDADE;PRECO UNITARIO;PRECO TOTAL
     *    Seguida de linhas de dados diretamente.
     *
     *  Layout B (planilha real CAIXA/SINAPI exportada do Excel):
     *    3 colunas vazias de prefixo.
     *    Cabecalho: ;;;ITEM;FONTE;CODIGO SERVICO;DESCRICAO DO SERVICO;UNID;QTDE TOTAL;CUSTO UNIT;...
     *    Cabecalho pode ter quebras de linha internas (\n dentro de celulas com aspas).
     *    Dados: ;;;1.1;SINAPI;97082;Escavacao...;M3;32,50;64,48;2095,60;...
     *
     * @param caminho Caminho absoluto para o arquivo CSV
     * @param delimiter Delimitador (padrao ';')
     */
    public lerPlanilha(caminho: string, delimiter: string = ';'): OrcamentoItem[] {
        const raw = fs.readFileSync(caminho, 'utf-8');

        // Detectar layout B: linha com 3+ colunas vazias antes do cabecalho real
        if (this.detectarLayoutB(raw, delimiter)) {
            return this.lerLayoutB(raw, delimiter);
        }
        return this.lerLayoutA(raw, delimiter);
    }

    // -----------------------------------------------------------------------
    // Deteccao de layout
    // -----------------------------------------------------------------------

    private detectarLayoutB(raw: string, delimiter: string): boolean {
        // Layout B tem linhas com 3 celulas vazias seguidas de ITEM ou CODIGO SERVICO
        for (const linha of raw.split('\n').slice(0, 20)) {
            const partes = linha.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
            if (partes.length >= 7 && partes[0] === '' && partes[1] === '' && partes[2] === '') {
                const n3 = normalizar(partes[3]);
                const n5 = normalizar(partes[5]);
                if (n3 === 'item' || n5.includes('codigo') || n5.includes('servico')) {
                    return true;
                }
            }
        }
        return false;
    }

    // -----------------------------------------------------------------------
    // Layout A — CSV simples
    // -----------------------------------------------------------------------

    private lerLayoutA(raw: string, delimiter: string): OrcamentoItem[] {
        const linhas = raw.split('\n');

        let indiceCabecalho = -1;
        for (let i = 0; i < linhas.length; i++) {
            const partes = linhas[i].split(delimiter);
            const norm = partes.map(p => normalizar(p));
            const ehCab =
                norm.some(p => p === 'codigo' || p === 'descricao') ||
                (norm.some(p => p === 'item') && partes.length >= 6);
            if (ehCab) { indiceCabecalho = i; break; }
        }

        if (indiceCabecalho < 0) {
            throw new Error(
                'Layout simples: cabecalho com "CODIGO" ou "DESCRICAO" nao encontrado.'
            );
        }

        const metadata = this.extrairMetadata(linhas.slice(0, indiceCabecalho), delimiter);
        const dadosRaw = linhas.slice(indiceCabecalho).join('\n');

        let registros: any[];
        try {
            registros = parse(dadosRaw, {
                delimiter,
                columns: (header: string[]) => header.map(normalizar),
                skip_empty_lines: true,
                relax_column_count: true,
                bom: true,
                skip_records_with_empty_values: true,
            });
        } catch {
            registros = [];
            for (const linha of linhas.slice(indiceCabecalho + 1)) {
                const p = linha.split(delimiter).map(s => s.trim());
                if (p.length >= 4 && p[0] && !isNaN(Number(p[0].replace(',', '.')))) {
                    registros.push({ codigo: p[0], descricao: p[1], unidade: p[2], quantidade: p[3], preco_unitario: p[4] || '0', preco_total: p[5] || '0' });
                }
            }
        }

        const itens: OrcamentoItem[] = [];
        for (const r of registros) {
            const codigoRaw = r.codigo ?? r.item ?? '';
            if (!codigoRaw || String(codigoRaw).trim() === '') continue;
            const codigo = String(codigoRaw).trim();
            if (/^(total|subtotal)/i.test(codigo)) continue;

            const qtd = parseNumBR(r.quantidade ?? '0');
            const pu  = parseNumBR(r.preco_unitario ?? r.precoUnitario ?? '0');
            const pt  = parseNumBR(r.preco_total ?? r.precoTotal ?? '0');
            if (qtd === 0 && pt === 0) continue;

            itens.push({
                codigo,
                descricao: (r.descricao ?? r.item ?? '').trim(),
                unidade:   (r.unidade ?? 'UN').trim(),
                quantidade: qtd,
                precoUnitario: pu,
                precoTotal: pt > 0 ? pt : qtd * pu,
                categoria: metadata.obra || '',
                fonte: 'PLANILHA_ORCAMENTARIA',
            });
        }
        return itens;
    }

    // -----------------------------------------------------------------------
    // Layout B — planilha real exportada do Excel (CAIXA/SINAPI)
    //
    // Estrutura de colunas (0-indexed, apos os 3 prefixos vazios):
    //   3 = ITEM     (ex: "1.1", "2.3")
    //   4 = FONTE    (ex: "SINAPI", "CPU")
    //   5 = CODIGO   (ex: "97082")
    //   6 = DESCRICAO
    //   7 = UNID
    //   8 = QTDE TOTAL
    //   9 = CUSTO UNITARIO (sem BDI)
    //  10 = CUSTO TOTAL (sem BDI)
    // -----------------------------------------------------------------------

    private lerLayoutB(raw: string, delimiter: string): OrcamentoItem[] {
        // Usar csv-parse com suporte a celulas multi-linha (relaxed_quotes)
        let registros: any[][];
        try {
            registros = parse(raw, {
                delimiter,
                skip_empty_lines: false,
                relax_column_count: true,
                relax_quotes: true,
                bom: true,
                cast: false,
            }) as any[][];
        } catch {
            // Fallback: split por linhas simples
            registros = raw.split('\n').map(l => l.split(delimiter).map(c => c.trim()));
        }

        // Encontrar a linha de cabecalho: col[3] normalizada = "item"
        let indiceCab = -1;
        for (let i = 0; i < Math.min(registros.length, 25); i++) {
            const row = registros[i];
            if (row.length > 5 && normalizar(String(row[3] ?? '')) === 'item') {
                indiceCab = i;
                break;
            }
        }

        if (indiceCab < 0) {
            throw new Error('Layout B: linha de cabecalho com "ITEM" na coluna 3 nao encontrada.');
        }

        // Extrair metadados das linhas anteriores ao cabecalho
        const linhasMetadata = registros.slice(0, indiceCab).map(r => r.join(delimiter));
        const metadata = this.extrairMetadata(linhasMetadata, delimiter);

        // Detectar posicoes das colunas a partir do cabecalho
        const cab = registros[indiceCab].map(c => normalizar(String(c ?? '')));
        const colCodigo    = cab.findIndex(c => c.includes('codigo') && c.includes('servico') || c === 'codigo');
        const colDescricao = cab.findIndex(c => c.includes('descricao'));
        const colUnidade   = cab.findIndex(c => c === 'unid' || c === 'unidade');
        const colQtde      = cab.findIndex(c => c.includes('qtde') || c.includes('quantidade'));
        const colPU        = cab.findIndex(c => c.includes('custo') && c.includes('unit'));
        const colPT        = cab.findIndex(c => (c.includes('custo') && c.includes('total')) || c.includes('preco_total'));
        const colFonte     = cab.findIndex(c => c === 'fonte');

        // Posicoes padrao caso deteccao falhe
        const iCod  = colCodigo    >= 0 ? colCodigo    : 5;
        const iDesc = colDescricao >= 0 ? colDescricao : 6;
        const iUnid = colUnidade   >= 0 ? colUnidade   : 7;
        const iQtde = colQtde      >= 0 ? colQtde      : 8;
        const iPU   = colPU        >= 0 ? colPU        : 9;
        const iPT   = colPT        >= 0 ? colPT        : 10;
        const iFonte = colFonte    >= 0 ? colFonte      : 4;

        const itens: OrcamentoItem[] = [];

        for (let i = indiceCab + 1; i < registros.length; i++) {
            const row = registros[i];
            if (!row || row.length < 7) continue;

            const itemNum = String(row[3] ?? '').trim();

            // Aceitar apenas itens numerados com ponto (1.1, 2.3, 3.1.2, etc.)
            if (!/^\d+(\.\d+)+$/.test(itemNum)) continue;

            const codigo = String(row[iCod] ?? '').trim().replace(/^"|"$/g, '');
            if (!codigo) continue;

            const descricao = String(row[iDesc] ?? '').trim().replace(/^"|"$/g, '');
            const unidade   = String(row[iUnid] ?? 'UN').trim().replace(/^"|"$/g, '') || 'UN';
            const qtd       = parseNumBR(row[iQtde]);
            const pu        = parseNumBR(row[iPU]);
            const pt        = parseNumBR(row[iPT]);
            const fonte     = String(row[iFonte] ?? 'SINAPI').trim() || 'SINAPI';

            if (qtd === 0 && pt === 0 && pu === 0) continue;

            itens.push({
                codigo,
                descricao,
                unidade,
                quantidade: qtd,
                precoUnitario: pu,
                precoTotal: pt > 0 ? pt : qtd * pu,
                categoria: metadata.obra || '',
                fonte,
            });
        }

        return itens;
    }

    // -----------------------------------------------------------------------
    // Auxiliares
    // -----------------------------------------------------------------------

    private extrairMetadata(
        linhasCabecalho: string[],
        delimiter: string
    ): { orgao: string; secretaria: string; obra: string; data: string } {
        const meta = { orgao: '', secretaria: '', obra: '', data: '' };

        for (const linha of linhasCabecalho) {
            const partes = linha.split(delimiter).map(p => p.trim().replace(/^"|"$/g, '')).filter(p => p);
            const texto  = removerAcentos(partes.join(' ')).toUpperCase();

            if (texto.includes('PREFEITURA') && !meta.orgao)    meta.orgao = partes[0] || '';
            if (texto.includes('SECRETARIA') && !meta.secretaria) meta.secretaria = partes[0] || '';

            if (texto.includes('OBRA')) {
                const idx = partes.findIndex(p => removerAcentos(p).toUpperCase().includes('OBRA'));
                if (idx >= 0 && partes[idx + 1]) meta.obra = partes[idx + 1].replace(/^OBRA:\s*/i, '').trim();
            }
            if (texto.includes('DATA')) {
                const idx = partes.findIndex(p => removerAcentos(p).toUpperCase() === 'DATA:');
                if (idx >= 0 && partes[idx + 1]) meta.data = partes[idx + 1].trim();
            }
        }
        return meta;
    }

    /** Converte itens do orcamento para a interface Insumo */
    public paraInsumos(itens: OrcamentoItem[]): Insumo[] {
        return itens.map((item, idx) => ({
            id: String(idx + 1),
            codigoSinapi: item.codigo,
            descricao:    item.descricao,
            unidade:      item.unidade,
            precoMedio:   item.precoUnitario,
            dataReferencia: new Date(),
            origem:   item.fonte || 'PLANILHA_ORCAMENTARIA',
            desonerado: false,
        }));
    }
}
