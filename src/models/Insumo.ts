/** Interface principal de um insumo SINAPI */
export interface Insumo {
    id: string;
    codigoSinapi: string;
    descricao: string;
    unidade: string;
    precoMedio: number;
    dataReferencia: Date | string;
    origem: string;
    desonerado: boolean;
}

/** Interface para itens extraídos de uma planilha de orçamento */
export interface OrcamentoItem {
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    precoUnitario: number;
    precoTotal: number;
    categoria?: string;
    fonte?: string;
}
