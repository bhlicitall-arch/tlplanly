import { Insumo } from "../models/Insumo";
import { PrecoReferencia } from "../models/Auditoria";
import fs from 'fs';
import path from 'path';

export class SinapiConnector {

    /**
     * Busca dados de referência SINAPI a partir do arquivo JSON local.
     * @param referencia - Formato esperado "YYYY-MM" (ex: "2026-05")
     */
    async fetchInsumos(referencia: string): Promise<Insumo[]> {
        console.log(`[SINAPI] Carregando dados de referência: ${referencia}`);

        const precoRefs = this.carregarPrecosReferencia();
        return precoRefs.map((ref, idx) => ({
            id: String(idx + 1),
            codigoSinapi: ref.codigoSinapi,
            descricao: ref.descricao,
            unidade: ref.unidade,
            precoMedio: ref.precoMedio,
            dataReferencia: ref.dataReferencia,
            origem: 'SINAPI',
            desonerado: ref.desonerado,
        }));
    }

    /**
     * Carrega os preços de referência do arquivo JSON.
     */
    carregarPrecosReferencia(): PrecoReferencia[] {
        const caminho = path.resolve(__dirname, '../../data/referencia.json');
        const conteudo = fs.readFileSync(caminho, 'utf-8');
        return JSON.parse(conteudo) as PrecoReferencia[];
    }

    /**
     * Busca um preço de referência por código SINAPI.
     */
    buscarPorCodigo(codigoSinapi: string): PrecoReferencia | undefined {
        const precos = this.carregarPrecosReferencia();
        return precos.find(p => p.codigoSinapi === codigoSinapi);
    }

    /**
     * Busca por descrição aproximada (fallback quando o código não é encontrado).
     */
    buscarPorDescricao(descricao: string): PrecoReferencia | undefined {
        const precos = this.carregarPrecosReferencia();
        const termos = descricao.toLowerCase().split(/\s+/).filter(t => t.length > 3);

        // Só faz busca aproximada se houver palavras descritivas suficientes
        if (termos.length < 2) return undefined;

        // Normaliza os termos: remove acentos para comparação
        const normalizar = (s: string) =>
            s.normalize('NFD').replace(/[̀-ͯ]/g, '');
        const termosNorm = termos.map(normalizar);

        return precos
            .map(ref => {
                const refTermosNorm = ref.descricao
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[̀-ͯ]/g, '')
                    .split(/\s+/)
                    .filter(t => t.length > 3);

                // Match exato de palavra (não substring parcial)
                const matches = termosNorm.filter(t =>
                    refTermosNorm.some(rt => rt === t)
                );
                return { ref, score: matches.length / termos.length, matchCount: matches.length };
            })
            .filter(r => r.score >= 0.5 && r.matchCount >= 2)
            .sort((a, b) => b.score - a.score)
            .map(r => r.ref)[0];
    }
}
