import { AgenteAuditor } from '../src/services/AgenteAuditor';
import { SinapiConnector } from '../src/connectors/sinapiConnector';
import { Insumo } from '../src/models/Insumo';

function exigir(condicao: boolean, mensagem: string): void {
    if (!condicao) throw new Error(mensagem);
}

async function testarMatching() {
    console.log('TESTE: MATCHING AVANCADO - TLPlanly');

    const connector = new SinapiConnector();
    const referencias = connector
        .carregarPrecosReferencia()
        .filter(r => r.codigoSinapi && /^\d+$/.test(r.codigoSinapi) && r.descricao.split(/\s+/).length >= 5 && r.precoMedio > 10);

    exigir(referencias.length >= 2, 'Base insuficiente para teste de matching.');

    const refCodigo = referencias[0];
    const refDescricao = referencias[1];

    const insumos: Insumo[] = [
        {
            id: 'codigo-normalizado',
            codigoSinapi: '000' + refCodigo.codigoSinapi,
            descricao: refCodigo.descricao,
            unidade: refCodigo.unidade,
            precoMedio: refCodigo.precoMedio,
            dataReferencia: new Date(),
            origem: 'PLANILHA',
            desonerado: false,
        },
        {
            id: 'codigo-proprio-descricao',
            codigoSinapi: 'CPU-001',
            descricao: refDescricao.descricao.toLowerCase(),
            unidade: refDescricao.unidade,
            precoMedio: refDescricao.precoMedio * 1.08,
            dataReferencia: new Date(),
            origem: 'CPU',
            desonerado: false,
        },
        {
            id: 'sem-match',
            codigoSinapi: 'CPU-SEM-MATCH',
            descricao: 'servico exclusivo sem termos compativeis com a base carregada',
            unidade: 'UN',
            precoMedio: 10,
            dataReferencia: new Date(),
            origem: 'CPU',
            desonerado: false,
        },
    ];

    const auditor = new AgenteAuditor({ toleranciaAprovado: 5, toleranciaAlerta: 15 });
    const relatorio = await auditor.comparar(insumos);
    const porId = new Map(relatorio.resultados.map(r => [r.insumoId, r]));

    exigir(porId.get('codigo-normalizado')?.matchTipo === 'CODIGO_NORMALIZADO', 'Codigo com zeros deveria casar por normalizacao.');
    exigir(porId.get('codigo-normalizado')?.codigoReferencia === refCodigo.codigoSinapi, 'Referencia normalizada divergente.');

    exigir(porId.get('codigo-proprio-descricao')?.matchTipo === 'DESCRICAO', 'Codigo proprio deveria casar por descricao.');
    exigir((porId.get('codigo-proprio-descricao')?.matchScore ?? 0) >= 0.58, 'Score de descricao abaixo do limiar esperado.');
    exigir(porId.get('codigo-proprio-descricao')?.codigoReferencia === refDescricao.codigoSinapi, 'Referencia por descricao divergente.');

    exigir(porId.get('sem-match')?.status === 'NAO_ENCONTRADO', 'Item sem relacao deveria permanecer nao encontrado.');
    exigir(porId.get('sem-match')?.matchTipo === 'NAO_ENCONTRADO', 'Match type do item sem relacao deveria ser NAO_ENCONTRADO.');

    console.log('TODOS OS TESTES DE MATCHING PASSARAM.');
}

testarMatching().catch(err => {
    console.error('Teste de matching interrompido:', err);
    process.exit(1);
});
