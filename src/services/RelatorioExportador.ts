import fs from 'fs';
import path from 'path';
import { RelatorioAuditoria, ResultadoAuditoria } from '../models/Auditoria';

export interface OpcoesExportacao {
    /** Pasta de destino (padrão: ./relatorios) */
    pasta?: string;
    /** Prefixo do nome do arquivo (padrão: auditoria) */
    prefixo?: string;
    /** Incluir timestamp no nome do arquivo (padrão: true) */
    timestamp?: boolean;
}

/**
 * Exporta RelatorioAuditoria para JSON, CSV e TXT.
 *
 * Uso:
 *   const exp = new RelatorioExportador();
 *   const caminhos = exp.exportarTudo(relatorio);
 *   console.log(caminhos); // { json: '...', csv: '...', txt: '...' }
 */
export class RelatorioExportador {
    private pasta: string;
    private prefixo: string;
    private timestamp: boolean;

    constructor(opcoes: OpcoesExportacao = {}) {
        this.pasta = path.resolve(opcoes.pasta ?? 'relatorios');
        this.prefixo = opcoes.prefixo ?? 'auditoria';
        this.timestamp = opcoes.timestamp ?? true;
    }

    // ── Ponto de entrada ──────────────────────────────────────────────

    /**
     * Exporta o relatório nos três formatos e retorna os caminhos gerados.
     */
    public exportarTudo(relatorio: RelatorioAuditoria): { json: string; csv: string; txt: string } {
        this.garantirPasta();
        const base = this.nomeBase();

        const caminhoJson = path.join(this.pasta, `${base}.json`);
        const caminhoCsv  = path.join(this.pasta, `${base}.csv`);
        const caminhoTxt  = path.join(this.pasta, `${base}.txt`);

        fs.writeFileSync(caminhoJson, this.paraJson(relatorio), 'utf-8');
        fs.writeFileSync(caminhoCsv,  this.paraCsv(relatorio),  'utf-8');
        fs.writeFileSync(caminhoTxt,  this.paraTxt(relatorio),  'utf-8');

        console.log(`\n📁 Relatórios salvos em: ${this.pasta}`);
        console.log(`   📄 JSON : ${path.basename(caminhoJson)}`);
        console.log(`   📊 CSV  : ${path.basename(caminhoCsv)}`);
        console.log(`   📝 TXT  : ${path.basename(caminhoTxt)}`);

        return { json: caminhoJson, csv: caminhoCsv, txt: caminhoTxt };
    }

    // ── Formatadores ──────────────────────────────────────────────────

    /** Serialização JSON indentada para leitura humana e integração com outros sistemas. */
    public paraJson(relatorio: RelatorioAuditoria): string {
        return JSON.stringify(relatorio, null, 2);
    }

    /**
     * CSV compatível com Excel brasileiro (separador ';', decimal ',').
     *
     * Colunas:
     *   CODIGO_SINAPI | DESCRICAO | UNIDADE | PRECO_PLANILHA | PRECO_REFERENCIA
     *   DIFERENCA_ABS | DIFERENCA_PCT | STATUS | MOTIVO | PRECO_SUGERIDO
     */
    public paraCsv(relatorio: RelatorioAuditoria): string {
        const linhas: string[] = [];

        // Cabeçalho do documento
        linhas.push(`RELATÓRIO DE AUDITORIA DE PREÇOS - TLPlanly`);
        linhas.push(`Data;${relatorio.dataGeracao.toLocaleString('pt-BR')}`);
        linhas.push(`Total;${relatorio.totalInsumos};Aprovados;${relatorio.aprovados};Alertas;${relatorio.alertas};Críticos;${relatorio.criticos};Não encontrados;${relatorio.naoEncontrados}`);
        linhas.push(`Custo planilha;${this.fmt(relatorio.custoTotalPlanilha)};Custo referência;${this.fmt(relatorio.custoTotalReferencia)};Diferença;${this.fmt(relatorio.diferencaTotal)}`);
        linhas.push('');

        // Cabeçalho das colunas
        linhas.push([
            'CODIGO_SINAPI',
            'DESCRICAO',
            'UNIDADE',
            'PRECO_PLANILHA',
            'PRECO_REFERENCIA',
            'DIFERENCA_ABS',
            'DIFERENCA_PCT',
            'STATUS',
            'MATCH_TIPO',
            'MATCH_SCORE',
            'CODIGO_REFERENCIA',
            'FONTE_REFERENCIA',
            'MOTIVO',
            'OBSERVACOES',
            'PRECO_SUGERIDO',
        ].join(';'));

        // Linhas de dados
        for (const r of relatorio.resultados) {
            linhas.push([
                r.codigoSinapi,
                `"${r.descricao.replace(/"/g, '""')}"`,
                r.unidade,
                this.fmt(r.precoPlanilha),
                r.precoReferencia !== null ? this.fmt(r.precoReferencia) : '',
                r.diferencaAbsoluta !== null ? this.fmt(r.diferencaAbsoluta) : '',
                r.diferencaPercentual !== null ? this.fmt(r.diferencaPercentual) : '',
                r.status,
                r.matchTipo ?? '',
                r.matchScore !== undefined ? this.fmt(r.matchScore * 100) : '',
                r.codigoReferencia ?? '',
                r.fonteReferencia ?? '',
                `"${(r.motivo ?? '').replace(/"/g, '""')}"`,
                `"${(r.observacoes ?? []).join(' | ').replace(/"/g, '""')}"`,
                this.fmt(r.precoSugerido),
            ].join(';'));
        }

        return linhas.join('\r\n');
    }

    /** Texto formatado para e-mail ou impressão. */
    public paraTxt(relatorio: RelatorioAuditoria): string {
        const SEP = '═'.repeat(70);
        const sep = '─'.repeat(70);
        const linhas: string[] = [];

        linhas.push(SEP);
        linhas.push('  RELATÓRIO DE AUDITORIA DE PREÇOS — TLPlanly');
        linhas.push(`  Data: ${relatorio.dataGeracao.toLocaleString('pt-BR')}`);
        linhas.push(SEP);

        linhas.push('');
        linhas.push('  RESUMO EXECUTIVO');
        linhas.push(sep);
        linhas.push(`  Total de insumos auditados : ${relatorio.totalInsumos}`);
        linhas.push(`  ✅ Aprovados               : ${relatorio.aprovados}`);
        linhas.push(`  ⚠️  Alertas                 : ${relatorio.alertas}`);
        linhas.push(`  🚨 Críticos                : ${relatorio.criticos}`);
        linhas.push(`  ❓ Não encontrados         : ${relatorio.naoEncontrados}`);
        linhas.push('');
        linhas.push(`  Custo total (planilha)     : R$ ${relatorio.custoTotalPlanilha.toFixed(2)}`);
        linhas.push(`  Custo total (referência)   : R$ ${relatorio.custoTotalReferencia.toFixed(2)}`);
        const sinal = relatorio.diferencaTotal >= 0 ? '+' : '';
        linhas.push(`  Diferença total            : ${sinal}R$ ${relatorio.diferencaTotal.toFixed(2)}`);

        const conformidade = relatorio.totalInsumos > 0
            ? ((relatorio.aprovados / relatorio.totalInsumos) * 100).toFixed(1)
            : '0.0';
        linhas.push(`  Índice de conformidade     : ${conformidade}%`);

        // Seção críticos
        const criticos = relatorio.resultados.filter(r => r.status === 'CRÍTICO');
        if (criticos.length > 0) {
            linhas.push('');
            linhas.push(sep);
            linhas.push('  🚨 ITENS CRÍTICOS (superfaturamento)');
            linhas.push(sep);
            for (const c of criticos) {
                linhas.push(`\n  [${c.codigoSinapi}] ${c.descricao}`);
                linhas.push(`  Planilha: R$ ${c.precoPlanilha.toFixed(2)}  |  Referência: R$ ${(c.precoReferencia ?? 0).toFixed(2)}  |  ${(c.diferencaPercentual ?? 0).toFixed(2)}%`);
                linhas.push(`  → ${c.motivo}`);
                linhas.push(`  → Preço sugerido: R$ ${c.precoSugerido.toFixed(2)}`);
            }
        }

        // Seção alertas
        const alertas = relatorio.resultados.filter(r => r.status === 'ALERTA');
        if (alertas.length > 0) {
            linhas.push('');
            linhas.push(sep);
            linhas.push('  ⚠️  ITENS EM ALERTA');
            linhas.push(sep);
            for (const a of alertas) {
                linhas.push(`\n  [${a.codigoSinapi}] ${a.descricao}`);
                linhas.push(`  Planilha: R$ ${a.precoPlanilha.toFixed(2)}  |  Referência: R$ ${(a.precoReferencia ?? 0).toFixed(2)}  |  ${(a.diferencaPercentual ?? 0).toFixed(2)}%`);
                linhas.push(`  → ${a.motivo}`);
            }
        }

        // Seção não encontrados
        const naoEncontrados = relatorio.resultados.filter(r => r.status === 'NAO_ENCONTRADO');
        if (naoEncontrados.length > 0) {
            linhas.push('');
            linhas.push(sep);
            linhas.push('  ❓ INSUMOS NÃO ENCONTRADOS NA BASE SINAPI');
            linhas.push(sep);
            for (const n of naoEncontrados) {
                linhas.push(`  [${n.codigoSinapi}] ${n.descricao} (${n.unidade}) — R$ ${n.precoPlanilha.toFixed(2)}`);
            }
        }

        linhas.push('');
        linhas.push(SEP);
        linhas.push('  Gerado por TLPlanly — TechLicense');
        linhas.push(SEP);

        return linhas.join('\n');
    }

    // ── Auxiliares ────────────────────────────────────────────────────

    /** Formata número como string decimal BR (vírgula). */
    private fmt(n: number): string {
        return n.toFixed(2).replace('.', ',');
    }

    /** Nome base do arquivo: prefixo + timestamp opcional. */
    private nomeBase(): string {
        if (!this.timestamp) return this.prefixo;
        const agora = new Date();
        const ts = agora.toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .slice(0, 19);           // YYYY-MM-DD_HH-MM-SS
        return `${this.prefixo}_${ts}`;
    }

    /** Cria a pasta de destino se não existir. */
    private garantirPasta(): void {
        if (!fs.existsSync(this.pasta)) {
            fs.mkdirSync(this.pasta, { recursive: true });
        }
    }
}
