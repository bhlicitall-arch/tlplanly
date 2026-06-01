import { Insumo } from '../models/Insumo';
import {
    PrecoReferencia,
    RelatorioAuditoria,
    ResultadoAuditoria,
    StatusAuditoria,
} from '../models/Auditoria';
import { SinapiConnector } from '../connectors/sinapiConnector';

const STATUS_CRITICO = ('CR' + '\u00cd' + 'TICO') as StatusAuditoria;

export interface ConfiguracaoAuditoria {
    toleranciaAprovado: number;
    toleranciaAlerta: number;
    modoEstrito: boolean;
}

const CONFIG_PADRAO: ConfiguracaoAuditoria = {
    toleranciaAprovado: 5,
    toleranciaAlerta: 15,
    modoEstrito: false,
};

type MatchTipo = NonNullable<ResultadoAuditoria['matchTipo']>;

interface MatchReferencia {
    ref?: PrecoReferencia;
    tipo: MatchTipo;
    score: number;
}

export class AgenteAuditor {
    private connector: SinapiConnector;
    private config: ConfiguracaoAuditoria;

    constructor(config?: Partial<ConfiguracaoAuditoria>) {
        this.connector = new SinapiConnector();
        this.config = { ...CONFIG_PADRAO, ...config };
    }

    public async comparar(insumos: Insumo[]): Promise<RelatorioAuditoria> {
        console.log(`[AUDITOR] Iniciando auditoria de ${insumos.length} insumos...`);

        const referencia = this.connector.carregarPrecosReferencia();
        const mapaReferencia = this.criarMapaReferencia(referencia);

        const resultados: ResultadoAuditoria[] = [];
        let custoTotalPlanilha = 0;
        let custoTotalReferencia = 0;

        for (const insumo of insumos) {
            const resultado = this.avaliarInsumo(insumo, mapaReferencia, referencia);
            resultados.push(resultado);

            custoTotalPlanilha += insumo.precoMedio;
            if (resultado.precoReferencia !== null) {
                custoTotalReferencia += resultado.precoReferencia;
            }
        }

        const relatorio: RelatorioAuditoria = {
            dataGeracao: new Date(),
            totalInsumos: resultados.length,
            aprovados: resultados.filter(r => r.status === 'APROVADO').length,
            alertas: resultados.filter(r => r.status === 'ALERTA').length,
            criticos: resultados.filter(r => r.status === STATUS_CRITICO).length,
            naoEncontrados: resultados.filter(r => r.status === 'NAO_ENCONTRADO').length,
            custoTotalPlanilha,
            custoTotalReferencia,
            diferencaTotal: custoTotalReferencia - custoTotalPlanilha,
            resultados,
        };

        this.exibirResumo(relatorio);
        return relatorio;
    }

    private avaliarInsumo(
        insumo: Insumo,
        mapaReferencia: Map<string, PrecoReferencia>,
        referencias: PrecoReferencia[]
    ): ResultadoAuditoria {
        const match = this.encontrarReferencia(insumo, mapaReferencia, referencias);
        const ref = match.ref;

        if (!ref) {
            const status = this.config.modoEstrito ? STATUS_CRITICO : 'NAO_ENCONTRADO';
            return {
                insumoId: insumo.id,
                codigoSinapi: insumo.codigoSinapi,
                descricao: insumo.descricao,
                unidade: insumo.unidade,
                precoPlanilha: insumo.precoMedio,
                precoReferencia: null,
                diferencaAbsoluta: null,
                diferencaPercentual: null,
                status,
                motivo: 'Item sem correspondencia confiavel na base de referencia carregada',
                precoSugerido: insumo.precoMedio,
                matchTipo: 'NAO_ENCONTRADO',
                matchScore: 0,
                codigoReferencia: null,
                descricaoReferencia: null,
                unidadeReferencia: null,
                fonteReferencia: null,
                observacoes: [
                    'Verificar se o item e composicao de servico, codigo proprio ou pertence a base ainda nao importada.',
                ],
            };
        }

        const precoRef = ref.precoMedio;
        const precoPlan = insumo.precoMedio;
        const diffAbsoluta = precoRef - precoPlan;
        const diffPercentual = precoRef !== 0
            ? ((precoPlan - precoRef) / precoRef) * 100
            : 0;

        const status = this.classificar(diffPercentual);
        const observacoes: string[] = [];

        if (match.tipo === 'DESCRICAO') {
            observacoes.push(`Referencia encontrada por descricao com confianca ${(match.score * 100).toFixed(1)}%.`);
        }
        if (match.tipo === 'CODIGO_NORMALIZADO') {
            observacoes.push('Codigo compatibilizado por normalizacao.');
        }
        if (this.normalizarUnidade(insumo.unidade) !== this.normalizarUnidade(ref.unidade)) {
            observacoes.push(`Unidade divergente: planilha ${insumo.unidade} x referencia ${ref.unidade}.`);
        }

        const motivo = this.gerarMotivo(status, diffPercentual, precoRef, match);

        return {
            insumoId: insumo.id,
            codigoSinapi: insumo.codigoSinapi,
            descricao: insumo.descricao,
            unidade: insumo.unidade,
            precoPlanilha: precoPlan,
            precoReferencia: precoRef,
            diferencaAbsoluta: Math.round(diffAbsoluta * 100) / 100,
            diferencaPercentual: Math.round(diffPercentual * 100) / 100,
            status,
            motivo,
            precoSugerido: status === 'APROVADO' ? precoPlan : precoRef,
            matchTipo: match.tipo,
            matchScore: Math.round(match.score * 1000) / 1000,
            codigoReferencia: ref.codigoSinapi,
            descricaoReferencia: ref.descricao,
            unidadeReferencia: ref.unidade,
            fonteReferencia: ref.fonte,
            observacoes,
        };
    }

    private encontrarReferencia(
        insumo: Insumo,
        mapaReferencia: Map<string, PrecoReferencia>,
        referencias: PrecoReferencia[]
    ): MatchReferencia {
        const codigo = String(insumo.codigoSinapi || '').trim();
        const refExata = mapaReferencia.get(codigo);
        if (refExata) return { ref: refExata, tipo: 'CODIGO', score: 1 };

        const codigoNorm = this.normalizarCodigo(codigo);
        if (codigoNorm) {
            const refNormalizada = referencias.find(r => this.normalizarCodigo(r.codigoSinapi) === codigoNorm);
            if (refNormalizada) return { ref: refNormalizada, tipo: 'CODIGO_NORMALIZADO', score: 0.98 };
        }

        const melhor = this.buscarPorDescricaoConfiavel(insumo, referencias);
        if (melhor && melhor.score >= this.limiarDescricao(insumo, melhor.ref)) {
            return { ref: melhor.ref, tipo: 'DESCRICAO', score: melhor.score };
        }

        return { tipo: 'NAO_ENCONTRADO', score: melhor?.score ?? 0 };
    }

    private buscarPorDescricaoConfiavel(
        insumo: Insumo,
        referencias: PrecoReferencia[]
    ): { ref: PrecoReferencia; score: number } | undefined {
        const tokensItem = this.tokenizar(insumo.descricao);
        if (tokensItem.length < 2) return undefined;

        let melhor: { ref: PrecoReferencia; score: number } | undefined;
        for (const ref of referencias) {
            const score = this.scoreDescricao(insumo, ref, tokensItem);
            if (!melhor || score > melhor.score) melhor = { ref, score };
        }

        return melhor;
    }

    private scoreDescricao(insumo: Insumo, ref: PrecoReferencia, tokensItem: string[]): number {
        const tokensRef = this.tokenizar(ref.descricao);
        if (tokensRef.length < 2) return 0;

        const setRef = new Set(tokensRef);
        const intersecao = tokensItem.filter(t => setRef.has(t)).length;
        const uniao = new Set([...tokensItem, ...tokensRef]).size || 1;
        const coberturaItem = intersecao / tokensItem.length;
        const jaccard = intersecao / uniao;

        let score = (coberturaItem * 0.68) + (jaccard * 0.22);

        const descItem = this.normalizarTexto(insumo.descricao);
        const descRef = this.normalizarTexto(ref.descricao);
        if (descRef.includes(descItem) || descItem.includes(descRef)) score += 0.08;
        if (this.normalizarUnidade(insumo.unidade) === this.normalizarUnidade(ref.unidade)) score += 0.10;

        return Math.min(1, score);
    }

    private limiarDescricao(insumo: Insumo, ref: PrecoReferencia): number {
        const mesmaUnidade = this.normalizarUnidade(insumo.unidade) === this.normalizarUnidade(ref.unidade);
        return mesmaUnidade ? 0.58 : 0.72;
    }

    private normalizarCodigo(codigo: string): string {
        const limpo = String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (/^\d+$/.test(limpo)) return String(Number(limpo));
        return limpo.replace(/^0+/, '');
    }

    private normalizarTexto(texto: string): string {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private tokenizar(texto: string): string[] {
        const stop = new Set([
            'com', 'sem', 'para', 'por', 'das', 'dos', 'uma', 'uns', 'nas', 'nos',
            'de', 'da', 'do', 'em', 'e', 'a', 'o', 'un', 'm2', 'm3', 'kg',
            'fornecimento', 'instalacao', 'execucao',
        ]);
        return this.normalizarTexto(texto)
            .split(' ')
            .filter(t => t.length >= 3 && !stop.has(t));
    }

    private normalizarUnidade(unidade: string): string {
        return this.normalizarTexto(unidade).toUpperCase();
    }

    private classificar(diffPercentual: number): StatusAuditoria {
        const absDiff = Math.abs(diffPercentual);

        if (diffPercentual > this.config.toleranciaAlerta) {
            return STATUS_CRITICO;
        }

        if (absDiff > this.config.toleranciaAprovado) {
            return 'ALERTA';
        }

        return 'APROVADO';
    }

    private gerarMotivo(
        status: StatusAuditoria,
        diffPercentual: number,
        precoReferencia: number,
        match: MatchReferencia
    ): string {
        const sinal = diffPercentual >= 0 ? '+' : '';
        const pct = `${sinal}${diffPercentual.toFixed(2)}%`;
        const sufixoMatch = match.tipo === 'DESCRICAO'
            ? ` Referencia por descricao (${(match.score * 100).toFixed(1)}% de confianca).`
            : '';

        switch (status) {
            case 'APROVADO':
                return `Preco dentro da tolerancia (${pct} em relacao a referencia de R$ ${precoReferencia.toFixed(2)}).${sufixoMatch}`;
            case 'ALERTA':
                if (diffPercentual > 0) {
                    return `Preco ${pct} acima da referencia de R$ ${precoReferencia.toFixed(2)}. Recomenda-se renegociacao.${sufixoMatch}`;
                }
                return `Preco ${pct} abaixo da referencia de R$ ${precoReferencia.toFixed(2)}. Verificar se a qualidade e equivalente.${sufixoMatch}`;
            case STATUS_CRITICO:
                return `PRECO ${pct} ACIMA da referencia de R$ ${precoReferencia.toFixed(2)}. Superfaturamento suspeito!${sufixoMatch}`;
            default:
                return '';
        }
    }

    private criarMapaReferencia(referencias: PrecoReferencia[]): Map<string, PrecoReferencia> {
        const mapa = new Map<string, PrecoReferencia>();
        for (const ref of referencias) {
            mapa.set(ref.codigoSinapi, ref);
        }
        return mapa;
    }

    private exibirResumo(relatorio: RelatorioAuditoria): void {
        const separador = '='.repeat(60);

        console.log(`\n${separador}`);
        console.log('RELATORIO DE AUDITORIA DE PRECOS');
        console.log(relatorio.dataGeracao.toLocaleString('pt-BR'));
        console.log(separador);

        console.log(`\nTotal de insumos auditados: ${relatorio.totalInsumos}`);
        console.log(`Aprovados:              ${relatorio.aprovados}`);
        console.log(`Alertas:                ${relatorio.alertas}`);
        console.log(`Criticos:               ${relatorio.criticos}`);
        console.log(`Nao encontrados:        ${relatorio.naoEncontrados}`);

        console.log(`\nCusto total (planilha):   R$ ${relatorio.custoTotalPlanilha.toFixed(2)}`);
        console.log(`Custo total (referencia): R$ ${relatorio.custoTotalReferencia.toFixed(2)}`);

        const sinal = relatorio.diferencaTotal >= 0 ? '+' : '';
        console.log(`Diferenca total:          ${sinal}R$ ${relatorio.diferencaTotal.toFixed(2)}`);

        const criticos = relatorio.resultados.filter(r => r.status === STATUS_CRITICO);
        if (criticos.length > 0) {
            console.log(`\n${'-'.repeat(60)}`);
            console.log('ITENS CRITICOS:');
            for (const c of criticos) {
                const match = c.matchTipo ? ` | match ${c.matchTipo} ${(c.matchScore ?? 0) * 100}%` : '';
                console.log(`   [${c.codigoSinapi}] ${c.descricao.substring(0, 50)}`);
                console.log(`   Planilha: R$ ${c.precoPlanilha.toFixed(2)} | Referencia: R$ ${(c.precoReferencia ?? 0).toFixed(2)} | ${c.diferencaPercentual?.toFixed(2)}%${match}`);
                console.log(`   -> ${c.motivo}`);
                console.log();
            }
        }
        console.log(separador);
    }

    public filtrarCriticos(relatorio: RelatorioAuditoria): ResultadoAuditoria[] {
        return relatorio.resultados.filter(r => r.status === STATUS_CRITICO);
    }

    public filtrarAlertas(relatorio: RelatorioAuditoria): ResultadoAuditoria[] {
        return relatorio.resultados.filter(r => r.status === 'ALERTA');
    }

    public gerarResumoTexto(relatorio: RelatorioAuditoria): string {
        const linhas: string[] = [];
        linhas.push('RELATORIO DE AUDITORIA DE PRECOS - TLPlanly');
        linhas.push(`Data: ${relatorio.dataGeracao.toLocaleString('pt-BR')}`);
        linhas.push('');
        linhas.push(`Total auditado: ${relatorio.totalInsumos}`);
        linhas.push(`Aprovados: ${relatorio.aprovados} | Alertas: ${relatorio.alertas} | Criticos: ${relatorio.criticos} | Nao encontrados: ${relatorio.naoEncontrados}`);
        linhas.push('');
        linhas.push(`Custo planilha:  R$ ${relatorio.custoTotalPlanilha.toFixed(2)}`);
        linhas.push(`Custo referencia: R$ ${relatorio.custoTotalReferencia.toFixed(2)}`);

        const sinal = relatorio.diferencaTotal >= 0 ? '+' : '';
        linhas.push(`Diferenca total: ${sinal}R$ ${relatorio.diferencaTotal.toFixed(2)}`);
        linhas.push('');

        const criticos = relatorio.resultados.filter(r => r.status === STATUS_CRITICO);
        if (criticos.length > 0) {
            linhas.push('ITENS CRITICOS:');
            for (const c of criticos) {
                linhas.push(`  [${c.codigoSinapi}] ${c.descricao} | Plan: R$ ${c.precoPlanilha.toFixed(2)} | Ref: R$ ${(c.precoReferencia ?? 0).toFixed(2)} | ${c.diferencaPercentual?.toFixed(2)}% | Match: ${c.matchTipo ?? '-'}`);
            }
        }

        return linhas.join('\n');
    }
}
