export type StatusAuditoria = 'APROVADO' | 'ALERTA' | 'CRÍTICO' | 'NAO_ENCONTRADO';

export interface ResultadoAuditoria {
    insumoId: string;
    codigoSinapi: string;
    descricao: string;
    unidade: string;
    precoPlanilha: number;
    precoReferencia: number | null;
    diferencaAbsoluta: number | null;
    diferencaPercentual: number | null;
    status: StatusAuditoria;
    motivo?: string;
    precoSugerido: number;
    matchTipo?: 'CODIGO' | 'CODIGO_NORMALIZADO' | 'DESCRICAO' | 'NAO_ENCONTRADO';
    matchScore?: number;
    codigoReferencia?: string | null;
    descricaoReferencia?: string | null;
    unidadeReferencia?: string | null;
    fonteReferencia?: string | null;
    observacoes?: string[];
}

export interface RelatorioAuditoria {
    dataGeracao: Date;
    totalInsumos: number;
    aprovados: number;
    alertas: number;
    criticos: number;
    naoEncontrados: number;
    custoTotalPlanilha: number;
    custoTotalReferencia: number;
    diferencaTotal: number;
    resultados: ResultadoAuditoria[];
}

export interface PrecoReferencia {
    codigoSinapi: string;
    descricao: string;
    unidade: string;
    precoMedio: number;
    dataReferencia: string;
    desonerado: boolean;
    fonte: string;
}
